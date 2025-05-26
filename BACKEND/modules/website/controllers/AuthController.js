const database = require('../../../config/db');
const jwt = require('jsonwebtoken');

// Generate JWT token
const generateToken = (userId) => {
    return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

// Generate 6-digit OTP
const generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString();

exports.register = async (req, res) => {
    const { name, email, phone, password, city, createdby } = req.body;

    console.log("Register Payload:", req.body);

    if (!name || !password || !city || (!email && !phone)) {
        return res.status(400).json({
            status: 'failed',
            message: 'Name, password, city, and email or phone are required'
        });
    }

    try {
        const db = await database.connectToDatabase();
        const usersCollection = db.collection('users');

        // Check if user already exists by email or phone
        const existingUser = await usersCollection.findOne({
            $or: [{ email }, { phone }]
        });

        if (existingUser) {
            return res.status(400).json({
                status: 'failed',
                message: 'User already exists'
            });
        }

        // Generate next user_id
        const lastUser = await usersCollection.find().sort({ user_id: -1 }).limit(1).toArray();
        const nextUserId = lastUser.length > 0 ? lastUser[0].user_id + 1 : 1;

        const otp = generateOtp();
        const otpExpires = new Date(Date.now() + 5 * 60 * 1000);
        const createdDate = new Date();

        const newUser = {
            user_id: nextUserId,
            role_id: 3,
            name,
            email,
            phone,
            password,
            city,
            otp,
            otpExpires,
            createdby,
            createdDate,
            status: true
        };

        const result = await usersCollection.insertOne(newUser);

        console.log(`OTP sent to ${phone || email}: ${otp}`);

        // Send success response
        return res.status(201).json({
            status: 'success',
            message: 'User registered. OTP sent to phone.',
            user: {
                id: result.insertedId,
                ...newUser
            }
        });
    } catch (err) {
        console.error("Register Error:", err);
        return res.status(500).json({
            status: 'error',
            message: 'Server error',
            error: err.message
        });
    }
};

exports.verifyOtp = async (req, res) => {
    const { phone, otp } = req.body;

    if (!phone || !otp)
        return res.status(400).json({ status: 'failed', message: 'Phone and OTP required' });

    try {
        const db = await database.connectToDatabase();

        const user = await db.collection('users').findOne({ phone });

        if (!user || user.otp !== otp || new Date() > user.otpExpires) {
            return res.status(400).json({ status: 'failed', message: 'Invalid or expired OTP' });
        }

        await db.collection('users').updateOne({ phone }, { $unset: { otp: "", otpExpires: "" } });

        const token = generateToken(user._id);

        res.status(200).json({
            status: 'success',
            message: 'Login successful',
            token,
            user: { id: user._id, name: user.name, email: user.email, phone: user.phone, city: user.city }
        });
    } catch (err) {
        res.status(500).json({ status: 'error', message: 'OTP verification failed', error: err.message });
    }
};

exports.loginWithEmail = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password)
        return res.status(400).json({ status: 'failed', message: 'Email and password are required' });

    try {
        const db = await database.connectToDatabase();

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
    const { phone } = req.body;

    if (!phone)
        return res.status(400).json({ status: 'failed', message: 'Phone number is required' });

    try {
        const db = await database.connectToDatabase();

        const user = await db.collection('users').findOne({ phone });

        if (!user)
            return res.status(404).json({ status: 'failed', message: 'User not found' });

        const otp = generateOtp();
        const otpExpires = new Date(Date.now() + 5 * 60 * 1000);

        await db.collection('users').updateOne({ phone }, { $set: { otp, otpExpires } });

        console.log(`OTP sent to ${phone}: ${otp}`);

        res.status(200).json({ status: 'success', message: 'OTP sent to your phone' });
    } catch (err) {
        res.status(500).json({ status: 'error', message: 'Error sending OTP', error: err.message });
    }
};

exports.verifyOtpforLogin = async (req, res) => {
    const { phone, otp } = req.body;

    if (!phone || !otp)
        return res.status(400).json({ status: 'failed', message: 'Phone and OTP are required' });

    try {
        const db = await database.connectToDatabase();

        const user = await db.collection('users').findOne({ phone });

        if (!user || user.otp !== otp || new Date() > user.otpExpires) {
            return res.status(400).json({ status: 'failed', message: 'Invalid or expired OTP' });
        }

        await db.collection('users').updateOne({ phone }, { $unset: { otp: "", otpExpires: "" } });

        const token = generateToken(user._id);
        res.status(200).json({
            status: 'success',
            message: 'Login successful',
            token,
            user
        });
    } catch (err) {
        res.status(500).json({ status: 'error', message: 'OTP login error', error: err.message });
    }
};
