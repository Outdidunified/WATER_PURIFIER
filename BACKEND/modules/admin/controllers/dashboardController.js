const database = require('../../../config/db');
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'default_secret_key';
const { ObjectId } = require("mongodb"); // Import ObjectId
const logger = require('../../../middlewares/requestLogger');

// 1.Login Controller
const authenticate = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(401).json({ message: 'Email and Password required' });
        }

        const db = await database.connectToDatabase();
        const usersCollection = db.collection('admin_users');

        // Make sure field names match your MongoDB schema
        const user = await usersCollection.findOne({ email: email, status: "true" });

        if (!user) {
            return res.status(401).json({ message: 'Invalid email or user is deactivated' });
        }

        if (user.password !== password) {
            return res.status(401).json({ message: 'Invalid password' });
        }

        // Generate JWT token (you can include _id if needed)
        const token = jwt.sign({ userId: user._id }, JWT_SECRET);

        return res.status(200).json({
            status: 'Success',
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone
            },
            token: token
        });

    } catch (error) {
        console.error('Error in authentication:', error);
        return res.status(500).json({ status: 'Failed', message: 'Internal Server Error' });
    }
};

module.exports = {
    authenticate
};