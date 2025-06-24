const partsModel = require('../models/partsModel');
const priceService = require('../services/priceService');

exports.showCostsByDate = async (req, res) => {
  const date = req.params.date;
  const parts = await partsModel.countDocuments({
    timestamp: {
      $gte: new Date(date + 'T00:00:00Z'),
      $lt: new Date(date + 'T23:59:59Z')
    }
  });
  const costs = await priceService.calcEnergyCosts(parts, date);
  res.status(200).json({ date, parts, costs });
};

exports.showProfitTime = async (req, res) => {
  const partsCount = parseInt(req.params.partsCount)
  const profitTime = await priceService.getProfitTime(partsCount);

  res.status(200).json(profitTime);
};