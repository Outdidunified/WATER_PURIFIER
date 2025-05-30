const jwt = require('jsonwebtoken');
const { EmailConfig } = require('../controllers/Email');
const { connectToDatabase } = require('../../../config/db');

const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

const generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString();

exports.register = async (req, res) => {
  const { name, email, phone, password, city, createdby } = req.body;

  if (!name || !password || !city || (!email && !phone)) {
    return res.status(400).json({
      status: 'failed',
      message: 'Name, password, city, and email or phone are required'
    });
  }

  try {
    const db = await connectToDatabase();

    const role = await db.collection('user_roles').findOne({ role_id: 3 });
    if (!role || !role.status) {
      return res.status(403).json({
        status: 'failed',
        message: 'Registration is only allowed for EndUser role'
      });
    }

    const existingUser = await db.collection('users').findOne({
      $or: [{ email }, { phone }]
    });

    if (existingUser) {
      return res.status(400).json({ status: 'failed', message: 'User already exists' });
    }

    const otp = generateOtp();
    const otpExpires = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
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
      isSubscribed: false // 👈 Set user as not subscribed by default
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
      await EmailConfig(email, otp);  // Send OTP email
      console.log(`OTP sent to email: ${email}`);
    }

    if (phone) {
      console.log(`OTP sent to phone: ${phone}: ${otp}`); // Send SMS if needed
    }

    res.status(201).json({
      status: 'success',
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
    res.status(500).json({ status: 'error', message: 'Server error', error: err.message });
  }
};


exports.verifyOtp = async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ status: 'failed', message: 'Email and OTP are required' });
  }

  try {
    const db = await connectToDatabase();

    const user = await db.collection('users').findOne({ email });

    if (!user || user.otp !== otp || new Date() > user.otpExpires) {
      return res.status(400).json({ status: 'failed', message: 'Invalid or expired OTP' });
    }

    await db.collection('users').updateOne(
      { email },
      { $unset: { otp: "", otpExpires: "", otpGeneratedAt: "" } }
    );

    const token = generateToken(user._id);

    res.status(200).json({
      status: 'success',
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        city: user.city
      }
    });
  } catch (err) {
    res.status(500).json({
      status: 'error',
      message: 'OTP verification failed',
      error: err.message
    });
  }
};

exports.loginWithEmail = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password)
    return res.status(400).json({ status: 'failed', message: 'Email and password are required' });

  try {
    const db = await connectToDatabase();
    const user = await db.collection('users').findOne({ email });

    if (!user || user.password !== password) {
      return res.status(400).json({ status: 'failed', message: 'Invalid email or password' });
    }

    const token = generateToken(user._id);
    res.status(200).json({ status: 'success', message: 'Login successful', token, user });
  } catch (err) {
    res.status(500).json({ status: 'error', message: 'Login error', error: err.message });
  }
};

exports.sendOtp = async (req, res) => {
  const { email } = req.body;

  if (!email)
    return res.status(400).json({ status: 'failed', message: 'Email is required' });

  try {
    const db = await connectToDatabase();
    const user = await db.collection('users').findOne({ email });

    if (!user)
      return res.status(404).json({ status: 'failed', message: 'User not found' });

    const otp = generateOtp();
    const otpExpires = new Date(Date.now() + 5 * 60 * 1000);
    const otpGeneratedAt = new Date();

    await db.collection('users').updateOne({ email }, { $set: { otp, otpExpires, otpGeneratedAt } });

    // Send OTP via email (Water Purifier website OTP for login)
    await EmailConfig(email, otp);
    console.log(`OTP sent to email: ${email} - ${otp}`);

    res.status(200).json({ status: 'success', message: 'OTP sent to your email' });
  } catch (err) {
    res.status(500).json({ status: 'error', message: 'Error sending OTP', error: err.message });
  }
};
