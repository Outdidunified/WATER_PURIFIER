const database = require('../../../config/db');
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'default_secret_key';
const { ObjectId } = require("mongodb");
const logger = require('../../../middlewares/requestLogger');
const multerImg = require('../middlewares/imgMiddleware');
const nodemailer = require('nodemailer');

// Email transporter setup
const transporter = nodemailer.createTransport({
    host: 'smtppro.zoho.in', // SMTP server address
    port: 465, // Use 465 for SSL, 587 for TLS
    secure: true, // Use SSL (true) or TLS (false)
    auth: {
        user: 'kesavan@outdidtech.com', // Your email address
        pass: 'qShPZ1czL5Gm', // Your email password
    },
});

async function sendEmail(to, subject, text, html) {
    try {
        const info = await transporter.sendMail({
            from: `IonHive Water Purifier <kesavan@outdidtech.com>`,
            to,
            subject,
            text,
            html,
        });
        console.log('Message sent: %s', info.messageId);
        return true;
    } catch (error) {
        console.error('Error sending email:', error);
        return false;
    }
}

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

// 3.Product Models
// AddProductModels controller
const AddProductModels = async (req, res) => {
    try {
        // Helper function to safely parse array input
        const parseArray = (input) => {
            if (Array.isArray(input)) return input;
            if (typeof input === 'string') {
                try {
                    return JSON.parse(input);
                } catch (err) {
                    console.error("Failed to parse stringified array:", err);
                    return [];
                }
            }
            return [];
        };

        let productModels;

        // Accept either JSON object or JSON stringified in `data`
        if (typeof req.body === 'object' && !Array.isArray(req.body)) {
            productModels = [req.body]; // Wrap single object as array
        } else if (typeof req.body.data === 'string') {
            const parsed = JSON.parse(req.body.data);
            productModels = Array.isArray(parsed) ? parsed : [parsed];
        } else {
            return res.status(400).json({ status: 'Failed', message: 'Invalid or empty product data' });
        }

        const db = await database.connectToDatabase();
        const collection = db.collection("product_models");

        const now = new Date();

        // Get the last model_id
        const lastProductModel = await collection.find().sort({ model_id: -1 }).limit(1).toArray();
        let nextmodel_id = lastProductModel.length > 0 ? lastProductModel[0].model_id + 1 : 1;

        const uploadedFiles = req.files || {};
        const docsToInsert = [];

        for (let i = 0; i < productModels.length; i++) {
            const product = productModels[i];

            const {
                model_name,
                wp_device_quantity,
                product_details,
                createdby
            } = product;

            const plans = parseArray(product.plans);
            const duration = parseArray(product.duration);

            if (!model_name || !plans.length || !duration.length || !createdby) {
                return res.status(400).json({ status: 'Failed', message: 'Missing required fields in product' });
            }

            const model_id = nextmodel_id++;

            // Uploaded files by field name
            const main_img = uploadedFiles['main_img']?.[0]?.filename || product.main_img || "";
            const sub_img_1 = uploadedFiles['sub_img_1']?.[0]?.filename || product.sub_img_1 || "";
            const sub_img_2 = uploadedFiles['sub_img_2']?.[0]?.filename || product.sub_img_2 || "";
            const sub_img_3 = uploadedFiles['sub_img_3']?.[0]?.filename || product.sub_img_3 || "";
            const sub_img_4 = uploadedFiles['sub_img_4']?.[0]?.filename || product.sub_img_4 || "";
            const product_specifications = uploadedFiles['spec_pdf']?.[0]?.filename || product.product_specifications || "";

            docsToInsert.push({
                model_id,
                model_name,
                main_img,
                sub_img_1,
                sub_img_2,
                sub_img_3,
                sub_img_4,
                product_specifications,
                wp_device_quantity,
                product_details,
                plans: plans.map((p, idx) => ({ ...p, plans_id: idx + 1 })),
                duration: duration.map((d, idx) => ({ ...d, duration_id: idx + 1 })),
                createdby,
                createddate: now,
                status: true
            });
        }

        await collection.insertMany(docsToInsert);

        res.status(200).json({
            status: 'Success',
            message: 'Product Model(s) added successfully',
            data: docsToInsert
        });

    } catch (err) {
        console.error("Error in AddProductModels:", err);
        res.status(500).json({ status: 'Failed', message: 'Internal Server Error' });
    }
};

