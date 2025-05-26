const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const { connectToDatabase } = require('../../../config/db');

// In-memory store for OTPs (use Redis or DB in production)
const otpStore = {};

// Generate a random 6-digit OTP
const generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString();

// Create JWT token
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

// Nodemailer transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SMTP_EMAIL,
    pass: process.env.SMTP_PASSWORD,
  },
});

// Step 1: Send OTP to Email
exports.login = async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: true, message: 'Email is required' });
  }

  const otp = generateOtp();
  otpStore[email] = {
    otp,
    expiresAt: Date.now() + 5 * 60 * 1000, // 5 minutes from now
  };

  try {
    await transporter.sendMail({
      from: `"Outdid" <${process.env.SMTP_EMAIL}>`,
      to: email,
      subject: 'Your OTP for Login',
      text: `Your OTP is: ${otp}`,
    });

    res.status(200).json({ error: false, message: 'OTP sent successfully to email' });
  } catch (error) {
    console.error('Email error:', error);
    res.status(500).json({ error: true, message: 'Failed to send OTP' });
  }
};

// Step 2: Verify OTP and login/create user
exports.verifyOtp = async (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) {
    return res.status(400).json({ error: true, message: 'Email and OTP are required' });
  }

  const otpEntry = otpStore[email];

  if (!otpEntry || otpEntry.otp !== otp) {
    return res.status(401).json({ error: true, message: 'Invalid OTP' });
  }

  if (Date.now() > otpEntry.expiresAt) {
    delete otpStore[email];
    return res.status(410).json({ error: true, message: 'OTP has expired' });
  }

  const otpExpires = new Date(otpEntry.expiresAt); // Convert to Date for MongoDB

  try {
    const db = await connectToDatabase();
    const usersCollection = db.collection('users');

    let user = await usersCollection.findOne({ email });

    if (!user) {
      // Get the latest user_id and increment
      const latestUser = await usersCollection.find().sort({ user_id: -1 }).limit(1).toArray();
      const newUserId = latestUser.length > 0 ? latestUser[0].user_id + 1 : 1;

      const newUser = {
        user_id: newUserId,
        role_id: 3, // Default role
        name: null,
        email,
        phone: null,
        password: null,
        city: null,
        otp: null,
        otpExpires: otpExpires, // Explicit Date
        createdby: null,
        createdDate: new Date(),
        status: true,
      };

      await usersCollection.insertOne(newUser);
      user = newUser;
    } else {
      // Optional: update otpExpires for existing user if needed
      await usersCollection.updateOne(
        { email },
        { $set: { otpExpires } }
      );
    }

    const token = generateToken(user.user_id);

    // Clean up OTP after use
    delete otpStore[email];

    res.status(200).json({
      error: false,
      message: 'Login successful',
      token,
      user: {
        user_id: user.user_id,
        email: user.email,
        role_id: user.role_id,
      },
    });
  } catch (err) {
    console.error('Verification error:', err);
    res.status(500).json({ error: true, message: 'Internal server error' });
  }
};
