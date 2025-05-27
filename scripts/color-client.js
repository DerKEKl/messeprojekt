const net = require('net');

const HOST = '10.62.4.204'; // Raspberry Pi IP oder localhost
const PORT = 5000;

let rgb = [255, 0, 0];

const client = new net.Socket();

client.connect(PORT, HOST, () => {
    console.log(`Verbunden mit TCP-Server (${HOST}:${PORT})`);
});


client.on('data', (data) => {
    const msg = data.toString().trim();
    console.log('Server:', msg);

    if (msg === 'red') {
        rgb = [255, 0, 0];
    } else if (msg === 'green') {
        rgb = [0, 255, 0];
    } else if (msg === 'blue') {
        rgb = [0, 0, 255];
    } else {
        try {
            const obj = JSON.parse(msg);
            if (typeof obj.r === 'number' && typeof obj.g === 'number' && typeof obj.b === 'number') {
                rgb = [obj.r, obj.g, obj.b];
            }
        } catch {
            console.log('Unbekanntes Serverformat:', msg);
        }
    }

    console.log('Aktuelle Farbe:', rgb);
});

client.on('close', () => {
    console.log('Verbindung geschlossen.');
});

client.on('error', (err) => {
    console.error('Fehler:', err.message);
});
