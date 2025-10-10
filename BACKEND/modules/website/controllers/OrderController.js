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




// controllers/OrderController.js
exports.createSubscriptionOrder = async (req, res) => {
  try {
    // -----------------------------
    // Handle uploaded files
    // -----------------------------
     let main_image = '';
    let sub_images = [];

    // If files are uploaded via multipart/form-data
    if (req.files) {
      if (req.files['main_image'] && req.files['main_image'][0]) {
        main_image = req.files['main_image'][0].filename;
      }

      if (req.files['sub_images']) {
        sub_images = req.files['sub_images'].map(f => f.filename);
      }
    }

    // If JSON body has filenames (fallback)
    if (!main_image && req.body.main_image) {
      main_image = req.body.main_image;
    }

    if ((!sub_images || sub_images.length === 0) && req.body.sub_images) {
      sub_images = Array.isArray(req.body.sub_images)
        ? req.body.sub_images.filter(Boolean)
        : [];
    }


    // -----------------------------
    // Extract other fields from req.body
    // -----------------------------
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
      priceWithGST === undefined || gstAmount === undefined || grandTotal === undefined ||
      !wp_device_id || !main_image
    ) {
      return res.status(400).json({
        message: 'All fields including main_image and wp_device_id are required (except securityDeposit)'
      });
    }

    // Validate delivery address
    const addrResult = validateDeliveryAddress(deliveryAddress);
    if (!addrResult.valid) {
      return res.status(400).json({ message: addrResult.message });
    }

    const normalizedAddress = normalizeDeliveryAddress(deliveryAddress);

    // Check security deposit
    if (!user.security_deposit_added && (securityDeposit === undefined || securityDeposit === null)) {
      return res.status(400).json({ message: 'Security deposit is required for new users' });
    }

    // Fetch product model
    const productModel = await db.collection('product_models').findOne({ _id: new ObjectId(productModelId) });
    if (!productModel) return res.status(404).json({ message: 'Product model not found' });

    // Validate device
    const device = await db.collection('device_details').findOne({
      wp_device_id,
      model_id: Number(productModel.model_id),
      status: true
    });
    if (!device) {
      return res.status(404).json({ message: 'Invalid or unavailable device for this product' });
    }

    const deviceUsed = await db.collection('orders').findOne({
      wp_device_id,
      paymentStatus: 'Completed'
    });
    if (deviceUsed) {
      return res.status(400).json({
        status: 'failed',
        message: 'This device has already been used in a completed order. Please choose another device.'
      });
    }

    // Validate plan and duration
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

    const newOrder = {
      customOrderId,
      user_id: user.user_id,
      productModelId,
      modelName: productModel.model_name,
      wp_device_id,
      main_image,
      sub_images,
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

    // Payment record
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

    // Generate Razorpay signature
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
          model_name: productModel.model_name,
          main_image,
          sub_images
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

    // ✅ Verify Razorpay signature
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

    // ✅ Fetch order and user
    const order = await ordersCollection.findOne({ razorpayOrderId: razorpay_order_id });
    if (!order) return res.status(404).json({ message: 'Order not found' });

    const user = await usersCollection.findOne({ user_id: order.user_id });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const now = new Date();

    // ✅ Update order
    await ordersCollection.updateOne(
      { _id: order._id },
      {
        $set: {
          paymentStatus: 'Completed',
          orderStatus: 'Confirmed',
          razorpayPaymentId: razorpay_payment_id,
          subscribed_at: now,
          updatedAt: now
        }
      }
    );

    const updatedOrder = { ...order, paymentStatus: 'Completed', orderStatus: 'Confirmed', razorpayPaymentId: razorpay_payment_id, subscribed_at: now, updatedAt: now };

    // ✅ Update user subscription & active plan
    const userUpdateResult = await usersCollection.updateOne(
      { user_id: order.user_id },
      {
        $set: {
          is_subscribed: true,
          subscribed_at: now,
          active_order_id: order._id.toString(),
          active_label: order.selectedPlan?.label || null,
          active_plan_id: order.selectedPlan?.plans_id || null,
          active_duration_id: order.selectedDuration?.duration_time_limit || null
        },
        $addToSet: { assigned_device_ids: order.wp_device_id },
        $unset: { assigned_device_id: "" }
      }
    );

    if (userUpdateResult.matchedCount === 0) {
      console.warn(`⚠️ User update did not match any document for user_id ${order.user_id}`);
    }

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

    // ✅ Reduce product quantity
    // if (order.productModelId) {
    //   const productModel = await productModelsCollection.findOne({ _id: new ObjectId(order.productModelId) });
    //   if (productModel) {
    //     let currentQty = productModel.wp_device_quantity;
    //     if (typeof currentQty === 'string') currentQty = parseInt(currentQty, 10);
    //     if (!isNaN(currentQty) && currentQty > 0) {
    //       await productModelsCollection.updateOne(
    //         { _id: new ObjectId(order.productModelId) },
    //         { $inc: { wp_device_quantity: -1 } }
    //       );
    //     }
    //   }
    // }

    // ✅ Auto-assign installation
    await autoAssignInstallation(updatedOrder);

    // ✅ Send payment confirmation email
    try {
      await sendPaymentConfirmationEmail(user, order);
    } catch (emailError) {
      console.error('Error sending payment confirmation email:', emailError);
    }

    return res.status(200).json({
      status: 'success',
      message: 'Payment verified successfully. Subscription activated immediately. Installation will be scheduled soon.'
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

    // ✅ Create PDF Document
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

    // ✅ Response setup
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

    // ✅ Sections
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
      { label: 'Plan Price', value: payment.finalMonthlyPrice != null ? formatCurrency(payment.finalMonthlyPrice) : (payment.baseRent != null ? formatCurrency(payment.baseRent) : null) },
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

    // ✅ Total Section
    drawAmountSummary();

    // ✅ Footer
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




