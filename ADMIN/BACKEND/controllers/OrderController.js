const razorpay = require('../utils/Razorpay');
const crypto = require('crypto');
const { getDB } = require('../config/db');
const { ObjectId } = require('mongodb');  // Import once at the top

// Create Razorpay Order and Save Order in DB
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

    const db = getDB();

    // Fetch subscription plan
    const subscriptionPlan = await db.collection('subscriptionplans').findOne({ _id: new ObjectId(subscriptionPlanId) });
    if (!subscriptionPlan) return res.status(404).json({ message: 'Subscription plan not found' });

    const selectedPlan = subscriptionPlan.plans.find(plan => plan.duration === selectedDuration);
    if (!selectedPlan) return res.status(404).json({ message: 'Selected duration plan not found' });

    // Fetch product details
    const product = await db.collection('products').findOne({ _id: new ObjectId(productId) });
    if (!product) return res.status(404).json({ message: 'Product not found' });

    // Calculate pricing
    const durationInMonths = parseInt(selectedDuration);
    const baseRent = selectedPlan.pricePerMonth * durationInMonths;
    const gstAmount = (baseRent * selectedPlan.gst) / 100;
    const securityDeposit = selectedPlan.securityDeposit || 0;
    const totalPrice = baseRent + gstAmount + securityDeposit;

    // Create Razorpay order
    const razorpayOrder = await razorpay.orders.create({
      amount: Math.round(totalPrice * 100),  // amount in paise
      currency: 'INR',
      receipt: `order_rcptid_${Math.floor(Math.random() * 1000000)}`
    });

    // Save order in DB
    const newOrder = {
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
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await db.collection('orders').insertOne(newOrder);

    const orderId = result.insertedId;
    const body = razorpayOrder.id + '|' + orderId.toString();
    const generatedSignature = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex');

    res.status(200).json({
      status: 'success',
      message: 'Order created and Razorpay payment initiated',
      data: {
        userId: req.userId,
        orderId,
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

// Verify Razorpay Payment
exports.verifyRazorpayPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ message: 'All fields are required for verification' });
    }

    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ message: 'Invalid payment signature' });
    }

    const db = getDB();

    const order = await db.collection('orders').findOne({ razorpayOrderId: razorpay_order_id });
    if (!order) return res.status(404).json({ message: 'Order not found' });

    await db.collection('orders').updateOne(
      { _id: order._id },
      {
        $set: {
          paymentStatus: 'Completed',
          razorpayPaymentId: razorpay_payment_id,
          updatedAt: new Date()
        }
      }
    );

    return res.status(200).json({ message: 'Payment verified successfully' });
  } catch (error) {
    console.error('Verification Error:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};
