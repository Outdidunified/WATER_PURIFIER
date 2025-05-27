const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const { connectToDatabase } = require('../../../config/db');

exports.fetchUserDetails = async (req, res) => {
    const { user_id, email, role_id } = req.body;
  
    if (!user_id || !email || !role_id) {
      return res.status(400).json({ error: true, message: 'user_id, email, and role_id are required' });
    }
  
    try {
      const db = await connectToDatabase();
      const usersCollection = db.collection('users');
      const technicianCollection = db.collection('technician_details');
  
      // Fetch user from users collection
      const user = await usersCollection.findOne({
        user_id: parseInt(user_id),
        email: email,
        role_id: parseInt(role_id)
      });
  
      if (!user) {
        return res.status(404).json({ error: true, message: 'User not found with provided credentials' });
      }
  
      let technicianData = null;
      // If role_id is 2 (technician), fetch technician details
      if (parseInt(role_id) === 2) {
        technicianData = await technicianCollection.findOne({ user_id: parseInt(user_id), role_id: 2 });
      }
  
      // Destructure user fields
      const {
        user_id: dbUserId,
        name,
        email: dbEmail,
        phone,
        city,
        status,
        issubscribed,
        createdDate
      } = user;
  
      // Prepare response data
      const responseData = {
        user_id: dbUserId,
        name,
        email: dbEmail,
        phone,
        city,
        status,
        issubscribed,
        createdDate,
      };
  
      // Append technician data if available
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
    const { user_id, email, role_id, name, phone, city } = req.body;
  
    if (!user_id || !email || !role_id) {
      return res.status(400).json({ error: true, message: 'user_id, email, and role_id are required' });
    }
  
    try {
      const db = await connectToDatabase();
      const usersCollection = db.collection('users');
  
      // Check if the user exists
      const existingUser = await usersCollection.findOne({
        user_id: parseInt(user_id),
        email: email,
        role_id: parseInt(role_id)
      });
  
      if (!existingUser) {
        return res.status(404).json({ error: true, message: 'User not found with provided credentials' });
      }
  
      // Prepare fields to update
      const updateFields = {
        ...(name !== undefined && { name }),
        ...(phone !== undefined && { phone }),
        ...(city !== undefined && { city }),
        modifiedBy: email,
        modifiedDate: new Date()
      };
  
      // Update user
      const result = await usersCollection.updateOne(
        { user_id: parseInt(user_id), email, role_id: parseInt(role_id) },
        { $set: updateFields }
      );
  
      if (result.modifiedCount === 0) {
        return res.status(400).json({ error: true, message: 'No changes were made' });
      }
  
      return res.status(200).json({
        error: false,
        message: 'User details updated successfully',
        data: updateFields
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
      task_type,
      task_description
    } = req.body;
  
    // Basic validation
    if (!task_created_by_user_id || !task_created_by_user_email || !task_type || !task_description) {
      return res.status(400).json({
        error: true,
        message: 'task_created_by_user_id, task_created_by_user_email, task_type, and task_description are required',
      });
    }
  
    try {
      const db = await connectToDatabase();
      const serviceRecordsCollection = db.collection('service_records');
  
      // Get the latest task_id and increment it
      const lastTask = await serviceRecordsCollection
        .find({})
        .sort({ task_id: -1 })
        .limit(1)
        .toArray();
  
      const newTaskId = lastTask.length > 0 ? lastTask[0].task_id + 1 : 1;
  
      // Create the new task object
      const newServiceRecord = {
        task_id: newTaskId,
        task_status: "Initiated",
        assigned_technician_id: null,
        pending_reason: null,
        created_date: new Date(),
        modified_by: null,
        modified_date: null,
        assigned_date: null,
        task_type,
        task_description,
        image_before_service: [],
        image_after_service: [],
        task_created_by_user_id,
        task_created_by_user_email,
        otp: null
      };
  
      // Insert into collection
      await serviceRecordsCollection.insertOne(newServiceRecord);
  
      return res.status(201).json({
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
  