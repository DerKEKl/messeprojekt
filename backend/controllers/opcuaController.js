const mongoose = require('mongoose');
const { OPCUAClient, MessageSecurityMode, SecurityPolicy, AttributeIds, resolveNodeId, makeBrowsePath, BrowseDirection } = require('node-opcua');
const path = require('path');
const os = require('os');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Import existing Sensor Model instead of creating new one
const SensorModel = require('../models/sensorModel');

class OPCUAGateway {
    constructor() {
        this.client = null;
        this.session = null;
        this.isConnected = false;
        this.endpointUrl = 'opc.tcp://10.62.255.1:4840';
        this.dataLoggingInterval = null;
        this.discoveredNodes = {};
        this.tcpClient = null;
        this.allFoundNodes = [];

        this.nodeIds = {
            temperature: null,
            humidity: null,
            fanStatus: null
        };

        this.connectToServer();
    }

    async connectToServer() {
        console.log('🔌 Verbinde zu OPC UA Server:', this.endpointUrl);

        try {
            console.log('🔒 Verwende SignAndEncrypt Basic256Sha256...');

            this.client = OPCUAClient.create({
                applicationName: "Messeprojekt OPC UA Client",
                applicationUri: `urn:${os.hostname()}:Messeprojekt OPC UA Client`,
                productUri: "https://github.com/messeprojekt",
                requestedSessionTimeout: 60000,
                connectionStrategy: {
                    initialDelay: 1000,
                    maxRetry: 3,
                    maxDelay: 10000
                },
                securityMode: MessageSecurityMode.SignAndEncrypt,
                securityPolicy: SecurityPolicy.Basic256Sha256,
                endpointMustExist: true,
                keepSessionAlive: true
            });

            await this.client.connect(this.endpointUrl);
            this.session = await this.client.createSession();
            this.isConnected = true;

            console.log('✅ OPC UA Controller erfolgreich verbunden (SignAndEncrypt)');
            await this.fullNodeDiscovery();

            if (Object.values(this.nodeIds).some(id => id !== null)) {
                this.startDataLogging();
            } else {
                console.log('⚠️ Keine Sensor-Nodes über OPC UA gefunden, verwende TCP-Fallback');
                this.setupTCPFallback();
            }

        } catch (opcuaError) {
            console.error('❌ OPC UA SignAndEncrypt fehlgeschlagen:', opcuaError.message);
            console.log('🔄 Verwende TCP-Fallback für Sensordaten...');
            this.setupTCPFallback();
        }
    }

    async fullNodeDiscovery() {
        if (!this.session) {
            console.log('⚠️ Keine OPC UA Session verfügbar für Node Discovery');
            return;
        }

        try {
            console.log('🔍 Starte vollständige Node-Entdeckung...');
            this.allFoundNodes = [];

            // 1. Browse the entire server structure
            await this.browseRecursively("RootFolder", 0, 4); // Erweiterte Tiefe

            // 2. Test all found nodes for data access
            await this.testAllFoundNodes();

            // 3. Test common node patterns
            await this.testCommonNodeIds();

            // 4. Test numeric node IDs from server logs
            await this.testNumericNodeIdsFromLogs();

            // 5. Print summary
            this.printNodeSummary();

        } catch (error) {
            console.error('❌ Fehler bei der Node-Entdeckung:', error.message);
        }
    }

    async browseRecursively(nodeId, currentDepth, maxDepth) {
        if (currentDepth >= maxDepth) return;

        try {
            const browseResult = await this.session.browse(nodeId);

            for (const ref of browseResult.references || []) {
                const nodeName = ref.browseName.toString();
                const nodeIdStr = ref.nodeId.toString();

                // Store all found nodes
                this.allFoundNodes.push({
                    nodeId: nodeIdStr,
                    browseName: nodeName,
                    displayName: ref.displayName?.text || nodeName,
                    nodeClass: ref.nodeClass,
                    depth: currentDepth + 1
                });

                console.log(`${'  '.repeat(currentDepth + 1)}📁 ${nodeName} (${nodeIdStr})`);

                // Browse deeper if it's an object or variable
                if (ref.nodeClass === 1 || ref.nodeClass === 2) { // Object or Variable
                    await this.browseRecursively(ref.nodeId, currentDepth + 1, maxDepth);
                }
            }
        } catch (error) {
            // Ignore browse errors for individual nodes
            console.log(`${'  '.repeat(currentDepth + 1)}❌ Kann ${nodeId} nicht browsen: ${error.message}`);
        }
    }

