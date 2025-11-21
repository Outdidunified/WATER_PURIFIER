const jwt = require('jsonwebtoken');
const { sendOtpEmail } = require('../controllers/Email');
const { connectToDatabase } = require('../../../config/db');
const otpStore = {};
const { checkAndResetSubscription } = require('../../../services/subscriptionChecker');


const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

const generateNumericPassword = () => Math.floor(1000 + Math.random() * 9000).toString(); // 4-digit password


const generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString();
//register
exports.register = async (req, res) => {
  const {
    name,
    email,
    phone,
    password,
    city,
    district,
    state,
    country,
    addressline1,
    addressline2,
    pincode,
    createdby
  } = req.body;

  // 🔹 Validation
  if (!name || !password || !city || (!email && !phone)) {
    return res.status(400).json({
      status: 'failed',
      error: true,
      message: 'Name, password, city, and email or phone are required'
    });
  }

  try {
    const db = await connectToDatabase();

    // 🔹 Check EndUser role status
    const role = await db.collection('user_roles').findOne({ role_id: 3 });

    if (!role) {
      return res.status(404).json({
        status: 'failed',
        error: true,
        message: 'EndUser role not found'
      });
    }

    // 🔒 Block registration if EndUser role is deactivated
    if (role.status === false) {
      return res.status(403).json({
        status: 'failed',
        error: true,
        message: 'EndUser role is deactivated. Registration not allowed.'
      });
    }

    // 🔹 Check for duplicate EndUser with same email
    const existingUsers = await db.collection('users').find({
      $or: [{ email }]
    }).toArray();

    const endUserExists = existingUsers.find(u => u.role_id === 3);
    if (endUserExists) {
      return res.status(400).json({
        status: 'failed',
        error: true,
        message: 'End User with same email already exists'
      });
    }

    // 🔹 Prepare new user data
    const otp = generateOtp();
    const otpExpires = new Date(Date.now() + 5 * 60 * 1000);
    const otpGeneratedAt = new Date();
    const createdDate = new Date();

    const lastUser = await db.collection('users').find().sort({ user_id: -1 }).limit(1).toArray();
    const newUserId = lastUser.length > 0 ? lastUser[0].user_id + 1 : 1;

    const newUser = {
      name,
      email,
      phone,
      password,
      city,
      district,
      state,
      country,
      addressline1,
      addressline2,
      pincode,
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
    };

    const result = await db.collection('users').insertOne(newUser);

    // 📴 OTP sending disabled intentionally
    // (You can re-enable if needed using sendOtpEmail or SMS gateway)

    res.status(201).json({
      status: 'success',
      error: false,
      message: 'User registered successfully',
      user: {
        id: result.insertedId,
        user_id: newUserId,
        name,
        email,
        phone,
        city,
        district,
        state,
        country,
        addressline1,
        addressline2,
        pincode,
        createdby,
        createdDate,
        status: true,
        role_id: role.role_id,
        role_name: role.role_name,
        isSubscribed: false
      }
    });

  } catch (err) {
    console.error('Registration error:', err.message);
    res.status(500).json({
      status: 'error',
      error: true,
      message: 'Server error',
      details: err.message
    });
  }
};



