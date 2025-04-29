const mongoose = require('mongoose');
module.exports = mongoose.model('Parts', {
    partNumber: String,
    color: String,
    timestamp: Date,
    energyUsage: Number
  });
  