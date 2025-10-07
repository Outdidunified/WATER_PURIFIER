const razorpay = require('../../../services/Razorpay');
const crypto = require('crypto');
const { connectToDatabase } = require('../../../config/db');
const { ObjectId } = require('mongodb');
const { sendSubscriptionConfirmationEmail } = require('../controllers/Email');
const { validateDeliveryAddress, normalizeDeliveryAddress } = require('../models/DeliveryAddress');
const { autoAssignInstallation } = require('../../admin/services/autoAssignmentService');


function generateOrderId() {
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, ''); // e.g. 20250526
    const random = Math.random().toString(36).substr(2, 6).toUpperCase(); // 6-char random
    return `ORD-${date}-${random}`;
}




exports.createSubscriptionOrder = async (req, res) => {
  try {
    const {
      productModelId,
      selectedPlanId,
      selectedDurationId,
      deliveryAddress,
      finalMonthlyPrice,
      discountAmount,
      gstAmount,
      securityDeposit,
      grandTotal,
      priceWithGST,
      wp_device_id
    } = req.body;

    const db = await connectToDatabase();
    const user = await db.collection('users').findOne({ _id: new ObjectId(req.userId) });
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (Number(user.role_id) !== 3) {
      return res.status(403).json({
        status: 'failed',
        message: 'Only End Users are allowed to create subscriptions'
      });
    }

    if (
      !productModelId || !selectedPlanId || !selectedDurationId || !deliveryAddress ||
      finalMonthlyPrice === undefined || discountAmount === undefined ||
      priceWithGST === undefined || gstAmount === undefined || grandTotal === undefined || !wp_device_id
    ) {
      return res.status(400).json({
        message: 'All fields including wp_device_id are required (except securityDeposit)'
      });
    }

    // Validate deliveryAddress (district required)
    const addrResult = validateDeliveryAddress(deliveryAddress);
    if (!addrResult.valid) {
      return res.status(400).json({ message: addrResult.message });
    }

    // Normalize before storing
    const normalizedAddress = normalizeDeliveryAddress(deliveryAddress);

    // Require security deposit for first-time users
    if (!user.security_deposit_added && (securityDeposit === undefined || securityDeposit === null)) {
      return res.status(400).json({ message: 'Security deposit is required for new users' });
    }

    // Check product model
    const productModel = await db.collection('product_models').findOne({ _id: new ObjectId(productModelId) });
    if (!productModel) return res.status(404).json({ message: 'Product model not found' });

    if (!productModel.wp_device_quantity || productModel.wp_device_quantity <= 0) {
      return res.status(404).json({ message: 'No available devices for this product model' });
    }

    // Validate device availability
    const device = await db.collection('device_details').findOne({
      wp_device_id: wp_device_id,
      model_id: Number(productModel.model_id),
      status: true
    });

    if (!device) {
      return res.status(404).json({ message: 'Invalid or unavailable device for this product' });
    }

    const deviceUsed = await db.collection('orders').findOne({
      wp_device_id: wp_device_id,
      paymentStatus: 'Completed'
    });

    if (deviceUsed) {
      return res.status(400).json({
        status: 'failed',
        message: 'This device has already been used in a completed order. Please choose another device.'
      });
    }

    // Validate selected plan and duration
    const selectedPlan = productModel.plans.find(plan => plan.plans_id === selectedPlanId);
    const selectedDuration = productModel.duration.find(dur => dur.duration_id === selectedDurationId);

    if (!selectedPlan || !selectedDuration) {
      return res.status(404).json({ message: 'Selected plan or duration not found' });
    }

    const capacityString = selectedPlan?.capacity || "";
    const totalLitre = parseInt(capacityString.match(/\d+/)?.[0] || "0", 10);

    const effectiveSecurityDeposit = user.security_deposit_added ? 0 : securityDeposit;
    const totalAmountForRazorpay = grandTotal;

    // Create Razorpay order
    const razorpayOrder = await razorpay.orders.create({
      amount: Math.round(totalAmountForRazorpay * 100),
      currency: 'INR',
      receipt: `order_rcptid_${Math.floor(Math.random() * 1000000)}`
    });

    const customOrderId = generateOrderId();

    // Insert order
    const newOrder = {
      customOrderId,
      user_id: user.user_id,
      productModelId,
      modelName: productModel.model_name,
      wp_device_id,
      selectedPlan,
      selectedDuration,
      grandTotal: totalAmountForRazorpay,
      deliveryAddress: normalizedAddress,
      paymentStatus: 'Pending',
      orderStatus: 'Created',
      razorpayOrderId: razorpayOrder.id,
      totalLitre,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await db.collection('orders').insertOne(newOrder);
    const orderId = result.insertedId;

    // Insert payment details
    await db.collection('payments').insertOne({
      user_id: user.user_id,
      orderId,
      razorpayOrderId: razorpayOrder.id,
      finalMonthlyPrice,
      discountAmount,
      priceWithGST,
      gstAmount,
      securityDeposit: effectiveSecurityDeposit,
      totalPrice: totalAmountForRazorpay,
      totalLitre,
      paymentStatus: 'Pending',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // Generate Razorpay signature for frontend verification
    const signatureBase = razorpayOrder.id + '|' + orderId.toString();
    const generatedSignature = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(signatureBase)
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
        wp_device_id,
        selectedPlan,
        selectedDuration,
        costBreakdown: {
          finalMonthlyPrice,
          discountAmount,
          priceWithGST,
          gstAmount,
          securityDeposit: effectiveSecurityDeposit,
          totalPrice: totalAmountForRazorpay
        },
        deliveryAddress: normalizedAddress,
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

    // Verify signature
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ message: 'Invalid payment signature' });
    }

    const db = await connectToDatabase();
    const ordersCollection = db.collection('orders');
    const usersCollection = db.collection('users');
    const paymentsCollection = db.collection('payments');
    const productModelsCollection = db.collection('product_models');

    const order = await ordersCollection.findOne({ razorpayOrderId: razorpay_order_id });
    if (!order) return res.status(404).json({ message: 'Order not found' });

    const user = await usersCollection.findOne({ user_id: order.user_id });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const now = new Date();

    // ✅ Update order as paid and confirmed
    await ordersCollection.updateOne(
      { _id: order._id },
      {
        $set: {
          paymentStatus: 'Completed',
          orderStatus: 'Confirmed',
          razorpayPaymentId: razorpay_payment_id,
          updatedAt: now
        }
      }
    );

    const updatedOrder = {
      ...order,
      paymentStatus: 'Completed',
      orderStatus: 'Confirmed',
      razorpayPaymentId: razorpay_payment_id,
      updatedAt: now
    };

    // ✅ Auto assign installation
    await autoAssignInstallation(updatedOrder);

    // ✅ Update payment record
    await paymentsCollection.updateOne(
      { razorpayOrderId: razorpay_order_id },
      {
        $set: {
          paymentStatus: 'Completed',
          razorpayPaymentId: razorpay_payment_id,
          updatedAt: now
        }
      }
    );

    // ✅ Assign device (without subscription updates)
    await usersCollection.updateOne(
      { user_id: order.user_id },
      {
        $addToSet: { assigned_device_ids: order.wp_device_id || null },
        $unset: { assigned_device_id: "" }
      }
    );

    // ✅ Reduce product quantity
    if (order.productModelId) {
      const productModel = await productModelsCollection.findOne({ _id: new ObjectId(order.productModelId) });
      if (!productModel) return res.status(404).json({ message: 'Product model not found' });

      let currentQty = productModel.wp_device_quantity;
      if (typeof currentQty === 'string') currentQty = parseInt(currentQty, 10);
      if (isNaN(currentQty) || currentQty <= 0) return res.status(400).json({ message: 'Invalid or zero quantity' });

      await productModelsCollection.updateOne(
        { _id: new ObjectId(order.productModelId) },
        { $inc: { wp_device_quantity: -1 } }
      );
    }

    // ✅ Email user (no subscription details yet)
    try {
      await sendPaymentConfirmationEmail(user, order);
    } catch (emailError) {
      console.error('Error sending payment confirmation email:', emailError);
    }

    return res.status(200).json({
      status: 'success',
      message: 'Payment verified successfully. Subscription will activate after installation is completed.'
    });
  } catch (error) {
    console.error('Error verifying Razorpay payment:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
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





