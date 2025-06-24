const sensorValue = require('../models/sensorModel');

exports.postSensorValue = async (req, res) => {
  req.body.timestamp = new Date();
  const newValue = new sensorValue(req.body);
  await newValue.save();
  res.status(200).json(newValue);
};
