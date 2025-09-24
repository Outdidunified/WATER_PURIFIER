const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const { connectToDatabase } = require('../../../config/db');
const { ObjectId } = require('mongodb');

exports.fetchUserDetails = async (req, res) => { 
  const { user_id, email, role_id } = req.body;

  if (!user_id || !email || !role_id) {
    return res.status(400).json({ error: true, message: 'user_id, email, and role_id are required' });
  }

  try {
    const db = await connectToDatabase();
    const usersCollection = db.collection('users');
    const technicianCollection = db.collection('technician_details');

    const user = await usersCollection.findOne({
      user_id: parseInt(user_id),
      email,
      role_id: parseInt(role_id)
    });

    if (!user) {
      return res.status(404).json({ error: true, message: 'User not found with provided credentials' });
    }

    let technicianData = null;
    if (parseInt(role_id) === 2) {
      technicianData = await technicianCollection.findOne({ user_id: parseInt(user_id), role_id: 2 });
    }

    const {
      user_id: dbUserId,
      name,
      email: dbEmail,
      phone,
      addressline1,
      addressline2,
      city,
      district,
      state,
      country,
      pincode,
      status,
      is_subscribed,
      createdDate
    } = user;

    const responseData = {
      user_id: dbUserId,
      name,
      email: dbEmail,
      phone,
      addressline1,
      addressline2: addressline2 || '',
      city,
      district,
      state,
      country,
      pincode,
      status,
      is_subscribed,
      createdDate,
    };

    if (technicianData) {
      responseData.technician_info = {
        technician_code: technicianData.technician_code,
        total_completed_services: technicianData.total_completed_services || 0,
        total_incomplete_services: technicianData.total_incomplete_services || 0,
      };
    }

    res.status(200).json({
      error: false,
      message: 'User details fetched successfully',
      data: responseData
    });

  } catch (error) {
    console.error('Fetch user error:', error);
    res.status(500).json({ error: true, message: 'Server error while fetching user details' });
  }
};

  
  
 exports.updateUserDetails = async (req, res) => {
  const { 
    user_id, 
    email, 
    role_id, 
    name, 
    phone, 
    addressline1,
    addressline2, // optional
    city, 
    district,
    state,
    country,
    pincode
  } = req.body;

  if (!user_id || !email || !role_id) {
    return res.status(400).json({ error: true, message: 'user_id, email, and role_id are required' });
  }

  // Validate required address fields (without 'address')
  const missingFields = [];
  if (!addressline1) missingFields.push('addressline1');
  if (!city) missingFields.push('city');
  if (!district) missingFields.push('district');
  if (!state) missingFields.push('state');
  if (!country) missingFields.push('country');
  if (!pincode) missingFields.push('pincode');
  if (missingFields.length) {
    return res.status(400).json({
      error: true,
      message: `Missing required fields: ${missingFields.join(', ')}`,
      missing: missingFields
    });
  }

  try {
    const db = await connectToDatabase();
    const usersCollection = db.collection('users');

    // Fetch existing user
    const existingUser = await usersCollection.findOne({
      user_id: parseInt(user_id),
      role_id: parseInt(role_id)
    });

    if (!existingUser) {
      return res.status(404).json({ error: true, message: 'User not found with provided user_id and role_id' });
    }

    // Check if new values differ from existing ones
    const isSameData =
      (name === undefined || name === existingUser.name) &&
      (phone === undefined || phone === existingUser.phone) &&
      (addressline1 === undefined || addressline1 === existingUser.addressline1) &&
      (addressline2 === undefined || addressline2 === existingUser.addressline2) &&
      (city === undefined || city === existingUser.city) &&
      (district === undefined || district === existingUser.district) &&
      (state === undefined || state === existingUser.state) &&
      (country === undefined || country === existingUser.country) &&
      (pincode === undefined || pincode === existingUser.pincode);

    if (isSameData) {
      return res.status(402).json({ error: true, message: 'No changes were made. Same data submitted.' });
    }

    // Prepare update
    const updateFields = {
      ...(name !== undefined && { name }),
      ...(phone !== undefined && { phone }),
      ...(addressline1 !== undefined && { addressline1 }),
      ...(addressline2 !== undefined && { addressline2 }),
      ...(city !== undefined && { city }),
      ...(district !== undefined && { district }),
      ...(state !== undefined && { state }),
      ...(country !== undefined && { country }),
      ...(pincode !== undefined && { pincode }),
      modifiedBy: email,
      modifiedDate: new Date()
    };

    const result = await usersCollection.updateOne(
      { user_id: parseInt(user_id), role_id: parseInt(role_id) },
      { $set: updateFields }
    );

    return res.status(200).json({
  error: false,
  message: 'User details updated successfully',
  data: {
    user_id: parseInt(user_id),
    ...updateFields
  }
});


  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: true, message: 'Server error while updating user details' });
  }
};

  
 exports.createServiceRequest = async (req, res) => {
  const {
    task_created_by_user_id,
    task_created_by_user_email,
    task_description,
    role_id,
    device_id  // NEW: Get device_id from request body
  } = req.body;

  // Basic validation
  if (
    !task_created_by_user_id ||
    !task_created_by_user_email ||
    !task_description ||
    !role_id
  ) {
    return res.status(400).json({
      error: true,
      message: 'task_created_by_user_id, task_created_by_user_email, task_description, role_id, and device_id are required',
    });
  }

  try {
    const db = await connectToDatabase();
    const usersCollection = db.collection('users');
    const serviceRecordsCollection = db.collection('service_records');

    // ✅ Step 1: Check if device_id is assigned to the user
    const user = await usersCollection.findOne({ user_id: task_created_by_user_id });

    if (!user) {
      return res.status(404).json({
        error: true,
        message: 'User not found',
      });
    }

    const isDeviceAssigned = user.assigned_device_ids;
    console.log('isDeviceAssigned',isDeviceAssigned)

    if (!isDeviceAssigned) {
      return res.status(403).json({
        error: true,
        message: 'Device not assigned to the user',
      });
    }

    // ✅ Step 2: Get the latest task_id and increment it
    const lastTask = await serviceRecordsCollection
      .find({})
      .sort({ task_id: -1 })
      .limit(1)
      .toArray();

    const newTaskId = lastTask.length > 0 ? lastTask[0].task_id + 1 : 1;

    // ✅ Step 3: Create the new task object
    const newServiceRecord = {
      task_id: newTaskId,
      task_status: "Initiated",
      task_type: 2,
      assigned_technician_id: null,
      pending_reason: null,
      created_date: new Date(),
      modified_by: null,
      modified_date: null,
      assigned_date: null,
      task_description,
      image_before_service: [],
      image_after_service: [],
      task_created_by_user_id,
      task_created_by_user_email,
      role_id,
      device_id, // Include device_id in record
      otp: null
    };

    // ✅ Step 4: Insert into collection
    await serviceRecordsCollection.insertOne(newServiceRecord);

    return res.status(200).json({
      error: false,
      message: 'Service request created successfully',
      data: newServiceRecord,
    });

  } catch (error) {
    console.error('Error creating service request:', error);
    return res.status(500).json({
      error: true,
      message: 'Internal server error while creating service request',
    });
  }
};

  
  exports.fetchpaymenthistory = async (req, res) => {
    try {
      const { user_id } = req.body;
  
      if (!user_id) {
        return res
          .status(400)
          .json({ success: false, message: 'user_id is required in request body' });
      }
  
      const db = await connectToDatabase();
      const paymentCollection = db.collection('payments');
      const orderCollection = db.collection('orders');
  
      // Fetch payment records for the user
      const payments = await paymentCollection.find({ user_id }).toArray();
  
      // Convert each payment's orderId (string) to ObjectId safely
      const orderIdMap = {};
      const validOrderObjectIds = [];
  
      for (const payment of payments) {
        if (payment.orderId) {
          try {
            const oid = new ObjectId(payment.orderId);
            orderIdMap[payment.orderId] = oid;
            validOrderObjectIds.push(oid);
          } catch (_) {
            // ignore invalid ObjectId
          }
        }
      }
  
      // Fetch all matching orders in one query
      const orders = await orderCollection
        .find({ _id: { $in: validOrderObjectIds } })
        .toArray();
  
      // Map orders by stringified ObjectId
      const orderMap = {};
      for (const order of orders) {
        orderMap[order._id.toString()] = order;
      }
  
      // Attach matched order to each payment
      const paymentsWithOrders = payments.map(payment => {
        const order = orderMap[payment.orderId];
        return {
          ...payment,
          orders: order ? [order] : []
        };
      });
  
      res.status(200).json({
        success: true,
        message: 'Payment history with orders fetched successfully',
        data: paymentsWithOrders
      });
  
    } catch (error) {
      console.error('❌ Error fetching payment history:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while fetching payment history'
      });
    }
  };