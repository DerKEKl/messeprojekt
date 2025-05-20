const partsModel = require('../models/partsModel');

exports.createNewPart = async (req, res) => {
  req.body.timestamp = new Date();
  const newPart = new partsModel(req.body);
  await newPart.save();
  res.status(200).json(newPart)
}

exports.getPartByNumber = async (req, res) => {
  const partNumber = req.params.partNumber
  const part = await partsModel.find({ partNumber: partNumber });
  res.status(200).json(part);
};

exports.getAllParts = async (req, res) => {
  const parts = await partsModel.find();
  res.status(200).json(parts);
}

exports.getPartByDay = async (req, res) => {
  let date = req.params.date
  const start = new Date(`${date}T00:00:00.000Z`);
  const end = new Date(`${date}T23:59:59.999Z`);
  date = { $gte: start, $lte: end }
  const parts = await partsModel.find({ timestamp: date }); 
  res.status(200).json(parts);
}