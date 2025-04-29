const part = require('../models/partsModel');

exports.createNewPart = async (req, res) => {
  const newPart = new part(req.body);
  await newPart.save();
  res.status().json()
}

exports.getPartByNumber = async (req, res) => {
  res.status().json();
};

exports.getAllParts = async (req, res) => {
  const parts = await parts.find();
  res.status().json();
}

exports.getPartByDay = async (req, res) => {
  const date = req.body.date
  const parts = await parts.find({ timestamp: date });
  res.status().json();
}