exports.login = async (req, res) => {
  console.log("Received /registerOrLogin request:", req.body);

  const { email, role_id } = req.body;

  if (!email || Number(role_id) !== 3) {
    return res.status(400).json({
      error: true,
      message: 'Email and role_id = 3 are required',
    });
  }

  try {
    const db = await connectToDatabase();

    // Fetch role details
    const role = await db.collection('user_roles').findOne({ role_id: Number(role_id) });

    if (!role) {
      return res.status(404).json({ error: true, message: 'Role not found' });
    }

    // 🔒 Block login if EndUser role is deactivated
    if (role.role_id === 3 && role.status === false) {
      return res.status(403).json({
        error: true,
        message: 'EndUser role is deactivated. Login not allowed.',
      });
    }

    const otp = generateOtp();
    const otpGeneratedAt = new Date();
    const otpExpires = new Date(Date.now() + 5 * 60 * 1000);
    const createdDate = new Date();

    // Check if user already exists
    const existingUser = await db
      .collection('users')
      .findOne({ email, role_id: Number(role_id) });

    if (existingUser) {
      // 🚫 Prevent deactivated users from logging in
      if (existingUser.status === false) {
        return res.status(403).json({
          error: true,
          message: 'Your account has been deactivated. Login not allowed.',
        });
      }

      //  Check and reset expired subscription if needed
      await checkAndResetSubscription(db, existingUser);

      // Update OTP for existing user
      await db.collection('users').updateOne(
        { email, role_id: Number(role_id) },
        { $set: { otp, otpGeneratedAt, otpExpires } }
      );

      await sendOtpEmail(email, otp);
      console.log(`Existing user — OTP sent to ${email}: ${otp}`);

      return res.status(200).json({
        error: false,
        message: 'OTP sent to email for login',
        data: {
          user_id: existingUser.user_id,
          role_id: existingUser.role_id,
          email: existingUser.email,
          status: existingUser.status,
        },
      });
    } else {
      // Register a new user
      const generatedPassword = generateNumericPassword();
      const lastUser = await db
        .collection('users')
        .find()
        .sort({ user_id: -1 })
        .limit(1)
        .toArray();

      const newUserId = lastUser.length > 0 ? lastUser[0].user_id + 1 : 1;

      const newUser = {
        name: "",
        phone: null,
        city: "",
        password: parseInt(generatedPassword),
        email,
        otp,
        otpGeneratedAt,
        otpExpires,
        role_id: role.role_id,
        role_name: role.role_name,
        user_id: newUserId,
        status: true,
        is_subscribed: false,
        createdDate,
      };

      await db.collection('users').insertOne(newUser);

      await sendOtpEmail(email, otp, generatedPassword);
      console.log(`New user registered — OTP + Password sent to ${email}: OTP=${otp}, Password=${generatedPassword}`);

      return res.status(200).json({
        error: false,
        message: 'Registered successfully. OTP and password sent to email.',
        data: {
          user_id: newUserId,
          role_id: role.role_id,
          email,
        },
      });
    }
  } catch (error) {
    console.error('Register/Login error:', error);
    return res.status(500).json({
      error: true,
      message: 'Register/Login failed',
      details: error.message,
    });
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
      is_subscribed: technician.is_subscribed,
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
  const { email, otp, role_id } = req.body;

  console.log('\nOTP Verification Request Received');
  console.log('Email:', email);
  console.log('OTP:', otp);
  console.log('Role ID:', role_id);

  if (!email || !otp || !role_id) {
    console.log('Missing required fields (email, otp, or role_id)');
    return res.status(400).json({
      error: true,
      message: 'Email, OTP, and role_id are required'
    });
  }

  try {
    const db = await connectToDatabase();
    console.log('Connected to database');

    const user = await db.collection('users').findOne({ email, role_id: Number(role_id) });

    if (!user) {
      console.log('User not found with provided email and role_id');
      return res.status(400).json({ error: true, message: 'User not found' });
    }

    if (!user.otp || !user.otpGeneratedAt) {
      console.log('OTP data missing in user');
      return res.status(400).json({ error: true, message: 'OTP not found or expired' });
    }

    const generatedAt = new Date(user.otpGeneratedAt);
    const expiryTime = new Date(generatedAt.getTime() + 5 * 60 * 1000);
    const currentTime = new Date();

    console.log('OTP Generated At:', generatedAt);
    console.log('Current Time:', currentTime);
    console.log('Expiry Time:', expiryTime);

    if (String(user.otp) !== String(otp)) {
      console.log('OTP does not match');
      return res.status(400).json({ error: true, message: 'Invalid or expired OTP' });
    }

    if (currentTime > expiryTime) {
      console.log('OTP has expired');
      return res.status(400).json({ error: true, message: 'OTP expired. Please request a new one.' });
    }

    await db.collection('users').updateOne(
      { email, role_id: Number(role_id) },
      { $unset: { otp: "", otpExpires: "", otpGeneratedAt: "" } }
    );
    console.log('OTP fields cleared successfully');

    const token = generateToken(user._id);

    return res.status(200).json({
      error: false,
      message: 'Login successful',
      token,
      data: {
        user_id: user.user_id,
        email: user.email,
        role_id: user.role_id,
        is_subscribed: user.is_subscribed || false
      }
    });

  } catch (err) {
    console.error('OTP verification failed:', err.message);
    return res.status(500).json({
      error: true,
      message: 'OTP verification failed',
      details: err.message
    });
  }
};



exports.loginWithEmail = async (req, res) => {
  const { email, password, role_id } = req.body;

  if (!email || !password || !role_id) {
    return res.status(400).json({
      error: true,
      status: 'failed',
      message: 'Email, password, and role_id are required'
    });
  }

  try {
    const db = await connectToDatabase();

    // 🔍 Fetch the role document
    const role = await db.collection('user_roles').findOne({ role_id: Number(role_id) });

    if (!role) {
      return res.status(404).json({
        error: true,
        status: 'failed',
        message: 'Role not found'
      });
    }

    // 🔒 Block login if EndUser role is deactivated
    // if (role.role_id === 3 && role.status === false) {
    //   return res.status(403).json({
    //     error: true,
    //     status: 'failed',
    //     message: 'EndUser role is deactivated. Login not allowed.'
    //   });
    // }

    // 🔍 Find the user by email and role
    const user = await db.collection('users').findOne({ email, role_id: Number(role_id) });

    if (!user) {
      return res.status(400).json({
        error: true,
        status: 'failed',
        message: 'Invalid credentials'
      });
    }

    // 🔑 Verify password
    if (user.password !== password) {
      return res.status(400).json({
        error: true,
        status: 'failed',
        message: 'Invalid credentials'
      });
    }

    // 🚫 Only allow End Users (role_id = 3)
    if (Number(role_id) !== 3) {
      return res.status(403).json({
        error: true,
        status: 'failed',
        message: 'Only End Users are allowed'
      });
    }

    // 🚫 Block deactivated users
    if (!user.status) {
      return res.status(403).json({
        error: true,
        status: 'failed',
        message: 'Your account is deactivated. Please contact support.'
      });
    }

    // ✅ Check and reset expired subscriptions
    await checkAndResetSubscription(db, user);

    // 🪙 Generate JWT token
    const token = generateToken(user._id);

    const minimalUser = {
      role_id: user.role_id,
      user_id: user.user_id,
      status: user.status,
      email: user.email,
    };

    return res.status(200).json({
      error: false,
      status: 'success',
      message: 'Login successful',
      token,
      user: minimalUser,
    });

  } catch (err) {
    console.error('LoginWithEmail error:', err);
    return res.status(500).json({
      error: true,
      status: 'error',
      message: 'Login error',
      error: err.message
    });
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
    await sendOtpEmail(email, otp);
    console.log(`OTP sent to email: ${email} - ${otp}`);

    res.status(200).json({ error:false,status: 'success', message: 'OTP sent to your email' });
  } catch (err) {
    res.status(500).json({ error:true,status: 'error', message: 'Error sending OTP', error: err.message });
  }
};
