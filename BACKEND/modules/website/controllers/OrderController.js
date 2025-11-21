// controllers/OrderController.js
const razorpay = require('../../../services/Razorpay');
const crypto = require('crypto');
const { connectToDatabase } = require('../../../config/db');
const { ObjectId } = require('mongodb');
const { sendSubscriptionConfirmationEmail, sendEmail } = require('../controllers/Email');

// Function to send order success email to seller, admin, customer, and technical team
async function sendOrderSuccessEmailToSellerAndAdmin(order, user) {
  try {
    const db = await connectToDatabase();

    // Get all sellers, admins, and technical team - deduplicate by email
    const staffUsers = await db.collection('users').find({
      role_id: { $in: [1, 4, 5] } // 1 = Admin, 4 = Seller, 5 = Technical
    }).toArray();

    // Collect unique emails to avoid sending duplicates
    const uniqueEmails = new Set();
    const emailRecipients = [];

    // Add staff (admin, seller, technical)
    staffUsers.forEach(u => {
      if (u.email && !uniqueEmails.has(u.email)) {
        uniqueEmails.add(u.email);
        emailRecipients.push({ email: u.email, type: 'staff' });
      }
    });

    // Add customer/user if not already in the list
    if (user.email && !uniqueEmails.has(user.email)) {
      uniqueEmails.add(user.email);
      emailRecipients.push({ email: user.email, type: 'customer' });
    }

    if (!emailRecipients.length) {
      console.warn('No recipients found to send order success email');
      return false;
    }

    const subject = `New Order Success - ${order.customOrderId}`;
    const text = `
Dear Team,

A new order has been successfully placed and payment confirmed.

Order Details:
- Order ID: ${order.customOrderId}
- Customer: ${user.name || 'N/A'} (${user.email})
- Product: ${order.modelName}
- Plan: ${order.selectedPlan?.label || 'N/A'}
- Amount: ₹${order.grandTotal}
- Device ID: ${order.wp_device_id}
- Payment Type: ${order.paymentType}

Please process this order accordingly.

Best regards,
IonHive System
    `;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border-radius: 10px; background-color: #f9f9f9; border: 1px solid #ddd;">
        <h2 style="color: #333;">New Order Success Notification</h2>
        <p style="font-size: 16px; color: #555;">A new order has been successfully placed and payment confirmed.</p>
        <div style="background-color: #fff; padding: 15px; border-radius: 5px; margin: 15px 0;">
          <h3 style="margin-top: 0; color: #333;">Order Details:</h3>
          <ul style="font-size: 16px; color: #555;">
            <li><strong>Order ID:</strong> ${order.customOrderId}</li>
            <li><strong>Customer:</strong> ${user.name || 'N/A'} (${user.email})</li>
            <li><strong>Product:</strong> ${order.modelName}</li>
            <li><strong>Plan:</strong> ${order.selectedPlan?.label || 'N/A'}</li>
            <li><strong>Amount:</strong> ₹${order.grandTotal}</li>
            <li><strong>Device ID:</strong> ${order.wp_device_id}</li>
            <li><strong>Payment Type:</strong> ${order.paymentType}</li>
          </ul>
        </div>
        <p style="font-size: 16px; color: #555;">Please process this order accordingly.</p>
        <p style="color: #555;">Best regards,<br><strong>IonHive System</strong></p>
        <p style="font-size: 14px; color: #888; text-align: center; margin-top: 30px; border-top: 1px solid #ddd; padding-top: 10px;">
          This is an automated message from IonHive Water Purifier.
        </p>
      </div>
    `;

    // Send email to all unique recipients
    const emailPromises = emailRecipients.map(recipient => {
      return sendEmail(recipient.email, subject, text, html);
    });

    const results = await Promise.allSettled(emailPromises);
    const successCount = results.filter(result => result.status === 'fulfilled' && result.value).length;

    console.log(`Order success email sent to ${successCount}/${emailRecipients.length} unique recipients`);
    return successCount > 0;

  } catch (error) {
    console.error('Error sending order success email to seller and admin:', error);
    return false;
  }
}
const { validateDeliveryAddress, normalizeDeliveryAddress } = require('../models/DeliveryAddress');
const { autoAssignInstallation } = require('../../admin/services/autoAssignmentService');

const DELIVERY_STATUSES = ['accepted', 'packed', 'intransit', 'outfordelivery', 'completed'];

function generateOrderId() {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, ''); // e.g. 20250526
  const random = Math.random().toString(36).substr(2, 6).toUpperCase();
  return `ORD-${date}-${random}`;
}
function generaterechagerid() {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, ''); // e.g. 20250526
  const random = Math.random().toString(36).substr(2, 6).toUpperCase();
  return `RECHARGE-${date}-${random}`;
}
exports.createSubscriptionOrder = async (req, res) => {
  try {
    let {
      productModelId,
      selectedPlanId,
      selectedDurationId,
      deliveryAddress,
      discountedPrice,
      discountAmount,
      gstAmount,
      securityDeposit,
      grandTotal,
      priceWithGST,
      wp_device_id,
      paymentType,
      price,
      subtotal,
      codFee
    } = req.body;

    if (!paymentType) return res.status(400).json({ message: 'paymentType is required' });
    paymentType = paymentType.toUpperCase();
    if (!['COD', 'ONLINE'].includes(paymentType)) return res.status(400).json({ message: 'Invalid paymentType. Must be "COD" or "ONLINE"' });

    const db = await connectToDatabase();
    const user = await db.collection('users').findOne({ _id: new ObjectId(req.userId) });
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (Number(user.role_id) !== 3) return res.status(403).json({ message: 'Only End Users can create subscriptions' });

   if (
  !productModelId || 
  !selectedPlanId || 
  !selectedDurationId || 
  !deliveryAddress ||
  discountedPrice === undefined || 
  discountAmount === undefined ||
  priceWithGST === undefined || 
  gstAmount === undefined || 
  grandTotal === undefined || 
  !wp_device_id
) {
  const missingFields = [];

  if (!productModelId) missingFields.push('productModelId');
  if (!selectedPlanId) missingFields.push('selectedPlanId');
  if (!selectedDurationId) missingFields.push('selectedDurationId');
  if (!deliveryAddress) missingFields.push('deliveryAddress');
  if (discountedPrice === undefined) missingFields.push('discountedPrice');
  if (discountAmount === undefined) missingFields.push('discountAmount');
  if (priceWithGST === undefined) missingFields.push('priceWithGST');
  if (gstAmount === undefined) missingFields.push('gstAmount');
  if (grandTotal === undefined) missingFields.push('grandTotal');
  if (!wp_device_id) missingFields.push('wp_device_id');

  return res.status(400).json({ 
    message: 'Missing required fields', 
    missingFields 
  });
}


    const addrResult = validateDeliveryAddress(deliveryAddress);
    if (!addrResult.valid) return res.status(400).json({ message: addrResult.message });
    const normalizedAddress = normalizeDeliveryAddress(deliveryAddress);

    if (!user.security_deposit_added && (securityDeposit === undefined || securityDeposit === null)) {
      return res.status(400).json({ message: 'Security deposit is required for new users' });
    }

    const productModel = await db.collection('product_models').findOne({ _id: new ObjectId(productModelId) });
    if (!productModel) return res.status(404).json({ message: 'Product model not found' });

    const main_image = productModel.main_img || '';
    const sub_images = [productModel.sub_img_1, productModel.sub_img_2, productModel.sub_img_3, productModel.sub_img_4].filter(Boolean);

    // Check device availability
    const device = await db.collection('device_details').findOne({
      wp_device_id,
      model_id: Number(productModel.model_id),
      status: true
    });
    if (!device) return res.status(404).json({ message: 'Device not available' });

    // Prevent assigning same device again
    const deviceUsed = await db.collection('orders').findOne({
      wp_device_id,
      $or: [
        { paymentStatus: 'Completed' },
        { orderStatus: 'Confirmed' }
      ]
    });
    if (deviceUsed) {
      return res.status(400).json({ message: 'This device is already assigned to another order. Please choose another device.' });
    }

    const normalizeId = (value) => (value === undefined || value === null ? '' : value.toString());
    const durations = Array.isArray(productModel.duration) ? productModel.duration : [];
    const selectedDuration = durations.find((duration) => normalizeId(duration.duration_id) === normalizeId(selectedDurationId));
    const selectedDurationPlans = Array.isArray(selectedDuration?.plans) ? selectedDuration.plans : [];
    const topLevelPlans = Array.isArray(productModel.plans) ? productModel.plans : [];
    const plans = selectedDurationPlans.length > 0 ? selectedDurationPlans : topLevelPlans;
    const selectedPlan = plans.find((plan) => normalizeId(plan.plans_id) === normalizeId(selectedPlanId));
    if (!selectedPlan || !selectedDuration) return res.status(404).json({ message: 'Plan or duration not found' });

    const effectiveSecurityDeposit = user.security_deposit_added ? 0 : securityDeposit;
    const totalLitre = parseInt(selectedPlan.capacity.match(/\d+/)?.[0] || "0", 10);

    let razorpayOrder = null;
    if (paymentType === 'ONLINE') {
      razorpayOrder = await razorpay.orders.create({
        amount: Math.round(grandTotal * 100),
        currency: 'INR',
        receipt: `order_rcptid_${Math.floor(Math.random() * 1000000)}`
      });
    }

    const customOrderId = generateOrderId();
    const orderStatus = 'Confirmed';
    const paymentStatus = 'Pending'; // COD and ONLINE both start Pending

    const now = new Date();

    const newOrder = {
      customOrderId,
      user_id: user.user_id,
      productModelId,
      orderType: 'subscription',
      modelName: productModel.model_name,
      modeltype: productModel.model_type,
      main_image,
      sub_images,
      wp_device_id,
      selectedPlan,
      selectedDuration,
      grandTotal,
      deliveryAddress: normalizedAddress,
      paymentType,
      paymentStatus,
      orderStatus,
      razorpayOrderId: razorpayOrder?.id || null,
      totalLitre,
      price,
      subtotal,
      codFee,
      deliveryAcceptanceStatus: 'pending',
      deliveryAcceptanceTimestamp: null,
      deliveryCompletionTimestamp: null,
      createdAt: now,
      updatedAt: now
    };

    const result = await db.collection('orders').insertOne(newOrder);
    const orderId = result.insertedId;

    await db.collection('payments').insertOne({
      user_id: user.user_id,
      orderId,
      razorpayOrderId: razorpayOrder?.id || null,
      discountedPrice,
      discountAmount,
      priceWithGST,
      gstAmount,
      securityDeposit: effectiveSecurityDeposit,
      totalPrice: grandTotal,
      totalLitre,
      paymentStatus,
      paymentType,
      price,
      subtotal,
      codFee,
      createdAt: now,
      updatedAt: now
    });

    //  Immediately mark user subscribed for COD
    if (paymentType === 'COD') {
      const now = new Date();
      await db.collection('users').updateOne(
        { user_id: user.user_id },
        {
          $set: {
            is_subscribed: true,
            subscribed_at: now,
            active_order_id: orderId.toString(),
            active_label: selectedPlan.label,
            active_plan_id: selectedPlan.plans_id,
            active_duration_id: selectedDuration.duration_time_limit
          },
          $addToSet: { assigned_device_ids: wp_device_id },
          $unset: { assigned_device_id: "" }
        }
      );

      await db.collection('orders').updateOne(
        { _id: orderId },
        {
          $set: {
            deliveryAcceptanceStatus: 'accepted',
            deliveryAcceptanceTimestamp: now
          }
        }
      );
    }

    await autoAssignInstallation(newOrder);

    const generatedSignature = razorpayOrder
      ? crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
          .update(`${razorpayOrder.id}|${orderId.toString()}`)
          .digest('hex')
      : null;

    return res.status(200).json({
      status: 'success',
      message: 'Order created successfully',
      data: {
        orderId: customOrderId,
        userId: user.user_id,
        razorpayOrder,
        razorpaySignature: generatedSignature,
        paymentType,
        product: {
          _id: productModel._id,
          model_name: productModel.model_name,
          model_type: productModel.model_type,
          main_image,
          sub_images
        },
        wp_device_id,
        selectedPlan,
        selectedDuration,
        costBreakdown: {
          discountedPrice,
          discountAmount,
          priceWithGST,
          gstAmount,
          securityDeposit: effectiveSecurityDeposit,
          totalPrice: grandTotal
        },
        deliveryAddress: normalizedAddress,
        totalLitre,
        orderStatus,
        paymentStatus
      }
    });
  } catch (err) {
    console.error('Error in createSubscriptionOrder:', err);
    return res.status(500).json({ message: 'Failed to create order', error: err.message });
  }
};

exports.renewSubscription = async (req, res) => {
  try {
    const {
      wp_device_id,
      productModelId,
      selectedPlanId,
      selectedDurationId,
      deliveryAddress,
      discountedPrice,
      discountAmount,
      gstAmount,
      grandTotal,
      priceWithGST,
      price,
      subtotal,
      
      orderType,
      paymentType,
      task,
      user_id
    } = req.body;

    const db = await connectToDatabase();
    const users = db.collection('users');
    const orders = db.collection('orders');
    const payments = db.collection('payments');
    const productModels = db.collection('product_models');
    const deviceDetails = db.collection('device_details');

    // ✅ Validate user
    const user = await users.findOne({ user_id: Number(user_id) });
    if (!user) return res.status(404).json({ status: 'failure', message: 'User not found' });
    if (Number(user.role_id) !== 3)
      return res.status(403).json({ status: 'failure', message: 'Only End Users can renew subscriptions' });

    // ✅ Fetch product model (supports both _id and model_id)
    let productModel;
    if (ObjectId.isValid(productModelId)) {
      productModel = await productModels.findOne({ _id: new ObjectId(productModelId) });
    } else {
      productModel = await productModels.findOne({ model_id: Number(productModelId) });
    }

    if (!productModel)
      return res.status(404).json({ status: 'failure', message: 'Product model not found' });

    // ✅ Extract images
    const main_image = productModel.main_img || '';
    const sub_images = [
      productModel.sub_img_1,
      productModel.sub_img_2,
      productModel.sub_img_3,
      productModel.sub_img_4,
    ].filter(Boolean);

    // ✅ Find correct duration & plan
    const normalizeId = (v) => (v === undefined || v === null ? '' : v.toString());
    const durations = Array.isArray(productModel.duration) ? productModel.duration : [];

    const selectedDuration = durations.find(
      (duration) => normalizeId(duration.duration_id) === normalizeId(selectedDurationId)
    );

    const plans = Array.isArray(selectedDuration?.plans) ? selectedDuration.plans : [];
    const selectedPlan = plans.find(
      (plan) => normalizeId(plan.plans_id) === normalizeId(selectedPlanId)
    );

    if (!selectedPlan || !selectedDuration)
      return res.status(404).json({ message: 'Plan or duration not found' });

    // ✅ Create Razorpay order if ONLINE
    let razorpayOrder = null;
    if (paymentType && paymentType.toUpperCase() === 'ONLINE') {
      razorpayOrder = await razorpay.orders.create({
        amount: Math.round(Number(grandTotal) * 100),
        currency: 'INR',
        receipt: `renew_rcptid_${Math.floor(Math.random() * 1000000)}`,
      });
    }

    // ✅ Prepare order
    const customOrderId = generaterechagerid();
    const now = new Date();
    const paymentStatus = 'Pending';
    const orderStatus = 'Confirmed';
    const totalLitre = parseInt(selectedPlan.capacity?.match(/\d+/)?.[0] || '0', 10);
    
    const deviceDetail = await deviceDetails.findOne({ wp_device_id: wp_device_id.trim() });
    const macId= deviceDetail?.mac_id;


    const renewOrder = {
      customOrderId,
      user_id: user.user_id,
      user_email: user.email,
      wp_device_id: wp_device_id.trim(),
      productModelId: productModel.model_id,
      modelName: productModel.model_name,
      modeltype: productModel.model_type,
      main_image,
      sub_images,
      selectedPlan,
      selectedDuration,
      grandTotal: grandTotal,
      discountedPrice: discountedPrice,
      discountAmount: discountAmount,
      gstAmount: gstAmount,
      priceWithGST: priceWithGST,
      price: price,
      subtotal: subtotal,
      deliveryAddress,
      orderType: 'Recharge',
      paymentType: paymentType.toUpperCase(),
      paymentStatus,
      orderStatus,
      isRenewal: true,
      createdAt: now,
      updatedAt: now,
      isRecharge: true,
      totalLitre,
      razorpayOrderId: razorpayOrder?.id || null,
      mac_id: macId
      
      
    };

    const orderResult = await orders.insertOne(renewOrder);
    const orderId = orderResult.insertedId;

    // ✅ Insert payment
    await payments.insertOne({
      user_id: user.user_id,
      orderId,
      razorpayOrderId: razorpayOrder?.id || null,
      discountedPrice: Number(discountedPrice),
      discountAmount: Number(discountAmount),
      priceWithGST: Number(priceWithGST),
      gstAmount: Number(gstAmount),
      totalPrice: Number(grandTotal),
      orderType,
      paymentType,
      paymentStatus,
      isRenewal: true,
      createdAt: now,
      updatedAt: now,
    });

    // ✅ Generate Razorpay signature
    const generatedSignature = razorpayOrder
      ? crypto
          .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
          .update(`${razorpayOrder.id}|${orderId.toString()}`)
          .digest('hex')
      : null;

    // ✅ Final response (same as createSubscriptionOrder)
    return res.status(200).json({
      status: 'success',
      message: 'Recharge order created successfully',
      data: {
        orderId: customOrderId,
        userId: user.user_id,
        razorpayOrder,
        razorpaySignature: generatedSignature,
        paymentType,
        product: {
          _id: productModel._id,
          model_name: productModel.model_name,
          model_type: productModel.model_type,
          main_image,
          sub_images,
        },
        wp_device_id,
        selectedPlan,
        selectedDuration,
        costBreakdown: {
          discountedPrice: Number(discountedPrice),
          discountAmount: Number(discountAmount),
          priceWithGST: Number(priceWithGST),
          gstAmount: Number(gstAmount),
          totalPrice: Number(grandTotal),
        },
        deliveryAddress,
        totalLitre,
        orderStatus,
        paymentStatus,
      },
    });
  } catch (err) {
    console.error('Error in renewSubscription:', err);
    return res
      .status(500)
      .json({ message: 'Failed to renew subscription', error: err.message });
  }
};



exports.verifyRazorpayPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ message: 'All fields are required for verification' });
    }

    // 🔐 Verify Razorpay signature
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
    const devicesCollection = db.collection('device_details');

    // 🔍 Fetch order
    const order = await ordersCollection.findOne({ razorpayOrderId: razorpay_order_id });
    if (!order) return res.status(404).json({ message: 'Order not found' });

    // 🔍 Fetch user
    const user = await usersCollection.findOne({ user_id: order.user_id });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const device= await devicesCollection.findOne({ wp_device_id: order.wp_device_id });
    if(!device){
      return res.status(404).json({message:'Device not found'});
    }

    const now = new Date();

    // 🧾 Update payment record
    await paymentsCollection.updateOne(
      { razorpayOrderId: razorpay_order_id },
      {
        $set: {
          paymentStatus: 'Completed',
          razorpayPaymentId: razorpay_payment_id,
          updatedAt: now,
        },
      }
    );

    // 🧾 Update order
    await ordersCollection.updateOne(
      { _id: order._id },
      {
        $set: {
          paymentStatus: 'Completed',
          orderStatus: 'Confirmed',
          razorpayPaymentId: razorpay_payment_id,
          updatedAt: now,
          isSetup: false
        },
      }
    );
    
    await devicesCollection.updateOne(
      { wp_device_id: order.wp_device_id },
      {
        $set: {
          isSetup: false
        },
      }
    );

    // 🧩 Fetch updated order
    const updatedOrder = {
      ...order,
      paymentStatus: 'Completed',
      orderStatus: 'Confirmed',
      razorpayPaymentId: razorpay_payment_id,
      updatedAt: now,
    };

    // 🔄 Handle user update differently for renewal vs. new order
    if (order.isRenewal) {
      // ✅ Renewal Flow: extend or replace current subscription
      await usersCollection.updateOne(
        { user_id: order.user_id },
        {
          $set: {
            is_subscribed: true,
            subscribed_at: now,
            active_order_id: order._id.toString(),
            active_label: order.selectedPlan?.label || null,
            active_plan_id: order.selectedPlan?.plans_id || null,
            active_duration_id: order.selectedDuration?.duration_time_limit || null,
            renewed_from_order_id: order.parentOrderReference || null,
          },
          $addToSet: { assigned_device_ids: order.wp_device_id },
        }
      );

      console.log(`✅ Renewal subscription activated for user_id ${order.user_id}`);
    } else {
      // ✅ New Subscription Flow (existing logic)
      await usersCollection.updateOne(
        { user_id: order.user_id },
        {
          $set: {
            is_subscribed: true,
            subscribed_at: now,
            active_order_id: order._id.toString(),
            active_label: order.selectedPlan?.label || null,
            active_plan_id: order.selectedPlan?.plans_id || null,
            active_duration_id: order.selectedDuration?.duration_time_limit || null,
          },
          $addToSet: { assigned_device_ids: order.wp_device_id },
          $unset: { assigned_device_id: "" },
        }
      );

      // Auto-assign installation only for new subscription
      // await autoAssignInstallation(updatedOrder);
    }

    // 📧 Send order success email to seller and admin
    try {
      await sendOrderSuccessEmailToSellerAndAdmin(updatedOrder, user);
    } catch (emailError) {
      console.error('Error sending order success email to seller and admin:', emailError);
    }

    return res.status(200).json({
      status: 'success',
      message: order.isRenewal
        ? 'Renewal payment verified successfully. Subscription renewed.'
        : 'Payment verified successfully. Subscription activated.',
    });

  } catch (error) {
    console.error('Error verifying Razorpay payment:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};



const PDFDocument = require('pdfkit');
const path = require('path');
const fs = require('fs');

// function formatCurrency(value) {
//     if (value === undefined || value === null || value === '') {
//         return '₹0.00';
//     }
//     const num = Number(value);
//     if (Number.isNaN(num)) {
//         return '₹0.00';
//     }
//     return `₹${num.toFixed(2)}`;
// }

// function formatDate(date) {
//     if (!date) return 'N/A';
//     const d = new Date(date);
//     return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
// }


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
exports.downloadInvoice = async (req, res) => {
  try {
    const { orderId } = req.params;
    if (!orderId)
      return res.status(400).json({ message: 'orderId is required' });

    const db = await connectToDatabase();
    const ordersCollection = db.collection('orders');
    const paymentsCollection = db.collection('payments');
    const usersCollection = db.collection('users');

    // Fetch order, user, and payment
    const order = await ordersCollection.findOne({ customOrderId: orderId });
    if (!order) return res.status(404).json({ message: 'Order not found' });

    const user = await usersCollection.findOne({ user_id: order.user_id });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const payment = await paymentsCollection.findOne({ orderId: order._id });
    if (!payment)
      return res
        .status(404)
        .json({ message: 'Payment details not found for this order' });

    console.log('Payment Data for Invoice:', payment);

    const appearedAt = order.createdAt || payment.createdAt || new Date();
    const subscribedAt = payment.subscribedAt || order.subscribed_at || payment.createdAt || order.updatedAt || null;
    const subscriptionExpiry = payment.subscriptionExpiryDate || order.subscriptionExpiryDate || null;

    //  Create PDF Document
    const doc = new PDFDocument({ margin: 40, size: 'A4', autoFirstPage: true });

    const fonts = {
      regular: 'Helvetica',
      bold: 'Helvetica-Bold',
      italic: 'Helvetica-Oblique',
    };

    try {
      const fontBasePath = path.join(
        __dirname,
        '../../../../FRONTEND/APP/assets/fonts/Poppins'
      );
      const regularFontPath = path.join(fontBasePath, 'Poppins-Regular.ttf');
      const boldFontPath = path.join(fontBasePath, 'Poppins-Bold.ttf');
      const italicFontPath = path.join(fontBasePath, 'Poppins-Italic.ttf');

      if (fs.existsSync(regularFontPath)) {
        doc.registerFont('Poppins-Regular', regularFontPath);
        fonts.regular = 'Poppins-Regular';
      }
      if (fs.existsSync(boldFontPath)) {
        doc.registerFont('Poppins-Bold', boldFontPath);
        fonts.bold = 'Poppins-Bold';
      }
      if (fs.existsSync(italicFontPath)) {
        doc.registerFont('Poppins-Italic', italicFontPath);
        fonts.italic = 'Poppins-Italic';
      }
    } catch (fontError) {
      console.warn('Invoice font registration failed:', fontError);
    }

    const primaryColor = '#0A5EB7';
    const accentColor = '#E3EEFF';
    const labelColor = '#3F4C6B';
    const textColor = '#1F2933';
    const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;

    const isValuePrintable = (value) => {
      if (value === 0) return true;
      if (typeof value === 'number') return true;
      if (value instanceof Date) return !Number.isNaN(value.getTime());
      if (typeof value === 'string') return value.trim() !== '';
      return Boolean(value);
    };

    const drawSection = (title, rows = []) => {
      const validRows = rows.filter((row) => isValuePrintable(row.value));
      if (!validRows.length) return;
      const padding = 16;
      const labelColumnWidth = pageWidth * 0.35;
      const contentWidth = pageWidth - padding * 2;
      let sectionTop = doc.y;

      if (sectionTop > 650) {
        doc.addPage();
        sectionTop = doc.y;
      }

      doc.save();
      doc.roundedRect(doc.page.margins.left, sectionTop, pageWidth, 22)
        .fillAndStroke('#FFFFFF', accentColor);
      doc.restore();

      doc.font(fonts.bold)
        .fontSize(13)
        .fillColor(primaryColor)
        .text(title, doc.page.margins.left + 6, sectionTop + 6);

      let currentY = sectionTop + 28;

      validRows.forEach((row) => {
        const valueText = typeof row.value === 'number' ? row.value.toString() : String(row.value);
        const labelHeight = doc.heightOfString(row.label, { width: labelColumnWidth });
        const valueHeight = doc.heightOfString(valueText, { width: contentWidth - labelColumnWidth - padding });
        const rowHeight = Math.max(labelHeight, valueHeight) + 8;

        if (currentY + rowHeight > 750) {
          doc.addPage();
          currentY = doc.y;
        }

        doc.save();
        doc.roundedRect(doc.page.margins.left, currentY, pageWidth, rowHeight)
          .fill('#F8FBFF');
        doc.restore();

        doc.font(fonts.bold)
          .fontSize(10)
          .fillColor(labelColor)
          .text(row.label, doc.page.margins.left + 12, currentY + 4, {
            width: labelColumnWidth,
          });

        doc.font(fonts.regular)
          .fontSize(10)
          .fillColor(textColor)
          .text(valueText, doc.page.margins.left + labelColumnWidth + 12, currentY + 4, {
            width: contentWidth - labelColumnWidth - padding,
          });

        currentY += rowHeight + 4;
      });

      doc.y = currentY + 10;
    };

    const drawAmountSummary = () => {
      const metrics = [
        payment.baseRent != null && { label: 'Base Rent', value: formatCurrency(payment.baseRent) },
        payment.discount != null && { label: 'Discount', value: formatCurrency(payment.discount) },
        (payment.totalPrice != null || order.grandTotal != null) && {
          label: 'Total Payable',
          value: formatCurrency(payment.totalPrice != null ? payment.totalPrice : order.grandTotal),
          highlight: true,
        },
      ].filter(Boolean);

      if (!metrics.length) {
        return;
      }

      const boxGap = 12;
      const boxWidth = (pageWidth - boxGap * (metrics.length - 1)) / metrics.length;
      const boxHeight = 90;
      const startY = doc.y;

      if (doc.y > 680) {
        doc.addPage();
      }

      metrics.forEach((metric, i) => {
        const boxX = doc.page.margins.left + i * (boxWidth + boxGap);

        doc.save();
        const fillColor = metric.highlight ? primaryColor : '#F5F8FF';
        const strokeColor = metric.highlight ? primaryColor : accentColor;

        doc.roundedRect(boxX, startY, boxWidth, boxHeight).fillAndStroke(fillColor, strokeColor);

        doc.fillColor(metric.highlight ? '#FFFFFF' : primaryColor)
          .font(fonts.bold)
          .fontSize(11)
          .text(metric.label, boxX + 16, startY + 18, { width: boxWidth - 32 });

        doc.fillColor(metric.highlight ? '#FFFFFF' : textColor)
          .font(fonts.bold)
          .fontSize(18)
          .text(metric.value, boxX + 16, startY + 42, { width: boxWidth - 32 });

        doc.restore();
      });

      doc.y = startY + boxHeight + 24;
    };

    //  Response setup
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${order.customOrderId}_invoice.pdf"`
    );
    doc.pipe(res);

    // Header
    const headerTop = doc.y;
    const headerHeight = 110;

    doc.save();
    doc.roundedRect(doc.page.margins.left, headerTop, pageWidth, headerHeight).fill(primaryColor);
    doc.fillColor('#FFFFFF')
      .font(fonts.bold)
      .fontSize(22)
      .text('Water Purifier Invoice', doc.page.margins.left + 24, headerTop + 26, {
        width: pageWidth - 48,
      });

    doc.font(fonts.regular)
      .fontSize(11)
      .text(`Invoice Date: ${formatDate(appearedAt)}`, doc.page.margins.left + 24, headerTop + 66)
      .text(`Invoice ID: ${order.customOrderId}`, doc.page.margins.left + 24, headerTop + 86);

    doc.text('Water Purifier Pvt. Ltd.', doc.page.margins.left + pageWidth / 2, headerTop + 30, {
      width: pageWidth / 2 - 24,
      align: 'right',
    })
      .font(fonts.regular)
      .text('support@waterpurifier.com', doc.page.margins.left + pageWidth / 2, headerTop + 48, {
        width: pageWidth / 2 - 24,
        align: 'right',
      })
      .text('+91 98765 43210', doc.page.margins.left + pageWidth / 2, headerTop + 66, {
        width: pageWidth / 2 - 24,
        align: 'right',
      });
    doc.restore();

    doc.y = headerTop + headerHeight + 28;

    const addressParts = order.deliveryAddress
      ? [
          order.deliveryAddress.street,
          order.deliveryAddress.area,
          order.deliveryAddress.city,
          order.deliveryAddress.state,
          order.deliveryAddress.pincode,
        ].filter(Boolean)
      : [];

    //  Sections
    drawSection('Customer Details', [
      { label: 'Name', value: user.name },
      { label: 'Email', value: user.email },
      { label: 'Phone', value: user.phone },
      { label: 'User ID', value: user.user_id },
      { label: 'Address', value: addressParts.join(', ') },
    ]);

    drawSection('Order Details', [
      { label: 'Device ID', value: order.wp_device_id },
      { label: 'Product Model', value: order.modelName || order.productModelId },
      { label: 'Plan', value: order.selectedPlan?.label },
      { label: 'Plan Price', value: payment.discountedPrice != null ? formatCurrency(payment.discountedPrice) : (payment.baseRent != null ? formatCurrency(payment.baseRent) : null) },
      { label: 'Duration', value: order.selectedDuration?.duration_time_limit },
      { label: 'Total Litres', value: order.totalLitre },
      { label: 'Order Status', value: order.orderStatus },
    ]);

    drawSection('Subscription Timeline', [
      { label: 'Subscription Start', value: subscribedAt ? formatDate(subscribedAt) : null },
      { label: 'Subscription Expiry', value: subscriptionExpiry ? formatDate(subscriptionExpiry) : null },
    ]);

    drawSection('Payment Summary', [
      { label: 'Payment Status', value: payment.paymentStatus || order.paymentStatus },
      { label: 'Payment ID', value: order.razorpayPaymentId || payment.razorpayPaymentId },
      { label: 'Razorpay Order ID', value: order.razorpayOrderId || payment.razorpayOrderId },
      { label: 'Security Deposit', value: payment.securityDeposit != null ? formatCurrency(payment.securityDeposit) : null },
      { label: 'GST Amount', value: payment.gstAmount != null ? formatCurrency(payment.gstAmount) : null },
      { label: 'Discounted Rent', value: payment.discountedBaseRent != null ? formatCurrency(payment.discountedBaseRent) : null },
      { label: 'Total Price', value: payment.totalPrice != null ? formatCurrency(payment.totalPrice) : null },
    ]);

    //  Total Section
    drawAmountSummary();

    //  Footer
    doc.font(fonts.italic)
      .fontSize(10)
      .fillColor('#6B7280')
      .text('This is a computer-generated invoice and does not require a signature.', doc.page.margins.left, doc.y, { width: pageWidth, align: 'center' });

    doc.moveDown(0.3);
    doc.font(fonts.bold)
      .fontSize(11)
      .fillColor(primaryColor)
      .text('Thank you for choosing Water Purifier!', doc.page.margins.left, doc.y, { width: pageWidth, align: 'center' });

    doc.end();
  } catch (error) {
    console.error('Error generating invoice PDF:', error);
    res.status(500).json({ message: 'Failed to generate invoice', error: error.message });
  }
};

