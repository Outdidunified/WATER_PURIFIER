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

// STEP 1: Send OTP to Email
exports.login = async (req, res) => {
  console.log("Received /login request:", req.body);

  const { email, role_id } = req.body;

  if (!email || Number(role_id) !== 3) {
    const response = { error: true, message: 'Email and role_id 3 are required' };
    console.log("Sending /login response:", response);
    return res.status(400).json(response);
  }

  try {
    const otp = generateOtp();
    otpStore[email] = {
      otp,
      expiresAt: Date.now() + 5 * 60 * 1000, // 5 minutes
    };
    console.log(`Generated OTP for ${email}:`, otp);

    await transporter.sendMail({
      from: `"Outdid" <${process.env.SMTP_EMAIL}>`,
      to: email,
      subject: 'Your OTP for Login',
      text: `Your OTP is: ${otp}`,
    });

    const response = { error: false, message: 'OTP sent successfully to email' };
    console.log("Sending /login response:", response);
    res.status(200).json(response);
  } catch (error) {
    console.error('Email error:', error);
    res.status(500).json({ error: true, message: 'Failed to send OTP' });
  }
};

// STEP 2: Verify OTP and Login/Create User
exports.verifyOtp = async (req, res) => {
  const { email, otp } = req.body;

  console.log("Received /verifyOtp request:", req.body);

  if (!email || !otp) {
    return res.status(400).json({ error: true, message: 'Email and OTP are required' });
  }

  const otpEntry = otpStore[email];

  if (!otpEntry) {
    return res.status(401).json({ error: true, message: 'Invalid OTP' });
  }

  console.log('Stored OTP:', otpEntry.otp, 'Type:', typeof otpEntry.otp);
  console.log('Received OTP:', otp, 'Type:', typeof otp);

  if (otpEntry.otp !== String(otp)) {
    return res.status(401).json({ error: true, message: 'Invalid OTP' });
  }

  if (Date.now() > otpEntry.expiresAt) {
    delete otpStore[email];
    return res.status(410).json({ error: true, message: 'OTP has expired' });
  }

  const otpExpires = new Date(otpEntry.expiresAt);

  try {
    const db = await connectToDatabase();
    const usersCollection = db.collection('users');

    let user = await usersCollection.findOne({ email });

    if (user) {
      await usersCollection.updateOne({ email }, { $set: { otpExpires } });
    } else {
      const latestUser = await usersCollection.find().sort({ user_id: -1 }).limit(1).toArray();
      const newUserId = latestUser.length > 0 ? latestUser[0].user_id + 1 : 1;

      const newUser = {
        user_id: newUserId,
        role_id: 3,
        name: null,
        email,
        phone: null,
        password: null,
        city: null,
        otp: null,
        otpExpires,
        createdby: null,
        createdDate: new Date(),
        issubscribed: null,
        status: true,
        active_duration_id:null,
        active_order_id:null,
        active_plan_id:null,
        assigned_device_id:null,
        subscribedAt:null,
      };

      await usersCollection.insertOne(newUser);
      user = newUser;
    }

    const token = generateToken(user.user_id);
    delete otpStore[email]; // Cleanup OTP

    const response = {
      error: false,
      message: 'Login successful',
      token,
      data: {
        user_id: user.user_id,
        email: user.email,
        role_id: user.role_id,
        is_subscribed: user.issubscribed,
      },
    };
    console.log("Sending /verifyOtp response:", response);
    res.status(200).json(response);
  } catch (err) {
    console.error('Verification error:', err);
    res.status(500).json({ error: true, message: 'Internal server error' });
  }
};

// Technician Login (role_id = 2)
exports.technicianLogin = async (req, res) => {
  console.log("Received /technicianLogin request:", req.body);

  const { email, password, role_id } = req.body;

  if (!email || !password || role_id !== 2) {
    const response = { error: true, message: 'Invalid credentials or role_id' };
    console.log("Sending /technicianLogin response:", response);
    return res.status(400).json(response);
  }

  try {
    const db = await connectToDatabase();
    const usersCollection = db.collection('users');

    const technician = await usersCollection.findOne({ email, role_id });

    if (!technician) {
      const response = { error: true, message: 'Technician not found with this email' };
      console.log("Sending /technicianLogin response:", response);
      return res.status(404).json(response);
    }

    if (String(technician.password) !== String(password)) {
      const response = { error: true, message: 'Incorrect password' };
      console.log("Sending /technicianLogin response:", response);
      return res.status(401).json(response);
    }

    const token = jwt.sign({ id: technician.user_id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    const response = {
      error: false,
      message: 'Technician login successful',
      token,
      data: {
        user_id: technician.user_id,
        email: technician.email,
        role_id: technician.role_id,
      },
    };
    console.log("Sending /technicianLogin response:", response);
    res.status(200).json(response);
  } catch (error) {
    console.error('Technician login error:', error);
    res.status(500).json({ error: true, message: 'Internal server error' });
  }
};
