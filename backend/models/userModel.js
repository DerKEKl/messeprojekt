const mongoose = require('mongoose');
module.exports = mongoose.model('user', {
  username: { type: String, unique: true, required: true },
  passwordHash: { type: String, required: true }
});
