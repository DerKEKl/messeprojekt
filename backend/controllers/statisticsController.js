const partsModel = require("../models/partsModel");

exports.createReport = async (req, res) => {
  const date = req.params.date;

  const start = new Date(`${date}T00:00:00.000Z`);
  const end = new Date(`${date}T23:59:59.999Z`);

  try {
    const parts = await partsModel.find({
      timestamp: { $gte: start, $lte: end }
    }).sort({ timestamp: 1 });

    if (parts.length === 0) {
      return res.status(404).json({ message: "Keine Bauteile an diesem Tag." });
    }

    const partsCount = parts.length;

    const colorMap = {};
    for (const part of parts) {
      colorMap[part.color] = (colorMap[part.color] || 0) + 1;
    }

    const mostCommonColor = Object.entries(colorMap)
      .sort((a, b) => b[1] - a[1])[0][0];

    const productionStart = parts[0].timestamp.toISOString().substring(11, 16);
    const productionEnd = parts[parts.length - 1].timestamp.toISOString().substring(11, 16);

    res.json({
      date,
      partsCount,
      mostCommonColor,
      productionStart: productionStart,
      productionEnd: productionEnd
    });
  } catch (err) {
    console.error("Fehler bei Tagesbericht:", err);
    res.status(500).json({ error: "Statistik konnte nicht erstellt werden." });
  }
};

exports.countColors = async (req, res) => {
  try {
    const result = await partsModel.aggregate([
      {
        $group: {
          _id: "$color",
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          _id: 0,
          color: "$_id",
          count: 1
        }
      }
    ]);

    res.status(200).json(result);
  } catch (err) {
    console.error("Fehler bei Farbstatistik:", err);
    res.status(500).json({ error: "Fehler bei der Auswertung der Farben" });
  }
};