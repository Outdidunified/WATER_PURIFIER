const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const { connectToDatabase } = require('../../../config/db');
const { ObjectId } = require('mongodb');
const { autoAssignService } = require('../../admin/services/autoAssignmentService');

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
      password,
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
      password,
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
    password, // optional
    addressline1,
    addressline2, // optional
    city, 
    district,
    state,
    country,
    pincode
  } = req.body;

  // Validate required fields
  if (!user_id || !email || !role_id) {
    return res.status(400).json({ error: true, message: 'user_id, email, and role_id are required' });
  }

  // Validate required address fields
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
      (password === undefined || password === existingUser.password) &&
      (addressline1 === undefined || addressline1 === existingUser.addressline1) &&
      (addressline2 === undefined || addressline2 === existingUser.addressline2) &&
      (city === undefined || city === existingUser.city) &&
      (district === undefined || district === existingUser.district) &&
      (state === undefined || state === existingUser.state) &&
      (country === undefined || country === existingUser.country) &&
      (pincode === undefined || pincode === existingUser.pincode);

    if (isSameData) {
      return res.status(200).json({ error: false, message: 'No changes were made. Same data submitted.' });
    }

    // Prepare update object
    const updateFields = {
      ...(name !== undefined && { name }),
      ...(phone !== undefined && { phone }),
      ...(password !== undefined && { password }), // optional plain-text update
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

    // Update user
    await usersCollection.updateOne(
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
    return res.status(500).json({ error: true, message: 'Server error while updating user details' });
  }
};


  
 exports.createServiceRequest = async (req, res) => {
  const {
    task_created_by_user_id,
    task_created_by_user_email,
    task_description,
    role_id,
    wp_device_id,
    modelName
  } = req.body;

  if (
    !task_created_by_user_id ||
    !task_created_by_user_email ||
    !task_description ||
    !role_id ||
    !wp_device_id ||
    !modelName
  ) {
    return res.status(400).json({
      error: true,
      message: 'task_created_by_user_id, task_created_by_user_email, task_description, role_id, wp_device_id, and modelName are required',
    });
  }

  try {
    const db = await connectToDatabase();
    const usersCollection = db.collection('users');
    const serviceRecordsCollection = db.collection('service_records');

    const user = await usersCollection.findOne({ user_id: task_created_by_user_id });

    if (!user) {
      return res.status(404).json({
        error: true,
        message: 'User not found',
      });
    }

    const isDeviceAssigned = user.assigned_device_ids;
    console.log('isDeviceAssigned', isDeviceAssigned)

    if (!isDeviceAssigned) {
      return res.status(403).json({
        error: true,
        message: 'Device not assigned to the user',
      });
    }

    const lastTask = await serviceRecordsCollection
      .find({})
      .sort({ task_id: -1 })
      .limit(1)
      .toArray();

    const newTaskId = lastTask.length > 0 ? lastTask[0].task_id + 1 : 1;

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
      wp_device_id,
      modelName,
      otp: null
    };

    await serviceRecordsCollection.insertOne(newServiceRecord);

    await autoAssignService(newTaskId);

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
      return res.status(400).json({
        success: false,
        message: "user_id is required in request body",
      });
    }

    const db = await connectToDatabase();
    const paymentCollection = db.collection("payments");

    const payments = await paymentCollection
      .find({ user_id })
      .project({
        orderId: 1,
        totalPrice: 1,
        createdAt: 1,
        paymentStatus: 1
      })
      .sort({ createdAt: -1 })
      .toArray();

    if (!payments.length) {
      return res.status(200).json({
        success: true,
        message: "No payment history found for this user",
        data: [],
      });
    }

    res.status(200).json({
      success: true,
      message: "Payment history fetched successfully",
      data: payments,
    });
  } catch (error) {
    console.error("Error fetching payment history:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching payment history",
      details: error.message,
    });
  }
};

