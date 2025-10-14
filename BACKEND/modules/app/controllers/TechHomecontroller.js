const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const qrcode = require('qrcode');
const { connectToDatabase } = require('../../../config/db');
const { ObjectId } = require('mongodb');
const path = require('path');
const Razorpay = require('razorpay');
const crypto = require('crypto');

const razorpayInstance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Nodemailer transporter

exports.getAssignedTaskDetails = async (req, res) => {
    const { user_id, email, role_id, assigned_technician_id } = req.body;
  
    // Basic validation
    if (!user_id || !email || !role_id || !assigned_technician_id) {
      return res.status(400).json({ 
        error: true, 
        message: 'user_id, email, role_id, and assigned_technician_id are required' 
      });
    }
  
    // Check if role_id is technician role (2)
    if (parseInt(role_id) !== 2) {
      return res.status(403).json({ error: true, message: 'Access denied: not a technician' });
    }
  
    try {
      const db = await connectToDatabase();
      const serviceRecordsCollection = db.collection('service_records');
  
      // Query for tasks assigned to the technician (excluding completed)
      const tasks = await serviceRecordsCollection.find({
        assigned_technician_id: assigned_technician_id.trim(),
        task_status: { $in: ['Assigned', 'Pending'] }
      }).toArray();
  
      if (!tasks || tasks.length === 0) {
        return res.status(404).json({ error: true, message: 'No active tasks found assigned to this technician' });
      }
  
      return res.status(200).json({
        error: false,
        message: 'Assigned tasks fetched successfully',
        data: tasks,
      });
  
    } catch (error) {
      console.error('Error fetching assigned tasks:', error);
      return res.status(500).json({ error: true, message: 'Server error while fetching task details' });
    }
  };
  
  

// Nodemailer transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SMTP_EMAIL,
    pass: process.env.SMTP_PASSWORD,
  },
});

