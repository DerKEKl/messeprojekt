const sensorValue = require('../models/sensorModel');

exports.getSensorValue = async (req, res) => {
  const newValue = new sensorValue(req.body);
  await newValue.save();
  res.status().json();
};
