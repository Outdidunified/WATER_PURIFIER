const jwt = require('jsonwebtoken');
const { EmailConfig } = require('../controllers/Email');
const { connectToDatabase } = require('../../../config/db');
const otpStore = {};


const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

const generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString();

exports.register = async (req, res) => {
  const { name, email, phone, password, city, createdby } = req.body;

  if (!name || !password || !city || (!email && !phone)) {
    return res.status(400).json({
      status: 'failed',
      error: true,
      message: 'Name, password, city, and email or phone are required'
    });
  }

  try {
    const db = await connectToDatabase();

    const role = await db.collection('user_roles').findOne({ role_id: 3 });
    if (!role || !role.status) {
      return res.status(403).json({
        status: 'failed',
        error: true,
        message: 'Registration is only allowed for EndUser role'
      });
    }

    const usersWithSameEmailOrPhone = await db.collection('users').find({
      $or: [{ email }]
    }).toArray();

    const sameRoleExists = usersWithSameEmailOrPhone.find(u => u.role_id === 3);
    if (sameRoleExists) {
      return res.status(400).json({
        status: 'failed',
        error: true,
        message: 'End User with same email/phone already exists'
      });
    }

    const technicianExists = usersWithSameEmailOrPhone.find(u => u.role_id === 2);
    if (!technicianExists && usersWithSameEmailOrPhone.length > 0) {
      return res.status(400).json({
        status: 'failed',
        error: true,
        message: 'User already exists with different role'
      });
    }

    const otp = generateOtp();
    const otpExpires = new Date(Date.now() + 5 * 60 * 1000);
    const otpGeneratedAt = new Date();
    const createdDate = new Date();

    const lastUser = await db.collection('users').find().sort({ user_id: -1 }).limit(1).toArray();
    const newUserId = lastUser.length > 0 ? lastUser[0].user_id + 1 : 1;

    const result = await db.collection('users').insertOne({
      name,
      email,
      phone,
      password,
      city,
      otp,
      otpExpires,
      otpGeneratedAt,
      createdby,
      createdDate,
      status: true,
      role_id: role.role_id,
      role_name: role.role_name,
      user_id: newUserId,
  is_subscribed: false
    });

    await db.collection('user_roles').insertOne({
      user_id: newUserId,
      role_id: role.role_id,
      role_name: role.role_name,
      created_date: createdDate,
      created_by: createdby,
      modified_by: createdby,
      modified_date: createdDate,
      status: true
    });

    if (email) {
      await EmailConfig(email, otp);
      console.log(`OTP sent to email: ${email}`);
    }

    if (phone) {
      console.log(`OTP sent to phone: ${phone}: ${otp}`);
    }

    res.status(201).json({
      status: 'success',
      error: false,
      message: 'User registered. OTP sent to email/phone.',
      user: {
        id: result.insertedId,
        user_id: newUserId,
        name,
        email,
        phone,
        city,
        createdby,
        createdDate,
        status: true,
        role_id: role.role_id,
        role_name: role.role_name,
        isSubscribed: false
      }
    });

  } catch (err) {
    res.status(500).json({
      status: 'error',
      error: true,
      message: 'Server error',
      details: err.message
    });
  }
};



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

    await EmailConfig(email, otp); // ✅ Use imported function only

    const response = { error: false, message: 'OTP sent successfully to email' };
    console.log("Sending /login response:", response);
    res.status(200).json(response);
  } catch (error) {
    console.error('Email error:', error);
    res.status(500).json({ error: true, message: 'Failed to send OTP' });
  }
};

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
    const technicianDetailsCollection = db.collection('technician_details');

    const technician = await usersCollection.findOne({ email, role_id });

    if (!technician) {
      const response = { error: true, message: 'Technician not found with this email' };
      console.log("Sending /technicianLogin response:", response);
      return res.status(404).json(response);
    }

    if (technician.status === false) {
      const response = { error: true, message: 'Your account has been deactivated.' };
      console.log("Sending /technicianLogin response:", response);
      return res.status(403).json(response);
    }

    if (String(technician.password) !== String(password)) {
      const response = { error: true, message: 'Incorrect password' };
      console.log("Sending /technicianLogin response:", response);
      return res.status(401).json(response);
    }

    const token = jwt.sign({ id: technician.user_id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    // Fetch technician stats but without total_incomplete_services
    const technicianStats = await technicianDetailsCollection.findOne({ technician_id: technician.technician_id });

    const responseData = {
      user_id: technician.user_id,
      email: technician.email,
      role_id: technician.role_id,
      technician_id: technician.technician_id,
      name: technician.name,
      phone: technician.phone,
      city: technician.city,
      issubscribed: technician.issubscribed,
      stats: technicianStats
        ? {
            total_completed_services: technicianStats.total_completed_services || 0,
            total_assigned_services: technicianStats.total_assigned_services || 0,
          }
        : null,
    };

    const response = {
      error: false,
      message: 'Technician login successful',
      token,
      data: responseData,
    };

    console.log("Sending /technicianLogin response:", response);
    res.status(200).json(response);
  } catch (error) {
    console.error('Technician login error:', error);
    res.status(500).json({ error: true, message: 'Internal server error' });
  }
};

