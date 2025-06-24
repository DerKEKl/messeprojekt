const mongoose = require('mongoose');
module.exports = mongoose.model('sensor', {
  temperature: Number,
  humidity: Number,
  timestamp: Date
});
