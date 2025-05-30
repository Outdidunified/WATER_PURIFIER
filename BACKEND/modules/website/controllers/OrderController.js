const razorpay = require('../../../services/Razorpay');
const crypto = require('crypto');
const { connectToDatabase } = require('../../../config/db');
const { ObjectId } = require('mongodb');

function generateOrderId() {
  const date = new Date().toISOString().slice(0,10).replace(/-/g, ''); // e.g. 20250526
  const random = Math.random().toString(36).substr(2, 6).toUpperCase(); // 6-char random
  return `ORD-${date}-${random}`;
}

exports.createSubscriptionOrder = async (req, res) => {
  try {
    const {
      productModelId,
      selectedPlanId,
      selectedDurationId,
      deliveryAddress
    } = req.body;

    if (!productModelId || !selectedPlanId || !selectedDurationId || !deliveryAddress) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const db = await connectToDatabase();

    // Fetch user by ID
    const user = await db.collection('users').findOne({ _id: new ObjectId(req.userId) });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const now = new Date();
    if (user.subscriptionExpiryDate && new Date(user.subscriptionExpiryDate) > now) {
      console.log(`User has active subscription expiring on ${user.subscriptionExpiryDate}. Proceeding to recharge.`);
    } else {
      console.log(`User has no active subscription or it expired.`);
    }

    const productModel = await db.collection('product_models').findOne({ _id: new ObjectId(productModelId) });
    if (!productModel) return res.status(404).json({ message: 'Product model not found' });

    if (!productModel.wp_device_quantity || productModel.wp_device_quantity <= 0) {
      return res.status(404).json({ message: 'No available devices for this product model' });
    }

    const selectedPlan = productModel.plans.find(plan => plan.plans_id === selectedPlanId);
    const selectedDuration = productModel.duration.find(dur => dur.duration_id === selectedDurationId);

    if (!selectedPlan || !selectedDuration) {
      return res.status(404).json({ message: 'Selected plan or duration not found' });
    }

    // Price calculation
    const pricePerMonth = selectedPlan.price;
    const durationLabel = selectedDuration.duration_time_limit; // e.g. "90 days"
    const durationInDays = parseInt(durationLabel.split(' ')[0]); // Extract number
    const monthsEquivalent = durationInDays / 30;
    const baseRent = pricePerMonth * monthsEquivalent;
    const discount = (baseRent * selectedDuration.discount) / 100;
    const discountedBaseRent = baseRent - discount;
    const gstAmount = (discountedBaseRent * selectedDuration.gst) / 100;
    const securityDeposit = selectedDuration.security_deposit || 0;
    const totalPrice = discountedBaseRent + gstAmount + securityDeposit;

    let litrePerMonth = selectedPlan.litre_per_month;

    if (!litrePerMonth && selectedPlan.capacity) {
      const match = selectedPlan.capacity.match(/(\d+)/); // Extract number from "500 Ltrs/M"
      if (match) {
        litrePerMonth = parseInt(match[1], 10);
      } else {
        litrePerMonth = 0;
      }
    }

    const totalLitre = litrePerMonth * monthsEquivalent;

    const deviceQuery = { model_id: Number(productModel.model_id), status: true };
    const device = await db.collection('device_details').findOne(deviceQuery);
    if (!device) {
      return res.status(404).json({ message: 'Device with this model_id not found' });
    }

    const razorpayOrder = await razorpay.orders.create({
      amount: Math.round(totalPrice * 100),
      currency: 'INR',
      receipt: `order_rcptid_${Math.floor(Math.random() * 1000000)}`
    });

    const customOrderId = generateOrderId();

    const newOrder = {
      customOrderId,
      user_id: user.user_id,
      productModelId,
      modelName: productModel.model_name,
      wp_device_id: device.wp_device_id,
      selectedPlan,
      selectedDuration,
      price: totalPrice,
      deliveryAddress,
      paymentStatus: 'Pending',
      orderStatus: 'Created',
      razorpayOrderId: razorpayOrder.id,
      totalLitre,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await db.collection('orders').insertOne(newOrder);
    const orderId = result.insertedId;

    const paymentDoc = {
      user_id: user.user_id,
      orderId,
      razorpayOrderId: razorpayOrder.id,
      baseRent,
      discount,
      discountedBaseRent,
      gstAmount,
      securityDeposit,
      totalPrice,
      totalLitre, 
      paymentStatus: 'Pending',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    await db.collection('payments').insertOne(paymentDoc);

    const body = razorpayOrder.id + '|' + orderId.toString();
    const generatedSignature = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex');

    return res.status(200).json({
      status: 'success',
      message: 'Order created and Razorpay payment initiated',
      data: {
        orderId: customOrderId,
        userId: user.user_id,
        razorpayOrder,
        razorpaySignature: generatedSignature,
        product: {
          _id: productModel._id,
          model_name: productModel.model_name
        },
        wp_device_id: device.wp_device_id,
        selectedPlan,
        selectedDuration,
        costBreakdown: {
          baseRent,
          discount,
          discountedBaseRent,
          gstAmount,
          securityDeposit,
          totalPrice
        },
        deliveryAddress,
        totalLitre 
      }
    });

  } catch (err) {
    console.error('Error in createSubscriptionOrder:', err);
    return res.status(500).json({ message: 'Failed to create order', error: err.message });
  }
};



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

    const db = await connectToDatabase();

    const order = await db.collection('orders').findOne({ razorpayOrderId: razorpay_order_id });
    if (!order) return res.status(404).json({ message: 'Order not found' });

    const subscribedAt = new Date();

    // Calculate new subscription expiry date by adding selected duration days to now or extend current expiry if still active
    const durationStr = order.selectedDuration?.duration_time_limit || '30 days';
    const durationInDays = parseInt(durationStr.split(' ')[0]) || 30;

    let subscriptionExpiryDate;
    if (order.paymentStatus === 'Completed' && order.subscriptionExpiryDate && new Date(order.subscriptionExpiryDate) > subscribedAt) {
      // If current subscription active, extend expiry
      subscriptionExpiryDate = new Date(order.subscriptionExpiryDate);
      subscriptionExpiryDate.setDate(subscriptionExpiryDate.getDate() + durationInDays);
    } else {
      // Else, start new subscription from today
      subscriptionExpiryDate = new Date(subscribedAt);
      subscriptionExpiryDate.setDate(subscriptionExpiryDate.getDate() + durationInDays);
    }

    // Update order with payment status and expiry
    await db.collection('orders').updateOne(
      { _id: order._id },
      {
        $set: {
          paymentStatus: 'Completed',
          orderStatus: 'Confirmed',
          razorpayPaymentId: razorpay_payment_id,
          updatedAt: new Date(),
          subscriptionExpiryDate
        }
      }
    );

    // Update payment record
    await db.collection('payments').updateOne(
      { razorpayOrderId: razorpay_order_id },
      {
        $set: {
          paymentStatus: 'Completed',
          razorpayPaymentId: razorpay_payment_id,
          subscribedAt,
          subscriptionExpiryDate,
          updatedAt: new Date()
        }
      }
    );

    // Update user subscription info (extend if active, else new)
    const user = await db.collection('users').findOne({ user_id: order.user_id });

    let userNewExpiry = subscriptionExpiryDate;
    if (user?.subscriptionExpiryDate && new Date(user.subscriptionExpiryDate) > subscribedAt) {
      userNewExpiry = new Date(user.subscriptionExpiryDate);
      userNewExpiry.setDate(userNewExpiry.getDate() + durationInDays);
    }

    await db.collection('users').updateOne(
      { user_id: order.user_id },
      {
        $set: {
          isSubscribed: true,
          subscribedAt,
          subscriptionExpiryDate: userNewExpiry,
          assigned_device_id: order.wp_device_id || null,
          active_label: order.selectedPlan?.label || null,
          active_plan_id: order.selectedPlan?.plans_id || null,
          active_duration_id: order.selectedDuration?.duration_time_limit || null,
          active_order_id: order._id.toString()
        }
      }
    );

    // Decrement available device quantity for product model
    if (order.productModelId) {
      await db.collection('product_models').updateOne(
        { _id: new ObjectId(order.productModelId) },
        { $inc: { wp_device_quantity: -1 } }
      );
    }

    return res.status(200).json({
      message: 'Payment verified, subscription activated or renewed, device quantity updated',
      subscriptionExpiryDate: userNewExpiry
    });

  } catch (error) {
    console.error('Error verifying Razorpay payment:', error);
    return res.status(500).json({ message: 'Error verifying payment', error: error.message });
  }
};