exports.getDeliveryHistory = async (req, res) => {
  try {
    const { orderId } = req.params;

    if (!orderId) {
      return res.status(400).json({ message: 'orderId is required' });
    }

    // Validate if orderId is a valid MongoDB ObjectId
    if (!ObjectId.isValid(orderId)) {
      return res.status(400).json({ message: 'Invalid orderId format' });
    }

    const db = await connectToDatabase();
    const order = await db.collection('orders').findOne({ _id: new ObjectId(orderId) });

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Build delivery history from order's delivery fields
    const history = [];

    // ✅ Helper to safely normalize statuses
    const normalizeStatus = (value) => {
      if (typeof value === 'string') return value.toLowerCase();
      if (value === true) return 'accepted';
      if (value === false) return 'rejected';
      return 'pending';
    };

    // ✅ Add delivery acceptance event if exists
    if (order.deliveryAcceptanceStatus && order.deliveryAcceptanceTimestamp) {
      history.push({
        status: normalizeStatus(order.deliveryAcceptanceStatus),
        timestamp: order.deliveryAcceptanceTimestamp,
        note: order.deliveryAcceptanceNote || '',
        updatedBy: order.deliveryAcceptanceUpdatedBy || 'System',
      });
    }

    // ✅ Add delivery completion event if exists
    if (order.deliveryCompletionTimestamp) {
      history.push({
        status: 'completed',
        timestamp: order.deliveryCompletionTimestamp,
        note: order.deliveryCompletionNote || '',
        updatedBy: order.deliveryCompletionUpdatedBy || 'System',
      });
    }

    // ✅ If no delivery events, fallback to order creation
    if (history.length === 0 && order.orderStatus) {
      history.push({
        status: normalizeStatus(order.orderStatus),
        timestamp: order.createdAt || new Date(),
        note: 'Order created',
        updatedBy: 'System',
      });
    }

    // ✅ Extract delivery notes (array or single)
    const notes = Array.isArray(order.deliveryNotes)
      ? order.deliveryNotes
      : order.deliveryNotes
      ? [{ text: order.deliveryNotes, timestamp: new Date() }]
      : [];

    // ✅ Determine current status safely
    let currentStatus =
      order.deliveryCurrentStatus ||
      normalizeStatus(order.deliveryAcceptanceStatus) ||
      normalizeStatus(order.orderStatus) ||
      'pending';

    return res.status(200).json({
      status: 'success',
      data: {
        history,
        deliveryHistory: history,
        notes,
        deliveryNotes: notes,
        currentStatus,
        order: {
          _id: order._id,
          customOrderId: order.customOrderId,
          deliveryAcceptanceStatus: order.deliveryAcceptanceStatus,
          deliveryCurrentStatus: order.deliveryCurrentStatus,
          orderStatus: order.orderStatus,
          paymentStatus: order.paymentStatus,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching delivery history:', error);
    res.status(500).json({
      message: 'Failed to fetch delivery history',
      error: error.message,
    });
  }
};


exports.updateDeliveryStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { newStatus, notes } = req.body;

    // Validate ObjectId
    if (!ObjectId.isValid(orderId)) {
      return res.status(400).json({ message: 'Invalid order ID format' });
    }

    // Validate new status
    if (!newStatus) {
      return res.status(400).json({ message: 'newStatus is required' });
    }

    const statusLower = newStatus.toLowerCase();
    if (!DELIVERY_STATUSES.includes(statusLower)) {
      return res.status(400).json({
        message: `Invalid delivery status. Must be one of: ${DELIVERY_STATUSES.join(', ')}`
      });
    }

    console.log('updateDeliveryStatus called with:', { orderId, newStatus: statusLower });

    const db = await connectToDatabase();
    const ordersCollection = db.collection('orders');

    // Get current order
    console.log('Fetching order with ID:', orderId);
    const order = await ordersCollection.findOne({ _id: new ObjectId(orderId) });
    console.log('Order fetched:', { orderId, found: !!order, orderStatus: order?.orderStatus });
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Validate sequential status progression (no skipping, no going backwards)
    const currentStatus = order.deliveryCurrentStatus || 'pending';
    const currentStatusIndex = DELIVERY_STATUSES.indexOf(currentStatus);
    const newStatusIndex = DELIVERY_STATUSES.indexOf(statusLower);

    // If already at current status, return error
    if (currentStatus === statusLower) {
      return res.status(400).json({
        message: `Delivery status is already "${statusLower}". Cannot update to the same status.`
      });
    }

    // Check if trying to go backwards
    if (newStatusIndex < currentStatusIndex) {
      return res.status(400).json({
        message: `Cannot go backwards in delivery status. Current: "${currentStatus}" → Requested: "${statusLower}". You can only move forward in the sequence: ${DELIVERY_STATUSES.join(' → ')}`
      });
    }

    // Check if trying to skip steps
    // if (newStatusIndex > currentStatusIndex + 1) {
    //   const nextStatus = DELIVERY_STATUSES[currentStatusIndex + 1];
    //   return res.status(400).json({
    //     message: `Cannot skip delivery status steps. Current: "${currentStatus}" → Next should be: "${nextStatus}" → Cannot jump to: "${statusLower}". Follow the sequence: ${DELIVERY_STATUSES.join(' → ')}`
    //   });
    // }

    // Prepare update object
    const updateData = {
      deliveryCurrentStatus: statusLower,
      updatedAt: new Date()
    };

    // Update status-specific timestamps
    if (statusLower === 'accepted') {
      updateData.deliveryAcceptanceStatus = true;
      updateData.deliveryAcceptanceTimestamp = new Date();
    } else if (statusLower === 'completed') {
      updateData.deliveryCompletionStatus = true;
      updateData.deliveryCompletionTimestamp = new Date();
    }

    // Add to delivery history
    const historyEntry = {
      status: statusLower,
      timestamp: new Date(),
      notes: notes || 'Manual update by admin',
      updatedBy: 'admin'
    };

    // Update order
    console.log('Attempting to update order:', {
      orderId,
      updateData,
      historyEntry
    });

    const result = await ordersCollection.findOneAndUpdate(
      { _id: new ObjectId(orderId) },
      {
        $set: updateData,
        $push: {
          deliveryHistory: historyEntry
        }
      },
      { returnDocument: 'after' }
    );

    console.log('Update result:', {
      resultType: typeof result,
      hasValue: result?.value ? true : false,
      hasOk: result?.ok ? true : false,
      resultKeys: result ? Object.keys(result) : 'null'
    });

    // Handle both old and new MongoDB driver versions
    const updatedOrder = result?.value || result;

    if (!updatedOrder || !updatedOrder._id) {
      console.error('Failed to get updated order:', { result, updatedOrder });
      return res.status(500).json({
        message: 'Failed to update order in database',
        error: 'Update returned no value',
        debug: {
          resultType: typeof result,
          resultKeys: result ? Object.keys(result) : 'null',
          hasId: updatedOrder?._id ? true : false
        }
      });
    }

    // Trigger auto-assignment for installation if delivery is completed
    if (statusLower === 'completed') {
      console.log(`Delivery completed for order ${orderId}. Triggering auto-assignment for installation...`);
      console.log('Order details for auto-assignment:', {
        orderId: updatedOrder._id,
        wp_device_id: updatedOrder.wp_device_id,
        orderStatus: updatedOrder.orderStatus,
        paymentStatus: updatedOrder.paymentStatus,
        paymentType: updatedOrder.paymentType,
        deliveryAddress: updatedOrder.deliveryAddress ? '✓ Present' : '✗ Missing',
        customOrderId: updatedOrder.customOrderId
      });
      try {
        await autoAssignInstallation(updatedOrder);
        console.log('Auto-assignment completed successfully for order:', orderId);
      } catch (assignmentError) {
        console.error('Error during auto-assignment:', assignmentError);
        // Don't fail the response, just log the error
      }
    }

    return res.status(200).json({
      message: 'Delivery status updated successfully',
      order: updatedOrder
    });
  } catch (error) {
    console.error('Error updating delivery status:', error);
    res.status(500).json({
      message: 'Failed to update delivery status',
      error: error.message
    });
  }
};

// Example helper functions (to be implemented elsewhere)
function formatDate(date) {
  return date.toLocaleDateString('en-GB'); // e.g., DD/MM/YYYY
}

function formatCurrency(amount) {
  if (amount === undefined || amount === null || amount === '') {
    return '₹0.00';
  }
  const numericAmount = Number(amount);
  if (Number.isNaN(numericAmount)) {
    return '₹0.00';
  }
  const formatted = numericAmount.toFixed(2);
  // Ensure currency symbol is a separate string to avoid encoding issues
  return `₹${formatted}`;
}


exports.getUserDevices = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ status: 'failure', message: 'User ID is required' });
    }

    const db = await connectToDatabase();

    // Step 1: Fetch completed orders for the user
    const orders = await db.collection('orders').find({
      user_id: parseInt(userId),
      orderStatus: 'Confirmed',
      deliveryCurrentStatus: 'completed',
      paymentStatus: 'Completed',
      modeltype:"Smart"
    }).toArray();

    if (!orders.length) {
      return res.status(404).json({ status: 'failure', message: 'No completed orders found for this user' });
    }

    // Step 2: Extract device IDs from those orders
    const deviceIds = orders.map(o => o.wp_device_id).filter(Boolean);

    if (!deviceIds.length) {
      return res.status(404).json({ status: 'failure', message: 'No devices found for this user' });
    }

    // Step 3: Check installation status from service_records
    const completedInstallations = await db.collection('service_records').find({
      wp_device_id: { $in: deviceIds },
      task_type: 1, // installation type
      task_status: 'Completed'
    }).toArray();

    // Keep only devices whose installation is completed
    const completedDeviceIds = completedInstallations.map(r => r.wp_device_id);

    if (!completedDeviceIds.length) {
      return res.status(404).json({
        status: 'failure',
        message: 'No devices with completed installation found for this user'
      });
    }

    // Step 4: Fetch device details for only completed installations
    const deviceDetails = await db.collection('device_details').find({
      wp_device_id: { $in: completedDeviceIds }
    }).toArray();

    if (!deviceDetails.length) {
      return res.status(404).json({ status: 'failure', message: 'No device details found for this user' });
    }

    // Step 5: Group devices by model_name
    const devicesByModel = deviceDetails.reduce((acc, device) => {
      const { model_name } = device;
      if (!acc[model_name]) acc[model_name] = [];
      acc[model_name].push({
        deviceId: device.wp_device_id,
        model_id: device.model_id,
        model_name: device.model_name,
        installation_status: 'Completed',
        deviceDetails: device,
        // Ordersdetails: orders.filter(o => completedDeviceIds.includes(o.wp_device_id)),
        deliveryAddress: orders.find(o => o.wp_device_id === device.wp_device_id)?.deliveryAddress
      });
      return acc;
    }, {});

    // ✅ Step 6: Final structured response
    res.status(200).json({
      status: 'success',
      user_id: parseInt(userId),
      total_devices: completedDeviceIds.length,
      devices: devicesByModel,
     
    });

  } catch (error) {
    console.error('Error fetching user devices:', error);
    res.status(500).json({
      status: 'failure',
      message: 'Failed to fetch user devices',
      error: error.message
    });
  }
};
