const { exec } = require('child_process');
const partsController = require('../controllers/partsController');
const partsModel = require('../models/partsModel');

exports.startRoutine = async (req, res) => {
    exec('py backend/scripts/pick_and_place.py', async (err, stdout, stderr) => {
        if (err) {
            console.log(stderr);
            return res.status(500).json({ message: "Steuerung fehlgeschlagen." });
        }

        const match = stdout.match(/RESULT:(\w+)/);
        if (!match) {
            return res.status(500).json({ message: "Keine Farbe erkannt." });
        }

        const colors = stdout
            .split('\n')
            .filter(line => line.startsWith('RESULT:'))
            .map(line => line.split(':')[1]);

        for (const color of colors) {
            const latestPart = await partsModel.findOne().sort({ partNumber: -1 });
            let nextNumber = 1;

            if (latestPart && latestPart.partNumber) {
                const match = latestPart.partNumber.match(/B-(\d+)/);
                if (match) nextNumber = parseInt(match[1]) + 1;
            }

            const partNumber = `B-${String(nextNumber).padStart(3, '0')}`;

            const fakeReq = {
                body: {
                    partNumber,
                    color: color,
                    timestamp: new Date(),
                    energyUsage: 0.2
                }
            };

            const fakeRes = {
                status: () => ({ json: () => { } }),
                json: () => { }
            };

            await partsController.createNewPart(fakeReq, fakeRes);
        }

        res.status(200).json({ message: "Steuerung erfolgreich." });
    });
};