// FetchProductModels
const FetchProductModels = async (req, res) => {
    try {
        const db = await database.connectToDatabase();
        const collection = db.collection("product_models");

        const plans = await collection.find().toArray();

        return res.status(200).json({ status: 'Success', data: plans });

    } catch (error) {
        console.error("Error in productModels:", error);
        logger?.error?.(error);
        return res.status(500).json({ status: 'Failed', message: 'Internal Server Error' });
    }
};

// UpdateProductModels
const UpdateProductModels = async (req, res) => {
    try {
        // Helper to parse input that may be a stringified JSON array
        const parseArray = (input) => {
            if (Array.isArray(input)) return input;
            if (typeof input === 'string') {
                try {
                    return JSON.parse(input);
                } catch (err) {
                    console.error("Failed to parse stringified array:", err);
                    return [];
                }
            }
            return [];
        };

        // Support both single object and array input
        let productModels;

        if (typeof req.body === 'object' && !Array.isArray(req.body)) {
            productModels = [req.body]; // wrap single object
        } else if (typeof req.body.data === 'string') {
            const parsed = JSON.parse(req.body.data);
            productModels = Array.isArray(parsed) ? parsed : [parsed];
        } else {
            return res.status(400).json({ status: 'Failed', message: 'Invalid or empty product data' });
        }

        const db = await database.connectToDatabase();
        const collection = db.collection('product_models');

        for (const product of productModels) {
            let {
                model_id,
                model_name,
                wp_device_quantity,
                product_details,
                modifiedby,
                status: rawStatus
            } = product;

            // ✅ Convert model_id to number
            model_id = Number(model_id);

            if (isNaN(model_id)) {
                return res.status(400).json({ status: 'Failed', message: 'Invalid model_id format' });
            }

            // Convert status from string to boolean if needed
            let status;
            if (typeof rawStatus === 'boolean') {
                status = rawStatus;
            } else if (typeof rawStatus === 'string') {
                status = rawStatus.toLowerCase() === 'true';
            } else {
                status = false; // fallback
            }

            const plans = parseArray(product.plans);
            const duration = parseArray(product.duration);

            // Validation
            if (
                !model_id || !model_name || !plans.length || !duration.length || !modifiedby || typeof status !== 'boolean'
            ) {
                return res.status(400).json({ status: 'Failed', message: 'Missing or invalid required fields in product' });
            }

            // Extract uploaded file names or fallback to existing
            const main_img = req.files?.['main_img']?.[0]?.filename || product.main_img || '';
            const sub_img_1 = req.files?.['sub_img_1']?.[0]?.filename || product.sub_img_1 || '';
            const sub_img_2 = req.files?.['sub_img_2']?.[0]?.filename || product.sub_img_2 || '';
            const sub_img_3 = req.files?.['sub_img_3']?.[0]?.filename || product.sub_img_3 || '';
            const sub_img_4 = req.files?.['sub_img_4']?.[0]?.filename || product.sub_img_4 || '';
            const product_specifications = req.files?.['spec_pdf']?.[0]?.filename || product.product_specifications || '';

            // Plan ID assignment
            const lastPlanIdDoc = await collection.aggregate([
                { $unwind: '$plans' },
                { $sort: { 'plans.plans_id': -1 } },
                { $limit: 1 },
                { $project: { _id: 0, plans_id: '$plans.plans_id' } }
            ]).toArray();
            let nextPlansId = lastPlanIdDoc.length > 0 ? lastPlanIdDoc[0].plans_id + 1 : 1;

            const updatedPlans = plans.map(p =>
                p.plans_id && Number.isInteger(p.plans_id) ? p : { ...p, plans_id: nextPlansId++ }
            );

            // Duration ID assignment
            const lastDurationIdDoc = await collection.aggregate([
                { $unwind: '$duration' },
                { $sort: { 'duration.duration_id': -1 } },
                { $limit: 1 },
                { $project: { _id: 0, duration_id: '$duration.duration_id' } }
            ]).toArray();
            let nextDurationId = lastDurationIdDoc.length > 0 ? lastDurationIdDoc[0].duration_id + 1 : 1;

            const updatedDuration = duration.map(d =>
                d.duration_id && Number.isInteger(d.duration_id) ? d : { ...d, duration_id: nextDurationId++ }
            );

            const now = new Date();

            // ✅ Update with correct model_id type
            const result = await collection.updateOne(
                { model_id: model_id },
                {
                    $set: {
                        model_name,
                        main_img,
                        sub_img_1,
                        sub_img_2,
                        sub_img_3,
                        sub_img_4,
                        wp_device_quantity,
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

            if (result.matchedCount === 0) {
                console.warn(`No document matched for model_id: ${model_id}`);
            }
        }

        res.status(200).json({ status: 'Success', message: 'Product Model(s) updated successfully' });

    } catch (error) {
        console.error('Error in UpdateProductModels:', error);
        res.status(500).json({ status: 'Failed', message: 'Internal Server Error' });
    }
};



// const UpdateProductModels = async (req, res) => {
//     try {
//         // Support both single object and array input
//         let productModels;

//         if (typeof req.body === 'object' && !Array.isArray(req.body)) {
//             productModels = [req.body]; // wrap single object
//         } else if (typeof req.body.data === 'string') {
//             const parsed = JSON.parse(req.body.data);
//             productModels = Array.isArray(parsed) ? parsed : [parsed];
//         } else {
//             return res.status(400).json({ status: 'Failed', message: 'Invalid or empty product data' });
//         }

//         const db = await database.connectToDatabase();
//         const collection = db.collection('product_models');

//         for (const product of productModels) {
//             const {
//                 model_id,
//                 model_name,
//                 wp_device_quantity,
//                 product_details,
//                 plans,
//                 duration,
//                 modifiedby,
//                 status
//             } = product;

//             if (
//                 !model_id ||
//                 !model_name ||
//                 !plans || !Array.isArray(plans) || plans.length === 0 ||
//                 !duration || !Array.isArray(duration) || duration.length === 0 ||
//                 !modifiedby ||
//                 typeof status !== 'boolean'
//             ) {
//                 return res.status(400).json({ status: 'Failed', message: 'Missing or invalid required fields in product' });
//             }

//             // Extract uploaded file names or fallback to existing
//             const main_img = req.files?.['main_img']?.[0]?.filename || product.main_img || '';
//             const sub_img_1 = req.files?.['sub_img_1']?.[0]?.filename || product.sub_img_1 || '';
//             const sub_img_2 = req.files?.['sub_img_2']?.[0]?.filename || product.sub_img_2 || '';
//             const sub_img_3 = req.files?.['sub_img_3']?.[0]?.filename || product.sub_img_3 || '';
//             const sub_img_4 = req.files?.['sub_img_4']?.[0]?.filename || product.sub_img_4 || '';
//             const product_specifications = req.files?.['product_specifications']?.[0]?.filename || product.product_specifications || '';

//             // Plan ID assignment
//             const lastPlanIdDoc = await collection.aggregate([
//                 { $unwind: '$plans' },
//                 { $sort: { 'plans.plans_id': -1 } },
//                 { $limit: 1 },
//                 { $project: { _id: 0, plans_id: '$plans.plans_id' } }
//             ]).toArray();
//             let nextPlansId = lastPlanIdDoc.length > 0 ? lastPlanIdDoc[0].plans_id + 1 : 1;

//             const updatedPlans = plans.map(p =>
//                 p.plans_id && Number.isInteger(p.plans_id) ? p : { ...p, plans_id: nextPlansId++ }
//             );

//             // Duration ID assignment
//             const lastDurationIdDoc = await collection.aggregate([
//                 { $unwind: '$duration' },
//                 { $sort: { 'duration.duration_id': -1 } },
//                 { $limit: 1 },
//                 { $project: { _id: 0, duration_id: '$duration.duration_id' } }
//             ]).toArray();
//             let nextDurationId = lastDurationIdDoc.length > 0 ? lastDurationIdDoc[0].duration_id + 1 : 1;

//             const updatedDuration = duration.map(d =>
//                 d.duration_id && Number.isInteger(d.duration_id) ? d : { ...d, duration_id: nextDurationId++ }
//             );

//             const now = new Date();

//             await collection.updateOne(
//                 { model_id },
//                 {
//                     $set: {
//                         model_name,
//                         main_img,
//                         sub_img_1,
//                         sub_img_2,
//                         sub_img_3,
//                         sub_img_4,
//                         wp_device_quantity,
//                         product_details,
//                         product_specifications,
//                         plans: updatedPlans,
//                         duration: updatedDuration,
//                         modifiedby,
//                         modifieddate: now,
//                         status
//                     }
//                 }
//             );
//         }

//         res.status(200).json({ status: 'Success', message: 'Product Model(s) updated successfully' });

//     } catch (error) {
//         console.error('Error in UpdateProductModels:', error);
//         res.status(500).json({ status: 'Failed', message: 'Internal Server Error' });
//     }
// };
  
// 4. Device Details
// AddDeviceDetails controller
const AddDeviceDetails = async (req, res) => {
    try {
        const deviceData = Array.isArray(req.body) ? req.body : [req.body];

        if (!deviceData.length || !deviceData[0].wp_device_id) {
            return res.status(400).json({
                status: 'Failed',
                message: 'Invalid or empty device data'
            });
        }

        const db = await database.connectToDatabase();
        const deviceCollection = db.collection("device_details");
        const modelCollection = db.collection("product_models");

        const docsToInsert = [];

        for (const device of deviceData) {
            // Check if device ID already exists
            const existingDevice = await deviceCollection.findOne({ wp_device_id: device.wp_device_id });
            if (existingDevice) {
                return res.status(400).json({
                    success: false,
                    message: `Device ID '${device.wp_device_id}' already exists. Please use a unique wp_device_id.`,
                });
            }

            // Check if model_id exists and has wp_device_quantity > 0
            const model = await modelCollection.findOne({ model_id: device.model_id });
            if (!model) {
                return res.status(400).json({
                    status: 'Failed',
                    message: `Model ID '${device.model_id}' does not exist.`
                });
            }

            if (model.wp_device_quantity < 1) {
                return res.status(400).json({
                    status: 'Failed',
                    message: `Model ID '${device.model_id}' has no available quantity (wp_device_quantity < 1).`
                });
            }

            const now = new Date();
            docsToInsert.push({
                ...device,
                createddate: now,
                model_assigned_date: now,
                status: true
            });

            // Decrease wp_device_quantity by 1
            await modelCollection.updateOne(
                { model_id: device.model_id },
                { $inc: { wp_device_quantity: -1 } }
            );
        }

        // Insert all new devices
        await deviceCollection.insertMany(docsToInsert);

        res.status(200).json({
            status: 'Success',
            message: 'Device Detail(s) added successfully',
            data: docsToInsert
        });

    } catch (err) {
        console.error("Error in AddDeviceDetails:", err);
        res.status(500).json({
            status: 'Failed',
            message: 'Internal Server Error'
        });
    }
};

// FetchDeviceDetails
const FetchDeviceDetails = async (req, res) => {
    try {
        const db = await database.connectToDatabase();
        const collection = db.collection("device_details");

        const deviceDetails = await collection.find().toArray();

        return res.status(200).json({ status: 'Success', data: deviceDetails });

    } catch (error) {
        console.error("Error in FetchDeviceDetails:", error);
        logger?.error?.(error);
        return res.status(500).json({ status: 'Failed', message: 'Internal Server Error' });
    }
};

// UpdateDeviceDetails
const UpdateDeviceDetails = async (req, res) => {
    try {
        const { wp_device_id, modifiedby, model_assigned_by, model_id, model_name, status } = req.body;

        if (!wp_device_id) {
            return res.status(400).json({
                status: 'Failed',
                message: 'wp_device_id is required for update'
            });
        }

        const db = await database.connectToDatabase();
        const collection = db.collection("device_details");

        // Check if device exists
        const existingDevice = await collection.findOne({ wp_device_id });

        if (!existingDevice) {
            return res.status(404).json({
                status: 'Failed',
                message: `Device with ID '${wp_device_id}' does not exist`
            });
        }

        const updatedData = {
            modifiedby,
            model_assigned_by,
            model_id,
            model_name,
            status,
            modifieddate: new Date()
        };

        // Remove undefined fields
        Object.keys(updatedData).forEach(key => {
            if (updatedData[key] === undefined) {
                delete updatedData[key];
            }
        });

        const result = await collection.updateOne(
            { wp_device_id },
            { $set: updatedData }
        );

        res.status(200).json({
            status: 'Success',
            message: `Device '${wp_device_id}' updated successfully`,
            data: updatedData
        });

    } catch (err) {
        console.error("Error in UpdateDeviceDetails:", err);
        res.status(500).json({
            status: 'Failed',
            message: 'Internal Server Error'
        });
    }
};

// 5.Call Request
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

// 6.Contact
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

// 7. Manage Orders
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

// 8.Manage Roles
// AddUserRoles controller
const AddUserRoles = async (req, res) => {
    try {
        console.log(req.body);
        const userRoles = Array.isArray(req.body) ? req.body : [req.body];

        if (!userRoles.length || !userRoles[0].role_id || !userRoles[0].role_name) {
            return res.status(400).json({
                status: 'Failed',
                message: 'Invalid or empty role data'
            });
        }

        const db = await database.connectToDatabase();
        const collection = db.collection("user_roles");

        const docsToInsert = [];

        for (const role of userRoles) {
            const { role_id, role_name } = role;

            // Check for duplicate role_id and role_name
            const existingRole = await collection.findOne({ role_id, role_name });

            if (existingRole) {
                return res.status(400).json({
                    success: false,
                    message: `Role ID '${role_id}' and Role Name '${role_name}' already exist. Please use unique values.`,
                });
            }

            const now = new Date();

            docsToInsert.push({
                ...role,
                created_date: now,
                status: true
            });
        }

        await collection.insertMany(docsToInsert);

        res.status(200).json({
            status: 'Success',
            message: 'User Role(s) added successfully',
            data: docsToInsert
        });

    } catch (err) {
        console.error("Error in AddUserRoles:", err);
        res.status(500).json({
            status: 'Failed',
            message: 'Internal Server Error'
        });
    }
};

// FetchUserRoles
const FetchUserRoles = async (req, res) => {
    try {
        const db = await database.connectToDatabase();
        const collection = db.collection("user_roles");

        const userRoles = await collection.find().toArray();

        return res.status(200).json({ status: 'Success', data: userRoles });

    } catch (error) {
        console.error("Error in FetchUserRoles:", error);
        logger?.error?.(error);
        return res.status(500).json({ status: 'Failed', message: 'Internal Server Error' });
    }
};

// UpdateUserRoles
const UpdateUserRoles = async (req, res) => {
    try {
        const { role_id, role_name, modified_by, status } = req.body;

        if (!role_id || !role_name) {
            return res.status(400).json({
                status: 'Failed',
                message: 'role_id and role_name are required for update'
            });
        }

        const db = await database.connectToDatabase();
        const collection = db.collection("user_roles");

        // Check if the role exists
        const existingRole = await collection.findOne({ role_id, role_name });

        if (!existingRole) {
            return res.status(404).json({
                status: 'Failed',
                message: `Role with ID '${role_id}' and name '${role_name}' does not exist`
            });
        }

        const updatedData = {
            modified_by,
            status,
            modified_date: new Date()
        };

        // Remove undefined fields
        Object.keys(updatedData).forEach(key => {
            if (updatedData[key] === undefined) {
                delete updatedData[key];
            }
        });

        const result = await collection.updateOne(
            { role_id, role_name },
            { $set: updatedData }
        );

        res.status(200).json({
            status: 'Success',
            message: 'User role updated successfully',
            data: updatedData
        });

    } catch (err) {
        console.error("Error in UpdateUserRoles:", err);
        res.status(500).json({
            status: 'Failed',
            message: 'Internal Server Error'
        });
    }
};

// 9.Manage User
// AddUsers controller
const AddUsers = async (req, res) => {
    try {
        const users = Array.isArray(req.body) ? req.body : [req.body];

        if (!users.length || !users[0].role_id || !users[0].email) {
            return res.status(400).json({
                status: 'Failed',
                message: 'Invalid or empty user data',
            });
        }

        const db = await database.connectToDatabase();
        const collection = db.collection("users");

        const docsToInsert = [];

        // Get the highest current user_id
        const lastUser = await collection.find().sort({ user_id: -1 }).limit(1).toArray();
        let nextUserId = lastUser.length > 0 ? lastUser[0].user_id + 1 : 1;

        // For generating technician_id
        const getNextTechnicianId = async () => {
            const lastTech = await collection
                .find({ technician_id: { $exists: true } })
                .sort({ technician_id: -1 })
                .limit(1)
                .toArray();

            if (lastTech.length > 0 && lastTech[0].technician_id) {
                const lastId = parseInt(lastTech[0].technician_id.replace('EMP', ''));
                return `EMP${(lastId + 1).toString().padStart(3, '0')}`;
            } else {
                return 'EMP001';
            }
        };

        for (const user of users) {
            const { role_id, email } = user;

            // Check for duplicate email for the same role
            const existingUser = await collection.findOne({ role_id, email });
            if (existingUser) {
                return res.status(400).json({
                    status: 'Failed',
                    message: `This email is already used under this user role. Use a different email or user role.`,
                });
            }

            const now = new Date();

            const newUser = {
                ...user,
                user_id: nextUserId++,
                createdDate: now,
                status: true,
            };

            // Assign technician_id if role_id == 2
            if (role_id === 2) {
                newUser.technician_id = await getNextTechnicianId();
            }

            docsToInsert.push(newUser);
        }

        await collection.insertMany(docsToInsert);

        return res.status(200).json({
            status: 'Success',
            message: 'User(s) added successfully',
            data: docsToInsert,
        });
    } catch (err) {
        console.error("Error in AddUsers:", err);
        return res.status(500).json({
            status: 'Failed',
            message: 'Internal Server Error',
        });
    }
};

// FetchUsers
const FetchUsers = async (req, res) => {
    try {
        const db = await database.connectToDatabase();
        const collection = db.collection("users");

        const users = await collection.find().toArray();

        return res.status(200).json({ status: 'Success', data: users });

    } catch (error) {
        console.error("Error in FetchUsers:", error);
        logger?.error?.(error);
        return res.status(500).json({ status: 'Failed', message: 'Internal Server Error' });
    }
};

// UpdateUsers
const UpdateUsers = async (req, res) => {
    try {
        const { role_id, user_id, name, email, password, phone, city, modifiedBy, status } = req.body;

        if (!role_id || !user_id) {
            return res.status(400).json({
                status: 'Failed',
                message: 'role_id and user_id are required for update'
            });
        }

        const db = await database.connectToDatabase();
        const collection = db.collection("users");

        // Check if the user exists with given role_id and user_id
        const existingUser = await collection.findOne({ role_id, user_id });

        if (!existingUser) {
            return res.status(404).json({
                status: 'Failed',
                message: `User with role_id '${role_id}' and user_id '${user_id}' does not exist`
            });
        }

        const updatedData = {
            name,
            password,
            phone,
            city,
            modifiedBy,
            status,
            modifiedDate: new Date()
        };

        // Remove any undefined fields
        Object.keys(updatedData).forEach(key => {
            if (updatedData[key] === undefined) {
                delete updatedData[key];
            }
        });

        const result = await collection.updateOne(
            { role_id, user_id },
            { $set: updatedData }
        );

        res.status(200).json({
            status: 'Success',
            message: 'User updated successfully',
            data: updatedData
        });

    } catch (err) {
        console.error("Error in UpdateUsers:", err);
        res.status(500).json({
            status: 'Failed',
            message: 'Internal Server Error'
        });
    }
};

//10.InstallationService, 
// FetchInstallationService
const FetchInstallationService = async (req, res) => {
    try {
        const db = await database.connectToDatabase();
        const usersCollection = db.collection("users");

        const technicians = await usersCollection.aggregate([
            { $match: { role_id: 2 } },

            // Lookup technician_details (single object or null)
            {
                $lookup: {
                    from: "technician_details",
                    localField: "technician_id",
                    foreignField: "technician_id",
                    as: "technician_details"
                }
            },
            {
                $addFields: {
                    technician_details: {
                        $cond: [
                            { $gt: [{ $size: "$technician_details" }, 0] },
                            { $arrayElemAt: ["$technician_details", 0] },
                            null
                        ]
                    }
                }
            },

            // Lookup service_records (array)
            {
                $lookup: {
                    from: "service_records",
                    localField: "technician_id",
                    foreignField: "assigned_technician_id",
                    as: "service_records"
                }
            },

            // Convert empty service_records arrays to null
            {
                $addFields: {
                    service_records: {
                        $cond: [
                            { $gt: [{ $size: "$service_records" }, 0] },
                            "$service_records",
                            null
                        ]
                    }
                }
            }

        ]).toArray();

        return res.status(200).json({
            status: "Success",
            message: "Technician users fetched successfully",
            data: technicians
        });

    } catch (error) {
        console.error("Error in FetchInstallationService:", error);
        return res.status(500).json({
            status: "Failed",
            message: "Internal Server Error"
        });
    }
};

// FetchSelectUserOrders
const FetchSelectUserOrders = async (req, res) => {
    try {
        const db = await database.connectToDatabase();
        const collection = db.collection("orders");

        // Filter orders where installation_status is "Pending"
        const pendingOrders = await collection.find({ installation_status: "Pending" }).toArray();

        return res.status(200).json({
            status: 'Success',
            message: 'Pending installation orders fetched successfully',
            data: pendingOrders
        });

    } catch (error) {
        console.error("Error in FetchSelectUserOrders:", error);
        logger?.error?.(error);
        return res.status(500).json({
            status: 'Failed',
            message: 'Internal Server Error'
        });
    }
};

// Send OTP email
async function sendOrderConfirmationEmail(email, otd) {
    console.log(email, otd)
    try {
        const subject = 'Installation OTP - IonHive Water Purifier';
        const text = `Hi IonHive water purifier user,

        Your installation OTP is: ${otd}

        Once your IonHive device is installed by our technician, please share this OTP with them to complete the installation process.

        Thank you for choosing IonHive!`;

        const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border-radius: 10px; background-color: #f9f9f9; border: 1px solid #ddd;">
                <h2 style="color: #333;">Hi IonHive Water Purifier User,</h2>
                <p style="font-size: 16px; color: #555;">
                    Your installation OTP is: <strong style="color: #000;">${otd}</strong>
                </p>
                <p style="font-size: 16px; color: #555;">
                    Once our installation technician completes your setup, they will request this OTP from you to verify successful installation.
                </p>
                <p style="color: #555;">Thank you for choosing <strong>IonHive</strong>!</p>
                <p style="font-size: 14px; color: #888; text-align: center; margin-top: 30px; border-top: 1px solid #ddd; padding-top: 10px;">
                    This is an automated message from IonHive Water Purifier.
                </p>
            </div>
        `;

        await sendEmail(email, subject, text, html);
    } catch (error) {
        console.error('Error in sendOrderConfirmationEmail:', error);
        return false;
    }
}

// AssignInstallation function
const AssignInstallation = async (req, res) => {
    try {
        const db = await database.connectToDatabase();
        const serviceRecords = db.collection("service_records");
        const usersCollection = db.collection("users");
        const technicianDetailsCollection = db.collection("technician_details");

        const {
            technician_role_id,
            technician_user_id,
            technician_id,
            order_user_id,
            customOrderId,
            wp_device_id,
            assigned_by
        } = req.body;

        // Basic validation
        if (
            !technician_role_id ||
            !technician_user_id ||
            !technician_id ||
            !order_user_id ||
            !customOrderId ||
            !wp_device_id ||
            !assigned_by
        ) {
            return res.status(400).json({
                status: 'Failed',
                message: 'Invalid or missing required fields',
            });
        }

        // Check if Installation already assigned for wp_device_id
        const existingInstallation = await serviceRecords.findOne({
            wp_device_id: wp_device_id,
            task_type: 1,
        });

        if (existingInstallation) {
            return res.status(409).json({
                status: 'Failed',
                message: `An Installation task for this wp_device_id (${wp_device_id}) has already been assigned.`,
            });
        }

        // Fetch user info
        const orderUser = await usersCollection.findOne({ user_id: order_user_id });
        if (!orderUser) {
            return res.status(404).json({
                status: 'Failed',
                message: 'User not found for given order_user_id',
            });
        }

        const technicianUser = await usersCollection.findOne({ technician_id });
        if (!technicianUser) {
            return res.status(404).json({
                status: 'Failed',
                message: 'Technician not found for given technician_id',
            });
        }

        // Generate task ID and OTP
        const lastTask = await serviceRecords.find().sort({ task_id: -1 }).limit(1).toArray();
        const nextTaskId = lastTask.length > 0 ? lastTask[0].task_id + 1 : 1;
        const otp = Math.floor(100000 + Math.random() * 900000);
        const now = new Date();

        // Prepare new task
        const newTask = {
            task_id: nextTaskId,
            task_status: "Pending",
            task_type: 1,
            task_description: "Ordered a new device",
            assigned_technician_id: technician_id,
            assigned_date: now,
            task_created_by_user_id: order_user_id,
            task_created_by_user_email: orderUser.email,
            wp_device_id,
            otd: otp,
            created_date: now,
            created_by: assigned_by,
            assigned_by
        };

        // Insert task
        await serviceRecords.insertOne(newTask);

        // Update technician details
        await technicianDetailsCollection.updateOne(
            { user_id: technician_user_id, role_id: technician_role_id, technician_id: technician_id },
            {
                $set: {
                    user_id: technician_user_id,
                    role_id: technician_role_id,
                    email: technicianUser.email,
                    technician_id,
                    status: true
                },
                $inc: { total_assigned_services: 1 }
            },
            { upsert: true }
        );

        // Send OTP email
        await sendOrderConfirmationEmail(orderUser.email, otp);

        // Final response
        return res.status(200).json({
            status: 'Success',
            message: 'Installation task assigned and OTP sent to user',
            data: newTask
        });

    } catch (err) {
        console.error("Error in AssignInstallation:", err);
        return res.status(500).json({
            status: 'Failed',
            message: 'Internal Server Error',
        });
    }
};

// ReAssignInstallation
const ReAssignInstallation = async (req, res) => {
    try {
        const db = await database.connectToDatabase();
        const serviceRecords = db.collection("service_records");

        const { task_id, technician_id, modified_by } = req.body;

        // Basic validation
        if (!task_id || !technician_id || !modified_by) {
            return res.status(400).json({
                status: 'Failed',
                message: 'Invalid or missing required fields',
            });
        }

        // Check if the task exists
        const existingTask = await serviceRecords.findOne({ task_id });

        if (!existingTask) {
            return res.status(404).json({
                status: 'Failed',
                message: `Task with task_id ${task_id} not found.`,
            });
        }

        // Update the record
        const now = new Date();
        const updateResult = await serviceRecords.updateOne(
            { task_id },
            {
                $set: {
                    assigned_technician_id: technician_id,
                    modified_by,
                    modified_date: now
                }
            }
        );

        if (updateResult.modifiedCount === 1) {
            return res.status(200).json({
                status: 'Success',
                message: `Installation task ${task_id} reassigned successfully.`,
            });
        } else {
            return res.status(500).json({
                status: 'Failed',
                message: 'Task update failed. Please try again.',
            });
        }

    } catch (err) {
        console.error("Error in ReAssignInstallation:", err);
        return res.status(500).json({
            status: 'Failed',
            message: 'Internal Server Error',
        });
    }
};

// FetchSelectInstallationTask
const FetchSelectInstallationTask = async (req, res) => {
    try {
        const db = await database.connectToDatabase();
        const collection = db.collection("service_records");

        // Fetch all service_records
        // Filter service_records where task_type is 1 like "Installation"
        const allServices = await collection.find({ task_type: 1 }).toArray();

        return res.status(200).json({
            status: 'Success',
            message: 'All installation records fetched successfully',
            data: allServices
        });

    } catch (error) {
        console.error("Error in FetchSelectInstallationTask:", error);
        logger?.error?.(error); // Optional logger
        return res.status(500).json({
            status: 'Failed',
            message: 'Internal Server Error'
        });
    }
};

// FetchSelectServiceTask
const FetchSelectServiceTask = async (req, res) => {
    try {
        const db = await database.connectToDatabase();
        const collection = db.collection("service_records");

        // Fetch all service_records
        // Filter service_records where task_type is 2 like "Service"
        const allServices = await collection.find({ task_type: 2 }).toArray();

        return res.status(200).json({
            status: 'Success',
            message: 'All service records fetched successfully',
            data: allServices
        });

    } catch (error) {
        console.error("Error in FetchSelectServiceTask:", error);
        logger?.error?.(error); // Optional logger
        return res.status(500).json({
            status: 'Failed',
            message: 'Internal Server Error'
        });
    }
};

module.exports = {
    authenticate, FetchAdminProfile, UpdateAdminProfile, AddProductModels, FetchProductModels, UpdateProductModels, AddDeviceDetails, FetchDeviceDetails,
    UpdateDeviceDetails, FetchCallRequest, FetchContact, FetchOrders, UpdateOrdersStatus, AddUserRoles, FetchUserRoles, UpdateUserRoles,
    AddUsers, FetchUsers, UpdateUsers, FetchInstallationService, FetchSelectUserOrders, AssignInstallation, ReAssignInstallation, FetchSelectInstallationTask,
    FetchSelectServiceTask
};