    async testAllFoundNodes() {
        console.log('\n🧪 Teste alle gefundenen Nodes auf Datenzugriff...');

        for (const node of this.allFoundNodes) {
            try {
                const dataValue = await this.session.read({
                    nodeId: node.nodeId,
                    attributeId: AttributeIds.Value
                });

                if (dataValue.statusCode.isGoodish() && dataValue.value && dataValue.value.value !== undefined) {
                    const value = dataValue.value.value;
                    console.log(`✅ Lesbar: ${node.browseName} (${node.nodeId}) = ${value} [${typeof value}]`);

                    // Try to identify sensor types by name and value
                    const lowerName = node.browseName.toLowerCase();
                    const displayName = node.displayName.toLowerCase();

                    if ((lowerName.includes('temp') || displayName.includes('temp')) && typeof value === 'number') {
                        console.log(`🌡️ TEMPERATUR GEFUNDEN: ${node.nodeId} = ${value}°C`);
                        this.nodeIds.temperature = node.nodeId;
                    }

                    if ((lowerName.includes('humid') || displayName.includes('humid')) && typeof value === 'number') {
                        console.log(`💧 FEUCHTIGKEIT GEFUNDEN: ${node.nodeId} = ${value}%`);
                        this.nodeIds.humidity = node.nodeId;
                    }
                    if ((lowerName.includes('fan') || displayName.includes('fan')) && value !== null) {
                        console.log(`🌪️ FAN STATUS GEFUNDEN: ${node.nodeId} = ${value}`);
                        this.nodeIds.fanStatus = node.nodeId;
                    }

                    // Also check for generic data patterns
                    if (typeof value === 'number' && value > 0 && value < 100 && !this.nodeIds.temperature) {
                        console.log(`🔢 MÖGLICHE TEMPERATUR: ${node.nodeId} = ${value}`);
                        if (!this.nodeIds.temperature && value > 10 && value < 50) {
                            this.nodeIds.temperature = node.nodeId;
                        }
                    }
                }
            } catch (error) {
                // Ignore read errors for individual nodes
            }
        }
    }

    async testNumericNodeIdsFromLogs() {
        console.log('\n🔍 Teste numerische Node-IDs aus den Server-Logs...');

        // Node IDs aus deinen Server-Logs extrahiert
        const logNodeIds = [
            'i=3062', 'i=3063', 'i=24', 'i=31', 'i=3068', 'i=12170', 'i=3067', 'i=3069', 'i=3070',
            'i=11433', 'i=11498', 'i=15002', 'i=12908', 'i=11512', 'i=11513', 'i=11432', 'i=3071',
            'i=12745', 'i=3072', 'i=3073', 'i=16306', 'i=17605', 'i=23501', 'i=58', 'i=62', 'i=78',
            'i=80', 'i=83', 'i=11508', 'i=11510', 'i=84', 'i=16314', 'i=11214', 'i=11202', 'i=11215',
            'i=2341', 'i=2342', 'i=2343', 'i=11285', 'i=2344', 'i=11304', 'i=2346', 'i=2347', 'i=2348',
            'i=2349', 'i=2350', 'i=11286', 'i=11287', 'i=11305', 'i=11306', 'i=11288', 'i=2351',
            'i=2352', 'i=11307', 'i=11308', 'i=2355', 'i=2357', 'i=2358', 'i=2359', 'i=11505',
            'i=11506', 'i=11507', 'i=2360', 'i=2361', 'i=2362', 'i=2363', 'i=2364', 'i=11292',
            'i=11426', 'i=11427', 'i=11428', 'i=11429'
        ];

        // Teste auch mit verschiedenen Namespaces
        const namespacesToTest = [0, 1, 2, 3, 4];

        for (const namespace of namespacesToTest) {
            for (const nodeId of logNodeIds) {
                const fullNodeId = `ns=${namespace};${nodeId}`;
                try {
                    const dataValue = await this.session.read({
                        nodeId: fullNodeId,
                        attributeId: AttributeIds.Value
                    });

                    if (dataValue.statusCode.isGoodish() && dataValue.value && dataValue.value.value !== undefined) {
                        const value = dataValue.value.value;
                        console.log(`✅ AKTIVE NODE AUS LOGS: ${fullNodeId} = ${value} [${typeof value}]`);

                        // Prüfe ob es sich um Sensordaten handelt
                        if (typeof value === 'number') {
                            if (value >= 15 && value <= 40 && !this.nodeIds.temperature) {
                                console.log(`🌡️ TEMPERATUR AUS LOGS: ${fullNodeId} = ${value}°C`);
                                this.nodeIds.temperature = fullNodeId;
                            } else if (value >= 20 && value <= 100 && !this.nodeIds.humidity) {
                                console.log(`💧 MÖGLICHE FEUCHTIGKEIT: ${fullNodeId} = ${value}%`);
                                this.nodeIds.humidity = fullNodeId;
                            }
                        }
                    }
                } catch (error) {
                    // Ignore errors for individual test nodes
                }
            }
        }
    }

