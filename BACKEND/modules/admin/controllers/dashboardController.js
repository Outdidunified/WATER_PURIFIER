const database = require('../../../config/db');
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'default_secret_key';
const { ObjectId } = require("mongodb");
const logger = require('../../../middlewares/requestLogger');

// 1. Login Controller
const authenticate = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(401).json({ message: 'Email and Password required' });
        }

        const db = await database.connectToDatabase();
        const usersCollection = db.collection('admin_users');

        const user = await usersCollection.findOne({ email, status: "true" });

        if (!user) {
            return res.status(401).json({ message: 'Invalid email or user is deactivated' });
        }

        if (user.password !== password) {
            return res.status(401).json({ message: 'Invalid password' });
        }

        const token = jwt.sign({ userId: user._id }, JWT_SECRET);

        return res.status(200).json({
            status: 'Success',
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                status: user.status
            },
            token
        });

    } catch (error) {
        console.error('Error in authentication:', error);
        return res.status(500).json({ status: 'Failed', message: 'Internal Server Error' });
    }
};

// Profile
// Fetch Admin Profile
const FetchAdminProfile = async (req, res) => {
    const { user_id } = req.body;

    try {
        const db = await database.connectToDatabase();
        const usersCollection = db.collection("admin_users");

        const user = await usersCollection.findOne({ _id: new ObjectId(user_id) });

        if (!user) {
            return res.status(404).json({ status: 'Failed', message: 'User not found' });
        }

        const { socket, ...sanitizedProfile } = user;

        return res.status(200).json({ status: 'Success', data: sanitizedProfile });

    } catch (error) {
        console.error('Error in FetchAdminProfile controller:', error);
        logger?.error?.(error);
        return res.status(500).json({ status: 'Failed', message: 'Internal Server Error' });
    }
};

// Update Admin Profile
const UpdateAdminProfile = async (req, res) => {
    const { user_id, name, phone, password, modified_by, status } = req.body;

    try {
        if (!user_id || !name || !phone || !password || !modified_by || !status) {
            return res.status(400).json({
                status: 'Failed',
                message: 'All fields (user_id, name, phone, password, modified_by, status) are required'
            });
        }

        const db = await database.connectToDatabase();
        const usersCollection = db.collection("admin_users");

        const existingUser = await usersCollection.findOne({ _id: new ObjectId(user_id) });
        if (!existingUser) {
            return res.status(404).json({ status: 'Failed', message: 'User not found' });
        }

        const updateResult = await usersCollection.updateOne(
            { _id: new ObjectId(user_id) },
            {
                $set: {
                    name,
                    phone,
                    password,
                    modified_by,
                    modified_date: new Date(),
                    status
                }
            }
        );

        if (updateResult.matchedCount === 0) {
            return res.status(500).json({ status: 'Failed', message: 'Failed to update user profile' });
        }

        return res.status(200).json({
            status: 'Success',
            message: 'User profile updated successfully',
            data: { user_id, name, phone, status }
        });

    } catch (error) {
        console.error('Error in UpdateAdminProfile controller:', error);
        logger?.error?.(error);
        return res.status(500).json({ status: 'Failed', message: 'Internal Server Error' });
    }
};

// 3.Subscription Plans
//AddSubscriptionPlans
const AddSubscriptionPlans = async (req, res) => {
    const { type, capacity, plans, createdby, status } = req.body;

    if (!type || !capacity || !Array.isArray(plans) || !createdby || typeof status !== 'boolean') {
        return res.status(400).json({
            status: 'Failed',
            message: 'All fields (type, capacity, plans[], createdby, status) are required'
        });
    }

    try {
        const db = await database.connectToDatabase();
        const collection = db.collection("subscriptionplans");

        // Get the highest productId
        const lastPlan = await collection.find().sort({ productId: -1 }).limit(1).toArray();
        const nextProductId = lastPlan.length > 0 ? parseInt(lastPlan[0].productId) + 1 : 1;

        const newPlan = {
            productId: nextProductId.toString(), // ensure it's a string if you're storing it that way
            type,
            capacity,
            plans,
            createdby,
            createdDate: new Date(),
            status
        };

        await collection.insertOne(newPlan);

        return res.status(200).json({
            status: 'Success',
            message: 'Subscription plan added successfully',
            data: newPlan
        });

    } catch (error) {
        console.error("Error in AddSubscriptionPlans:", error);
        logger?.error?.(error);
        return res.status(500).json({ status: 'Failed', message: 'Internal Server Error' });
    }
};

