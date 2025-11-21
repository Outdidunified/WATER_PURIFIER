const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const qrcode = require('qrcode');
const { connectToDatabase } = require('../../../config/db');
const { ObjectId } = require('mongodb');
const path = require('path');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const { sendEmail } = require('../../website/controllers/Email');


const razorpayInstance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Nodemailer transporter
exports.getAssignedTaskDetails = async (req, res) => {
    const { user_id, email, role_id, assigned_technician_id } = req.body;
  
    if (!user_id || !email || !role_id || !assigned_technician_id) {
      return res.status(400).json({ 
        error: true, 
        message: 'user_id, email, role_id, and assigned_technician_id are required' 
      });
    }
  
    if (parseInt(role_id) !== 2) {
      return res.status(403).json({ error: true, message: 'Access denied: not a technician' });
    }
  
    try {
      const db = await connectToDatabase();
      const serviceRecordsCollection = db.collection('service_records');
  
      const tasks = await serviceRecordsCollection
        .find({
          assigned_technician_id: assigned_technician_id.trim(),
          task_status: { $in: ['Assigned', 'Pending'] }
        })
        .sort({ created_date: -1 })
        .toArray();
  
      return res.status(200).json({
        error: false,
        message: tasks.length > 0 ? 'Assigned tasks fetched successfully' : 'No active tasks found',
        data: tasks,
      });
  
    } catch (error) {
      console.error('Error fetching assigned tasks:', error);
      return res.status(500).json({ error: true, message: 'Server error while fetching task details' });
    }
  };


exports.getRejectionHistory = async (req, res) => {
  const { user_id, email, role_id, assigned_technician_id } = req.body;

  if (!user_id || !email || !role_id || !assigned_technician_id) {
    return res.status(400).json({
      error: true,
      message: 'user_id, email, role_id, and assigned_technician_id are required'
    });
  }

  if (parseInt(role_id) !== 2) {
    return res.status(403).json({ error: true, message: 'Access denied: not a technician' });
  }

  try {
    const db = await connectToDatabase();
    const rejectionHistoryCollection = db.collection('rejection_history');

    const rejectionHistory = await rejectionHistoryCollection.find({
      technician_id: assigned_technician_id.trim()
    }).sort({ rejected_date: -1 }).toArray();

    if (!rejectionHistory || rejectionHistory.length === 0) {
      return res.status(404).json({ error: true, message: 'No rejection history found' });
    }

    return res.status(200).json({
      error: false,
      message: 'Rejection history fetched successfully',
      data: rejectionHistory,
    });

  } catch (error) {
    console.error('Error fetching rejection history:', error);
    return res.status(500).json({ error: true, message: 'Server error while fetching rejection history' });
  }
};


