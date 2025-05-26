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
  
      const user = await usersCollection.findOne({
        user_id: parseInt(user_id),
        email: email,
        role_id: parseInt(role_id)
      });
  
      if (!user) {
        return res.status(404).json({ error: true, message: 'User not found with provided credentials' });
      }
  
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
      
  
      res.status(200).json({
        error: false,
        message: 'User details fetched successfully',
        data: { 
          user_id: dbUserId,
          name, 
          email: dbEmail, 
          phone, 
          city, 
          status, 
          issubscribed, 
          createdDate 
        }
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
  