// FetchSubscriptionPlans
const FetchSubscriptionPlans = async (req, res) => {
    try {
        const db = await database.connectToDatabase();
        const collection = db.collection("subscriptionplans");

        const plans = await collection.find().toArray();

        return res.status(200).json({ status: 'Success', data: plans });

    } catch (error) {
        console.error("Error in FetchSubscriptionPlans:", error);
        logger?.error?.(error);
        return res.status(500).json({ status: 'Failed', message: 'Internal Server Error' });
    }
};

// UpdateSubscriptionPlans
const UpdateSubscriptionPlans = async (req, res) => {
    const { _id, productId, type, capacity, plans, status, modified_by } = req.body;

    // Validate input
    if (!_id || !productId || !type || !capacity || !Array.isArray(plans) || !status || !modified_by) {
        return res.status(400).json({
            status: 'Failed',
            message: 'All fields (_id, productId, type, capacity, plans[], status, modified_by) are required'
        });
    }

    try {
        const db = await database.connectToDatabase();
        const collection = db.collection("subscriptionplans");

        const result = await collection.updateOne(
            { _id: new ObjectId(_id) },
            {
                $set: {
                    productId,
                    type,
                    capacity,
                    plans,
                    status,
                    modified_by,               // Track who modified
                    modifiedDate: new Date()   // Track when
                }
            }
        );

        if (result.matchedCount === 0) {
            return res.status(404).json({ status: 'Failed', message: 'Subscription plan not found' });
        }

        return res.status(200).json({
            status: 'Success',
            message: 'Subscription plan updated successfully'
        });

    } catch (error) {
        console.error("Error in UpdateSubscriptionPlans:", error);
        logger?.error?.(error);
        return res.status(500).json({ status: 'Failed', message: 'Internal Server Error' });
    }
};

// 4.Call Request
// FetchCallRequest
const FetchCallRequest = async (req, res) => {
    try {
        const db = await database.connectToDatabase();
        const collection = db.collection("callRequests");

        const CallRequest = await collection.find().toArray();

        return res.status(200).json({ status: 'Success', data: CallRequest });

    } catch (error) {
        console.error("Error in FetchCallRequest:", error);
        logger?.error?.(error);
        return res.status(500).json({ status: 'Failed', message: 'Internal Server Error' });
    }
};
// 5.Contact
// FetchContact
const FetchContact = async (req, res) => {
    try {
        const db = await database.connectToDatabase();
        const collection = db.collection("contactUs");

        const contact = await collection.find().toArray();

        return res.status(200).json({ status: 'Success', data: contact });

    } catch (error) {
        console.error("Error in FetchContact:", error);
        logger?.error?.(error);
        return res.status(500).json({ status: 'Failed', message: 'Internal Server Error' });
    }
};

// 6. Manage Orders
// FetchOrders
const FetchOrders = async (req, res) => {
    try {
        const db = await database.connectToDatabase();
        const collection = db.collection("orders");

        const orders = await collection.find().toArray();

        return res.status(200).json({ status: 'Success', data: orders });

    } catch (error) {
        console.error("Error in FetchOrders:", error);
        logger?.error?.(error);
        return res.status(500).json({ status: 'Failed', message: 'Internal Server Error' });
    }
}

//UpdateOrdersStatus
const UpdateOrdersStatus = async (req, res) => {
    const { _id, delivaryStatus, modified_by } = req.body;

    // Validate input
    if (!_id || !delivaryStatus || !modified_by) {
        return res.status(400).json({
            status: 'Failed',
            message: 'All fields (_id, delivaryStatus, modified_by) are required'
        });
    }

    try {
        const db = await database.connectToDatabase();
        const collection = db.collection("orders");

        const result = await collection.updateOne(
            { _id: new ObjectId(_id) },
            {
                $set: {
                    delivaryStatus,
                    modified_by,
                    modifiedDate: new Date()
                }
            }
        );

        if (result.matchedCount === 0) {
            return res.status(404).json({ status: 'Failed', message: 'Order not found' });
        }

        return res.status(200).json({
            status: 'Success',
            message: 'Order status updated successfully'
        });

    } catch (error) {
        console.error("Error in UpdateOrdersStatus:", error);
        logger?.error?.(error);
        return res.status(500).json({
            status: 'Failed',
            message: 'Internal Server Error'
        });
    }
};

module.exports = {
    authenticate, FetchAdminProfile, UpdateAdminProfile, AddSubscriptionPlans, FetchSubscriptionPlans, UpdateSubscriptionPlans, FetchCallRequest, FetchContact,
    FetchOrders, UpdateOrdersStatus
};
