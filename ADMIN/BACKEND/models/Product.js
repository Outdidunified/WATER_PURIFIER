const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  title: String,
  imageUrl: String, // main image
  subImages: [String], // array of 5 sub image URLs
  isOutOfStock: Boolean,
  benefits: [String],
  specifications: {
    tdsLevel: String,
    hardness: String,
    capacity: String,
    dutyCycle: String,
    display: String,
    bodyMaterial: String,
  },
  subscriptionPlans: [{ type: mongoose.Schema.Types.ObjectId, ref: 'SubscriptionPlan' }], // Add this field
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);
