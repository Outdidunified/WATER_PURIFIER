const database = require('../../../config/db');
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'default_secret_key';
const { ObjectId } = require("mongodb");
const logger = require('../../../middlewares/requestLogger');
const multerImg = require('../middlewares/multer');

// 1. Login Controller
const authenticate = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(401).json({ message: 'Email and Password are required' });
        }

        const role_id = 1; // Hardcoded role_id for admin

        const db = await database.connectToDatabase();
        const usersCollection = db.collection('users');

        // Check user by email, role_id, and status
        const user = await usersCollection.findOne({
            email,
            role_id: role_id,
            status: true
        });

        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials or user is deactivated' });
        }

        if (user.password !== password) {
            return res.status(401).json({ message: 'Invalid password' });
        }

        const token = jwt.sign({ userId: user._id }, JWT_SECRET);

        return res.status(200).json({
            status: 'Success',
            user: {
                _id: user._id,
                user_id: user.user_id,
                role_id: user.role_id,
                name: user.name,
                email: user.email,
                password: user.password,
                phone: user.phone,
                createdby: user.createdby,
                modifiedby: user.modifiedby,
                createddate: user.createddate,
                modifieddate: user.modifieddate,
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
        const usersCollection = db.collection("users");

        // Correct syntax for querying by user_id
        const user = await usersCollection.findOne({ user_id: parseInt(user_id) });

        if (!user) {
            return res.status(404).json({ status: 'Failed', message: 'User not found' });
        }

        // Remove sensitive or unnecessary fields like 'socket' if needed
        const { socket, password, ...sanitizedProfile } = user;

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
        // Validate all fields
        if (
            user_id === undefined ||
            !name ||
            !phone ||
            !password ||
            !modified_by ||
            status === undefined
        ) {
            return res.status(400).json({
                status: 'Failed',
                message: 'All fields (user_id, name, phone, password, modified_by, status) are required'
            });
        }

        const db = await database.connectToDatabase();
        const usersCollection = db.collection("users");

        const userIdInt = parseInt(user_id);

        // Check if user exists
        const existingUser = await usersCollection.findOne({ user_id: userIdInt });
        if (!existingUser) {
            return res.status(404).json({ status: 'Failed', message: 'User not found' });
        }

        // Perform update
        const updateResult = await usersCollection.updateOne(
            { user_id: userIdInt },
            {
                $set: {
                    name,
                    phone,
                    password: String(password), // Ensure password is string
                    modifiedby: modified_by,
                    modifieddate: new Date(),
                    status: Boolean(status)
                }
            }
        );

        if (updateResult.matchedCount === 0 || updateResult.modifiedCount === 0) {
            return res.status(500).json({ status: 'Failed', message: 'Failed to update user profile' });
        }

        return res.status(200).json({
            status: 'Success',
            message: 'User profile updated successfully',
            data: {
                user_id: userIdInt,
                name,
                phone,
                status: Boolean(status)
            }
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

    if (!type || !capacity || !Array.isArray(plans) || plans.length === 0 || !createdby || typeof status !== 'boolean') {
        return res.status(400).json({
            status: 'Failed',
            message: 'All fields (type, capacity, plans[], createdby, status) are required'
        });
    }

    try {
        const db = await database.connectToDatabase();
        const collection = db.collection("subscriptionplans");

        // Get next subscriptionplans_id
        const lastPlanDoc = await collection.find().sort({ subscriptionplans_id: -1 }).limit(1).toArray();
        const nextSubscriptionPlanId = lastPlanDoc.length > 0 ? lastPlanDoc[0].subscriptionplans_id + 1 : 1;

        // Get next plans_id globally
        const lastPlanId = await collection.aggregate([
            { $unwind: "$plans" },
            { $project: { plans_id: "$plans.plans_id" } },
            { $sort: { plans_id: -1 } },
            { $limit: 1 }
        ]).toArray();

        let nextPlansId = lastPlanId.length > 0 ? lastPlanId[0].plans_id + 1 : 1;

        // Add plans_id to each plan
        const updatedPlans = plans.map(plan => ({
            ...plan,
            plans_id: nextPlansId++
        }));

        const now = new Date();

        const newPlanDoc = {
            subscriptionplans_id: nextSubscriptionPlanId,
            type,
            capacity,
            plans: updatedPlans,
            createdby,
            createdDate: now,
            modifiedDate: now,
            modified_by: createdby,
            status
        };

        await collection.insertOne(newPlanDoc);

        return res.status(200).json({
            status: 'Success',
            message: 'Subscription plan added successfully',
            data: newPlanDoc
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
    const { subscriptionplans_id, type, capacity, plans, status, modified_by } = req.body;

    // Validate input
    if (
        typeof subscriptionplans_id !== 'number' ||
        !type || !capacity ||
        !Array.isArray(plans) || plans.length === 0 ||
        typeof status !== 'boolean' ||
        !modified_by
    ) {
        return res.status(400).json({
            status: 'Failed',
            message: 'Fields (subscriptionplans_id, type, capacity, plans[], status, modified_by) are required'
        });
    }

    try {
        const db = await database.connectToDatabase();
        const collection = db.collection("subscriptionplans");

        // Check if subscriptionplans_id exists
        const existingDoc = await collection.findOne({ subscriptionplans_id });
        if (!existingDoc) {
            return res.status(404).json({
                status: 'Failed',
                message: `Subscription plan with ID ${subscriptionplans_id} not found`
            });
        }

        // Get highest existing plans_id globally
        const lastPlanIdDoc = await collection.aggregate([
            { $unwind: "$plans" },
            { $project: { plans_id: "$plans.plans_id" } },
            { $sort: { plans_id: -1 } },
            { $limit: 1 }
        ]).toArray();
        let nextPlansId = lastPlanIdDoc.length > 0 ? lastPlanIdDoc[0].plans_id + 1 : 1;

        // Re-assign new plans_id to each plan
        const updatedPlans = plans.map(plan => ({
            ...plan,
            plans_id: nextPlansId++
        }));

        // Update the document
        const result = await collection.updateOne(
            { subscriptionplans_id },
            {
                $set: {
                    type,
                    capacity,
                    plans: updatedPlans,
                    status,
                    modified_by,
                    modifiedDate: new Date()
                }
            }
        );

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

// AddProductPlans controller
const AddProductPlans = async (req, res) => {
    try {
        const products = Array.isArray(req.body) ? req.body : JSON.parse(req.body.data || '[]');

        if (!Array.isArray(products) || products.length === 0) {
            return res.status(400).json({ status: 'Failed', message: 'Invalid or empty product data' });
        }

        const db = await database.connectToDatabase();
        const collection = db.collection("productplans");

        const now = new Date();

        const docsToInsert = [];

        // Get last productId globally once, to avoid multiple queries in loop
        const lastProduct = await collection.find().sort({ productId: -1 }).limit(1).toArray();
        let nextProductId = lastProduct.length > 0 ? lastProduct[0].productId + 1 : 1;

        for (const product of products) {
            const {
                product_name,
                main_img = "",
                sub_img_1 = "",
                sub_img_2 = "",
                sub_img_3 = "",
                sub_img_4 = "",
                product_details,
                product_specifications = "",
                plans,
                duration,
                createdby,
                status
            } = product;

            if (!product_name || !plans || !duration || !createdby || typeof status !== 'boolean') {
                return res.status(400).json({ status: 'Failed', message: 'Missing required fields in product' });
            }

            // plans_id and duration_id start at 1 for each product
            const updatedPlans = plans.map((p, i) => ({ ...p, plans_id: i + 1 }));
            const updatedDuration = duration.map((d, i) => ({ ...d, duration_id: i + 1 }));

            docsToInsert.push({
                productId: nextProductId++,
                product_name,
                main_img,
                sub_img_1,
                sub_img_2,
                sub_img_3,
                sub_img_4,
                product_details,
                product_specifications,
                plans: updatedPlans,
                duration: updatedDuration,
                createdby,
                createddate: now,
                status
            });
        }

        await collection.insertMany(docsToInsert);

        res.status(200).json({
            status: 'Success',
            message: 'Product plan(s) added successfully',
            data: docsToInsert
        });

    } catch (err) {
        console.error("Error in AddProductPlans:", err);
        res.status(500).json({ status: 'Failed', message: 'Internal Server Error' });
    }
};
  
// FetchProductPlans
const FetchProductPlans = async (req, res) => {
    try {
        const db = await database.connectToDatabase();
        const collection = db.collection("productplans");

        const plans = await collection.find().toArray();

        return res.status(200).json({ status: 'Success', data: plans });

    } catch (error) {
        console.error("Error in productplans:", error);
        logger?.error?.(error);
        return res.status(500).json({ status: 'Failed', message: 'Internal Server Error' });
    }
};

// UpdateProductPlans
const UpdateProductPlans = async (req, res) => {
    try {
        const products = Array.isArray(req.body) ? req.body : JSON.parse(req.body.data || '[]');

        if (!Array.isArray(products) || products.length === 0) {
            return res.status(400).json({ status: 'Failed', message: 'Invalid or empty product data' });
        }

        const db = await database.connectToDatabase();
        const collection = db.collection("productplans");

        for (const product of products) {
            const {
                productId,
                product_name,
                main_img = "",
                sub_img_1 = "",
                sub_img_2 = "",
                sub_img_3 = "",
                sub_img_4 = "",
                product_details,
                product_specifications = "",
                plans,
                duration,
                modifiedby,
                status
            } = product;

            if (
                !productId ||
                !product_name ||
                !plans || !Array.isArray(plans) || plans.length === 0 ||
                !duration || !Array.isArray(duration) || duration.length === 0 ||
                !modifiedby ||
                typeof status !== 'boolean'
            ) {
                return res.status(400).json({ status: 'Failed', message: 'Missing or invalid required fields in product' });
            }

            // Check if productId exists
            const existingProduct = await collection.findOne({ productId });
            if (!existingProduct) {
                return res.status(404).json({
                    status: 'Failed',
                    message: `Product with productId ${productId} not found`
                });
            }

            // Get highest existing plans_id globally (among all documents)
            const lastPlanIdDoc = await collection.aggregate([
                { $unwind: "$plans" },
                { $project: { plans_id: "$plans.plans_id" } },
                { $sort: { plans_id: -1 } },
                { $limit: 1 }
            ]).toArray();
            let nextPlansId = lastPlanIdDoc.length > 0 ? lastPlanIdDoc[0].plans_id + 1 : 1;

            // For plans: keep existing plans_id if present, else assign new
            const updatedPlans = plans.map(p => {
                if (p.plans_id && Number.isInteger(p.plans_id)) {
                    return p; // keep existing plans_id
                } else {
                    return { ...p, plans_id: nextPlansId++ }; // assign new plans_id
                }
            });

            // Get highest existing duration_id globally
            const lastDurationIdDoc = await collection.aggregate([
                { $unwind: "$duration" },
                { $project: { duration_id: "$duration.duration_id" } },
                { $sort: { duration_id: -1 } },
                { $limit: 1 }
            ]).toArray();
            let nextDurationId = lastDurationIdDoc.length > 0 ? lastDurationIdDoc[0].duration_id + 1 : 1;

            // For durations: keep existing duration_id if present, else assign new
            const updatedDuration = duration.map(d => {
                if (d.duration_id && Number.isInteger(d.duration_id)) {
                    return d; // keep existing duration_id
                } else {
                    return { ...d, duration_id: nextDurationId++ }; // assign new duration_id
                }
            });

            // Update the product document
            const now = new Date();
            await collection.updateOne(
                { productId },
                {
                    $set: {
                        product_name,
                        main_img,
                        sub_img_1,
                        sub_img_2,
                        sub_img_3,
                        sub_img_4,
                        product_details,
                        product_specifications,
                        plans: updatedPlans,
                        duration: updatedDuration,
                        modifiedby,
                        modifieddate: now,
                        status
                    }
                }
            );
        }

        res.status(200).json({
            status: 'Success',
            message: 'Product plan(s) updated successfully'
        });

    } catch (error) {
        console.error("Error in UpdateProductPlans:", error);
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
    const { order_id, delivaryStatus, modified_by } = req.body;

    // Validate input
    if (typeof order_id !== 'number' || !delivaryStatus || !modified_by) {
        return res.status(400).json({
            status: 'Failed',
            message: 'All fields (order_id, delivaryStatus, modified_by) are required'
        });
    }

    try {
        const db = await database.connectToDatabase();
        const collection = db.collection("orders");

        const result = await collection.updateOne(
            { order_id: order_id }, // Use order_id instead of _id
            {
                $set: {
                    delivaryStatus,
                    modified_by,
                    modifiedDate: new Date()
                }
            }
        );

        if (result.matchedCount === 0) {
            return res.status(404).json({
                status: 'Failed',
                message: `Order with order_id ${order_id} not found`
            });
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

// 7.Manage Models

module.exports = {
    authenticate, FetchAdminProfile, UpdateAdminProfile, AddSubscriptionPlans, FetchSubscriptionPlans, UpdateSubscriptionPlans, FetchCallRequest, FetchContact,
    FetchOrders, UpdateOrdersStatus,
    AddProductPlans, FetchProductPlans, UpdateProductPlans,
};
