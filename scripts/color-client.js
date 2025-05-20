// datei: color-client.js

const net = require('net');

// Host und Port anpassen
const HOST = '10.62.0.54'; // oder 'localhost' / IP vom Raspberry Pi
const PORT = 5000;

const rgb = [255, 0, 0];

// Einfacher Socket-Client
const client = new net.Socket();

// Verbindung herstellen
client.connect(PORT, HOST, () => {
  console.log(`Verbunden mit TCP-Server (${HOST}:${PORT})`);
});

// Server-Antworten verarbeiten
client.on('data', (data) => {
  console.log('Server:', data.toString());

  rgb[0] = data.toString() === 'red' ? 255 : rgb[0] - 1;
  rgb[1] = data.toString() === 'green' ? 255 : rgb[1] - 1;
  rgb[2] = data.toString() === 'blue' ? 255 : rgb[2] - 1;

  console.log(rgb);
});

// Bei Verbindungsende
client.on('close', () => {
  console.log('Verbindung geschlossen.');
});

// Bei Fehler
client.on('error', (err) => {
  console.error('Fehler:', err.message);
});