// ============ LEAVE REQUEST API ============
exports.requestLeave = async (req, res) => {
  console.log('----- Incoming Request to /requestLeave -----');
  console.log('➡️ Body:', req.body);
  console.log('-------------------------------------------');

  const {
    technician_id,
    email,
    from_date,
    to_date,
    number_of_days,
    reason,
  } = req.body;

  // Basic validation
  if (!technician_id || !email || !from_date || !to_date || !number_of_days) {
    return res.status(400).json({
      error: true,
      message: 'Missing required fields',
    });
  }

  // Reason validation - optional but if provided, should not be empty
  if (reason && typeof reason === 'string' && reason.trim() === '') {
    return res.status(400).json({
      error: true,
      message: 'Reason is empty',
    });
  }

  try {
    const db = await connectToDatabase();
    const leaveRequestsCollection = db.collection('leave_requests');
    const usersCollection = db.collection('users');

    // Verify technician exists
    const technician = await usersCollection.findOne({
      technician_id: technician_id.trim(),
      email: email.trim(),
    });

    if (!technician) {
      return res.status(404).json({
        error: true,
        message: 'Technician not found',
      });
    }

    // Validate dates
    const fromDate = new Date(from_date);
    const toDate = new Date(to_date);

    if (fromDate > toDate) {
      return res.status(400).json({
        error: true,
        message: 'Start date cannot be after end date',
      });
    }

    // Check if leave already requested for these dates
    const existingLeave = await leaveRequestsCollection.findOne({
      technician_id: technician_id.trim(),
      $or: [
        {
          from_date: { $lte: toDate },
          to_date: { $gte: fromDate },
          status: { $in: ['Requested', 'Approved'] },
        },
      ],
    });

    if (existingLeave) {
      return res.status(400).json({
        error: true,
        message: 'Leave already exists for these dates',
        data: {
          leave_from: existingLeave.from_date,
          leave_to: existingLeave.to_date,
          status: existingLeave.status,
        },
      });
    }

    // Check if technician has an active or pending approved leave that hasn't been completed
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const pendingApprovedLeave = await leaveRequestsCollection.findOne({
      technician_id: technician_id.trim(),
      status: 'Approved',
      to_date: { $gte: today }, // Leave end date is today or in the future
    });

    if (pendingApprovedLeave) {
      return res.status(400).json({
        error: true,
        message: 'Complete your current leave first',
        data: {
          current_leave_from: pendingApprovedLeave.from_date,
          current_leave_to: pendingApprovedLeave.to_date,
        },
      });
    }

    // Create leave request
    const leaveRequest = {
      technician_id: technician_id.trim(),
      technician_name: technician.name,
      technician_email: email.trim(),
      from_date: fromDate,
      to_date: toDate,
      number_of_days: parseInt(number_of_days),
      reason: reason ? reason.trim() : null,
      status: 'Requested', // Default status
      requested_date: new Date(), // Current date/time
      created_at: new Date(),
      approval_date: null,
      approved_by: null,
      rejection_reason: null,
    };

    const result = await leaveRequestsCollection.insertOne(leaveRequest);

    return res.status(201).json({
      error: false,
      message: 'Leave request submitted successfully',
      data: {
        leave_request_id: result.insertedId,
        technician_id: technician_id.trim(),
        from_date: from_date,
        to_date: to_date,
        number_of_days: parseInt(number_of_days),
        reason: reason ? reason.trim() : 'No reason provided',
        status: 'Requested',
        requested_date: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Error requesting leave:', error);
    return res.status(500).json({
      error: true,
      message: 'Server error',
    });
  }
};

// ============ GET TECHNICIAN LEAVE REQUESTS ============
exports.getTechnicianLeaveRequests = async (req, res) => {
  const { technician_id, email } = req.body;

  if (!technician_id || !email) {
    return res.status(400).json({
      error: true,
      message: 'technician_id and email are required',
    });
  }

  try {
    const db = await connectToDatabase();
    const leaveRequestsCollection = db.collection('leave_requests');

    const leaveRequests = await leaveRequestsCollection
      .find({
        technician_id: technician_id.trim(),
        technician_email: email.trim(),
      })
      .sort({ requested_date: -1 })
      .toArray();

    return res.status(200).json({
      error: false,
      message: 'Leave requests fetched successfully',
      data: leaveRequests,
    });
  } catch (error) {
    console.error('Error fetching leave requests:', error);
    return res.status(500).json({
      error: true,
      message: 'Server error while fetching leave requests',
    });
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


exports.updateInProgressTaskLeaveAction = async (req, res) => {
  const { technician_id, email, task_id, action } = req.body;

  if (!technician_id || !email || !task_id || !action) {
    return res.status(400).json({
      error: true,
      message: 'Missing required fields',
    });
  }

  const validActions = ['forward', 'waiting'];
  const actionLower = action.toLowerCase();

  if (!validActions.includes(actionLower)) {
    return res.status(400).json({
      error: true,
      message: 'Action must be "forward" or "waiting"',
    });
  }

  try {
    const db = await connectToDatabase();
    const serviceRecordsCollection = db.collection('service_records');
    const leaveRequestsCollection = db.collection('leave_requests');

    // Check if technician is currently on approved leave
    const now = new Date();
    const todayUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));
    const tomorrowUTC = new Date(todayUTC);
    tomorrowUTC.setUTCDate(tomorrowUTC.getUTCDate() + 1);

    // First check: Is there any approved leave for this technician that hasn't completed?
    const anyApprovedLeave = await leaveRequestsCollection.findOne({
      technician_id: technician_id.trim(),
      technician_email: email.trim(),
      status: 'Approved',
      to_date: { $gt: todayUTC },
    });

    if (!anyApprovedLeave) {
      return res.status(403).json({
        error: true,
        message: 'No approved leave found',
      });
    }

    // Second check: Is technician currently within the leave period?
    const currentlyOnLeave = await leaveRequestsCollection.findOne({
      technician_id: technician_id.trim(),
      technician_email: email.trim(),
      status: 'Approved',
      from_date: { $lt: tomorrowUTC },
      to_date: { $gt: todayUTC },
    });

    if (!currentlyOnLeave) {
      return res.status(403).json({
        error: true,
        message: 'You can only do this during your leave dates',
        data: {
          leave_from: anyApprovedLeave.from_date,
          leave_to: anyApprovedLeave.to_date,
        },
      });
    }

    const approvedLeave = currentlyOnLeave;

    // Find the In Progress task
    const task = await serviceRecordsCollection.findOne({
      task_id: parseInt(task_id),
      assigned_technician_id: technician_id.trim(),
      task_status: 'In Progress',
    });

    if (!task) {
      return res.status(404).json({
        error: true,
        message: 'Task not found',
      });
    }

    // Prepare update data
    const updateData = {
      modified_by: technician_id.trim(),
      modified_date: new Date().toISOString(),
      leave_action: actionLower,
      leave_reference: {
        from_date: approvedLeave.from_date,
        to_date: approvedLeave.to_date,
      },
    };

    if (actionLower === 'forward') {
      updateData.task_status = 'Forwarded'; // will be picked up for reassignment
      updateData.waiting_status = false;    // reset waiting
    } else if (actionLower === 'waiting') {
      updateData.task_status = 'In Progress'; // keep as In Progress
      updateData.waiting_status = true;       // mark waiting
    }

    // Update service record
    const result = await serviceRecordsCollection.updateOne(
      { task_id: parseInt(task_id), assigned_technician_id: technician_id.trim() },
      { $set: updateData }
    );

    if (result.modifiedCount === 0) {
      return res.status(400).json({
        error: true,
        message: 'Failed to update task',
      });
    }

    // Response
    const message =
      actionLower === 'forward'
        ? 'Task forwarded for reassignment'
        : 'Task waiting status updated';

    return res.status(200).json({
      error: false,
      message,
      data: {
        action: actionLower,
      },
    });
  } catch (error) {
    console.error('Error updating task during leave:', error);
    return res.status(500).json({
      error: true,
      message: 'Server error',
    });
  }
};





exports.setupBleConnection = async (req, res) => {
  const { wp_device_id, mac_id, technician_id, task_id } = req.body;

  // ✅ Validate required fields
  if (!wp_device_id || !mac_id) {
    return res.status(400).json({
      error: true,
      message: 'wp_device_id and mac_id are required',
    });
  }

  try {
    const db = await connectToDatabase();
    const deviceDetailsCollection = db.collection('device_details');
    const serviceRecordsCollection = db.collection('service_records');

    // ✅ Check if device exists
    const device = await deviceDetailsCollection.findOne({
      wp_device_id: { $regex: new RegExp(`^${wp_device_id}$`, 'i') },
    });

    if (!device) {
      return res.status(404).json({
        error: true,
        message: 'Device not found in device_details',
      });
    }

    // ✅ Normalize MAC ID and current timestamp
    const normalizedMacId = mac_id.toUpperCase();
    const now = new Date();

    // ✅ Update only in `device_details`
    const deviceUpdateResult = await deviceDetailsCollection.updateOne(
      { wp_device_id: { $regex: new RegExp(`^${wp_device_id}$`, 'i') } },
      {
        $set: {
          enter_mac_id: normalizedMacId,
          setup_timestamp: now,
          ...(technician_id && { assigned_technician_id: technician_id }),
        },
      }
    );

    if (deviceUpdateResult.modifiedCount === 0) {
      return res.status(500).json({
        error: true,
        message: 'Failed to update device with MAC ID',
      });
    }

    // ✅ Optionally, only update `task_status` in service_records (no MAC or timestamp)
    if (task_id) {
      await serviceRecordsCollection.updateOne(
        { 
          task_id: parseInt(task_id),
          wp_device_id: wp_device_id,
        },
        {
          $set: {
            task_status: 'In Progress',
            ...(technician_id && { assigned_technician_id: technician_id }),
          },
        }
      );
    }

    // ✅ Final Response
    return res.status(200).json({
      error: false,
      message: 'MAC ID stored successfully in device_details',
      data: {
        wp_device_id,
        enter_mac_id: normalizedMacId,
        setup_timestamp: now,
        device_updated: deviceUpdateResult.modifiedCount > 0,
        task_status: 'In Progress',
      },
    });
  } catch (error) {
    console.error('Error in setupBleConnection:', error);
    return res.status(500).json({
      error: true,
      message: 'Server error while storing MAC ID',
    });
  }
};

exports.storeBleAck = async (req, res) => {
  const {
    wp_device_id,
    mac_id,
    status,
    timestamp,
    task_id,
    technician_id,
    plan_config: planConfigPayload,
  } = req.body;

  if (!wp_device_id || !mac_id ) {
    return res.status(400).json({
      error: true,
      message: 'wp_device_id, mac_id, and task_id are required',
    });
  }

  const numericStatus = parseInt(status, 10);
  if (Number.isNaN(numericStatus) || numericStatus !== 1) {
    return res.status(400).json({
      error: true,
      message: 'Invalid firmware status. Expected status value 1 for success',
    });
  }

  let planConfig = planConfigPayload ?? null;
  if (typeof planConfig === 'string') {
    try {
      planConfig = JSON.parse(planConfig);
    } catch (err) {
      return res.status(400).json({
        error: true,
        message: 'plan_config must be valid JSON',
      });
    }
  }

  if (planConfig && (typeof planConfig !== 'object' || Array.isArray(planConfig))) {
    return res.status(400).json({
      error: true,
      message: 'plan_config must be an object',
    });
  }

  if (planConfig && planConfig.totalWaterLimit !== undefined) {
    const totalLimit = Number(planConfig.totalWaterLimit);
    if (!Number.isNaN(totalLimit)) {
      planConfig.totalWaterLimit = totalLimit;
    }
  }

  const hasPlanConfig = Boolean(planConfig && Object.keys(planConfig).length > 0);
  const normalizedMacId = mac_id.toUpperCase();

  let ackTimestamp = timestamp ? new Date(timestamp) : new Date();
  if (Number.isNaN(ackTimestamp.getTime())) {
    ackTimestamp = new Date();
  }

  try {
    const db = await connectToDatabase();
    const deviceDetailsCollection = db.collection('device_details');
    const serviceRecordsCollection = db.collection('service_records');
    const ordersCollection = db.collection('orders');

    const deviceFilter = {
      wp_device_id: { $regex: new RegExp(`^${wp_device_id}$`, 'i') },
    };

    const device = await deviceDetailsCollection.findOne(deviceFilter);
    if (!device) {
      return res.status(404).json({
        error: true,
        message: 'Device not found in device_details for this acknowledgement',
      });
    }

    const serviceFilter = {
      task_id: parseInt(task_id, 10),
      wp_device_id,
    };

    if (technician_id) {
      serviceFilter.assigned_technician_id = technician_id;
    }

    const serviceRecord = await serviceRecordsCollection.findOne(serviceFilter);

    if (!serviceRecord) {
      return res.status(404).json({
        error: true,
        message: 'No matching service record found for this task',
      });
    }

    // ✅ Allow task_type 1 (Installation) and 3 (Recharge)
    if (![1, 3].includes(serviceRecord.task_type)) {
      return res.status(400).json({
        error: true,
        message: 'Acknowledgement is allowed only for Installation or Recharge tasks',
      });
    }

    // ✅ Allow In Progress or Pending state
    if (!['In Progress', 'Pending'].includes(serviceRecord.task_status)) {
      return res.status(400).json({
        error: true,
        message: 'Task must be In Progress or Pending to record this acknowledgement',
      });
    }

    // Create BLE acknowledgment history entry
    const ackHistoryEntry = {
      status: numericStatus,
      mac_id: normalizedMacId,
      timestamp: ackTimestamp,
      recorded_at: new Date(),
      task_type: serviceRecord.task_type,
    };

    // ✅ Update Device details
    const deviceUpdatePayload = {
      $set: {
        mac_id: normalizedMacId,
        ble_ack_status: numericStatus,
        ble_ack_timestamp: ackTimestamp,
        isSetup: true,
        updatedAt: new Date(),
        ...(technician_id ? { last_ble_ack_by: technician_id } : {}),
        ...(hasPlanConfig ? { plan_config: planConfig } : {}),
      },
      $push: { ble_ack_history: ackHistoryEntry },
    };

    await deviceDetailsCollection.updateOne(deviceFilter, deviceUpdatePayload);

    // ✅ Update Service record
    const serviceUpdatePayload = {
      $set: {
        mac_id: normalizedMacId,
        ble_ack_status: numericStatus,
        ble_ack_timestamp: ackTimestamp,
        task_status: 'In Progress',
        isSetup: true,
        updatedAt: new Date(),
        modified_date: new Date().toISOString(),
        ...(hasPlanConfig ? { plan_config: planConfig } : {}),
        ...(technician_id ? { modified_by: technician_id } : {}),
      },
      $push: { ble_ack_history: ackHistoryEntry },
    };

    await serviceRecordsCollection.updateOne(
      { _id: serviceRecord._id },
      serviceUpdatePayload
    );

// ✅ Update corresponding order → isSetup: true + BLE details
if (serviceRecord.linkedRechargeOrderId) {
  // Recharge order - update by linkedRechargeOrderId
  console.log(`Updating recharge order by linkedRechargeOrderId: ${serviceRecord.linkedRechargeOrderId}`);
  await ordersCollection.updateOne(
    { _id: new ObjectId(serviceRecord.linkedRechargeOrderId) },
    {
      $set: {
        mac_id: normalizedMacId,
        ble_ack_status: numericStatus,
        ble_ack_timestamp: ackTimestamp,
        isSetup: true,
        updatedAt: new Date(),
        ...(hasPlanConfig ? { plan_config: planConfig } : {}),
      },
      $push: { ble_ack_history: ackHistoryEntry },
    }
  );
} else {
  // Normal order (Installation) - update by customOrderId or orderId
  const orderId =
    serviceRecord.customOrderId ||
    serviceRecord.order?.customOrderId ||
    serviceRecord.order_snapshot?.customOrderId;

  if (orderId) {
    console.log(`Updating installation order by customOrderId: ${orderId}`);
    const updateResult = await ordersCollection.updateOne(
      { customOrderId: orderId },
      {
        $set: {
          mac_id: normalizedMacId,
          ble_ack_status: numericStatus,
          ble_ack_timestamp: ackTimestamp,
          isSetup: true,
          updatedAt: new Date(),
          ...(hasPlanConfig ? { plan_config: planConfig } : {}),
        },
        $push: { ble_ack_history: ackHistoryEntry },
      }
    );
    console.log(`Installation order update result: ${updateResult.modifiedCount} documents modified for orderId: ${orderId}`);
  } else if (serviceRecord.order_snapshot?.orderId) {
    console.log(`Updating order by order_snapshot.orderId: ${serviceRecord.order_snapshot.orderId}`);
    await ordersCollection.updateOne(
      { _id: new ObjectId(serviceRecord.order_snapshot.orderId) },
      {
        $set: {
          mac_id: normalizedMacId,
          ble_ack_status: numericStatus,
          ble_ack_timestamp: ackTimestamp,
          isSetup: true,
          updatedAt: new Date(),
          ...(hasPlanConfig ? { plan_config: planConfig } : {}),
        },
        $push: { ble_ack_history: ackHistoryEntry },
      }
    );
  } else {
    console.warn(`⚠️ No order ID found in serviceRecord for task ${task_id}`);
  }
}




    console.log(`⚙️ Device setup completed and isSetup marked true for task ${task_id}`);

    // ✅ Response
    return res.status(200).json({
      error: false,
      message: 'Device setup acknowledgement stored successfully',
      data: {
        wp_device_id,
        mac_id: normalizedMacId,
        status: numericStatus,
        ack_timestamp: ackTimestamp.toISOString(),
        plan_config: hasPlanConfig ? planConfig : null,
        isSetup: true,
        task_type: serviceRecord.task_type,
      },
    });
  } catch (error) {
    console.error('Error storing BLE acknowledgement:', error);
    return res.status(500).json({
      error: true,
      message: 'Server error while storing BLE acknowledgement',
      details: error.message,
    });
  }
};



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
    const deviceDetailsCollection = db.collection('device_details');

    // ✅ Find technician’s assigned task
    const task = await serviceRecordsCollection.findOne({
      task_id: parseInt(task_id),
      assigned_technician_id: technician_id,
    });
    if (!task)
      return res.status(404).json({ error: true, message: 'No task found assigned to this technician' });

    // ✅ Identify linked order
    let order;
    if (task.orderType === "Recharge" || task.rechargeDetails) {
      // Try linkedRechargeOrderId first
      if (task.linkedRechargeOrderId) {
        order = await ordersCollection.findOne({ _id: new ObjectId(task.linkedRechargeOrderId) });
        console.log("🔹 Recharge order found by linkedRechargeOrderId:", order?.customOrderId);
      }
      // If not found, try other identifiers
      if (!order) {
        order = await ordersCollection.findOne({
          $or: [
            { customOrderId: task.customOrderId },
            { customOrderId: task.order_snapshot?.customOrderId },
            { customOrderId: task.order?.customOrderId },
            { _id: task.order_snapshot?.orderId ? new ObjectId(task.order_snapshot.orderId) : null }
          ].filter(Boolean)
        });
        console.log("🔹 Recharge order found by fallback:", order?.customOrderId);
      }
    } else {
      order = await ordersCollection.findOne({
        customOrderId: task.customOrderId || task.order_snapshot?.customOrderId || task.order?.customOrderId,
      });
    }

    // ✅ Allow only specific fields
    const allowedFields = ['task_status', 'pending_reason', 'modified_by', 'modified_date', 'collectPayment', 'paymentMethod'];
    const updateData = {};
    for (let key in updates) {
      if (allowedFields.includes(key)) updateData[key] = updates[key];
    }

    const status = updates.task_status || task.task_status;

    // ✅ Pending reason validation
    if (status === 'Pending' && !updates.pending_reason?.trim()) {
      return res.status(400).json({
        error: true,
        message: 'pending_reason is required when task_status is "Pending"',
      });
    } else if (status !== 'Pending') {
      updateData.pending_reason = null;
    }

    // ✅ Completion validation
    if (status === 'Completed') {
      if (order && order.isSetup !== true) {
        return res.status(400).json({
          error: true,
          message: 'Setup not completed. Please complete setup before marking task as completed.',
        });
      }

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

      updateData.completed_date = new Date();
    }

    // ✅ Handle image uploads
    const files = req.files;
    if (files) {
      if (files.image_before_service && files.image_before_service.length > 0) {
        const beforeImagePath = `/upload/technician/before/${path.basename(files.image_before_service[0].path)}`;
        const existingBeforeImages = task.image_before_service || [];
        if (existingBeforeImages.length >= 5) {
          return res.status(400).json({ error: true, message: 'Maximum 5 images allowed for image_before_service' });
        }
        updateData.image_before_service = [...existingBeforeImages, beforeImagePath];
      }

      if (files.image_after_service && files.image_after_service.length > 0) {
        const afterImagePath = `/upload/technician/after/${path.basename(files.image_after_service[0].path)}`;
        const existingAfterImages = task.image_after_service || [];
        if (existingAfterImages.length >= 5) {
          return res.status(400).json({ error: true, message: 'Maximum 5 images allowed for image_after_service' });
        }
        updateData.image_after_service = [...existingAfterImages, afterImagePath];
      }
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ error: true, message: 'No valid fields provided for update' });
    }

    // ✅ Generate QR Code if QR payment method
    let qrCode = null;
    if (order && order.paymentType === 'COD' && updates.paymentMethod === 'QR') {
      const upiId = process.env.UPI_ID;
      const amount = order.grandTotal;
      const merchantName = process.env.MERCHANT_NAME || 'Water Purifier Service';
      const upiString = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(merchantName)}&am=${amount}&cu=INR`;
      qrCode = await qrcode.toDataURL(upiString);
    }

    // ✅ Handle COD Payment Collection
    if (updates.collectPayment == true && order && order.paymentType === 'COD') {
      const paymentRecord = await paymentsCollection.findOne({ orderId: order._id });

      if (paymentRecord && paymentRecord.paymentStatus !== 'Completed') {
        let qrCodeData = null;
        if (updates.paymentMethod === 'QR') qrCodeData = qrCode;

        // 🔹 Update order
        await ordersCollection.updateOne(
          { _id: order._id },
          {
            $set: {
              paymentStatus: 'Completed',
              paymentCollectedAt: new Date(),
              paymentCollectedBy: technician_id,
              qrCode: qrCodeData,
              updatedAt: new Date(),
              isSetup: false,
            },
          }
        );

        // 🔹 Update device details
        if (order.wp_device_id) {
          await deviceDetailsCollection.updateOne(
            { wp_device_id: order.wp_device_id },
            {
              $set: {
                isSetup: false,
                updatedAt: new Date(),
              },
            }
          );
        }

        // 🔹 Update payment record
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

await serviceRecordsCollection.updateOne(
  { task_id: parseInt(task_id) },
  {
    $set: {
      "order_snapshot.paymentStatus": "Completed",
      "payment_snapshot.paymentStatus": "Completed",
      "payment_snapshot.paymentCollectedAt": new Date(),
      "payment_snapshot.paymentMethod": updates.paymentMethod,
      "rechargeDetails.paymentStatus": "Completed", // ✅ Fix for recharge task
      "rechargeDetails.paymentCollectedAt": new Date(), // optional
      "rechargeDetails.paymentMethod": updates.paymentMethod, // optional
      modified_date: new Date(),
    },
  }
);


        console.log(`💵 COD payment collected for order ${order.customOrderId}`);
      }
    }

    // ✅ Update task document finally
    const result = await serviceRecordsCollection.updateOne(
      { task_id: parseInt(task_id), assigned_technician_id: technician_id },
      { $set: updateData }
    );

    if (result.modifiedCount === 0)
      return res.status(400).json({ error: true, message: 'No changes were made to the task' });

    // ✅ Technician stats + Subscription update if Completed
    if (status === 'Completed') {
      const technician = await technicianCollection.findOne({ technician_id });
      if (technician) {
        await technicianCollection.updateOne(
          { technician_id },
          { $set: { total_completed_services: (technician.total_completed_services || 0) + 1 } }
        );
      }

      // ✅ Update order with installation_status
      if (order) {
        await ordersCollection.updateOne(
          { _id: order._id },
          { $set: { installation_status: 'completed' } }
        );
      }

     
      // ✅ Send completion mail to user, admin, and seller
      try {
        const district = order?.deliveryAddress?.district;
        let adminEmails = [];
        let sellerEmails = [];

        if (district) {
          const admins = await usersCollection.find({ role_id: 1 }).toArray();
          const sellers = await usersCollection.find({ role_id: 2, district: district }).toArray();
          adminEmails = admins.map(u => u.email).filter(e => e && e.trim());
          sellerEmails = sellers.map(u => u.email).filter(e => e && e.trim());
        }

        const subject = 'Task Completed Successfully';
        const html = `
          <div style="font-family: Arial, sans-serif; padding: 20px;">
            <h2>Task Completion Notification</h2>
            <p>Service task <strong>#${task.task_id}</strong> for device <strong>${task.wp_device_id}</strong> has been <span style="color: green;">successfully completed</span>.</p>
            <p>Technician: ${technician_id}</p>
            <p>District: ${district || 'N/A'}</p>
            <p>Subscription expiry has been updated. 🎉</p>
            <p>— Water Purifier Team</p>
          </div>
        `;

        // Send to user
        if (task.task_created_by_user_email) {
          sendEmail(task.task_created_by_user_email, subject, '', html).catch(err => console.error('User email error:', err));
        }

        // Send to admins, CC sellers
        if (adminEmails.length > 0) {
          sendEmail(adminEmails.join(','), subject, '', html, sellerEmails).catch(err => console.error('Admin/Seller email error:', err));
        }
      } catch (emailError) {
        console.error('Error sending completion emails:', emailError);
      }
    }

    // ✅ Response
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
      message:
        'user_id, email, role_id, technician_id, task_id, and action are required',
    });
  }

  // Only technicians can act
  if (parseInt(role_id) !== 2) {
    return res
      .status(403)
      .json({ error: true, message: 'Access denied: not a technician' });
  }

  const actionLower = action.toLowerCase();
  if (!['accept', 'decline'].includes(actionLower)) {
    return res
      .status(400)
      .json({ error: true, message: 'Action must be "accept" or "decline"' });
  }

  // Decline must have a reason
  if (actionLower === 'decline' && (!decline_reason || !decline_reason.trim())) {
    return res.status(400).json({
      error: true,
      message: 'decline_reason is required when declining a task',
    });
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
      return res.status(404).json({
        error: true,
        message: 'Task not found or not assigned to technician',
      });
    }

    let updateData = {
      modified_by: technician_id,
      modified_date: new Date().toISOString(),
    };

    // ✅ ACCEPT
    if (actionLower === 'accept') {
      if (!estimated_end) {
        return res.status(400).json({
          error: true,
          message: 'estimated_end is required when accepting a task',
        });
      }

      // Parse assigned date and estimated end in UTC
      const assignedDateUTC = new Date(task.assigned_date);
      const estimatedEndUTC = new Date(estimated_end);

      // Calculate 2-day (48-hour) limit in UTC
      const twoDaysLaterUTC = new Date(assignedDateUTC);
      twoDaysLaterUTC.setUTCDate(twoDaysLaterUTC.getUTCDate() + 2);

      // Validation: ensure estimatedEndUTC is within assignedDateUTC and twoDaysLaterUTC
      if (estimatedEndUTC < assignedDateUTC || estimatedEndUTC > twoDaysLaterUTC) {
        return res.status(400).json({
          error: true,
          message: `Estimated end date must be within 48 hours of assigned date (${assignedDateUTC.toISOString()} - ${twoDaysLaterUTC.toISOString()})`,
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

    // ❌ DECLINE —> change task_status to "Rejected"
    if (actionLower === 'decline') {
      updateData = {
        ...updateData,
        task_status: 'Rejected',
        pending_reason: decline_reason.trim(),
        estimated_start: null,
        estimated_end: null,
      };
    }

    const result = await serviceRecordsCollection.updateOne(
      {
        task_id: parseInt(task_id),
        assigned_technician_id: technician_id.trim(),
      },
      { $set: updateData }
    );

    if (result.modifiedCount === 0) {
      return res
        .status(400)
        .json({ error: true, message: 'Failed to update task status' });
    }

    if (actionLower === 'decline') {
      const rejectionHistoryCollection = db.collection('rejection_history');
      const ordersCollection = db.collection('orders');
      
      const order = await ordersCollection.findOne({ wp_device_id: task.wp_device_id });
      
      const rejectionRecord = {
        task_id: parseInt(task_id),
        wp_device_id: task.wp_device_id,
        technician_id: technician_id.trim(),
        task_type: task.task_type,
        task_status: 'Rejected',
        task_description: task.task_description || null,
        decline_reason: decline_reason.trim(),
        rejected_date: new Date().toISOString(),
        assigned_date: task.assigned_date,
        task_created_by_user_email: task.task_created_by_user_email,
        order_type: order?.orderType || null,
        model_name: order?.modelName || null,
        model_type: order?.modeltype || null,
        plan_details: order?.selectedPlan || null,
        delivery_address: order?.deliveryAddress || null,
        customer_info: {
          user_id: order?.user_id || null,
          customer_name: order?.deliveryAddress?.name || null,
          customer_email: order?.deliveryAddress?.email || null,
          customer_phone: order?.deliveryAddress?.phone || null,
        },
        created_at: new Date(),
      };
      await rejectionHistoryCollection.insertOne(rejectionRecord);
    }

    // Send email notifications to admins and sellers in the district
    try {
      const ordersCollection = db.collection('orders');
      const usersCollection = db.collection('users');

      const order = await ordersCollection.findOne({ wp_device_id: task.wp_device_id });
      if (order && order.deliveryAddress && order.deliveryAddress.district) {
        const district = order.deliveryAddress.district;
        const admins = await usersCollection.find({ role_id: 1 }).toArray();
        const sellers = await usersCollection.find({ role_id: 2, district: district }).toArray();
        const adminEmails = admins.map(u => u.email).filter(e => e && e.trim());
        const sellerEmails = sellers.map(u => u.email).filter(e => e && e.trim());

        if (adminEmails.length > 0) {
          const technician = await usersCollection.findOne({
            $or: [
              { technician_id: technician_id.trim() },
              { employee_id: technician_id.trim() }
            ]
          });
          const techName = technician ? (technician.name || technician_id.trim()) : technician_id.trim();

          const subject = `Task ${actionLower}ed by Technician`;
          const html = `
            <div style="font-family: Arial, sans-serif; padding: 20px;">
              <h2>Task ${actionLower.charAt(0).toUpperCase() + actionLower.slice(1)} Notification</h2>
              <p>Technician <strong>${techName}</strong> has ${actionLower}ed task <strong>${task_id}</strong>.</p>
              <p>Device ID: ${task.wp_device_id}</p>
              <p>District: ${district}</p>
              ${actionLower === 'decline' ? `<p>Reason: ${decline_reason.trim()}</p>` : ''}
              <p>Action taken at: ${new Date().toISOString()}</p>
              <p>— Water Purifier Team</p>
            </div>
          `;

          // Send to admins, CC sellers
          sendEmail(adminEmails.join(','), subject, '', html, sellerEmails).catch(err => console.error('Email send error:', err));

          // Send to user only for accept
          if (actionLower === 'accept' && task.task_created_by_user_email) {
            sendEmail(task.task_created_by_user_email, subject, '', html).catch(err => console.error('User email send error:', err));
          }
        }
      }
    } catch (emailError) {
      console.error('Error sending notification emails:', emailError);
      // Don't fail the request if email fails
    }

    const actionMessage =
      actionLower === 'accept'
        ? 'Task accepted successfully'
        : 'Task rejected successfully';

    return res.status(200).json({
      error: false,
      message: actionMessage,
      data: {
        task_id: parseInt(task_id),
        new_status: updateData.task_status,
        action: actionLower,
        ...(actionLower === 'decline' && {
          decline_reason: decline_reason.trim(),
        }),
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
  
      // Fetch all tasks assigned to technician (excluding rejected tasks)
      const tasks = await serviceRecordsCollection.find({
        assigned_technician_id: assigned_technician_id.trim(),
        task_status: { $ne: 'Rejected' }
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

exports.createRechargeOrder = async (req, res) => {
  try {
    const {
      technician_id,
      email,
      task_id,
      wp_device_id,
      productModelId,
      selectedPlan,
      selectedDuration,
      deliveryAddress,
      discountedPrice,
      discountAmount,
      gstAmount,
      grandTotal,
      priceWithGST,
      price,
      subtotal,
      codFee,
      modelType
    } = req.body;

    // ✅ Validate required fields
    if (
      !technician_id ||
      !email ||
      !task_id ||
      !wp_device_id ||
      !productModelId ||
      !selectedPlan ||
      !selectedDuration
    ) {
      return res.status(400).json({
        error: true,
        message:
          "Missing required fields (technician_id, email, task_id, wp_device_id, productModelId, selectedPlan, selectedDuration)",
      });
    }

    const db = await connectToDatabase();
    const serviceRecords = db.collection("service_records");
    const orders = db.collection("orders");
    const payments = db.collection("payments");
    const users = db.collection("users");
    const productModels = db.collection("product_models");

    // ✅ Verify technician
    const technician = await users.findOne({ email: email.trim(), role_id: 2 });
    if (!technician) {
      return res.status(403).json({
        error: true,
        message: "Technician not found or unauthorized",
      });
    }

    // ✅ Verify task (Recharge at home = task_type 3)
    const task = await serviceRecords.findOne({
      task_id: parseInt(task_id),
      task_type: 3,
      assigned_technician_id: technician_id.trim(),
    });

    if (!task) {
      return res.status(404).json({
        error: true,
        message: "Recharge task not found or not assigned to this technician",
      });
    }

    // ✅ Verify customer
    const user = await users.findOne({ user_id: task.order_user_id });
    if (!user) {
      return res.status(404).json({ error: true, message: "Customer not found" });
    }

    if (!ObjectId.isValid(productModelId)) {
      return res.status(400).json({ error: true, message: "Invalid product model id" });
    }

    const productModel = await productModels.findOne({ _id: new ObjectId(productModelId) });
    if (!productModel) {
      return res.status(404).json({ error: true, message: "Product model not found" });
    }

    const mainImage = productModel.main_img || "";
    const subImages = [
      productModel.sub_img_1,
      productModel.sub_img_2,
      productModel.sub_img_3,
      productModel.sub_img_4,
    ].filter(Boolean);

    // ✅ Set constants
    const paymentType = "COD";
    const paymentStatus = "Pending";
    const orderType = "Recharge";
    const now = new Date();
    const customOrderId = `RECHARGE-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    // ✅ Create order document
    const rechargeOrder = {
      customOrderId,
      user_id: user.user_id,
      wp_device_id: wp_device_id.trim(),
      technician_id: technician_id.trim(),
      technician_email: email.trim(),
      productModelId,
      modelName: productModel.model_name,
      modeltype: modelType || productModel.model_type || 'Base',
      main_image: mainImage,
      sub_images: subImages,
      selectedPlan,
      selectedDuration,
      grandTotal,
      discountedPrice,
      discountAmount,
      gstAmount,
      priceWithGST,
      price,
      subtotal,
      codFee,
      deliveryAddress,
      orderType,
      paymentType,
      paymentStatus,
      orderStatus: "Confirmed",
      isRecharge: true,
      parentOrderReference: task.customOrderId,
      task_reference_id: task._id,
      createdAt: now,
      updatedAt: now,
    };

    const orderResult = await orders.insertOne(rechargeOrder);
    const orderId = orderResult.insertedId;

    // ✅ Create payment document
    await payments.insertOne({
      user_id: user.user_id,
      orderId,
      discountedPrice,
      discountAmount,
      priceWithGST,
      gstAmount,
      totalPrice: grandTotal,
      orderType,
      paymentType,
      paymentStatus,
      isRecharge: true,
      createdAt: now,
      updatedAt: now,
    });

    // ✅ Prepare recharge details for service record
    const rechargeDetails = {
      rechargeOrderId: customOrderId,
      orderId: orderId.toString(),
      orderType,
      paymentType,
      paymentStatus,
      selectedPlan,
      selectedDuration,
      grandTotal,
      discountedPrice,
      discountAmount,
      gstAmount,
      priceWithGST,
      price,
      subtotal,
      codFee,
      deliveryAddress,
      technician_id,
      technician_email: email,
      wp_device_id: wp_device_id.trim(), // ✅ Added inside rechargeDetails
      createdAt: now,
    };

    // ✅ Update service record with recharge details + wp_device_id
    await serviceRecords.updateOne(
      { task_id: parseInt(task_id) },
      {
        $set: {
          rechargeDetails,
          linkedRechargeOrderId: orderId,
          order_reference_id: orderId.toString(),
          orderType,
          wp_device_id: wp_device_id.trim(), // ✅ Store wp_device_id at root level also
          task_status: "In Progress",
          modified_by: technician_id.trim(),
          modified_date: now,
        },
      }
    );

    // ✅ Send success response
    return res.status(201).json({
      error: false,
      message: "Recharge order created successfully (COD)",
      data: {
        rechargeOrderId: customOrderId,
        orderType,
        paymentType,
        paymentStatus,
        linkedTaskId: task_id,
        wp_device_id,
        totalAmount: grandTotal,
        rechargeDetails,
      },
    });
  } catch (error) {
    console.error("Error creating recharge order:", error);
    return res.status(500).json({
      error: true,
      message: "Server error while creating recharge order",
      details: error.message,
    });
  }
};
