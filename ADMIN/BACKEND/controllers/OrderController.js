const razorpay = require('./../utils/Razorpay');
const crypto = require('crypto');
const Order = require('../models/Order');
const SubscriptionPlan = require('../models/SubscriptionPlan');
const Product = require('../models/Product');

// Step 1: Create Razorpay Order and Save Order in DB
exports.createSubscriptionOrder = async (req, res) => {
  try {
    const {
      productId,
      subscriptionPlanId,
      selectedDuration,
      deliveryAddress
    } = req.body;

    if (!productId || !subscriptionPlanId || !selectedDuration || !deliveryAddress) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Step 1: Fetch subscription plan
    const subscriptionPlan = await SubscriptionPlan.findById(subscriptionPlanId).lean();
    if (!subscriptionPlan) return res.status(404).json({ message: 'Subscription plan not found' });

    // Step 2: Find selected plan
    const selectedPlan = subscriptionPlan.plans.find(plan => plan.duration === selectedDuration);
    if (!selectedPlan) return res.status(404).json({ message: 'Selected duration plan not found' });

    // Step 3: Fetch product details
    const product = await Product.findById(productId).lean();
    if (!product) return res.status(404).json({ message: 'Product not found' });

    // Step 4: Calculate cost
    const durationInMonths = parseInt(selectedDuration); // e.g., "6 Months" -> 6
    const baseRent = selectedPlan.pricePerMonth * durationInMonths;
    const gstAmount = (baseRent * selectedPlan.gst) / 100;
    const securityDeposit = selectedPlan.securityDeposit || 0;
    const totalPrice = baseRent + gstAmount + securityDeposit;

    // Step 5: Create Razorpay order
    const razorpayOrder = await razorpay.orders.create({
      amount: Math.round(totalPrice * 100),
      currency: 'INR',
      receipt: `order_rcptid_${Math.floor(Math.random() * 1000000)}`
    });

    // Step 6: Save order in DB
    const newOrder = await Order.create({
      userId: req.userId,
      productId,
      subscriptionPlanId,
      selectedDuration,
      price: totalPrice,
      deliveryAddress,
      paymentStatus: 'Pending',
      razorpayOrderId: razorpayOrder.id,
      paymentDetails: {
        baseRent,
        gstAmount,
        securityDeposit,
        totalPrice
      }
    });

    const body = razorpayOrder.id + "|" + newOrder._id.toString();
    const generatedSignature = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex');

    // Step 8: Return response
    res.status(200).json({
      status: 'success',
      message: 'Order created and Razorpay payment initiated',
      data: {
        userId: req.userId, 
        orderId: newOrder._id,
        razorpayOrder,
        razorpaySignature: generatedSignature, 
        product: {
          _id: product._id,
          title: product.title
        },
        selectedPlan,
        costBreakdown: {
          baseRent,
          gstAmount,
          securityDeposit,
          totalPrice
        },
        deliveryAddress
      }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to create order', error: err.message });
  }
};

exports.verifyRazorpayPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ message: 'All fields are required for verification' });
    }

    // Generate expected signature
    const body = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex');

    // Compare signatures
    if (expectedSignature === razorpay_signature) {
      const order = await Order.findOne({ razorpayOrderId: razorpay_order_id });
      if (!order) return res.status(404).json({ message: 'Order not found' });

      order.paymentStatus = 'Completed';
      order.paymentDetails.razorpayPaymentId = razorpay_payment_id;
      await order.save();

      return res.status(200).json({ message: 'Payment verified successfully' });
    } else {
      return res.status(400).json({ message: 'Invalid payment signature' });
    }

  } catch (error) {
    console.error('Verification Error:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};