exports.updateTaskDetails = async (req, res) => {
  console.log('----- Incoming Request to /updateTaskDetails -----');
  console.log('➡️ Body:', req.body);
  console.log('➡️ Files:', req.files);
  console.log('---------------------------------------------------');

  const { task_id, user_id, role_id, email, technician_id, otp, updates: updatesJSON } = req.body;
  const updates = typeof updatesJSON === 'string' ? JSON.parse(updatesJSON) : updatesJSON;

  if (!task_id || !user_id || !role_id || !email || !technician_id || !updates || typeof updates !== 'object') {
    return res.status(400).json({
      error: true,
      message: 'task_id, user_id, role_id, email, technician_id and valid updates object are required',
    });
  }

  if (parseInt(role_id) !== 2) {
    return res.status(403).json({
      error: true,
      message: 'Access denied: Only technicians can update tasks',
    });
  }

  try {
    const db = await connectToDatabase();
    const serviceRecordsCollection = db.collection('service_records');
    const technicianCollection = db.collection('technician_details');
    const usersCollection = db.collection('users');
    const ordersCollection = db.collection('orders');
    const paymentsCollection = db.collection('payments');

    // Find the task assigned to the technician
    const task = await serviceRecordsCollection.findOne({
      task_id: parseInt(task_id),
      assigned_technician_id: technician_id,
    });

    if (!task)
      return res.status(404).json({ error: true, message: 'No task found assigned to this technician' });

    // Fetch order to check payment type
    const order = await ordersCollection.findOne({
      customOrderId: task.customOrderId || task.order_snapshot?.customOrderId || task.order?.customOrderId,
    });

    // Allowed fields to update
    const allowedFields = ['task_status', 'pending_reason', 'modified_by', 'modified_date', 'collectPayment', 'paymentMethod'];
    const updateData = {};
    for (let key in updates) {
      if (allowedFields.includes(key)) updateData[key] = updates[key];
    }

    const status = updates.task_status || task.task_status;

    // Validate Pending Reason
    if (status === 'Pending' && !updates.pending_reason?.trim()) {
      return res.status(400).json({
        error: true,
        message: 'pending_reason is required when task_status is "Pending"',
      });
    } else if (status !== 'Pending') {
      updateData.pending_reason = null;
    }

    // OTP check for Completed status
    if (status === 'Completed') {
      // For COD orders, require payment to be already collected before completing
      if (order && order.paymentType === 'COD') {
        const paymentRecord = await paymentsCollection.findOne({ orderId: order._id });
        if (!paymentRecord || paymentRecord.paymentStatus !== 'Completed') {
          return res.status(400).json({
            error: true,
            message: 'For COD orders, payment must be collected before completing the task.',
          });
        }
      }

      const parsedOtp = parseInt(otp);
      if (!parsedOtp || parsedOtp !== task.otp) {
        return res.status(400).json({ error: true, message: 'Invalid OTP. Cannot complete task.' });
      }

      updateData.completed_date = new Date(); // store in UTC
    }

    // Handle uploaded images
    const files = req.files;
    if (files) {
      if (files.image_before_service && files.image_before_service.length > 0) {
        const beforeImagePath = `/upload/technician/before/${path.basename(files.image_before_service[0].path)}`;
        const existingBeforeImages = task.image_before_service || [];
        if (existingBeforeImages.length >= 5) {
          return res.status(400).json({ error: true, message: 'Maximum of 5 images already uploaded for image_before_service' });
        }
        updateData.image_before_service = [...existingBeforeImages, beforeImagePath];
      }

      if (files.image_after_service && files.image_after_service.length > 0) {
        const afterImagePath = `/upload/technician/after/${path.basename(files.image_after_service[0].path)}`;
        const existingAfterImages = task.image_after_service || [];
        if (existingAfterImages.length >= 5) {
          return res.status(400).json({ error: true, message: 'Maximum of 5 images already uploaded for image_after_service' });
        }
        updateData.image_after_service = [...existingAfterImages, afterImagePath];
      }
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ error: true, message: 'No valid fields provided for update' });
    }

    // Generate QR code if payment method is QR for COD orders
    let qrCode = null;
    if (order && order.paymentType === 'COD' && updates.paymentMethod === 'QR') {
      const upiId = process.env.UPI_ID;
      const amount = order.grandTotal;
      const merchantName = process.env.MERCHANT_NAME || 'Water Purifier Service';
      const upiString = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(merchantName)}&am=${amount}&cu=INR`;
      qrCode = await qrcode.toDataURL(upiString);
    }

    // Handle COD payment collection
    if (updates.collectPayment == true && order && order.paymentType === 'COD') {
      const paymentRecord = await paymentsCollection.findOne({ orderId: order._id });
      if (paymentRecord && paymentRecord.paymentStatus !== 'Completed') {
        let qrCodeData = null;
        if (updates.paymentMethod === 'QR') qrCodeData = qrCode;

        await ordersCollection.updateOne(
          { customOrderId: order.customOrderId },
          {
            $set: {
              paymentStatus: 'Completed',
              paymentCollectedAt: new Date(),
              paymentCollectedBy: technician_id,
              qrCode: qrCodeData,
              updatedAt: new Date(),
            },
          }
        );

        await paymentsCollection.updateOne(
          { orderId: order._id },
          {
            $set: {
              paymentStatus: 'Completed',
              paymentCollectedAt: new Date(),
              paymentMethod: updates.paymentMethod,
              qrCode: qrCodeData,
              updatedAt: new Date(),
            },
          }
        );

        // Update snapshots in the task document
        const updatedOrder = await ordersCollection.findOne({ customOrderId: order.customOrderId });
        const updatedPayment = await paymentsCollection.findOne({ orderId: order._id });
        if (updatedOrder) updateData.order_snapshot = updatedOrder;
        if (updatedPayment) updateData.payment_snapshot = updatedPayment;

        console.log(`💵 COD payment collected for order ${order.customOrderId}`);
      }
    }

    // Update task in DB
    const result = await serviceRecordsCollection.updateOne(
      { task_id: parseInt(task_id), assigned_technician_id: technician_id },
      { $set: updateData }
    );

    if (result.modifiedCount === 0) {
      return res.status(400).json({ error: true, message: 'No changes were made to the task' });
    }

    // Technician stats + Subscription expiry updates if completed
    if (status === 'Completed') {
      const technician = await technicianCollection.findOne({ technician_id });
      if (technician) {
        await technicianCollection.updateOne(
          { technician_id },
          { $set: { total_completed_services: (technician.total_completed_services || 0) + 1 } }
        );
      }

      // Update subscription expiry
      if (order) {
        const subscribedAt = new Date();
        const durationStr = order.selectedDuration?.duration_time_limit || '30 days';
        const durationInDays = parseInt(durationStr.split(' ')[0], 10) || 30;

        const subscriptionExpiryDate = new Date(subscribedAt);
        subscriptionExpiryDate.setDate(subscriptionExpiryDate.getDate() + durationInDays);

        const userId = parseInt(task.task_created_by_user_id);
        await usersCollection.updateOne({ user_id: userId }, { $set: { subscription_expiry_date: subscriptionExpiryDate } });
        await ordersCollection.updateOne(
          { customOrderId: order.customOrderId },
          { $set: { subscriptionExpiryDate, updatedAt: new Date() } }
        );

        console.log(`🟢 Subscription expiry updated for user ${userId}`);
      }

      // Send completion email
      const mailOptions = {
        from: 'your_email@gmail.com',
        to: task.task_created_by_user_email,
        subject: 'Task Completed Successfully',
        html: `<h3>Hello,</h3>
               <p>Your service task <strong>#${task.task_id}</strong> has been <span style="color: green;">successfully completed</span>.</p>
               <p>Subscription expiry has been updated. 🎉</p>`,
      };

      transporter.sendMail(mailOptions, (error, info) => {
        if (error) console.error('Error sending mail:', error);
        else console.log('Email sent:', info.response);
      });
    }

    // Final response
    let message = 'Task updated successfully';
    if (updates.collectPayment == true) message = 'Payment collected successfully';
    else if (status === 'Completed') message = 'Task completed successfully';

    return res.status(200).json({ error: false, message, qrCode });
  } catch (error) {
    console.error('Error updating task:', error);
    return res.status(500).json({ error: true, message: 'Server error while updating task' });
  }
};

  
 exports.acceptDeclineTask = async (req, res) => {
  const {
    user_id,
    email,
    role_id,
    technician_id,
    task_id,
    action,
    decline_reason,
    estimated_end,
  } = req.body;

  // Basic validation
  if (!user_id || !email || !role_id || !technician_id || !task_id || !action) {
    return res.status(400).json({
      error: true,
      message: 'user_id, email, role_id, technician_id, task_id, and action are required',
    });
  }

  // Only technicians can act
  if (parseInt(role_id) !== 2) {
    return res.status(403).json({ error: true, message: 'Access denied: not a technician' });
  }

  const actionLower = action.toLowerCase();
  if (!['accept', 'decline'].includes(actionLower)) {
    return res.status(400).json({ error: true, message: 'Action must be "accept" or "decline"' });
  }

  // Decline must have a reason
  if (actionLower === 'decline' && (!decline_reason || !decline_reason.trim())) {
    return res.status(400).json({ error: true, message: 'decline_reason is required when declining a task' });
  }

  try {
    const db = await connectToDatabase();
    const serviceRecordsCollection = db.collection('service_records');

    // Find assigned task
    const task = await serviceRecordsCollection.findOne({
      task_id: parseInt(task_id),
      assigned_technician_id: technician_id.trim(),
      task_status: { $in: ['Assigned', 'Pending'] },
    });

    if (!task) {
      return res.status(404).json({ error: true, message: 'Task not found or not assigned to technician' });
    }

    let updateData = {
      modified_by: technician_id,
      modified_date: new Date().toISOString(),
    };

    // ✅ ACCEPT
    if (actionLower === 'accept') {
      if (!estimated_end) {
        return res.status(400).json({ error: true, message: 'estimated_end is required when accepting a task' });
      }

      // Parse assigned date and estimated end in UTC
      const assignedDateUTC = new Date(task.assigned_date); // already UTC
      const estimatedEndUTC = new Date(estimated_end); // sent from Flutter as UTC

      // Calculate 3-day limit in UTC
      const threeDaysLaterUTC = new Date(assignedDateUTC);
      threeDaysLaterUTC.setUTCDate(threeDaysLaterUTC.getUTCDate() + 3);

      // Validation: ensure estimatedEndUTC is within assignedDateUTC and threeDaysLaterUTC
      if (estimatedEndUTC < assignedDateUTC || estimatedEndUTC > threeDaysLaterUTC) {
        return res.status(400).json({
          error: true,
          message: `Estimated end date must be within 3 days of assigned date (${assignedDateUTC.toISOString()} - ${threeDaysLaterUTC.toISOString()})`,
        });
      }

      updateData = {
        ...updateData,
        task_status: 'In Progress',
        pending_reason: null,
        estimated_start: assignedDateUTC,
        estimated_end: estimatedEndUTC,
      };
    }

    // ❌ DECLINE
    if (actionLower === 'decline') {
      updateData = {
        ...updateData,
        task_status: 'Pending',
        pending_reason: decline_reason.trim(),
        estimated_start: null,
        estimated_end: null,
      };
    }

    const result = await serviceRecordsCollection.updateOne(
      { task_id: parseInt(task_id), assigned_technician_id: technician_id.trim() },
      { $set: updateData }
    );

    if (result.modifiedCount === 0) {
      return res.status(400).json({ error: true, message: 'Failed to update task status' });
    }

    const actionMessage = actionLower === 'accept'
      ? 'Task accepted successfully'
      : 'Task declined successfully';

    return res.status(200).json({
      error: false,
      message: actionMessage,
      data: {
        task_id: parseInt(task_id),
        new_status: updateData.task_status,
        action: actionLower,
        ...(actionLower === 'decline' && { decline_reason: decline_reason.trim() }),
        ...(actionLower === 'accept' && {
          estimated_start: updateData.estimated_start,
          estimated_end: updateData.estimated_end,
        }),
      },
    });
  } catch (error) {
    console.error('Error processing task accept/decline:', error);
    return res.status(500).json({
      error: true,
      message: 'Server error while processing task action',
    });
  }
};




  exports.getAllAssignedTaskDetails = async (req, res) => {
    const { user_id, email, role_id, assigned_technician_id } = req.body;
  
    // Basic validation
    if (!user_id || !email || !role_id || !assigned_technician_id) {
      return res.status(400).json({ 
        error: true, 
        message: 'user_id, email, role_id, and assigned_technician_id are required' 
      });
    }
  
    // Only allow role_id 2 (Technician)
    if (parseInt(role_id) !== 2) {
      return res.status(403).json({ error: true, message: 'Access denied: not a technician' });
    }
  
    try {
      const db = await connectToDatabase();
      const serviceRecordsCollection = db.collection('service_records');
  
      // Fetch all tasks assigned to technician (no status filter)
      const tasks = await serviceRecordsCollection.find({
        assigned_technician_id: assigned_technician_id.trim()
      }).toArray();
  
      if (!tasks || tasks.length === 0) {
        return res.status(402).json({ error: true, message: 'No tasks found for this technician' });
      }
  
      return res.status(200).json({
        error: false,
        message: 'All assigned tasks fetched successfully',
        data: tasks,
      });
  
    } catch (error) {
      console.error('Error fetching all assigned tasks:', error);
      return res.status(500).json({ error: true, message: 'Server error while fetching all task details' });
    }
  };
  