    async testCommonNodeIds() {
        console.log('\n🎯 Teste häufige Node-ID Muster...');

        const testNodeIds = [
            // Standard OPC UA Namespaces
            'ns=1;s=Temperature', 'ns=1;s=Humidity', 'ns=1;s=Color', 'ns=1;s=FanStatus',
            'ns=2;s=Temperature', 'ns=2;s=Humidity', 'ns=2;s=Color', 'ns=2;s=FanStatus',
            'ns=3;s=Temperature', 'ns=3;s=Humidity', 'ns=3;s=Color', 'ns=3;s=FanStatus',
            'ns=4;s=Temperature', 'ns=4;s=Humidity', 'ns=4;s=Color', 'ns=4;s=FanStatus',

            // Numeric Node IDs (expanded range)
            'ns=1;i=1001', 'ns=1;i=1002', 'ns=1;i=1003', 'ns=1;i=1004', 'ns=1;i=1005',
            'ns=2;i=1001', 'ns=2;i=1002', 'ns=2;i=1003', 'ns=2;i=1004', 'ns=2;i=1005',
            'ns=3;i=1001', 'ns=3;i=1002', 'ns=3;i=1003', 'ns=3;i=1004', 'ns=3;i=1005',

            // More numeric patterns
            'ns=1;i=1', 'ns=1;i=2', 'ns=1;i=3', 'ns=1;i=4', 'ns=1;i=5',
            'ns=2;i=1', 'ns=2;i=2', 'ns=2;i=3', 'ns=2;i=4', 'ns=2;i=5',

            // Common patterns
            's=Temperature', 's=Humidity', 's=Color', 's=Fan',
            'ns=1;s=ServerData.Temperature', 'ns=1;s=Sensor.Temperature', 'ns=1;s=Data.Temperature',
            'ns=1;s=Sensors.Temperature', 'ns=1;s=Device.Temperature',

            // Raspberry Pi / Arduino specific
            'ns=1;s=RaspberryPi.Temperature', 'ns=1;s=Pi.Temperature',
            'ns=1;s=SensorData.Temperature', 'ns=1;s=DHT22.Temperature',
            'ns=1;s=DHT22.Humidity', 'ns=1;s=ColorSensor.Color',
            'ns=1;s=Arduino.Temperature', 'ns=1;s=Arduino.Humidity',

            // Generic sensor patterns
            'ns=1;s=Temp', 'ns=1;s=Hum', 'ns=1;s=Col',
            'ns=2;s=Temp', 'ns=2;s=Hum', 'ns=2;s=Col',
            'ns=1;s=sensor1', 'ns=1;s=sensor2', 'ns=1;s=sensor3',
            'ns=2;s=sensor1', 'ns=2;s=sensor2', 'ns=2;s=sensor3',

            // Industrial patterns
            'ns=1;s=AI001', 'ns=1;s=AI002', 'ns=1;s=AI003',
            'ns=1;s=TI001', 'ns=1;s=TI002', 'ns=1;s=HI001',

            // Device specific
            'ns=1;s=Device1.PV', 'ns=1;s=Device2.PV', 'ns=1;s=Device3.PV',
            'ns=1;s=Channel1', 'ns=1;s=Channel2', 'ns=1;s=Channel3'
        ];

        for (const nodeId of testNodeIds) {
            try {
                const dataValue = await this.session.read({
                    nodeId: nodeId,
                    attributeId: AttributeIds.Value
                });

                if (dataValue.statusCode.isGoodish() && dataValue.value && dataValue.value.value !== undefined) {
                    const value = dataValue.value.value;
                    console.log(`✅ Gültiger Node gefunden: ${nodeId} = ${value} [${typeof value}]`);

                    const lowerNodeId = nodeId.toLowerCase();
                    if ((lowerNodeId.includes('temperature') || lowerNodeId.includes('temp') || lowerNodeId.includes('ti')) && typeof value === 'number') {
                        console.log(`🌡️ TEMPERATUR PATTERN: ${nodeId}`);
                        if (!this.nodeIds.temperature) this.nodeIds.temperature = nodeId;
                    } else if ((lowerNodeId.includes('humidity') || lowerNodeId.includes('humid') || lowerNodeId.includes('hi')) && typeof value === 'number') {
                        console.log(`💧 HUMIDITY PATTERN: ${nodeId}`);
                        if (!this.nodeIds.humidity) this.nodeIds.humidity = nodeId;
                    } else if ((lowerNodeId.includes('color') || lowerNodeId.includes('colour') || lowerNodeId.includes('col')) && value !== null) {
                        console.log(`🎨 COLOR PATTERN: ${nodeId}`);
                        if (!this.nodeIds.color) this.nodeIds.color = nodeId;
                    } else if (lowerNodeId.includes('fan') && value !== null) {
                        console.log(`🌪️ FAN PATTERN: ${nodeId}`);
                        if (!this.nodeIds.fanStatus) this.nodeIds.fanStatus = nodeId;
                    } else if (typeof value === 'number' && !this.nodeIds.temperature) {
                        // Generic numeric value - could be temperature
                        console.log(`🔢 NUMERISCHER WERT: ${nodeId} = ${value}`);
                        if (value >= 15 && value <= 40) { // Reasonable temperature range
                            console.log(`🌡️ WAHRSCHEINLICHE TEMPERATUR: ${nodeId}`);
                            this.nodeIds.temperature = nodeId;
                        }
                    }
                }
            } catch (error) {
                // Ignore errors for individual test nodes
            }
        }
    }

