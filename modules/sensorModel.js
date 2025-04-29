const mongoose = require('mongoose');
module.exports = mongoose.model('sensor', {
  temperature: Number,
  humidity: Number,
  color: String,
  timestamp: Date
});
