const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  subscriptionPlanId: { type: mongoose.Schema.Types.ObjectId, ref: 'SubscriptionPlan' },
  selectedDuration: String,
  price: Number,
  deliveryAddress: {
    name: String,
    phone: String,
    addressLine: String,
    city: String,
    pincode: String,
    state: String
  },
  paymentStatus: { type: String, default: 'Pending' },
  razorpayOrderId: String,
  razorpayPaymentId: String
}, { timestamps: true });


module.exports = mongoose.model('Order', orderSchema);
