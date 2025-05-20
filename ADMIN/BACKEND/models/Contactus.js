const mongoose = require('mongoose');

const contactUsSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true },
  city: { type: String, required: true },
  message: { type: String, required: true }, 
  submittedAt: { type: Date, default: Date.now } 
});


module.exports = mongoose.model('ContactUs', contactUsSchema);
