const express = require('express');
const https = require('https');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const app = express();
const mongoose = require('mongoose');
require('dotenv').config({ path: path.join(__dirname, '.env') })

const sensorRoutes = require('./routes/sensorRoutes');
const costsRoutes = require('./routes/costsRoutes');
const statisticsRoutes = require('./routes/statisticsRoutes');
const partsRoutes = require('./routes/partsRoutes');
const robotRoutes = require('./routes/robotRoutes')
const authRoutes = require('./routes/authRoutes')

mongoose.connect(process.env.MONGO_DB_URL, {
}).then(response => {
    console.log('MongoDB Connection Succeeded.')
}).catch(error => {
    console.log('Error in DB connection: ' + error)
});

app.use(express.json())
app.use(cors());

app.use('/api/sensor', sensorRoutes);
app.use('/api/costs', costsRoutes);
app.use('/api/statistics', statisticsRoutes);
app.use('/api/parts', partsRoutes);
app.use('/api/robot', robotRoutes)
app.use('/api/auth', authRoutes)

app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        protocol: 'HTTPS',
        environment: process.env.NODE_ENV
    });
});

function createSelfSignedCertificates() {
    const forge = require('node-forge');
    const pki = forge.pki;
    
    console.log('Erstelle RSA-Schlüsselpaar...');
    const keys = pki.rsa.generateKeyPair(2048);
    
    console.log('Erstelle Self-Signed Zertifikat...');
    const cert = pki.createCertificate();
    cert.publicKey = keys.publicKey;
    cert.serialNumber = '01';
    cert.validity.notBefore = new Date();
    cert.validity.notAfter = new Date();
    cert.validity.notAfter.setFullYear(cert.validity.notBefore.getFullYear() + 1);
    
    const attrs = [
        { name: 'countryName', value: 'DE' },
        { name: 'organizationName', value: 'Robot Pick and Place System' },
        { name: 'commonName', value: 'localhost' }
    ];
    
    cert.setSubject(attrs);
    cert.setIssuer(attrs);
    
    cert.setExtensions([
        {
            name: 'basicConstraints',
            cA: true
        },
        {
            name: 'keyUsage',
            keyCertSign: true,
            digitalSignature: true,
            nonRepudiation: true,
            keyEncipherment: true,
            dataEncipherment: true
        },
        {
            name: 'subjectAltName',
            altNames: [
                { type: 2, value: 'localhost' },
                { type: 2, value: '127.0.0.1' },
                { type: 7, ip: '127.0.0.1' }
            ]
        }
    ]);
    
    cert.sign(keys.privateKey);
    
    const privateKeyPem = pki.privateKeyToPem(keys.privateKey);
    const certificatePem = pki.certificateToPem(cert);
    
    const certDir = path.join(__dirname, 'ssl');
    if (!fs.existsSync(certDir)) {
        fs.mkdirSync(certDir, { recursive: true });
    }
    
    fs.writeFileSync(path.join(certDir, 'private-key.pem'), privateKeyPem);
    fs.writeFileSync(path.join(certDir, 'certificate.pem'), certificatePem);
    
    console.log('✅ Self-Signed Zertifikate erstellt und gespeichert in /ssl/');
    
    return {
        key: privateKeyPem,
        cert: certificatePem
    };
}

function loadSSLCertificates() {
    const certDir = path.join(__dirname, 'ssl');
    
    try {
        const privateKey = fs.readFileSync(path.join(certDir, 'private-key.pem'), 'utf8');
        const certificate = fs.readFileSync(path.join(certDir, 'certificate.pem'), 'utf8');
        
        return {
            key: privateKey,
            cert: certificate
        };
    } catch (error) {
        console.log('Keine SSL-Zertifikate gefunden, erstelle Self-Signed Certificates...');
        return createSelfSignedCertificates();
    }
}

const PORT = process.env.HTTPS_PORT || 5443;
const HTTP_PORT = process.env.PORT || 5000;

try {
    const credentials = loadSSLCertificates();
    const httpsServer = https.createServer(credentials, app);
    
    httpsServer.listen(PORT, () => {
        console.log('HTTPS Server läuft auf Port: ' + PORT);
        console.log('HTTPS URL: https://localhost:' + PORT);
        console.log('API Base: https://localhost:' + PORT + '/api');
    });

    const http = require('http');
    const httpApp = express();
    
    httpApp.use((req, res) => {
        const httpsUrl = `https://${req.headers.host.replace(/:\d+$/, ':' + PORT)}${req.url}`;
        res.redirect(301, httpsUrl);
    });
    
    http.createServer(httpApp).listen(HTTP_PORT, () => {
        console.log('HTTP Redirect Server läuft auf Port: ' + HTTP_PORT);
        console.log('HTTP leitet weiter zu HTTPS');
    });
    
} catch (error) {
    console.error('HTTPS Server Fehler:', error);
    console.log('Fallback zu HTTP...');

    app.listen(HTTP_PORT, () => {
        console.log('⚠️  HTTP Server läuft auf Port: ' + HTTP_PORT);
    });
}