    printNodeSummary() {
        console.log('\n📋 ================ NODE DISCOVERY ZUSAMMENFASSUNG ================');
        console.log(`📊 Insgesamt gefundene Nodes: ${this.allFoundNodes.length}`);
        console.log('\n🎯 Zugewiesene Sensor-Nodes:');
        console.log(`🌡️ Temperatur: ${this.nodeIds.temperature || 'NICHT GEFUNDEN'}`);
        console.log(`💧 Feuchtigkeit: ${this.nodeIds.humidity || 'NICHT GEFUNDEN'}`);
        console.log(`🎨 Farbe: ${this.nodeIds.color || 'NICHT GEFUNDEN'}`);
        console.log(`🌪️ Fan Status: ${this.nodeIds.fanStatus || 'NICHT GEFUNDEN'}`);
        console.log('===============================================================\n');
    }

    async setupTCPFallback() {
        console.log('🔄 Initialisiere TCP-Fallback für Sensordaten...');

        const net = require('net');
        this.tcpClient = new net.Socket();

        const HOST = '10.62.255.1';
        const PORT = 5555; // Anderer Port für Sensordaten

        this.tcpClient.connect(PORT, HOST, () => {
            console.log(`✅ TCP-Fallback verbunden (${HOST}:${PORT})`);
        });

        this.tcpClient.on('data', (data) => {
            try {
                const sensorData = JSON.parse(data.toString());
                console.log('📊 TCP Sensordaten empfangen:', sensorData);

                if (sensorData.temperature !== undefined) {
                    this.nodeIds.temperature = 'tcp:temperature';
                }
                if (sensorData.humidity !== undefined) {
                    this.nodeIds.humidity = 'tcp:humidity';
                }
                if (sensorData.color !== undefined) {
                    this.nodeIds.color = 'tcp:color';
                }

                this.saveSensorData(sensorData.temperature, sensorData.humidity, sensorData.color);
            } catch (error) {
                console.log('❌ TCP Daten-Parse Fehler:', error.message);
            }
        });

        this.tcpClient.on('error', (err) => {
            console.error('❌ TCP-Fallback Fehler:', err.message);
        });

        this.tcpClient.on('close', () => {
            console.log('🔌 TCP-Fallback Verbindung geschlossen');
        });
    }

    async startDataLogging() {
        console.log('📊 Starte Datenprotokollierung...');

        this.dataLoggingInterval = setInterval(async () => {
            await this.readAndSaveSensorData();
        }, 5000); // Alle 5 Sekunden
    }

