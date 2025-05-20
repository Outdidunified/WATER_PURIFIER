const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

// Generate 6-digit OTP
const generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString();

// Register new user and send OTP immediately
exports.register = async (req, res) => {
  try {
    const { name, email, phone, password, city } = req.body;

    if (!name || !password || !city || (!email && !phone)) {
      return res.status(400).json({ status: 'failed', message: 'Name, password, city, and email or phone are required' });
    }

    const existingUser = await User.findOne({
      $or: [{ email }, { phone }],
    });

    if (existingUser) {
      return res.status(400).json({ status: 'failed', message: 'User already exists' });
    }

    // Create user without OTP first
    const user = await User.create({ name, email, phone, city, password });

    // Generate OTP and save to user
    const otp = generateOtp();
    user.otp = otp;
    user.otpExpires = new Date(Date.now() + 5 * 60 * 1000); // OTP valid for 5 mins
    await user.save();

    // Simulate sending OTP to phone (replace with SMS service)
    console.log(`OTP sent to ${phone}: ${otp}`);

    // Respond without token yet, require OTP verification for login
    res.status(201).json({
      status: 'success',
      message: 'User registered successfully. OTP sent to your phone for login.',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        city: user.city,
      },
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Server error', error: error.message });
  }
};

// Verify OTP and login user
exports.verifyOtp = async (req, res) => {
  try {
    const { phone, otp } = req.body;
    if (!phone || !otp) {
      return res.status(400).json({ status: 'failed', message: 'Phone and OTP are required' });
    }

    const user = await User.findOne({ phone });

    if (!user) {
      return res.status(404).json({ status: 'failed', message: 'User not found' });
    }

    if (user.otp !== otp || new Date() > user.otpExpires) {
      return res.status(400).json({ status: 'failed', message: 'Invalid or expired OTP' });
    }

    // Clear OTP fields after successful verification
    user.otp = null;
    user.otpExpires = null;
    await user.save();

    // Generate JWT token after successful OTP login
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
        city: user.city,
      },
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Failed to verify OTP', error: error.message });
  }
};


// Login via email + password
exports.loginWithEmail = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ status: 'failed', message: 'Email and password are required' });

    const user = await User.findOne({ email });
    if (!user || !user.matchPassword(password)) {
      return res.status(400).json({ status: 'failed', message: 'Invalid email or password' });
    }

    res.status(200).json({
      status: 'success',
      message: 'Login successful',
      token: generateToken(user._id),
      user,
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Internal Server error', error: error.message });
  }
};

// Send OTP to phone
exports.sendOtp = async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone)
      return res.status(400).json({ status: 'failed', message: 'Phone number is required' });

    const user = await User.findOne({ phone });
    if (!user)
      return res.status(404).json({ status: 'failed', message: 'User not found' });

    const otp = generateOtp();
    user.otp = otp;
    user.otpExpires = new Date(Date.now() + 5 * 60 * 1000); // 5 min expiry
    await user.save();

    // Simulate OTP sending (replace with SMS provider in real use)
    console.log(`OTP sent to ${phone}: ${otp}`);

    res.status(200).json({ status: 'success', message: 'OTP sent to your phone number' });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Failed to send OTP', error: error.message });
  }
};

// Verify OTP and login
exports.verifyOtpforLogin = async (req, res) => {
  try {
    const { phone, otp } = req.body;
    if (!phone || !otp)
      return res.status(400).json({ status: 'failed', message: 'Phone and OTP are required' });

    const user = await User.findOne({ phone });

    if (!user || user.otp !== otp || new Date() > user.otpExpires) {
      return res.status(400).json({ status: 'failed', message: 'Invalid or expired OTP' });
    }

    // Clear OTP
    user.otp = null;
    user.otpExpires = null;
    await user.save();

    res.status(200).json({
      status: 'success',
      message: 'Login successful',
      token: generateToken(user._id),
      user,
    });
    console.log('otp',otp)
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Failed to verify OTP', error: error.message });
  }
};
