const mongoose = require('mongoose');

const subscriptionPlanSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  type: String, // e.g., Silver, Gold, Family
  capacity: String, // e.g., "200 Ltrs/M"
  plans: [
    {
      duration: String,            
      pricePerMonth: Number,
      gst: Number,
      securityDeposit: Number,
    }
  ],
}, { timestamps: true });

module.exports = mongoose.model('SubscriptionPlan', subscriptionPlanSchema);
