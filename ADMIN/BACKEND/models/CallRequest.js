// models/RequestCall.js
const mongoose = require('mongoose');

const requestCallSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true },
  city: { type: String, required: true },
  requestedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('RequestCall', requestCallSchema);
