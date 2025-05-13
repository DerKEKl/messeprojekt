const { exec } = require('child_process')

exports.startRoutine = (req, res) => {
    exec('python3 scripts/pick_and_place.py', (err, stdout, stderr) => {
        if (err) {
            console.log(stderr)
            return res.status(500).json({ message: "Steuerung fehlgeschlagen." })
        }
        return res.status(200).json({ message: "Steuerung erfolgreich", result: stdout })
    })
}