const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const { connectToDatabase } = require('../../../config/db');
const { ObjectId } = require('mongodb');
const path = require('path');

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
  console.log('➡️ Headers:', req.headers);
  console.log('➡️ Content-Type:', req.headers['content-type']);
  console.log('---------------------------------------------------');

  const {
    task_id,
    user_id,
    role_id,
    email,
    technician_id,
    otp,
    updates: updatesJSON
  } = req.body;

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

    const task = await serviceRecordsCollection.findOne({
      task_id: parseInt(task_id),
      assigned_technician_id: technician_id
    });

    if (!task) {
      return res.status(404).json({
        error: true,
        message: 'No task found assigned to this technician',
      });
    }

    const allowedFields = ['task_status', 'pending_reason', 'modified_by', 'modified_date'];
    const updateData = {};

    for (let key in updates) {
      if (allowedFields.includes(key)) updateData[key] = updates[key];
    }

    const status = updates.task_status || task.task_status;

    if (status === 'Pending') {
      if (!updates.pending_reason || updates.pending_reason.trim() === '') {
        return res.status(400).json({
          error: true,
          message: 'pending_reason is required when task_status is "Pending"',
        });
      }
    } else {
      updateData.pending_reason = null;
    }

    if (status === 'Completed') {
      const parsedOtp = parseInt(otp);
      if (!parsedOtp || parsedOtp !== task.otp) {
        return res.status(400).json({
          error: true,
          message: 'Invalid OTP. Cannot complete task.',
        });
      }
    }

    // Handle uploaded images
    const files = req.files;
    if (files) {
      if (files.image_before_service && files.image_before_service.length > 0) {
        const beforeImagePath = `/uploads/technician/before/${path.basename(files.image_before_service[0].path)}`;
        const existingBeforeImages = task.image_before_service || [];
        if (existingBeforeImages.length >= 5) return res.status(400).json({ error: true, message: 'Max 5 images for image_before_service' });
        updateData.image_before_service = [...existingBeforeImages, beforeImagePath];
      }

      if (files.image_after_service && files.image_after_service.length > 0) {
        const afterImagePath = `/uploads/technician/after/${path.basename(files.image_after_service[0].path)}`;
        const existingAfterImages = task.image_after_service || [];
        if (existingAfterImages.length >= 5) return res.status(400).json({ error: true, message: 'Max 5 images for image_after_service' });
        updateData.image_after_service = [...existingAfterImages, afterImagePath];
      }
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ error: true, message: 'No valid fields provided for update' });
    }

    // Update task in DB
    const result = await serviceRecordsCollection.updateOne(
      { task_id: parseInt(task_id), assigned_technician_id: technician_id },
      { $set: updateData }
    );

    if (result.modifiedCount === 0) {
      return res.status(400).json({ error: true, message: 'No changes were made to the task' });
    }

    // Technician stats
    if (status === 'Completed') {
      const technician = await technicianCollection.findOne({ technician_id });
      if (technician) {
        await technicianCollection.updateOne(
          { technician_id },
          { $set: { total_completed_services: (technician.total_completed_services || 0) + 1 } }
        );
      }

      // ✅ Update subscription expiry now that installation is completed
      const order = await ordersCollection.findOne({ _id: task.order_id ? new ObjectId(task.order_id) : null });
      if (order) {
        const subscribedAt = new Date();
        const durationStr = order.selectedDuration?.duration_time_limit || '30 days';
        const durationInDays = parseInt(durationStr.split(' ')[0], 10) || 30;
        const subscriptionExpiryDate = new Date(subscribedAt);
        subscriptionExpiryDate.setDate(subscriptionExpiryDate.getDate() + durationInDays);

        await usersCollection.updateOne(
          { user_id: task.task_created_by_user_id },
          {
            $set: {
              is_subscribed: true,
              subscribed_at: subscribedAt,
              subscription_expiry_date: subscriptionExpiryDate,
              active_label: order.selectedPlan?.label || null,
              active_plan_id: order.selectedPlan?.plans_id || null,
              active_duration_id: order.selectedDuration?.duration_time_limit || null,
              active_order_id: order._id.toString()
            }
          }
        );

        // Update order with subscriptionExpiryDate as well
        await ordersCollection.updateOne(
          { _id: order._id },
          { $set: { subscriptionExpiryDate, updatedAt: new Date() } }
        );
      }

      // Send completion email
      const mailOptions = {
        from: 'your_email@gmail.com',
        to: task.task_created_by_user_email,
        subject: 'Task Completed Successfully',
        html: `
          <h3>Hello,</h3>
          <p>Your service task <strong>#${task.task_id}</strong> for <strong>${task.task_type}</strong> has been <span style="color: green;">successfully completed</span>.</p>
          <p>Task Description: ${task.task_description}</p>
          <p><strong>Technician ID:</strong> ${task.assigned_technician_id}</p>
          <p>Thank you for using our service!</p>
        `
      };

      transporter.sendMail(mailOptions, (error, info) => {
        if (error) console.error('Error sending mail:', error);
        else console.log('Email sent:', info.response);
      });
    }

    return res.status(200).json({ error: false, message: 'Task updated successfully' });

  } catch (error) {
    console.error('Error updating task:', error);
    return res.status(500).json({ error: true, message: 'Server error while updating task' });
  }
};



  
 exports.acceptDeclineTask = async (req, res) => {
  const { user_id, email, role_id, technician_id, task_id, action, decline_reason, estimated_start, estimated_end } = req.body;

  // Basic validation
  if (!user_id || !email || !role_id || !technician_id || !task_id || !action) {
    return res.status(400).json({
      error: true,
      message: 'user_id, email, role_id, technician_id, task_id, and action are required'
    });
  }

  // Check if role_id is technician role (2)
  if (parseInt(role_id) !== 2) {
    return res.status(403).json({ error: true, message: 'Access denied: not a technician' });
  }

  // Validate action
  if (!['accept', 'decline'].includes(action.toLowerCase())) {
    return res.status(400).json({
      error: true,
      message: 'action must be either "accept" or "decline"'
    });
  }

  // If declining, decline_reason is required
  if (action.toLowerCase() === 'decline' && (!decline_reason || decline_reason.trim() === '')) {
    return res.status(400).json({
      error: true,
      message: 'decline_reason is required when declining a task'
    });
  }

  // If accepting, estimated_start and estimated_end are required
  if (action.toLowerCase() === 'accept' && (!estimated_start || !estimated_end)) {
    return res.status(400).json({
      error: true,
      message: 'estimated_start and estimated_end are required when accepting a task'
    });
  }

  try {
    const db = await connectToDatabase();
    const serviceRecordsCollection = db.collection('service_records');

    // Find the task assigned to this technician
    const task = await serviceRecordsCollection.findOne({
      task_id: parseInt(task_id),
      assigned_technician_id: technician_id.trim(),
      task_status: { $in: ['Assigned', 'Pending'] } // allow both Assigned and Pending
    });

    if (!task) {
      return res.status(404).json({
        error: true,
        message: 'No assigned task found or task is not in "Assigned" status'
      });
    }

    // Prepare update data
    let updateData = {
      modified_by: technician_id,
      modified_date: new Date().toISOString()
    };

    if (action.toLowerCase() === 'accept') {
      updateData.task_status = 'In Progress'; // Change to in-progress after accept
      updateData.pending_reason = null;
      updateData.estimated_start = new Date(estimated_start);
      updateData.estimated_end = new Date(estimated_end);
    } else if (action.toLowerCase() === 'decline') {
      updateData.task_status = 'Pending';
      updateData.pending_reason = decline_reason.trim();
    }

    // Update the task in DB
    const result = await serviceRecordsCollection.updateOne(
      { task_id: parseInt(task_id), assigned_technician_id: technician_id.trim() },
      { $set: updateData }
    );

    if (result.modifiedCount === 0) {
      return res.status(400).json({
        error: true,
        message: 'Failed to update task status'
      });
    }

    const actionMessage = action.toLowerCase() === 'accept'
      ? 'Task accepted successfully'
      : 'Task declined successfully';

    return res.status(200).json({
      error: false,
      message: actionMessage,
      data: {
        task_id: parseInt(task_id),
        new_status: updateData.task_status,
        action: action.toLowerCase(),
        ...(action.toLowerCase() === 'decline' && { decline_reason: decline_reason.trim() }),
        ...(action.toLowerCase() === 'accept' && { 
          estimated_start: updateData.estimated_start,
          estimated_end: updateData.estimated_end
        })
      }
    });

  } catch (error) {
    console.error('Error processing task accept/decline:', error);
    return res.status(500).json({
      error: true,
      message: 'Server error while processing task action'
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
  