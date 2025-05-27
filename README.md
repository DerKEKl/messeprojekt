# Raspberry Pi Sensor Server

Ein modularer OPC UA und TCP Server für Raspberry Pi Sensoren mit DHT22 Temperatur-/Feuchtigkeitssensor, Kamera-basierter Farberkennung und automatischer Lüftersteuerung.

## Projektstruktur

```
raspberry-pi-sensor-server/
├── main.py                          # Hauptprogramm
├── config.py                        # Zentrale Konfiguration
├── requirements.txt                 # Python-Abhängigkeiten
├── README.md                        # Diese Dokumentation
├── utils/
│   └── logger.py                    # Logging-Utilities
├── sensors/
│   ├── temperature_sensor.py        # DHT22 Temperatursensor
│   └── image_processor.py           # Kamera und Bildverarbeitung
├── controllers/
│   └── fan_controller.py            # Lüftersteuerung
├── servers/
│   ├── tcp_server.py               # TCP Server für Farbdaten
│   └── opcua_server.py             # OPC UA Server
├── logs/                           # Log-Dateien (automatisch erstellt)
└── certificates/                   # OPC UA Zertifikate (automatisch erstellt)
```

## Features

### Sensoren
- **DHT22**: Temperatur- und Feuchtigkeitsmessung
- **Kamera**: RGB-Farbwerte aus Kamerabildern
- **TCP-Client**: Empfang von Farbwerten über TCP

### Aktoren
- **Lüftersteuerung**: Automatisch und manuell steuerbar
- **GPIO-basiert**: Unterstützung für Raspberry Pi GPIO

### Server
- **OPC UA Server**: Industriestandard für Datenbereitstellung
- **TCP Server**: Empfang von Farbdaten von externen Clients
- **Sichere Kommunikation**: Zertifikat-basierte Verschlüsselung

### Robustheit
- **Fehlerbehandlung**: Graceful Fallbacks bei Hardware-Problemen  
- **Dummy-Modi**: Testbetrieb ohne Hardware möglich
- **Logging**: Umfassendes Logging mit automatischer Log-Rotation

## Installation

### Systemabhängigkeiten (Raspberry Pi)

(Optional)

```bash
sudo sh setup.sh
```

```bash
sudo apt update
sudo apt install python3-pip python3-venv git

# Für Kamera-Support
sudo apt install python3-picamera2

# Für GPIO-Support
sudo apt install python3-rpi.gpio
```

### Python-Umgebung einrichten
```bash
# Repository klonen
git clone <repository-url>
cd raspberry-pi-sensor-server

# Virtuelle Umgebung erstellen
python3 -m venv venv
source venv/bin/activate

# Abhängigkeiten installieren
pip install -r requirements.txt
```

## Konfiguration

Bearbeiten Sie `config.py` für Ihre spezifischen Anforderungen:

```python
# GPIO-Pins anpassen
DHT_PIN = 4          # DHT22 Datenpin
FAN_PIN = 18         # Lüftersteuerungspin

# Server-Endpoints
OPCUA_ENDPOINT = "opc.tcp://0.0.0.0:4840"
TCP_PORT = 5000

# Temperatur-Schwellwert für automatische Lüftersteuerung
FAN_TEMPERATURE_THRESHOLD = 30.0  # °C
```

## Verwendung

### Server starten
```bash
# In der virtuellen Umgebung
source venv/bin/activate
python main.py
```

### OPC UA Client-Zugriff
Der Server stellt folgende Variablen bereit:
- `Temperature` (Float): Temperatur in °C
- `Humidity` (Float): Luftfeuchtigkeit in %
- `Color` (Array): RGB-Farbwerte [R, G, B]
- `FanStatus` (Boolean): Aktueller Lüfterstatus
- `FanControl` (Boolean, schreibbar): Manuelle Lüftersteuerung

### TCP-Client für Farbdaten
Senden Sie JSON-Daten an Port 5000:
```json
{"rgb": [255, 128, 64]}
```

## Hardware-Verbindungen

### DHT22 Temperatursensor
- VCC → 3.3V oder 5V
- GND → GND  
- DATA → GPIO 4 (konfigurierbar)

### Lüfter (über Relais/Transistor)
- Steuerungspin → GPIO 18 (konfigurierbar)
- Lüfter → Externe Stromversorgung

### Kamera
- Raspberry Pi Camera Module über CSI-Schnittstelle
- Oder USB-Kamera (wird automatisch erkannt)

## Logging

- Logs werden in `logs/latest.log` geschrieben
- Automatische Archivierung älterer Logs
- Konfigurierbare Log-Level in `config.py`

## Entwicklung

### Testmodus ohne Hardware
Das System erkennt automatisch fehlende Hardware und aktiviert Dummy-Modi:
- Simulierte Sensorwerte bei fehlendem DHT22
- Simulierte RGB-Werte bei fehlender Kamera  
- Dummy-Lüftersteuerung bei GPIO-Problemen

### Code-Struktur erweitern
- Neue Sensoren: Klassen in `sensors/` hinzufügen
- Neue Aktoren: Klassen in `controllers/` hinzufügen  
- Neue Server: Klassen in `servers/` hinzufügen
- Konfiguration in `config.py` erweitern

## Fehlerbehebung

### Häufige Probleme

**GPIO-Zugriff verweigert:**
```bash
sudo usermod -a -G gpio $USER
# Neu anmelden erforderlich
```

**Kamera nicht erkannt:**
```bash
# Kamera aktivieren
sudo raspi-config
# Interface Options → Camera → Enable
```

**Paketabhängigkeiten:**
```bash
# Einzelne Pakete installieren
pip install adafruit-circuitpython-dht
pip install opcua
```

### Debug-Modus
Für detaillierte Logs `LOG_LEVEL = "DEBUG"` in `config.py` setzen.