exports.verifyOtp = async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ error: true, message: 'Email and OTP are required' });
  }

  try {
    const db = await connectToDatabase();

    const user = await db.collection('users').findOne({ email });

    if (!user || !user.otp || !user.otpGeneratedAt) {
      return res.status(400).json({ error: true, message: 'Invalid OTP request' });
    }

    // Recalculate 5-minute expiry window from the stored generation time
    const generatedAt = new Date(user.otpGeneratedAt);
    const expiryTime = new Date(generatedAt.getTime() + 5 * 60 * 1000);
    const currentTime = new Date();

    if (user.otp !== otp || currentTime > expiryTime) {
      return res.status(400).json({ error: true, message: 'Invalid or expired OTP' });
    }

    // Clear OTP after successful verification
    await db.collection('users').updateOne(
      { email },
      { $unset: { otp: "", otpExpires: "", otpGeneratedAt: "" } }
    );

    // Generate token (use your token logic here)
    const token = generateToken(user._id); // or user.user_id if preferred

    res.status(200).json({
      error: false,
      message: 'Login successful',
      token,
      data: {
        user_id: user.user_id,
        email: user.email,
        role_id: user.role_id,
        is_subscribed: user.isSubscribed || false
      }
    });

  } catch (err) {
    res.status(500).json({
      error: true,
      message: 'OTP verification failed',
      details: err.message
    });
  }
};


exports.loginWithEmail = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password)
    return res.status(400).json({ error:true,status: 'failed', message: 'Email and password are required' });

  try {
    const db = await connectToDatabase();
    const user = await db.collection('users').findOne({ email });

    if (!user || user.password !== password) {
      return res.status(400).json({error:true, status: 'failed', message: 'Invalid email or password' });
    }

    const token = generateToken(user._id);
    res.status(200).json({ error:false,status: 'success', message: 'Login successful', token, user });
  } catch (err) {
    res.status(500).json({ error:true,status: 'error', message: 'Login error', error: err.message });
  }
};

exports.sendOtp = async (req, res) => {
  const { email } = req.body;

  if (!email)
    return res.status(400).json({ error:true,status: 'failed', message: 'Email is required' });

  try {
    const db = await connectToDatabase();
    const user = await db.collection('users').findOne({ email });

    if (!user)
      return res.status(404).json({ error:true,status: 'failed', message: 'User not found' });

    const otp = generateOtp();
    const otpExpires = new Date(Date.now() + 5 * 60 * 1000);
    const otpGeneratedAt = new Date();

    await db.collection('users').updateOne({ email }, { $set: { otp, otpExpires, otpGeneratedAt } });

    // Send OTP via email (Water Purifier website OTP for login)
    await EmailConfig(email, otp);
    console.log(`OTP sent to email: ${email} - ${otp}`);

    res.status(200).json({ error:false,status: 'success', message: 'OTP sent to your email' });
  } catch (err) {
    res.status(500).json({ error:true,status: 'error', message: 'Error sending OTP', error: err.message });
  }
};