    async readAndSaveSensorData() {
        if (!this.session || !this.isConnected) {
            console.log('⚠️ Keine OPC UA Verbindung für Datenlesung');
            return;
        }

        try {
            let temperature = null;
            let humidity = null;
            let color = null;

            // Temperatur lesen
            if (this.nodeIds.temperature) {
                try {
                    const tempValue = await this.session.read({
                        nodeId: this.nodeIds.temperature,
                        attributeId: AttributeIds.Value
                    });
                    if (tempValue.statusCode.isGoodish() && tempValue.value) {
                        temperature = tempValue.value.value;
                    }
                } catch (error) {
                    console.log('❌ Fehler beim Lesen der Temperatur:', error.message);
                }
            }

            // Feuchtigkeit lesen
            if (this.nodeIds.humidity) {
                try {
                    const humValue = await this.session.read({
                        nodeId: this.nodeIds.humidity,
                        attributeId: AttributeIds.Value
                    });
                    if (humValue.statusCode.isGoodish() && humValue.value) {
                        humidity = humValue.value.value;
                    }
                } catch (error) {
                    console.log('❌ Fehler beim Lesen der Feuchtigkeit:', error.message);
                }
            }

            // Farbe lesen
            if (this.nodeIds.color) {
                try {
                    const colorValue = await this.session.read({
                        nodeId: this.nodeIds.color,
                        attributeId: AttributeIds.Value
                    });
                    if (colorValue.statusCode.isGoodish() && colorValue.value) {
                        color = colorValue.value.value;
                    }
                } catch (error) {
                    console.log('❌ Fehler beim Lesen der Farbe:', error.message);
                }
            }

            // Daten speichern
            await this.saveSensorData(temperature, humidity, color);

        } catch (error) {
            console.error('❌ Fehler beim Lesen der Sensordaten:', error.message);
        }
    }

    async saveSensorData(temperature, humidity, color) {
        try {
            if (temperature !== null || humidity !== null || color !== null) {
                const sensorData = new SensorModel({
                    temperature: temperature,
                    humidity: humidity,
                    color: color,
                    timestamp: new Date()
                });

                await sensorData.save();
                console.log('💾 Sensordaten gespeichert:', { temperature, humidity, color });
            }
        } catch (error) {
            console.error('❌ Fehler beim Speichern der Sensordaten:', error.message);
        }
    }

    async getTemperature() {
        if (!this.nodeIds.temperature) {
            throw new Error('Temperature Node ID nicht verfügbar');
        }

        if (!this.session || !this.isConnected) {
            throw new Error('Keine OPC UA Verbindung');
        }

        try {
            const dataValue = await this.session.read({
                nodeId: this.nodeIds.temperature,
                attributeId: AttributeIds.Value
            });

            if (dataValue.statusCode.isGoodish() && dataValue.value) {
                return dataValue.value.value;
            } else {
                throw new Error('Ungültiger Temperaturwert empfangen');
            }
        } catch (error) {
            console.error('❌ Fehler beim Lesen der Temperatur:', error.message);
            throw error;
        }
    }

    async disconnect() {
        console.log('🔌 Trenne OPC UA Verbindung...');

        if (this.dataLoggingInterval) {
            clearInterval(this.dataLoggingInterval);
        }

        if (this.tcpClient) {
            this.tcpClient.destroy();
        }

        if (this.session) {
            await this.session.close();
        }

        if (this.client) {
            await this.client.disconnect();
        }

        this.isConnected = false;
        console.log('✅ OPC UA Gateway getrennt');
    }
}

// Erstelle globale Instanz
const gateway = new OPCUAGateway();

// Export für API-Routen
const getTemperature = async (req, res) => {
    try {
        const temperature = await gateway.getTemperature();
        res.json({
            success: true,
            temperature: temperature,
            unit: "°C",
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('❌ API Temperatur-Fehler:', error.message);
        res.status(500).json({
            success: false,
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
};

const getNodeStatus = async (req, res) => {
    res.json({
        success: true,
        connected: gateway.isConnected,
        nodeIds: gateway.nodeIds,
        discoveredNodes: gateway.allFoundNodes.length,
        timestamp: new Date().toISOString()
    });
};

const rediscoverNodes = async (req, res) => {
    try {
        await gateway.fullNodeDiscovery();
        res.json({
            success: true,
            message: 'Node-Entdeckung abgeschlossen',
            nodeIds: gateway.nodeIds,
            discoveredNodes: gateway.allFoundNodes.length,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
};

module.exports = {
    getTemperature,
    getNodeStatus,
    rediscoverNodes,
    gateway
};