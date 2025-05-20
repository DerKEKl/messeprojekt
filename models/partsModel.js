const mongoose = require('mongoose');
module.exports = mongoose.model('part', {
    partNumber: String,
    color: String,
    timestamp: Date,
    energyUsage: Number
  });
  