// GET /api/recharge-history
exports.getRechargeHistory = async (req, res) => {
  try {
    const db = await connectToDatabase();
    
    // Find the user by req.userId
    const user = await db.collection('users').findOne({ _id: new ObjectId(req.userId) });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Fetch all orders for the user
    const orders = await db.collection('orders')
      .find({ user_id: user.user_id })
      .sort({ createdAt: -1 })
      .toArray();

    if (!orders.length) {
      return res.status(200).json({
        status: 'success',
        message: 'No subscription history found',
        orders: []
      });
    }

    // Combine orders with relevant payment details (excluding duplicates)
    const ordersWithPayments = await Promise.all(
      orders.map(async (order) => {
        const payment = await db.collection('payments').findOne({
          razorpayOrderId: order.razorpayOrderId
        });

        let cleanedPaymentDetails = null;

        if (payment) {
          const {
            baseRent,
            discount,
            discountedBaseRent,
            gstAmount,
            securityDeposit,
            subscribedAt,
            subscriptionExpiryDate
          } = payment;

          cleanedPaymentDetails = {
            baseRent,
            discount,
            discountedBaseRent,
            gstAmount,
            securityDeposit,
            subscribedAt,
            subscriptionExpiryDate
          };
        }

        return {
          ...order,
          paymentDetails: cleanedPaymentDetails
        };
      })
    );

    res.status(200).json({
      status: 'success',
      message: 'User subscription history fetched successfully',
      orders: ordersWithPayments
    });

  } catch (error) {
    console.error('Error fetching recharge history:', error);
    res.status(500).json({ message: 'Failed to fetch subscription history', error: error.message });
  }
};





