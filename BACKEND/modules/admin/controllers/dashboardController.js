const database = require('../../../config/db');
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'default_secret_key';
const { ObjectId } = require("mongodb");
const logger = require('../../../middlewares/requestLogger');
const multerImg = require('../middlewares/imgMiddleware');
const nodemailer = require('nodemailer');
const MODULES = require('./modules.config');
const { normalizeDeliveryAddress } = require('../../../modules/website/models/DeliveryAddress');

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

const getModules = async (req, res) => {
  return res.status(200).json({
    status: "Success",
    message: "Modules fetched successfully",
    data: MODULES,
  });
};

//role based permission
const assignPermissions = async (req, res) => {
  const { role_id, permissions } = req.body;

  if (!role_id || !permissions || !Array.isArray(permissions)) {
    return res.status(400).json({ status: "Failed", message: "role_id and permissions array are required" });
  }

  const db = await database.connectToDatabase();
  const permissionsCollection = db.collection("permissions");

  try {
    const results = [];

    for (const p of permissions) {
      const module = p.module;
      if (!module) continue;

      const existing = await permissionsCollection.findOne({ role_id, module });

      if (existing) {
        await permissionsCollection.updateOne(
          { role_id, module },
          { $set: { ...p, status: p.status !== undefined ? p.status : true } }
        );
        results.push({ action: "updated", permission: { role_id, ...p } });
      } else {
        await permissionsCollection.insertOne({ role_id, ...p, status: p.status !== undefined ? p.status : true });
        results.push({ action: "created", permission: { role_id, ...p } });
      }
    }

    return res.status(200).json({ status: "Success", message: "Permissions assigned/updated successfully", data: results });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ status: "Failed", message: "Internal Server Error" });
  } finally {
    // No manual client closing needed; handled by db module
  }
};

// Fetch permissions by roleIds (like findByRoles)
const fetchPermissionsByRole = async (req, res) => {
  const roleIds = req.query.ids ? req.query.ids.split(",").map(Number) : [];

  if (!roleIds.length) {
    return res.status(400).json({ status: "Failed", message: "roleIds required" });
  }

  const db = await database.connectToDatabase();
  const permissionsCollection = db.collection("permissions");

  try {
    const permissions = await permissionsCollection.find({ role_id: { $in: roleIds } }).toArray();

    // Filter to only include modules defined in MODULES and actions that are true
    const filteredPermissions = permissions.filter(p => {
      const mod = MODULES.find(m => m.module === p.module);
      if (!mod) return false;
      return p.can_create || p.can_view || p.can_update || p.can_delete;
    });

    return res.status(200).json({ status: "Success", message: "Permissions fetched successfully", data: filteredPermissions });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ status: "Failed", message: "Internal Server Error" });
  } finally {
    // No manual client closing needed; handled by db module
  }
};






// 1. Login Controller
const authenticate = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(401).json({ message: 'Email and Password are required' });
        }

        const db = await database.connectToDatabase();
        const usersCollection = db.collection('users');

        // Find user by email, active status, and allowed roles (1 or 4)
        const user = await usersCollection.findOne({
            email,
            status: true,
            role_id: { $in: [1, 4] } // Only allow role_id 1 (admin) or 4 (seller)
        });

        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials, user is deactivated, or role not allowed' });
        }

        // Check password (normalize to string for comparison)
        const inputPassword = password.toString();
        const dbPassword = user.password.toString();
        if (dbPassword !== inputPassword) {
            return res.status(401).json({ message: 'Invalid password' });
        }

        // Generate JWT token
        const token = jwt.sign(
            { userId: user._id, role_id: user.role_id },
            JWT_SECRET,
            { expiresIn: '1d' }
        );

        return res.status(200).json({
            status: 'Success',
            user: {
                _id: user._id,
                user_id: user.user_id,
                role_id: user.role_id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                district: user.district, // include district so frontend can filter seller orders
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
        const { ...sanitizedProfile } = user;

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
                    password: parseInt(password),
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
                password,
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

        // Handle different body formats
        if (typeof req.body === 'object' && !Array.isArray(req.body)) {
            productModels = [req.body];
        } else if (typeof req.body.data === 'string') {
            const parsed = JSON.parse(req.body.data);
            productModels = Array.isArray(parsed) ? parsed : [parsed];
        } else {
            return res.status(400).json({ status: 'Failed', message: 'Invalid or empty product data' });
        }

        const db = await database.connectToDatabase();
        const collection = db.collection("product_models");

        const now = new Date();
        const lastProductModel = await collection.find().sort({ model_id: -1 }).limit(1).toArray();
        let nextmodel_id = lastProductModel.length > 0 ? lastProductModel[0].model_id + 1 : 1;

        const uploadedFiles = req.files || {};
        const docsToInsert = [];

        const lastPlanIdDoc = await collection.aggregate([
            { $unwind: { path: '$duration', preserveNullAndEmptyArrays: true } },
            { $match: { 'duration.duration_id': { $exists: true } } },
            { $unwind: { path: '$duration.plans', preserveNullAndEmptyArrays: true } },
            { $match: { 'duration.plans.plans_id': { $exists: true } } },
            { $sort: { 'duration.plans.plans_id': -1 } },
            { $limit: 1 },
            { $project: { _id: 0, plans_id: '$duration.plans.plans_id' } }
        ]).toArray();
        let nextPlansId = lastPlanIdDoc.length > 0 ? lastPlanIdDoc[0].plans_id + 1 : 1;

        const lastDurationIdDoc = await collection.aggregate([
            { $unwind: { path: '$duration', preserveNullAndEmptyArrays: true } },
            { $match: { 'duration.duration_id': { $exists: true } } },
            { $sort: { 'duration.duration_id': -1 } },
            { $limit: 1 },
            { $project: { _id: 0, duration_id: '$duration.duration_id' } }
        ]).toArray();
        let nextDurationId = lastDurationIdDoc.length > 0 ? lastDurationIdDoc[0].duration_id + 1 : 1;

        for (let i = 0; i < productModels.length; i++) {
            const product = productModels[i];

            const {
                model_name,
                wp_device_quantity,
                product_details,
                connectivity,
                createdby
            } = product;

            const duration = parseArray(product.duration).map(durationItem => ({
                ...durationItem,
                plans: parseArray(durationItem.plans),
            }));

            if (!model_name || !duration.length || duration.some(d => !d.plans || !d.plans.length) || !createdby) {
                return res.status(400).json({ status: 'Failed', message: 'Missing required fields in product or duration without plans' });
            }

            const quantityInt = parseInt(wp_device_quantity);
            if (isNaN(quantityInt)) {
                return res.status(400).json({ status: 'Failed', message: 'wp_device_quantity must be a valid number' });
            }

            // Check for duplicate model name
            const existing = await collection.findOne({ model_name: model_name.trim() });
            if (existing) {
                return res.status(409).json({
                    status: 'Failed',
                    message: `Model name "${model_name}" already exists. Duplicate not allowed.`,
                });
            }

            const model_id = nextmodel_id++;

            const main_img = uploadedFiles['main_img']?.[0]?.filename || product.main_img || "";
            const sub_img_1 = uploadedFiles['sub_img_1']?.[0]?.filename || product.sub_img_1 || "";
            const sub_img_2 = uploadedFiles['sub_img_2']?.[0]?.filename || product.sub_img_2 || "";
            const sub_img_3 = uploadedFiles['sub_img_3']?.[0]?.filename || product.sub_img_3 || "";
            const sub_img_4 = uploadedFiles['sub_img_4']?.[0]?.filename || product.sub_img_4 || "";
            const product_specifications = uploadedFiles['product_specifications']?.[0]?.filename || product.product_specifications || "";

            const updatedDuration = duration.map(durationItem => {
                const normalizedDurationId = Number(durationItem.duration_id);
                const duration_id = Number.isInteger(normalizedDurationId) && normalizedDurationId > 0
                    ? normalizedDurationId
                    : nextDurationId++;

                const plans = (durationItem.plans || []).map(planItem => {
                    const normalizedPlanId = Number(planItem.plans_id);
                    const plans_id = Number.isInteger(normalizedPlanId) && normalizedPlanId > 0
                        ? normalizedPlanId
                        : nextPlansId++;

                    return {
                        ...planItem,
                        plans_id,
                    };
                });

                return {
                    ...durationItem,
                    duration_id,
                    plans,
                };
            });

            docsToInsert.push({
                model_id,
                model_name: model_name.trim(),
                main_img,
                sub_img_1,
                sub_img_2,
                sub_img_3,
                sub_img_4,
                product_specifications,
                wp_device_quantity: quantityInt,
                product_details,
                connectivity: connectivity || '',
                duration: updatedDuration,
                createdby,
                createddate: now,
                status: true
            });
        }

        await collection.insertMany(docsToInsert);

        return res.status(200).json({
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
// const UpdateProductModels = async (req, res) => {
//     try {
//         // Helper to parse input that may be a stringified JSON array
//         const parseArray = (input) => {
//             if (Array.isArray(input)) return input;
//             if (typeof input === 'string') {
//                 try {
//                     return JSON.parse(input);
//                 } catch (err) {
//                     console.error("Failed to parse stringified array:", err);
//                     return [];
//                 }
//             }
//             return [];
//         };

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
//             let {
//                 model_id,
//                 model_name,
//                 wp_device_quantity,
//                 product_details,
//                 modifiedby,
//                 status: rawStatus
//             } = product;

//             model_id = Number(model_id);

//             if (isNaN(model_id)) {
//                 return res.status(400).json({ status: 'Failed', message: 'Invalid model_id format' });
//             }

//             // Convert status from string to boolean if needed
//             let status;
//             if (typeof rawStatus === 'boolean') {
//                 status = rawStatus;
//             } else if (typeof rawStatus === 'string') {
//                 status = rawStatus.toLowerCase() === 'true';
//             } else {
//                 status = false; // fallback
//             }

//             const plans = parseArray(product.plans);
//             const duration = parseArray(product.duration);

//             // Validation
//             if (
//                 !model_id || !model_name || !plans.length || !duration.length || !modifiedby || typeof status !== 'boolean'
//             ) {
//                 return res.status(400).json({ status: 'Failed', message: 'Missing or invalid required fields in product' });
//             }

//             // Extract uploaded file names or fallback to existing
//             const main_img = req.files?.['main_img']?.[0]?.filename || product.main_img || '';
//             const sub_img_1 = req.files?.['sub_img_1']?.[0]?.filename || product.sub_img_1 || '';
//             const sub_img_2 = req.files?.['sub_img_2']?.[0]?.filename || product.sub_img_2 || '';
//             const sub_img_3 = req.files?.['sub_img_3']?.[0]?.filename || product.sub_img_3 || '';
//             const sub_img_4 = req.files?.['sub_img_4']?.[0]?.filename || product.sub_img_4 || '';
//             const product_specifications = req.files?.['spec_pdf']?.[0]?.filename || product.product_specifications || '';

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

//             const result = await collection.updateOne(
//                 { model_id: model_id },
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

//             if (result.matchedCount === 0) {
//                 console.warn(`No document matched for model_id: ${model_id}`);
//             }
//         }

//         res.status(200).json({ status: 'Success', message: 'Product Model(s) updated successfully' });

//     } catch (error) {
//         console.error('Error in UpdateProductModels:', error);
//         res.status(500).json({ status: 'Failed', message: 'Internal Server Error' });
//     }
// };

const UpdateProductModels = async (req, res) => {
    try {
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
        if (typeof req.body === 'object' && !Array.isArray(req.body)) {
            productModels = [req.body];
        } else if (typeof req.body.data === 'string') {
            const parsed = JSON.parse(req.body.data);
            productModels = Array.isArray(parsed) ? parsed : [parsed];
        } else {
            return res.status(400).json({ status: 'Failed', message: 'Invalid or empty product data' });
        }

        const db = await database.connectToDatabase();
        const collection = db.collection('product_models');

        const lastPlanIdDoc = await collection.aggregate([
            { $unwind: { path: '$duration', preserveNullAndEmptyArrays: true } },
            { $match: { 'duration.duration_id': { $exists: true } } },
            { $unwind: { path: '$duration.plans', preserveNullAndEmptyArrays: true } },
            { $match: { 'duration.plans.plans_id': { $exists: true } } },
            { $sort: { 'duration.plans.plans_id': -1 } },
            { $limit: 1 },
            { $project: { _id: 0, plans_id: '$duration.plans.plans_id' } }
        ]).toArray();
        let nextPlansId = lastPlanIdDoc.length > 0 ? lastPlanIdDoc[0].plans_id + 1 : 1;

        const lastDurationIdDoc = await collection.aggregate([
            { $unwind: { path: '$duration', preserveNullAndEmptyArrays: true } },
            { $match: { 'duration.duration_id': { $exists: true } } },
            { $sort: { 'duration.duration_id': -1 } },
            { $limit: 1 },
            { $project: { _id: 0, duration_id: '$duration.duration_id' } }
        ]).toArray();
        let nextDurationId = lastDurationIdDoc.length > 0 ? lastDurationIdDoc[0].duration_id + 1 : 1;

        for (const product of productModels) {
            let {
                model_id,
                model_name,
                wp_device_quantity,
                product_details,
                connectivity,
                modifiedby,
                status: rawStatus
            } = product;

            model_id = Number(model_id);
            if (isNaN(model_id)) {
                return res.status(400).json({ status: 'Failed', message: 'Invalid model_id format' });
            }

            // Validate wp_device_quantity
            const quantityInt = parseInt(wp_device_quantity);
            if (isNaN(quantityInt)) {
                return res.status(400).json({ status: 'Failed', message: 'wp_device_quantity must be a valid number' });
            }

            let status;
            if (typeof rawStatus === 'boolean') {
                status = rawStatus;
            } else if (typeof rawStatus === 'string') {
                status = rawStatus.toLowerCase() === 'true';
            } else {
                status = false;
            }

            const duration = parseArray(product.duration).map(durationItem => ({
                ...durationItem,
                plans: parseArray(durationItem.plans),
            }));

            if (!model_id || !model_name || !duration.length || duration.some(d => !d.plans || !d.plans.length) || !modifiedby || typeof status !== 'boolean') {
                return res.status(400).json({ status: 'Failed', message: 'Missing required fields in product or duration without plans' });
            }

            // Duplicate check excluding current model_id
            const duplicate = await collection.findOne({
                model_name: model_name.trim(),
                model_id: { $ne: model_id }
            });

            if (duplicate) {
                return res.status(409).json({
                    status: 'Failed',
                    message: `Model name "${model_name}" already exists. Duplicate not allowed.`
                });
            }

            const main_img = req.files?.['main_img']?.[0]?.filename || product.main_img || '';
            const sub_img_1 = req.files?.['sub_img_1']?.[0]?.filename || product.sub_img_1 || '';
            const sub_img_2 = req.files?.['sub_img_2']?.[0]?.filename || product.sub_img_2 || '';
            const sub_img_3 = req.files?.['sub_img_3']?.[0]?.filename || product.sub_img_3 || '';
            const sub_img_4 = req.files?.['sub_img_4']?.[0]?.filename || product.sub_img_4 || '';
            const product_specifications = req.files?.['product_specifications']?.[0]?.filename || req.body.existing_product_specifications || '';

            const updatedDuration = duration.map(durationItem => {
                const normalizedDurationId = Number(durationItem.duration_id);
                const duration_id = Number.isInteger(normalizedDurationId) && normalizedDurationId > 0
                    ? normalizedDurationId
                    : nextDurationId++;

                const plans = (durationItem.plans || []).map(planItem => {
                    const normalizedPlanId = Number(planItem.plans_id);
                    const plans_id = Number.isInteger(normalizedPlanId) && normalizedPlanId > 0
                        ? normalizedPlanId
                        : nextPlansId++;

                    return {
                        ...planItem,
                        plans_id,
                    };
                });

                return {
                    ...durationItem,
                    duration_id,
                    plans,
                };
            });

            const now = new Date();

            const result = await collection.updateOne(
                { model_id: model_id },
                {
                    $set: {
                        model_name: model_name.trim(),
                        main_img,
                        sub_img_1,
                        sub_img_2,
                        sub_img_3,
                        sub_img_4,
                        wp_device_quantity: quantityInt,
                        product_details,
                        connectivity: connectivity || '',
                        product_specifications,
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


// 4. Device Details
// AddDeviceDetails controller
const AddDeviceDetails = async (req, res) => {
    try {
        const deviceData = Array.isArray(req.body) ? req.body : [req.body];

        if (!deviceData.length || !deviceData[0].wp_device_id) {
            return res.status(400).json({
                status: 'Failed',
                message: 'Invalid or empty device data',
            });
        }

        const db = await database.connectToDatabase();
        const deviceCollection = db.collection('device_details');
        const modelCollection = db.collection('product_models');

        const docsToInsert = [];

        for (const device of deviceData) {
            // Check if device ID already exists
            const existingDevice = await deviceCollection.findOne({
                wp_device_id: device.wp_device_id,
            });
            if (existingDevice) {
                return res.status(400).json({
                    success: false,
                    message: `Device ID '${device.wp_device_id}' already exists. Please use a unique Device ID.`,
                });
            }

            // Fetch model and validate wp_device_quantity
            const model = await modelCollection.findOne({ model_id: device.model_id });
            if (!model) {
                return res.status(400).json({
                    status: 'Failed',
                    message: `Model ID '${device.model_id}' does not exist.`,
                });
            }

            // Convert wp_device_quantity string to number
            let quantity = parseInt(model.wp_device_quantity);
            if (isNaN(quantity)) {
                return res.status(500).json({
                    status: 'Failed',
                    message: `Model ID '${device.model_id}' has invalid device quantity value.`,
                });
            }

            if (quantity < 1) {
                return res.status(400).json({
                    status: 'Failed',
                    message: `Model ID '${device.model_id}' has no available quantity.`,
                });
            }

            // Prepare device document
            const now = new Date();
            docsToInsert.push({
                ...device,
                createddate: now,
                model_assigned_date: now,
                status: true,
            });

            // ✅ Decrement quantity and store as integer
            quantity -= 1;
            await modelCollection.updateOne(
                { model_id: device.model_id },
                { $set: { wp_device_quantity: quantity } } // ✅ Keep it as number
            );
        }

        // Insert all new devices
        await deviceCollection.insertMany(docsToInsert);

        return res.status(200).json({
            status: 'Success',
            message: 'Device Detail(s) added successfully',
            data: docsToInsert,
        });
    } catch (err) {
        console.error('Error in AddDeviceDetails:', err);
        return res.status(500).json({
            status: 'Failed',
            message: 'Internal Server Error',
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
        const { wp_device_id, modifiedby, model_assigned_by, model_id, model_name, connectivity, status } = req.body;

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
            connectivity,
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
        const ordersCollection = db.collection("orders");
        const usersCollection = db.collection("users");

        // Get all orders
        const orders = await ordersCollection.find().toArray();

        // Extract unique numeric user_ids from orders
        const userIds = [...new Set(orders.map(order => order.user_id))];

        // Fetch users by user_id (not _id)
        const users = await usersCollection.find({ user_id: { $in: userIds } }).toArray();

        // Create a map of user_id -> email
        const userMap = {};
        users.forEach(user => {
            userMap[user.user_id] = user.email;
        });

        // Attach email to each order
        const ordersWithEmails = orders.map(order => ({
            ...order,
            email: userMap[order.user_id] || null,
        }));

        return res.status(200).json({ status: 'Success', data: ordersWithEmails });

    } catch (error) {
        console.error("Error in FetchOrders:", error);
        logger?.error?.(error);
        return res.status(500).json({ status: 'Failed', message: 'Internal Server Error' });
    }
};

const ConfirmCodPayment = async (req, res) => {
    try {
        const { wp_device_id } = req.body || {};

        if (!wp_device_id) {
            console.error('wp_device_id is missing from request body');
            return res.status(400).json({
                status: "failure",
                message: "wp_device_id is required",
            });
        }

        console.log('ConfirmCodPayment API called with wp_device_id:', wp_device_id);

        const db = await database.connectToDatabase();
        const ordersCollection = db.collection("orders");
        const serviceRecordsCollection = db.collection("service_records");

        // ✅ Find order first (primary source of truth)
        console.log('Looking for order with wp_device_id:', wp_device_id);
        const order = await ordersCollection.findOne({ wp_device_id });
        
        if (!order) {
            console.error('No order found for wp_device_id:', wp_device_id);
            return res.status(404).json({
                status: "failure",
                message: "Order not found for this device",
            });
        }

        console.log('Order found:', { 
            _id: order._id, 
            customOrderId: order.customOrderId,
            paymentType: order.paymentType,
            paymentStatus: order.paymentStatus,
            moneyReceived: order.moneyReceived 
        });

        // ✅ Check if order is COD payment type
        const paymentType = order?.paymentType;
        
        if (paymentType !== "COD") {
            console.error('Order payment type is not COD:', paymentType);
            return res.status(400).json({
                status: "failure",
                message: "This order is not a COD payment. Payment type is: " + paymentType,
            });
        }

        // ✅ Check if payment status is already completed
        if (order?.paymentStatus === "Completed") {
            console.log('Payment already completed for order:', order._id);
            return res.status(400).json({
                status: "failure",
                message: "Payment is already confirmed for this order",
            });
        }

        const now = new Date();

        // ✅ Update order with COD payment confirmation
        console.log('Updating order with wp_device_id:', wp_device_id);
        const updateResult = await ordersCollection.updateOne(
            { wp_device_id },
            {
                $set: {
                    moneyReceived: true,
                    paymentStatus: "Completed",
                    paymentCollectedAt: now,
                    adminPaymentConfirmedAt: now,
                    updatedAt: now,
                },
            }
        );

        console.log('Order update result:', { 
            matchedCount: updateResult.matchedCount, 
            modifiedCount: updateResult.modifiedCount 
        });

        // ✅ Also update service record if it exists
        const serviceRecord = await serviceRecordsCollection.findOne({ wp_device_id });
        if (serviceRecord) {
            console.log('Updating service record for wp_device_id:', wp_device_id);
            await serviceRecordsCollection.updateOne(
                { _id: serviceRecord._id },
                {
                    $set: {
                        "order_snapshot.moneyReceived": true,
                        "order_snapshot.paymentStatus": "Completed",
                        collectPayment: false,
                        snapshot: true,
                        modified_date: now,
                    },
                }
            );
        } else {
            console.log('No service record found for wp_device_id:', wp_device_id);
        }
        
        console.log('Successfully confirmed COD payment for device:', wp_device_id);
        return res.status(200).json({
            status: "success",
            message: "COD payment confirmed successfully.",
            data: {
                wp_device_id,
                paymentType: "COD",
                moneyReceived: true,
                paymentStatus: "Completed",
                confirmedAt: now,
            },
        });
    } catch (error) {
        console.error("Error confirming COD payment:", error);
        logger?.error?.(error);
        return res.status(500).json({
            status: "failure",
            message: "Internal server error",
            error: error.message,
        });
    }
};

// UpdateOrdersStatus
// const UpdateOrdersStatus = async (req, res) => {
//     const { order_id, orderStatus, modified_by } = req.body;

//     // Validate input
//     if (!order_id || !orderStatus || !modified_by) {
//         return res.status(400).json({
//             status: 'Failed',
//             message: 'All fields (order_id, orderStatus, modified_by) are required'
//         });
//     }

//     try {
//         const db = await database.connectToDatabase();
//         const collection = db.collection("orders");

//         const objectId = new ObjectId(order_id); // Convert string to ObjectId

//         const existingOrder = await collection.findOne({ _id: objectId });

//         if (!existingOrder) {
//             return res.status(404).json({
//                 status: 'Failed',
//                 message: `Order with _id ${order_id} not found`
//             });
//         }

//         const result = await collection.updateOne(
//             { _id: objectId },
//             {
//                 $set: {
//                     orderStatus,
//                     modified_by,
//                     modifiedDate: new Date()
//                 }
//             }
//         );

//         return res.status(200).json({
//             status: 'Success',
//             message: 'Order status updated successfully'
//         });

//     } catch (error) {
//         console.error("Error in UpdateOrdersStatus:", error);
//         return res.status(500).json({
//             status: 'Failed',
//             message: 'Internal Server Error'
//         });
//     }
// };

// 8.Manage Roles
// AddUserRoles controller (auto-assign role_id = last role_id + 1 based on role_name)
const AddUserRoles = async (req, res) => {
    try {
        const incoming = Array.isArray(req.body) ? req.body : [req.body];
        const userRoles = incoming.filter(Boolean);

        if (!userRoles.length) {
            return res.status(400).json({ status: 'Failed', message: 'No role data provided' });
        }

        const db = await database.connectToDatabase();
        const collection = db.collection('user_roles');

        // Find the current max role_id once
        const lastRole = await collection.find().sort({ role_id: -1 }).limit(1).toArray();
        let nextRoleId = lastRole.length > 0 ? lastRole[0].role_id + 1 : 1;

        const docsToAdd = [];
        const duplicates = [];

        for (const role of userRoles) {
            const role_name = (role?.role_name || '').trim();
            if (!role_name) {
                return res.status(400).json({
                    status: 'Failed',
                    message: 'Missing role_name',
                    problematic: role
                });
            }

            // Check for duplicate role_name
            const exists = await collection.findOne({ role_name });
            if (exists) {
                duplicates.push({ role_name, existing_role_id: exists.role_id });
                continue;
            }

            docsToAdd.push({
                role_id: nextRoleId++,
                role_name,
                created_date: new Date(),
                created_by: role.created_by || 'system',
                status: true,
                modified_by: null,
                modified_date: null,
            });
        }

        if (duplicates.length && !docsToAdd.length) {
            return res.status(400).json({
                status: 'Failed',
                message: 'All provided role_name(s) already exist',
                duplicates
            });
        }

        if (docsToAdd.length) {
            await collection.insertMany(docsToAdd);
        }

        res.status(200).json({
            status: 'Success',
            message: `${docsToAdd.length} role(s) added.`,
            added: docsToAdd,
            skipped_duplicates: duplicates,
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
        let { role_id, role_name, modified_by, status, new_role_name } = req.body;

        const db = await database.connectToDatabase();
        const collection = db.collection("user_roles");

        // Resolve role by either role_id or role_name
        let filter = null;
        if (role_id != null) {
            filter = { role_id: Number(role_id) };
        } else if (role_name) {
            filter = { role_name: String(role_name).trim() };
        } else {
            return res.status(400).json({
                status: 'Failed',
                message: 'Provide role_id or role_name to update'
            });
        }

        const existingRole = await collection.findOne(filter);
        if (!existingRole) {
            return res.status(404).json({
                status: 'Failed',
                message: 'Role not found'
            });
        }

        const updatedData = {
            modified_by,
            status,
            modified_date: new Date()
        };

        if (new_role_name) {
            updatedData.role_name = String(new_role_name).trim();
        }

        // Remove undefined fields
        Object.keys(updatedData).forEach(key => {
            if (updatedData[key] === undefined) delete updatedData[key];
        });

        await collection.updateOne({ role_id: existingRole.role_id }, { $set: updatedData });

        res.status(200).json({
            status: 'Success',
            message: 'User role updated successfully',
            data: { role_id: existingRole.role_id, ...updatedData }
        });

    } catch (err) {
        console.error("Error in UpdateUserRoles:", err);
        res.status(500).json({ status: 'Failed', message: 'Internal Server Error' });
    }
};

async function sendUserCredentialsEmail(email, user_id, password, role_name) {
    try {
        const subject = `Welcome to IonHive - Your Account Credentials`;
        const text = `Hi ${role_name},

        Your IonHive account has been created successfully. Below are your login credentials:

        Email: ${email}
        User ID: ${user_id}
        Password: ${password}

        Please use these credentials to log in to your IonHive account. For security, we recommend changing your password after your first login.

        Thank you for joining IonHive!`;

        const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border-radius: 10px; background-color: #f9f9f9; border: 1px solid #ddd;">
                <h2 style="color: #333;">Welcome to IonHive, ${role_name}!</h2>
                <p style="font-size: 16px; color: #555;">
                    Your IonHive account has been created successfully. Below are your login credentials:
                </p>
                <ul style="font-size: 16px; color: #555;">
                    <li><strong>Email:</strong> ${email}</li>
                    <li><strong>User ID:</strong> ${user_id}</li>
                    <li><strong>Password:</strong> ${password}</li>
                </ul>
                <p style="font-size: 16px; color: #555;">
                    Please use these credentials to log in to your IonHive account. For security, we recommend changing your password after your first login.
                </p>
                <p style="color: #555;">Thank you for joining <strong>IonHive</strong>!</p>
                <p style="font-size: 14px; color: #888; text-align: center; margin-top: 30px; border-top: 1px solid #ddd; padding-top: 10px;">
                    This is an automated message from IonHive Water Purifier.
                </p>
            </div>
        `;

        await sendEmailService(email, subject, text, html);
        return true;
    } catch (error) {
        console.error('Error in sendUserCredentialsEmail:', error);
        return false;
    }
}

// 9.Manage User
// AddUsers controller
const AddUsers = async (req, res) => {
    try {
        const users = Array.isArray(req.body) ? req.body : [req.body];

        if (!users.length || !users[0].email) {
            return res.status(400).json({
                status: 'Failed',
                message: 'Invalid or empty user data',
            });
        }

        const db = await database.connectToDatabase();
        const collection = db.collection("users");
        const technicianCollection = db.collection("technician_details");

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
            const { email } = user;

            // REQUIRED address fields validation
            const {
                addressline1,
                addressline2, // optional
                city,
                district,
                state,
                country,
                pincode
            } = user;

            const missingFields = [];
            if (!addressline1) missingFields.push('addressline1');
            if (!city) missingFields.push('city');
            if (!district) missingFields.push('district');
            if (!state) missingFields.push('state');
            if (!country) missingFields.push('country');
            if (!pincode) missingFields.push('pincode');
            if (missingFields.length) {
                return res.status(400).json({
                    status: 'Failed',
                    message: `Missing required fields: ${missingFields.join(', ')}`,
                    missing: missingFields
                });
            }

            const rolesColl = db.collection('user_roles');

            // Determine role: prefer role_id if provided; else role_name; else ensure EndUser exists
            let role_name = (user.role_name || '').trim();
            let role_id = user.role_id != null ? Number(user.role_id) : null;

            if (role_id != null && !Number.isNaN(role_id)) {
                // Resolve by role_id, do not auto-create by id
                const existingRole = await rolesColl.findOne({ role_id });
                if (!existingRole) {
                    return res.status(400).json({
                        status: 'Failed',
                        message: `Role with role_id ${role_id} does not exist. Provide a valid role_id or a role_name to auto-create.`
                    });
                }
                role_name = existingRole.role_name;
            } else if (role_name) {
                // Resolve by role_name; auto-create if missing with audit fields
                let existingRole = await rolesColl.findOne({ role_name });
                if (!existingRole) {
                    const lastRole = await rolesColl.find().sort({ role_id: -1 }).limit(1).toArray();
                    const nextRoleId = lastRole.length > 0 ? lastRole[0].role_id + 1 : 1;
                    await rolesColl.insertOne({
                        role_id: nextRoleId,
                        role_name,
                        created_date: new Date(),
                        created_by: user.createdby || user.email || 'system',
                        status: true,
                        modified_by: null,
                        modified_date: null,
                    });
                    role_id = nextRoleId;
                } else {
                    role_id = existingRole.role_id;
                }
            } else {
                // Neither provided: ensure EndUser exists (auto-create if missing)
                role_name = 'EndUser';
                let existingRole = await rolesColl.findOne({ role_name });
                if (!existingRole) {
                    const lastRole = await rolesColl.find().sort({ role_id: -1 }).limit(1).toArray();
                    const nextRoleId = lastRole.length > 0 ? lastRole[0].role_id + 1 : 1;
                    await rolesColl.insertOne({
                        role_id: nextRoleId,
                        role_name,
                        created_date: new Date(),
                        created_by: user.createdby || user.email || 'system',
                        status: true,
                        modified_by: null,
                        modified_date: null,
                    });
                    role_id = nextRoleId;
                } else {
                    role_id = existingRole.role_id;
                }
            }

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
                role_id,
                role_name,
                user_id: nextUserId++,
                createdDate: now,
                status: true,
                phone: parseInt(user.phone),
                password: parseInt(user.password),
                addressline1,
                addressline2, // optional
                city,
                district,
                state,
                country,
                pincode
            };

            // Assign technician_id if role_name === Technician (or role_id == 2)
            if (role_name === 'Technician' || role_id === 2) {
                newUser.technician_id = await getNextTechnicianId();
            }

            docsToInsert.push(newUser);
            technicianCollection.insertOne({user_id: newUser.user_id,email: newUser.email, technician_id: newUser.technician_id || null, status: true,total_assigned_services:0,total_completed_services:0});
        }

        await collection.insertMany(docsToInsert);

        // Send email to users with role Technician or Seller
        for (const user of docsToInsert) {
            if (user.role_name === 'Technician' || user.role_name === 'Seller') {
                const emailSent = await sendUserCredentialsEmail(
                    user.email,
                    user.user_id,
                    user.password,
                    user.role_name
                );
                if (!emailSent) {
                    console.warn(`Failed to send credentials email to ${user.email}`);
                    // Optionally, you could collect failed emails and include in response
                }
            }
        }

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
        const {
            role_id,
            user_id,
            name,
            email,
            password,
            phone,
            addressline1,
            addressline2, // optional
            city,
            district,
            state,
            country,
            pincode,
            modifiedBy,
            status
        } = req.body;

        if (!role_id || !user_id) {
            return res.status(400).json({
                status: 'Failed',
                message: 'role_id and user_id are required for update'
            });
        }

        // REQUIRED address fields validation for update (without 'address')
        const missingFields = [];
        if (!addressline1) missingFields.push('addressline1');
        if (!city) missingFields.push('city');
        if (!district) missingFields.push('district');
        if (!state) missingFields.push('state');
        if (!country) missingFields.push('country');
        if (!pincode) missingFields.push('pincode');
        if (missingFields.length) {
            return res.status(400).json({
                status: 'Failed',
                message: `Missing required fields: ${missingFields.join(', ')}`,
                missing: missingFields
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
            password: parseInt(password),
            phone: parseInt(phone),
            addressline1,
            addressline2, // optional
            city,
            district,
            state,
            country,
            pincode,
            modifiedBy,
            status,
            modifiedDate: new Date()
        };

        // If profile state/district changed, deactivate seller assignment
        try {
            const incomingState = state != null ? String(state).trim() : undefined;
            const incomingDistrict = district != null ? String(district).trim() : undefined;
            const previousState = String(existingUser.state || '').trim();
            const previousDistrict = String(existingUser.district || '').trim();
            let stateDistrictChanged = false;
            if (incomingState !== undefined && incomingState.toLowerCase() !== previousState.toLowerCase()) stateDistrictChanged = true;
            if (incomingDistrict !== undefined && incomingDistrict.toLowerCase() !== previousDistrict.toLowerCase()) stateDistrictChanged = true;
            if (stateDistrictChanged && existingUser.role_id === 4) {
                updatedData.assigned_status = false;
            }
        } catch (e) {
            // noop: do not block updates if comparison fails
        }

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
        const ordersCollection = db.collection("orders");

        const installations = await ordersCollection.aggregate([
            {
                $match: {
                    orderStatus: "Confirmed",
                    $or: [
                        { paymentType: "COD" },
                        { $and: [{ paymentType: "Online" }, { paymentStatus: "Completed" }] }
                    ]
                }
            },
            {
                $lookup: {
                    from: "service_records",
                    let: { deviceId: "$wp_device_id" },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ["$wp_device_id", "$$deviceId"] },
                                        { $eq: ["$task_type", 1] } // installation task only
                                    ]
                                }
                            }
                        }
                    ],
                    as: "service_records"
                }
            },
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
            },
            {
                $lookup: {
                    from: "users",
                    localField: "user_id",
                    foreignField: "user_id",
                    as: "user"
                }
            },
            {
                $addFields: {
                    email: {
                        $cond: [
                            { $gt: [{ $size: "$user" }, 0] },
                            { $arrayElemAt: ["$user.email", 0] },
                            null
                        ]
                    }
                }
            },
            {
                $project: { user: 0 }
            },
            {
                $sort: { createdAt: -1 }
            }
        ]).toArray();

        return res.status(200).json({
            status: "Success",
            message: "Installations fetched successfully",
            data: installations
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
        const ordersCollection = db.collection("orders");

        // Get pending orders with service_records
        const enrichedOrders = await ordersCollection.aggregate([
            {
                $match: {
                    $expr: {
                        $and: [
                            { $eq: ["$orderStatus", "Confirmed"] },
                            {
                                $or: [
                                    {
                                        $eq: [
                                            {
                                                $toUpper: {
                                                    $ifNull: ["$paymentType", ""]
                                                }
                                            },
                                            "COD"
                                        ]
                                    },
                                    { $eq: ["$paymentStatus", "Completed"] }
                                ]
                            }
                        ]
                    }
                }
            },
            {
                $lookup: {
                    from: "service_records",
                    let: { deviceId: "$wp_device_id" },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ["$wp_device_id", "$$deviceId"] },
                                        { $eq: ["$task_type", 1] }
                                    ]
                                }
                            }
                        }
                    ],
                    as: "service_records"
                }
            },
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
            },
            {
                $lookup: {
                    from: "users",
                    localField: "user_id",
                    foreignField: "user_id",
                    as: "user"
                }
            },
            {
                $addFields: {
                    email: {
                        $cond: [
                            { $gt: [{ $size: "$user" }, 0] },
                            { $arrayElemAt: ["$user.email", 0] },
                            null
                        ]
                    }
                }
            },
            {
                $project: { user: 0 }
            }
        ]).toArray();

        return res.status(200).json({
            status: 'Success',
            message: 'Pending installation orders fetched successfully',
            data: enrichedOrders
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
async function sendAssignInstallationEmail(email, otp) {
    try {
        const subject = 'Installation OTP - IonHive Water Purifier';
        const text = `Hi IonHive water purifier user,

        Your installation OTP is: ${otp}

        Once your IonHive device is installed by our technician, please share this OTP with them to complete the installation process.

        Thank you for choosing IonHive!`;

        const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border-radius: 10px; background-color: #f9f9f9; border: 1px solid #ddd;">
                <h2 style="color: #333;">Hi IonHive Water Purifier User,</h2>
                <p style="font-size: 16px; color: #555;">
                    Your installation OTP is: <strong style="color: #000;">${otp}</strong>
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
        const ordersCollection = db.collection("orders");
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
                message: `An Installation task for this device id (${wp_device_id}) has already been assigned.`,
            });
        }

        // Fetch user info
        const orderUser = await usersCollection.findOne({ user_id: order_user_id });
        if (!orderUser) {
            return res.status(404).json({
                status: 'Failed',
                message: 'User not found for given order user id',
            });
        }

        const technicianUser = await usersCollection.findOne({ technician_id });
        if (!technicianUser) {
            return res.status(404).json({
                status: 'Failed',
                message: 'Technician not found for given technician id',
            });
        }

        // Fetch order details to enrich the task
        const orderDoc = await ordersCollection.findOne({ customOrderId });
        if (!orderDoc) {
            return res.status(404).json({
                status: 'Failed',
                message: 'Order not found for given customOrderId'
            });
        }
        const normalizedAddress = normalizeDeliveryAddress(orderDoc.deliveryAddress || {});

        // Validate technician district matches order address district
        const technicianDistrictNormalized = normalizeDeliveryAddress({ district: technicianUser.district || '' }).district;
        if (normalizedAddress.district !== technicianDistrictNormalized) {
            return res.status(400).json({
                status: 'Failed',
                message: 'Technician district does not match order address district'
            });
        }

        // Generate task ID and OTP
        const lastTask = await serviceRecords.find().sort({ task_id: -1 }).limit(1).toArray();
        const nextTaskId = lastTask.length > 0 ? lastTask[0].task_id + 1 : 1;
        const otp = Math.floor(100000 + Math.random() * 900000);
        const now = new Date();

        // Guard: block assignment if order not paid/confirmed
        if (orderDoc?.paymentStatus?.toLowerCase() !== 'completed' || orderDoc?.orderStatus?.toLowerCase() !== 'confirmed') {
            return res.status(400).json({
                status: 'Failed',
                message: 'Cannot assign installation: order not paid/confirmed'
            });
        }

        // Prepare new task (enriched with address and product info)
        const newTask = {
            task_id: nextTaskId,
            task_status: "Pending",
            task_type: 1, // Installation
            task_description: "Ordered a new device",
            assigned_technician_id: technician_id,
            assigned_date: now,
            task_created_by_user_id: order_user_id,
            task_created_by_user_email: orderUser.email,
            wp_device_id,
            otp: otp,
            created_date: now,
            created_by: assigned_by,
            assigned_by,
            // Enriched fields for technician app
            address: normalizedAddress,
            product: {
                model_name: orderDoc?.modelName,
                wp_device_id: orderDoc?.wp_device_id || wp_device_id,
                selectedPlan: orderDoc?.selectedPlan,
                selectedDuration: orderDoc?.selectedDuration
            },
            order: {
                customOrderId: orderDoc?.customOrderId,
                user_id: orderDoc?.user_id
            }
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
        await sendAssignInstallationEmail(orderUser.email, otp);

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
    const ordersCollection = db.collection("orders");

    const { task_id, technician_id, modified_by } = req.body;

    // 1️⃣ Basic validation
    if (!task_id || !technician_id || !modified_by) {
      return res.status(400).json({
        status: 'Failed',
        message: 'Invalid or missing required fields',
      });
    }

    // 2️⃣ Check if the task exists
    const existingTask = await serviceRecords.findOne({ task_id });
    if (!existingTask) {
      return res.status(404).json({
        status: 'Failed',
        message: `Task with task id ${task_id} not found.`,
      });
    }

    // 3️⃣ Allow reassignment only if task_status = "Pending"
    if (existingTask.task_status.toLowerCase() !== 'pending') {
      return res.status(400).json({
        status: 'Failed',
        message: `Cannot reassign installation: task status is '${existingTask.task_status}'. Only pending tasks can be reassigned.`,
      });
    }

    // 4️⃣ Check related order payment status
    const relatedOrder = await ordersCollection.findOne({
      wp_device_id: existingTask.wp_device_id || existingTask.device_id,
    });

    if (!relatedOrder || relatedOrder.paymentStatus?.toLowerCase() !== 'completed') {
      return res.status(400).json({
        status: 'Failed',
        message: 'Cannot reassign installation: related order is not paid.',
      });
    }

    // 5️⃣ Fetch technician user to validate district
    const usersCollection = db.collection("users");
    const technicianUser = await usersCollection.findOne({ technician_id });
    if (!technicianUser) {
      return res.status(404).json({
        status: 'Failed',
        message: 'Technician not found',
      });
    }

    // 6️⃣ Validate technician district matches order address district
    const normalizedOrderAddress = normalizeDeliveryAddress(relatedOrder.deliveryAddress || {});
    const technicianDistrictNormalized = normalizeDeliveryAddress({ district: technicianUser.district || '' }).district;
    if (normalizedOrderAddress.district !== technicianDistrictNormalized) {
      return res.status(400).json({
        status: 'Failed',
        message: 'Technician district does not match order address district'
      });
    }

    // 5️⃣ Perform reassignment update
    const now = new Date();
    const updateResult = await serviceRecords.updateOne(
      { task_id },
      {
        $set: {
          assigned_technician_id: technician_id,
          modified_by,
          modified_date: now,
          pending_reason: null,
          assigned_date: now,
        },
      }
    );

    if (updateResult.modifiedCount === 1) {
      return res.status(200).json({
        status: 'Success',
        message: `Installation task ${task_id} reassigned successfully.`,
      });
    }

    return res.status(500).json({
      status: 'Failed',
      message: 'Task update failed. Please try again.',
    });

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
        const ordersCollection = db.collection("orders");

        const installations = await ordersCollection.aggregate([
            {
                $match: {
                    orderStatus: "Confirmed",
                    $or: [
                        { paymentStatus: "Completed" },
                        {
                            $expr: {
                                $eq: [
                                    {
                                        $toUpper: {
                                            $ifNull: ["$paymentType", ""]
                                        }
                                    },
                                    "COD"
                                ]
                            }
                        }
                    ]
                }
            },
            {
                $lookup: {
                    from: "service_records",
                    let: { deviceId: "$wp_device_id" },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ["$wp_device_id", "$$deviceId"] },
                                        { $eq: ["$task_type", 1] }
                                    ]
                                }
                            }
                        }
                    ],
                    as: "service_records"
                }
            },
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
            },
            {
                $lookup: {
                    from: "users",
                    localField: "user_id",
                    foreignField: "user_id",
                    as: "user"
                }
            },
            {
                $addFields: {
                    email: {
                        $cond: [
                            { $gt: [{ $size: "$user" }, 0] },
                            { $arrayElemAt: ["$user.email", 0] },
                            null
                        ]
                    }
                }
            },
            {
                $project: { user: 0 }
            }
        ]).toArray();

        return res.status(200).json({
            status: "Success",
            message: "Installations fetched successfully",
            data: installations
        });

    } catch (error) {
        console.error("Error in FetchSelectInstallationTask:", error);
        logger?.error?.(error);
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

        const allServices = await collection.aggregate([
            { $match: { task_type: 2 } },
            {
                $lookup: {
                    from: "orders",
                    localField: "device_id",
                    foreignField: "wp_device_id",
                    as: "order"
                }
            },
            { $addFields: { order: { $arrayElemAt: ["$order", 0] } } },
            { $match: { "order.paymentStatus": "Completed" } },
            { $addFields: { orderDelivery: "$order.deliveryAddress" } },
            {
                $addFields: {
                    addressString: {
                        $cond: [
                            { $eq: [{ $type: "$address" }, "string"] },
                            "$address",
                            null
                        ]
                    }
                }
            },
            {
                $addFields: {
                    normalizedAddress: {
                        $cond: [
                            {
                                $and: [
                                    { $ne: [{ $type: "$address" }, "missing"] },
                                    { $eq: [{ $type: "$address" }, "object"] }
                                ]
                            },
                            "$address",
                            "$orderDelivery"
                        ]
                    }
                }
            },
            {
                $addFields: {
                    address: { $ifNull: ["$normalizedAddress", "$address"] },
                    city: {
                        $ifNull: [
                            "$city",
                            { $ifNull: ["$normalizedAddress.city", "$orderDelivery.city"] }
                        ]
                    },
                    district: {
                        $ifNull: [
                            "$district",
                            { $ifNull: ["$normalizedAddress.district", "$orderDelivery.district"] }
                        ]
                    },
                    state: {
                        $ifNull: [
                            "$state",
                            { $ifNull: ["$normalizedAddress.state", "$orderDelivery.state"] }
                        ]
                    },
                    country: {
                        $ifNull: [
                            "$country",
                            { $ifNull: ["$normalizedAddress.country", "$orderDelivery.country"] }
                        ]
                    },
                    pincode: {
                        $ifNull: [
                            "$pincode",
                            { $ifNull: ["$normalizedAddress.pincode", "$orderDelivery.pincode"] }
                        ]
                    },
                    addressline1: {
                        $ifNull: [
                            "$addressline1",
                            { $ifNull: ["$normalizedAddress.addressline1", "$orderDelivery.addressline1"] }
                        ]
                    },
                    addressline2: {
                        $ifNull: [
                            "$addressline2",
                            { $ifNull: ["$normalizedAddress.addressline2", "$orderDelivery.addressline2"] }
                        ]
                    }
                }
            },
            { $addFields: { wp_device_id: "$device_id" } },
            {
                $project: {
                    device_id: 0,
                    order: 0,
                    orderDelivery: 0,
                    normalizedAddress: 0
                }
            }
        ]).toArray();

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

// Send OTP email
async function sendEmailService(to, subject, text, html) {
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

// Send OTP email
async function sendAssignServiceEmail(task_created_by_user_email, otp) {
    console.log(task_created_by_user_email, otp)
    try {
        const subject = 'Service OTP - IonHive Water Purifier';
        const text = `Hi IonHive water purifier user,

        Your service OTP is: ${otp}

        Once your IonHive device is installed by our technician, please share this OTP with them to complete the installation process.

        Thank you for choosing IonHive!`;

        const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border-radius: 10px; background-color: #f9f9f9; border: 1px solid #ddd;">
                <h2 style="color: #333;">Hi IonHive Water Purifier User,</h2>
                <p style="font-size: 16px; color: #555;">
                    Your service OTP is: <strong style="color: #000;">${otp}</strong>
                </p>
                <p style="font-size: 16px; color: #555;">
                    Once our service technician completes your setup, they will request this OTP from you to verify successful service.
                </p>
                <p style="color: #555;">Thank you for choosing <strong>IonHive</strong>!</p>
                <p style="font-size: 14px; color: #888; text-align: center; margin-top: 30px; border-top: 1px solid #ddd; padding-top: 10px;">
                    This is an automated message from IonHive Water Purifier.
                </p>
            </div>
        `;

        await sendEmailService(task_created_by_user_email, subject, text, html); // fixed argument
    } catch (error) {
        console.error('Error in sendAssignServiceEmail:', error); // fixed error label
        return false;
    }
}

// AssignService
const AssignService = async (req, res) => {
    try {
        const db = await database.connectToDatabase();
        const serviceRecords = db.collection("service_records");
        const usersCollection = db.collection("users");
        const technicianDetailsCollection = db.collection("technician_details");

        const {
            task_id,
            assigned_technician_id,
            task_created_by_user_email,
            assigned_by
        } = req.body;


        if (!task_id || !task_created_by_user_email || !assigned_technician_id || !assigned_by) {
            return res.status(400).json({
                status: 'Failed',
                message: 'Invalid or missing required fields',
            });
        }

        const otp = Math.floor(100000 + Math.random() * 900000);
        const now = new Date();

        // Find technician user in `users` collection
        const technicianUser = await usersCollection.findOne({ technician_id: assigned_technician_id });

        if (!technicianUser) {
            return res.status(404).json({
                status: 'Failed',
                message: 'Technician not found in users',
            });
        }

        const { user_id, role_id, email } = technicianUser;

        // Fetch existing task
        const existingTask = await serviceRecords.findOne({ task_id });
        if (!existingTask) {
            return res.status(404).json({
                status: 'Failed',
                message: 'Task not found with given task_id',
            });
        }

        // Resolve order by wp_device_id/device_id
        const ordersCollection = db.collection("orders");
        const wpId = existingTask.wp_device_id || existingTask.device_id;
        const orderDoc = await ordersCollection.findOne({ wp_device_id: wpId });
        if (!orderDoc || orderDoc.paymentStatus?.toLowerCase() !== 'completed') {
            return res.status(400).json({
                status: 'Failed',
                message: 'Cannot assign service: related order is not paid'
            });
        }

        // Validate technician district matches order address district
        const normalizedOrderAddress = normalizeDeliveryAddress(orderDoc.deliveryAddress || {});
        const technicianDistrictNormalized = normalizeDeliveryAddress({ district: technicianUser.district || '' }).district;
        if (normalizedOrderAddress.district !== technicianDistrictNormalized) {
            return res.status(400).json({
                status: 'Failed',
                message: 'Technician district does not match order address district'
            });
        }

        // Update the existing task by task_id
        const updateResult = await serviceRecords.updateOne(
            { task_id: task_id },
            {
                $set: {
                    task_status: "Pending",
                    assigned_technician_id,
                    assigned_date: now,
                    otp: otp,
                    assigned_by,
                    modified_by: assigned_by,
                    modified_date: now
                }
            }
        );

        if (updateResult.matchedCount === 0) {
            return res.status(404).json({
                status: 'Failed',
                message: 'Task not found with given task_id',
            });
        }

        // Update or insert technician details
        await technicianDetailsCollection.updateOne(
            { technician_id: assigned_technician_id },
            {
                $set: {
                    user_id,
                    role_id,
                    email,
                    technician_id: assigned_technician_id,
                    status: true
                },
                $inc: { total_assigned_services: 1 }
            },
            { upsert: true }
        );

        // Send OTP to the user who created the task
        await sendAssignServiceEmail(task_created_by_user_email, otp);

        // Respond
        return res.status(200).json({
            status: 'Success',
            message: 'Service task updated and OTP sent to user',
            task_id,
            assigned_technician_id,
            otp: otp
        });

    } catch (err) {
        console.error("Error in AssignService:", err);
        return res.status(500).json({
            status: 'Failed',
            message: 'Internal Server Error',
        });
    }
};

// ReAssignService
const ReAssignService = async (req, res) => {
  try {
    const db = await database.connectToDatabase();
    const serviceRecords = db.collection("service_records");
    const ordersCollection = db.collection("orders");

    const { task_id, technician_id, modified_by } = req.body;

    // 1️⃣ Basic validation
    if (!task_id || !technician_id || !modified_by) {
      return res.status(400).json({
        status: 'Failed',
        message: 'Invalid or missing required fields',
      });
    }

    // 2️⃣ Check if the task exists
    const existingTask = await serviceRecords.findOne({ task_id });
    if (!existingTask) {
      return res.status(404).json({
        status: 'Failed',
        message: `Task with task_id ${task_id} not found.`,
      });
    }

    // 3️⃣ Allow reassignment only if task_status = "Pending" (case-insensitive)
    if (existingTask.task_status.toLowerCase() !== 'pending') {
      return res.status(400).json({
        status: 'Failed',
        message: `Cannot reassign service: task status is '${existingTask.task_status}'. Only pending tasks can be reassigned.`,
      });
    }

    // 4️⃣ Ensure related order is paid
    const relatedOrder = await ordersCollection.findOne({
      wp_device_id: existingTask.wp_device_id || existingTask.device_id,
    });

    if (!relatedOrder || relatedOrder.paymentStatus?.toLowerCase() !== 'completed') {
      return res.status(400).json({
        status: 'Failed',
        message: 'Cannot reassign service: related order is not paid.',
      });
    }

    // 5️⃣ Fetch technician user to validate district
    const usersCollection = db.collection("users");
    const technicianUser = await usersCollection.findOne({ technician_id });
    if (!technicianUser) {
      return res.status(404).json({
        status: 'Failed',
        message: 'Technician not found',
      });
    }

    // 6️⃣ Validate technician district matches order address district
    const normalizedOrderAddress = normalizeDeliveryAddress(relatedOrder.deliveryAddress || {});
    const technicianDistrictNormalized = normalizeDeliveryAddress({ district: technicianUser.district || '' }).district;
    if (normalizedOrderAddress.district !== technicianDistrictNormalized) {
      return res.status(400).json({
        status: 'Failed',
        message: 'Technician district does not match order address district'
      });
    }

    // 5️⃣ Update task assignment
    const now = new Date();
    const updateResult = await serviceRecords.updateOne(
      { task_id },
      {
        $set: {
          assigned_technician_id: technician_id,
          modified_by,
          modified_date: now,
          pending_reason: null,
        assigned_date: now,
        },
      }
    );

    if (updateResult.modifiedCount === 1) {
      return res.status(200).json({
        status: 'Success',
        message: `Service task ${task_id} reassigned successfully.`,
      });
    }

    return res.status(500).json({
      status: 'Failed',
      message: 'Task update failed. Please try again.',
    });

  } catch (err) {
    console.error("Error in ReAssignService:", err);
    return res.status(500).json({
      status: 'Failed',
      message: 'Internal Server Error',
    });
  }
};

// Admin Fetch APIs additions
// 1) Fetch sellers (role_id = 4). Optional district filter.
const FetchSellers = async (req, res) => {
    try {
        const { district } = req.body || {};
        const db = await database.connectToDatabase();
        const usersCollection = db.collection('users');

        const query = { role_id: 4 };
        if (district && String(district).trim() !== '') {
            query.district = new RegExp(`^${String(district).trim()}$`, 'i');
        }

        const sellers = await usersCollection.find(query).toArray();
        return res.status(200).json({ status: 'Success', data: sellers });
    } catch (error) {
        console.error('Error in FetchSellers:', error);
        logger?.error?.(error);
        return res.status(500).json({ status: 'Failed', message: 'Internal Server Error' });
    }
};

// 2) Fetch orders by district (uses deliveryAddress.district)
const FetchOrdersByDistrict = async (req, res) => {
    try {
        const { district } = req.body || {};
        if (!district || String(district).trim() === '') {
            return res.status(400).json({ status: 'Failed', message: 'district is required' });
        }

        const db = await database.connectToDatabase();
        const ordersCollection = db.collection('orders');
        const usersCollection = db.collection('users');

        const districtRegex = new RegExp(`^${String(district).trim()}$`, 'i');
        const orders = await ordersCollection.find({ 'deliveryAddress.district': districtRegex }).toArray();

        const userIds = [...new Set(orders.map(o => o.user_id))];
        const users = await usersCollection.find({ user_id: { $in: userIds } }).toArray();
        const userMap = {};
        users.forEach(u => { userMap[u.user_id] = u.email; });

        const ordersWithEmail = orders.map(o => ({ ...o, email: userMap[o.user_id] || null }));
        return res.status(200).json({ status: 'Success', data: ordersWithEmail });
    } catch (error) {
        console.error('Error in FetchOrdersByDistrict:', error);
        logger?.error?.(error);
        return res.status(500).json({ status: 'Failed', message: 'Internal Server Error' });
    }
};

// 3) Fetch technicians by district (role_id = 2)
const FetchTechniciansByDistrict = async (req, res) => {
    try {
        const { district } = req.body || {};

        const db = await database.connectToDatabase();
        const usersCollection = db.collection('users');

        const query = { role_id: 2 };
        if (district && String(district).trim() !== '') {
            query.district = new RegExp(`^${String(district).trim()}$`, 'i');
        }

        const technicians = await usersCollection.find(query).toArray();

        return res.status(200).json({ status: 'Success', data: technicians });
    } catch (error) {
        console.error('Error in FetchTechniciansByDistrict:', error);
        logger?.error?.(error);
        return res.status(500).json({ status: 'Failed', message: 'Internal Server Error' });
    }
};

// 3.1) Get Districts with Sellers - Returns unique districts with state (no duplicates)
const GetDistrictsWithSellers = async (req, res) => {
    try {
        const db = await database.connectToDatabase();
        const usersCollection = db.collection('users');

        // Aggregate to get unique districts with states from sellers (role_id = 4)
        const districts = await usersCollection.aggregate([
            {
                $match: {
                    role_id: 4, // Only sellers
                    district: { $exists: true, $ne: null, $ne: '' },
                    state: { $exists: true, $ne: null, $ne: '' }
                }
            },
            {
                $group: {
                    _id: {
                        district: '$district',
                        state: '$state'
                    }
                }
            },
            {
                $project: {
                    _id: 0,
                    district: '$_id.district',
                    state: '$_id.state'
                }
            },
            {
                $sort: { state: 1, district: 1 } // Sort by state, then district
            }
        ]).toArray();

        return res.status(200).json({ 
            status: 'Success', 
            data: districts,
            count: districts.length 
        });
    } catch (error) {
        console.error('Error in GetDistrictsWithSellers:', error);
        logger?.error?.(error);
        return res.status(500).json({ status: 'Failed', message: 'Internal Server Error' });
    }
};

// 4) GET: Users by district (only role_id 2 and 3)
const GetUsersByDistrict = async (req, res) => {
    try {
        const { district } = req.query || {};
        if (!district || String(district).trim() === '') {
            return res.status(400).json({ status: 'Failed', message: 'district is required' });
        }
        const db = await database.connectToDatabase();
        const usersCollection = db.collection('users');
        const query = {
            district: new RegExp(`^${String(district).trim()}$`, 'i'),
            role_id: { $in: [2, 3] }
        };
        const users = await usersCollection.find(query).toArray();
        return res.status(200).json({ status: 'Success', data: users });
    } catch (error) {
        console.error('Error in GetUsersByDistrict:', error);
        logger?.error?.(error);
        return res.status(500).json({ status: 'Failed', message: 'Internal Server Error' });
    }
};

// 5) GET: Orders by district (deliveryAddress.district)
const GetOrdersByDistrict = async (req, res) => {
    try {
        const { district } = req.query || {};
        if (!district || String(district).trim() === '') {
            return res.status(400).json({ status: 'Failed', message: 'district is required' });
        }
        const db = await database.connectToDatabase();
        const ordersCollection = db.collection('orders');
        const usersCollection = db.collection('users');
        const districtRegex = new RegExp(`^${String(district).trim()}$`, 'i');
        const orders = await ordersCollection.find({ 'deliveryAddress.district': districtRegex }).toArray();
        const userIds = [...new Set(orders.map(o => o.user_id))];
        const users = await usersCollection.find({ user_id: { $in: userIds } }).toArray();
        const userMap = {};
        users.forEach(u => { userMap[u.user_id] = u.email; });
        const ordersWithEmail = orders.map(o => ({ ...o, email: userMap[o.user_id] || null }));
        return res.status(200).json({ status: 'Success', data: ordersWithEmail });
    } catch (error) {
        console.error('Error in GetOrdersByDistrict:', error);
        logger?.error?.(error);
        return res.status(500).json({ status: 'Failed', message: 'Internal Server Error' });
    }
};

const GetInstallationsByDistrict = async (req, res) => {
  try {
    const { district } = req.query || {};

    const db = await database.connectToDatabase();
    const ordersCollection = db.collection("orders");

    const matchStage = {
      orderStatus: "Confirmed",
      $or: [
        { paymentStatus: "Completed" },
        { paymentType: { $regex: /^cod$/i } }
      ]
    };

    if (district && String(district).trim() !== '') {
      // Case-insensitive regex
      matchStage["deliveryAddress.district"] = new RegExp(`^${String(district).trim()}$`, "i");
    }

    const installations = await ordersCollection.aggregate([
      { $match: matchStage },
      {
        $lookup: {
          from: "service_records",
          let: { deviceId: "$wp_device_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$wp_device_id", "$$deviceId"] },
                    { $eq: ["$task_type", 1] }
                  ]
                }
              }
            }
          ],
          as: "service_records"
        }
      },
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
      },
      {
        $lookup: {
          from: "users",
          localField: "user_id",
          foreignField: "user_id",
          as: "user"
        }
      },
      {
        $addFields: {
          email: {
            $cond: [
              { $gt: [{ $size: "$user" }, 0] },
              { $arrayElemAt: ["$user.email", 0] },
              null
            ]
          }
        }
      },
      // Only include orders that have installation records
      {
        $project: { user: 0 }
      }
    ]).toArray();

    return res.status(200).json({
      status: "Success",
      message: "Installations fetched successfully",
      data: installations
    });

  } catch (error) {
    console.error("Error in GetInstallationsByDistrict:", error);
    logger?.error?.(error);
    return res.status(500).json({
      status: "Failed",
      message: "Internal Server Error",
      data: null
    });
  }
};



// 7) GET: Services by district (service_records.task_type = 2)
const GetServicesByDistrict = async (req, res) => {
  try {
    const { district } = req.query || {};
    const db = await database.connectToDatabase();
    const serviceRecordsCollection = db.collection("service_records");

    const pipeline = [
      // Filter service_records for task_type = 2 (Services)
      { $match: { task_type: 2 } },

      // Resolve device id reference
      {
        $addFields: {
          resolvedDeviceId: {
            $ifNull: ["$wp_device_id", "$device_id"]
          }
        }
      },

      // Lookup order to get delivery address and payment info
      {
        $lookup: {
          from: "orders",
          localField: "resolvedDeviceId",
          foreignField: "wp_device_id",
          as: "order"
        }
      },

      // Flatten order array
      {
        $addFields: {
          order: { $arrayElemAt: ["$order", 0] }
        }
      },

      // Extract delivery address for convenience
      {
        $addFields: {
          orderDelivery: "$order.deliveryAddress"
        }
      },

      // Filter by district if provided
      ...(district && String(district).trim() !== ''
        ? [
            {
              $match: {
                $expr: {
                  $regexMatch: {
                    input: { $ifNull: ["$orderDelivery.district", ""] },
                    regex: new RegExp(String(district).trim(), "i")
                  }
                }
              }
            }
          ]
        : []),

      // Only include paid orders
      { $match: { "order.paymentStatus": "Completed" } },

      // Normalize address fields combining service record address and order delivery address
      {
        $addFields: {
          addressObject: {
            $cond: [
              {
                $and: [
                  { $ne: [{ $type: "$address" }, "missing"] },
                  { $eq: [{ $type: "$address" }, "object"] }
                ]
              },
              "$address",
              "$orderDelivery"
            ]
          }
        }
      },
      {
        $addFields: {
          address: { $ifNull: ["$addressObject", "$address"] },
          city: {
            $ifNull: ["$city", { $ifNull: ["$addressObject.city", "$orderDelivery.city"] }]
          },
          district: {
            $ifNull: ["$district", { $ifNull: ["$addressObject.district", "$orderDelivery.district"] }]
          },
          state: {
            $ifNull: ["$state", { $ifNull: ["$addressObject.state", "$orderDelivery.state"] }]
          },
          country: {
            $ifNull: ["$country", { $ifNull: ["$addressObject.country", "$orderDelivery.country"] }]
          },
          pincode: {
            $ifNull: ["$pincode", { $ifNull: ["$addressObject.pincode", "$orderDelivery.pincode"] }]
          },
          addressline1: {
            $ifNull: ["$addressline1", { $ifNull: ["$addressObject.addressline1", "$orderDelivery.addressline1"] }]
          },
          addressline2: {
            $ifNull: ["$addressline2", { $ifNull: ["$addressObject.addressline2", "$orderDelivery.addressline2"] }]
          }
        }
      },

      // Ensure wp_device_id field always present
      {
        $addFields: {
          wp_device_id: { $ifNull: ["$wp_device_id", "$resolvedDeviceId"] }
        }
      },

      // Clean up helper fields
      {
        $project: {
          device_id: 0,
          order: 0,
          orderDelivery: 0,
          addressObject: 0,
          resolvedDeviceId: 0
        }
      }
    ];

    const services = await serviceRecordsCollection.aggregate(pipeline).toArray();

    return res.status(200).json({ status: 'Success', data: services });

  } catch (error) {
    console.error('Error in GetServicesByDistrict:', error);
    logger?.error?.(error);
    return res.status(500).json({ status: 'Failed', message: 'Internal Server Error' });
  }
};





// Seller assignment APIs
// Assign seller to state/district with status
const AssignSeller = async (req, res) => {
    try {
        const { seller_id, assign_state, assign_district, assign_status } = req.body || {};
        const modifier = req.user?.userId || 'system';
        if (seller_id === undefined || !assign_state || !assign_district || assign_status === undefined) {
            return res.status(400).json({ status: 'Failed', message: 'seller_id, assign_state, assign_district, assign_status are required' });
        }
        const db = await database.connectToDatabase();
        const usersCollection = db.collection('users');
        const userIdInt = parseInt(seller_id);

        const seller = await usersCollection.findOne({ user_id: userIdInt, role_id: 4 });
        if (!seller) {
            return res.status(404).json({ status: 'Failed', message: 'Seller not found' });
        }

        const incomingState = String(assign_state).trim();
        const incomingDistrict = String(assign_district).trim();
        const existingState = String(seller.assigned_state || '').trim();
        const existingDistrict = String(seller.assigned_district || '').trim();

        const statusStr = String(assign_status).trim().toLowerCase();
        const statusBool = assign_status === true || assign_status === 1 || statusStr === '1' || statusStr === 'true';

        // If seller already has an assignment, only allow when state & district match (case-insensitive)
        if (existingState && existingDistrict) {
            const sameState = existingState.toLowerCase() === incomingState.toLowerCase();
            const sameDistrict = existingDistrict.toLowerCase() === incomingDistrict.toLowerCase();
            if (!sameState || !sameDistrict) {
                return res.status(400).json({ status: 'Failed', message: 'Assigned state/district change is not allowed' });
            }
            // Same assignment → update status only
            const updateResult = await usersCollection.updateOne(
                { user_id: userIdInt },
                { $set: { assigned_status: statusBool, modifiedby: modifier, modifieddate: new Date() } }
            );
            if (!updateResult.modifiedCount) {
                return res.status(500).json({ status: 'Failed', message: 'Assignment update failed' });
            }
            return res.status(200).json({ status: 'Success', message: 'Seller assignment status updated' });
        }

        // Initial assignment (no existing state/district) → allow setting
        const updateResult = await usersCollection.updateOne(
            { user_id: userIdInt },
            {
                $set: {
                    assigned_state: incomingState,
                    assigned_district: incomingDistrict,
                    assigned_status: statusBool,
                    modifiedby: modifier,
                    modifieddate: new Date()
                }
            }
        );

        if (!updateResult.modifiedCount) {
            return res.status(500).json({ status: 'Failed', message: 'Assignment update failed' });
        }

        return res.status(200).json({ status: 'Success', message: 'Seller assigned successfully' });
    } catch (error) {
        console.error('Error in AssignSeller:', error);
        logger?.error?.(error);
        return res.status(500).json({ status: 'Failed', message: 'Internal Server Error' });
    }
};

// ReAssign seller to different state/district with status
const ReAssignSeller = async (req, res) => {
    try {
        const { seller_id, assign_state, assign_district, assign_status } = req.body || {};
        const modifier = req.user?.userId || 'system';
        if (seller_id === undefined || !assign_state || !assign_district || assign_status === undefined) {
            return res.status(400).json({ status: 'Failed', message: 'seller_id, assign_state, assign_district, assign_status are required' });
        }
        const db = await database.connectToDatabase();
        const usersCollection = db.collection('users');
        const userIdInt = parseInt(seller_id);

        const seller = await usersCollection.findOne({ user_id: userIdInt, role_id: 4 });
        if (!seller) {
            return res.status(404).json({ status: 'Failed', message: 'Seller not found' });
        }

        const incomingState = String(assign_state).trim();
        const incomingDistrict = String(assign_district).trim();
        const existingState = String(seller.assigned_state || '').trim();
        const existingDistrict = String(seller.assigned_district || '').trim();

        const statusStr = String(assign_status).trim().toLowerCase();
        const statusBool = assign_status === true || assign_status === 1 || statusStr === '1' || statusStr === 'true';

        // If seller already has an assignment, only allow when state & district match (case-insensitive)
        if (existingState && existingDistrict) {
            const sameState = existingState.toLowerCase() === incomingState.toLowerCase();
            const sameDistrict = existingDistrict.toLowerCase() === incomingDistrict.toLowerCase();
            if (!sameState || !sameDistrict) {
                return res.status(400).json({ status: 'Failed', message: 'Assigned state/district change is not allowed' });
            }
            // Same assignment → update status only
            const updateResult = await usersCollection.updateOne(
                { user_id: userIdInt },
                { $set: { assigned_status: statusBool, modifiedby: modifier, modifieddate: new Date() } }
            );
            if (!updateResult.modifiedCount) {
                return res.status(500).json({ status: 'Failed', message: 'Reassignment update failed' });
            }
            return res.status(200).json({ status: 'Success', message: 'Seller reassignment status updated' });
        }

        // Initial assignment (no existing state/district) → allow setting
        const updateResult = await usersCollection.updateOne(
            { user_id: userIdInt },
            {
                $set: {
                    assigned_state: incomingState,
                    assigned_district: incomingDistrict,
                    assigned_status: statusBool,
                    modifiedby: modifier,
                    modifieddate: new Date()
                }
            }
        );

        if (!updateResult.modifiedCount) {
            return res.status(500).json({ status: 'Failed', message: 'Reassignment update failed' });
        }

        return res.status(200).json({ status: 'Success', message: 'Seller reassigned successfully' });
    } catch (error) {
        console.error('Error in ReAssignSeller:', error);
        logger?.error?.(error);
        return res.status(500).json({ status: 'Failed', message: 'Internal Server Error' });
    }
};

// Deactivate seller assignment (set assigned_status = false)
const DeactivateSellerAssignment = async (req, res) => {
    try {
        const { seller_id } = req.body || {};
        const modifier = req.user?.userId || 'system';
        if (seller_id === undefined) {
            return res.status(400).json({ status: 'Failed', message: 'seller_id is required' });
        }
        const db = await database.connectToDatabase();
        const usersCollection = db.collection('users');
        const userIdInt = parseInt(seller_id);

        const seller = await usersCollection.findOne({ user_id: userIdInt, role_id: 4 });
        if (!seller) {
            return res.status(404).json({ status: 'Failed', message: 'Seller not found' });
        }

        const updateResult = await usersCollection.updateOne(
            { user_id: userIdInt },
            { $set: { assigned_status: false, modifiedby: modifier, modifieddate: new Date() } }
        );

        if (!updateResult.modifiedCount) {
            return res.status(500).json({ status: 'Failed', message: 'Deactivate assignment failed' });
        }

        return res.status(200).json({ status: 'Success', message: 'Seller assignment deactivated successfully' });
    } catch (error) {
        console.error('Error in DeactivateSellerAssignment:', error);
        logger?.error?.(error);
        return res.status(500).json({ status: 'Failed', message: 'Internal Server Error' });
    }
};

const FetchEndUserDevices = async (req, res) => {
    try {
        const { user_id } = req.body || {};

        if (!user_id) {
            return res.status(400).json({
                status: 'Failed',
                message: 'user_id is required'
            });
        }

        const userIdInt = parseInt(user_id, 10);
        if (Number.isNaN(userIdInt)) {
            return res.status(400).json({
                status: 'Failed',
                message: 'Invalid user_id format'
            });
        }

        const db = await database.connectToDatabase();
        const usersCollection = db.collection('users');
        const deviceDetailsCollection = db.collection('device_details');
        const ordersCollection = db.collection('orders');

        const user = await usersCollection.findOne({ user_id: userIdInt, role_id: 3 });
        if (!user) {
            return res.status(404).json({
                status: 'Failed',
                message: 'End-user not found or does not have role_id 3'
            });
        }

        const assignedDevices = Array.isArray(user.assigned_device_ids)
            ? user.assigned_device_ids
            : user.assigned_device_id
            ? [user.assigned_device_id]
            : [];

        if (!assignedDevices.length) {
            return res.status(200).json({
                status: 'Success',
                message: 'No devices assigned to this user',
                data: []
            });
        }

        const devices = await deviceDetailsCollection.aggregate([
            {
                $match: {
                    wp_device_id: { $in: assignedDevices }
                }
            },
            {
                $lookup: {
                    from: 'product_models',
                    localField: 'model_id',
                    foreignField: 'model_id',
                    as: 'model'
                }
            },
            {
                $unwind: {
                    path: '$model',
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $project: {
                    _id: 0,
                    wp_device_id: 1,
                    model_id: 1,
                    model_name: {
                        $ifNull: ['$model.model_name', '$model_name']
                    },
                    status: 1,
                    assigned_date: '$model_assigned_date'
                }
            }
        ]).toArray();

        if (!devices.length) {
            return res.status(200).json({
                status: 'Success',
                message: 'No devices found for this user',
                data: []
            });
        }

        const normalizeId = (value) => String(value || '').toUpperCase();

        const latestOrders = await ordersCollection.aggregate([
            {
                $match: {
                    user_id: userIdInt,
                    wp_device_id: { $in: assignedDevices }
                }
            },
            { $sort: { createdAt: -1 } },
            {
                $group: {
                    _id: '$wp_device_id',
                    order: { $first: '$$ROOT' }
                }
            },
            {
                $lookup: {
                    from: 'payments',
                    let: { razorpayOrderId: '$order.razorpayOrderId' },
                    pipeline: [
                        {
                            $match: {
                                $expr: { $eq: ['$razorpayOrderId', '$$razorpayOrderId'] }
                            }
                        },
                        { $sort: { createdAt: -1 } },
                        { $limit: 1 }
                    ],
                    as: 'payment'
                }
            },
            {
                $lookup: {
                    from: 'payments',
                    let: { wpDeviceId: '$order.wp_device_id' },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ['$wp_device_id', '$$wpDeviceId'] },
                                        { $eq: ['$user_id', userIdInt] }
                                    ]
                                }
                            }
                        },
                        { $sort: { subscribedAt: -1 } },
                        { $limit: 1 }
                    ],
                    as: 'latestDevicePayment'
                }
            },
            {
                $addFields: {
                    payment: { $arrayElemAt: ['$payment', 0] },
                    latestDevicePayment: { $arrayElemAt: ['$latestDevicePayment', 0] }
                }
            }
        ]).toArray();

        const toISOStringSafe = (value) => {
            if (!value) return null;
            const date = new Date(value);
            return Number.isNaN(date.getTime()) ? null : date.toISOString();
        };

        const now = new Date();
        const orderMap = new Map();

        latestOrders.forEach((entry) => {
            const { _id, order, payment, latestDevicePayment } = entry || {};
            if (!_id || !order) return;

            const subscriptionExpiryRaw =
                latestDevicePayment?.subscriptionExpiryDate ||
                payment?.subscriptionExpiryDate ||
                order.subscriptionExpiryDate ||
                null;

            const subscriptionStartedRaw =
                latestDevicePayment?.subscribedAt ||
                payment?.subscribedAt ||
                order.subscribedAt ||
                order.planStartDate ||
                order.createdAt ||
                null;

            let subscriptionStatus = order.orderStatus || 'Pending';
            if (subscriptionExpiryRaw) {
                const expiryDate = new Date(subscriptionExpiryRaw);
                if (!Number.isNaN(expiryDate.getTime())) {
                    subscriptionStatus = expiryDate < now ? 'Expired' : 'Active';
                }
            } else if (order.paymentStatus === 'Completed') {
                subscriptionStatus = 'Active';
            } else if (order.paymentStatus === 'Pending') {
                subscriptionStatus = 'Pending';
            }

            orderMap.set(normalizeId(_id), {
                order,
                payment: payment || latestDevicePayment,
                subscriptionExpiryRaw,
                subscriptionStartedRaw,
                subscriptionStatus
            });
        });

        const devicesWithOrderDetails = devices.map((device) => {
            const orderInfo = orderMap.get(normalizeId(device.wp_device_id));

            if (!orderInfo) {
                return {
                    ...device,
                    orderStatus: 'Not Subscribed',
                    subscriptionStatus: 'Not Subscribed',
                    paymentStatus: null,
                    createdAt: null,
                    subscriptionStartedAt: null,
                    subscriptionExpiryDate: null,
                    planLabel: null,
                    planDuration: null,
                    razorpayOrderId: null
                };
            }

            const { order, payment, subscriptionExpiryRaw, subscriptionStartedRaw, subscriptionStatus } = orderInfo;
            const subscriptionStartedAt = toISOStringSafe(subscriptionStartedRaw);
            const subscriptionExpiryDate = toISOStringSafe(subscriptionExpiryRaw);

            return {
                ...device,
                orderStatus: order.orderStatus || subscriptionStatus,
                subscriptionStatus,
                paymentStatus: payment?.paymentStatus || order.paymentStatus || null,
                createdAt: subscriptionStartedAt,
                subscriptionStartedAt,
                subscriptionExpiryDate,
                planLabel: order.selectedPlan?.label || payment?.planLabel || null,
                planDuration: order.selectedDuration?.duration_time_limit || payment?.duration_time_limit || null,
                razorpayOrderId: payment?.razorpayOrderId || order.razorpayOrderId || null
            };
        });

        return res.status(200).json({
            status: 'Success',
            message: `Found ${devicesWithOrderDetails.length} device(s) for user ${user.name}`,
            data: devicesWithOrderDetails
        });
    } catch (error) {
        console.error('Error in FetchEndUserDevices:', error);
        logger?.error?.(error);
        return res.status(500).json({
            status: 'Failed',
            message: 'Internal Server Error'
        });
    }
};
const FetchOrdersByUserId = async (req, res) => {
    try {
        const { user_id } = req.body;

        // Validate input
        if (!user_id) {
            return res.status(400).json({
                status: 'Failed',
                message: 'user_id is required'
            });
        }

        const db = await database.connectToDatabase();
        const ordersCollection = db.collection("orders");
        const usersCollection = db.collection("users");
        const serviceRecordsCollection = db.collection("service_records");

        // Convert user_id to number if it's a string
        const userIdInt = parseInt(user_id);
        if (isNaN(userIdInt)) {
            return res.status(400).json({
                status: 'Failed',
                message: 'Invalid user_id format'
            });
        }

        // Check if user exists
        const user = await usersCollection.findOne({ user_id: userIdInt });
        if (!user) {
            return res.status(404).json({
                status: 'Failed',
                message: 'User not found'
            });
        }

        // ✅ Role-based restriction
        if (user.role_id !== 3) {
            return res.status(403).json({
                status: 'Failed',
                message: 'Unauthorized: only role_id 3 is allowed to access this data'
            });
        }

        // Get all orders for the specific user
        const orders = await ordersCollection.find({ user_id: userIdInt }).sort({ createdAt: -1 }).toArray();

        if (!orders.length) {
            return res.status(200).json({
                status: 'Success',
                message: 'No orders found for this user',
                data: [],
                user: {
                    user_id: user.user_id,
                    name: user.name,
                    email: user.email,
                    phone: user.phone
                }
            });
        }

        // Enrich orders with service records and installation status
        const enrichedOrders = await Promise.all(orders.map(async (order) => {
            const serviceRecord = await serviceRecordsCollection.findOne({ 
                wp_device_id: order.wp_device_id 
            });

            return {
                ...order,
                email: user.email,
                user_name: user.name,
                user_phone: user.phone,
                service_record: serviceRecord ? {
                    task_id: serviceRecord.task_id,
                    task_status: serviceRecord.task_status,
                    task_type: serviceRecord.task_type,
                    assigned_technician_id: serviceRecord.assigned_technician_id,
                    assigned_date: serviceRecord.assigned_date,
                    completed_date: serviceRecord.completed_date
                } : null,
                installation_status: serviceRecord ? serviceRecord.task_status : 'Not Assigned'
            };
        }));

        return res.status(200).json({
            status: 'Success',
            message: `Found ${orders.length} order(s) for user ${user.name}`,
            data: enrichedOrders,
            user: {
                user_id: user.user_id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                role_id: user.role_id,
                district: user.district,
                is_subscribed: user.is_subscribed,
                subscription_expiry_date: user.subscription_expiry_date
            },
            summary: {
                total_orders: orders.length,
                completed_orders: orders.filter(o => o.paymentStatus === 'Completed').length,
                pending_orders: orders.filter(o => o.paymentStatus === 'Pending').length,
                total_amount: orders.reduce((sum, o) => sum + (o.grandTotal || 0), 0)
            }
        });

    } catch (error) {
        console.error("Error in FetchOrdersByUserId:", error);
        logger?.error?.(error);
        return res.status(500).json({ 
            status: 'Failed', 
            message: 'Internal Server Error' 
        });
    }
};


// Get Analytics
const GetAnalytics = async (req, res) => {
    try {
        const db = await database.connectToDatabase();
        const paymentsCollection = db.collection("payments");
        const ordersCollection = db.collection("orders");
        const usersCollection = db.collection("users");

        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        
        // Current week (Monday to Sunday)
        const currentDayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
        const daysFromMonday = currentDayOfWeek === 0 ? 6 : currentDayOfWeek - 1; // If Sunday, go back 6 days
        const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - daysFromMonday);
        startOfWeek.setHours(0, 0, 0, 0);
        
        // Current calendar month (from 1st to today)
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        
        // Last 365 days (keep original behavior for year)
        const oneYearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);

        // ---------------- Helpers ----------------
        const countDocuments = (collection, filter) => collection.countDocuments(filter);

        const groupTimeline = async (collection, filter, groupId, labelField) => {
            const result = await collection.aggregate([
                { $match: filter },
                {
                    $group: {
                        _id: groupId,
                        total: { $sum: 1 },
                        successful: {
                            $sum: { $cond: [{ $eq: ["$paymentStatus", "Completed"] }, 1, 0] }
                        }
                    }
                },
                { $project: { [labelField]: "$_id", total: 1, successful: 1, _id: 0 } },
                { $sort: { [labelField]: 1 } }
            ]).toArray();
            return result;
        };

        const buildFixedBuckets = (range, results, labelKey = "label") => {
            const buckets = [];
            for (let i = range.start; i <= range.end; i++) {
                const match = results.find(r => r[labelKey] === i);
                buckets.push({
                    [labelKey]: i,
                    total: match ? match.total : 0,
                    successful: match ? match.successful : 0
                });
            }
            return buckets;
        };

        const groupRevenueTimeline = async (collection, filter, groupId, labelField) => {
            const result = await collection.aggregate([
                { $match: { ...filter, paymentStatus: "Completed" } },
                { $addFields: { amount: { $ifNull: ["$totalPrice", "$grandTotal"] } } },
                { $group: { _id: groupId, revenue: { $sum: "$amount" } } },
                { $project: { [labelField]: "$_id", revenue: 1, _id: 0 } },
                { $sort: { [labelField]: 1 } }
            ]).toArray();
            return result;
        };

        const buildRevenueBuckets = (range, results, labelKey = "label") => {
            const buckets = [];
            for (let i = range.start; i <= range.end; i++) {
                const match = results.find(r => r[labelKey] === i);
                buckets.push({
                    [labelKey]: i,
                    revenue: match ? match.revenue : 0
                });
            }
            return buckets;
        };

        // ---------------- New Helper for Top Items per Timeframe ----------------
        const getTopItems = async (collection, filter, groupByField, labelField = 'name', limit = 5) => {
            const result = await collection.aggregate([
                { $match: { ...filter, paymentStatus: "Completed" } },
                {
                    $group: {
                        _id: `$${groupByField}`,
                        devicesSold: { $sum: { $ifNull: ["$quantity", 1] } }
                    }
                },
                { $match: { _id: { $ne: null, $ne: "Unknown", $exists: true } } }, // Exclude null, "Unknown", or missing names
                { $sort: { devicesSold: -1 } },
                { $limit: limit },
                {
                    $project: {
                        [labelField]: "$_id",
                        devicesSold: 1,
                        _id: 0
                    }
                }
            ]).toArray();
            return result;
        };

        // ---------------- Payments / Orders / Revenue Summary ----------------
        const [
            paymentsTotal, paymentsSuccess, paymentsPending,
            ordersTotal, ordersSuccess, ordersPending,
            usersTotal, adminsCount, techniciansCount, endUsersCount, sellersCount
        ] = await Promise.all([
            countDocuments(paymentsCollection, {}),
            countDocuments(paymentsCollection, { paymentStatus: 'Completed' }),
            countDocuments(paymentsCollection, { paymentStatus: 'Pending' }),
            countDocuments(ordersCollection, {}),
            countDocuments(ordersCollection, { paymentStatus: 'Completed' }),
            countDocuments(ordersCollection, { paymentStatus: 'Pending' }),
            countDocuments(usersCollection, { role_id: { $in: [2, 3, 4] } }),
            countDocuments(usersCollection, { role_id: 1 }), // Admin
            countDocuments(usersCollection, { role_id: 2 }), // Technician
            countDocuments(usersCollection, { role_id: 3 }), // End User
            countDocuments(usersCollection, { role_id: 4 }) // Seller
        ]);

        // ---------------- Timelines ----------------
        // Payments timelines
        const paymentsTodayRaw = await groupTimeline(paymentsCollection, { createdAt: { $gte: startOfToday } }, { $hour: "$createdAt" }, "hour");
        const paymentsWeekRaw = await groupTimeline(paymentsCollection, { createdAt: { $gte: startOfWeek } }, { $dayOfWeek: "$createdAt" }, "day");
        const paymentsMonthRaw = await groupTimeline(paymentsCollection, { createdAt: { $gte: startOfMonth } }, { $dayOfMonth: "$createdAt" }, "day");
        const paymentsYearRaw = await groupTimeline(paymentsCollection, { createdAt: { $gte: oneYearAgo } }, { $month: "$createdAt" }, "month");

        const paymentsTimeline = {
            today: buildFixedBuckets({ start: 0, end: 23 }, paymentsTodayRaw, "hour"),
            week: buildFixedBuckets({ start: 1, end: 7 }, paymentsWeekRaw, "day"),
            month: buildFixedBuckets({ start: 1, end: 31 }, paymentsMonthRaw, "day"),
            year: buildFixedBuckets({ start: 1, end: 12 }, paymentsYearRaw, "month")
        };

        // Orders timelines
        const ordersTodayRaw = await groupTimeline(ordersCollection, { createdAt: { $gte: startOfToday } }, { $hour: "$createdAt" }, "hour");
        const ordersWeekRaw = await groupTimeline(ordersCollection, { createdAt: { $gte: startOfWeek } }, { $dayOfWeek: "$createdAt" }, "day");
        const ordersMonthRaw = await groupTimeline(ordersCollection, { createdAt: { $gte: startOfMonth } }, { $dayOfMonth: "$createdAt" }, "day");
        const ordersYearRaw = await groupTimeline(ordersCollection, { createdAt: { $gte: oneYearAgo } }, { $month: "$createdAt" }, "month");

        const ordersTimeline = {
            today: buildFixedBuckets({ start: 0, end: 23 }, ordersTodayRaw, "hour"),
            week: buildFixedBuckets({ start: 1, end: 7 }, ordersWeekRaw, "day"),
            month: buildFixedBuckets({ start: 1, end: 31 }, ordersMonthRaw, "day"),
            year: buildFixedBuckets({ start: 1, end: 12 }, ordersYearRaw, "month")
        };

        // Revenue timelines (using orders collection)
        const revenueTodayRaw = await groupRevenueTimeline(ordersCollection, { createdAt: { $gte: startOfToday } }, { $hour: "$createdAt" }, "hour");
        const revenueWeekRaw = await groupRevenueTimeline(ordersCollection, { createdAt: { $gte: startOfWeek } }, { $dayOfWeek: "$createdAt" }, "day");
        const revenueMonthRaw = await groupRevenueTimeline(ordersCollection, { createdAt: { $gte: startOfMonth } }, { $dayOfMonth: "$createdAt" }, "day");
        const revenueYearRaw = await groupRevenueTimeline(ordersCollection, { createdAt: { $gte: oneYearAgo } }, { $month: "$createdAt" }, "month");

        const revenueTimeline = {
            today: buildRevenueBuckets({ start: 0, end: 23 }, revenueTodayRaw, "hour"),
            week: buildRevenueBuckets({ start: 1, end: 7 }, revenueWeekRaw, "day"),
            month: buildRevenueBuckets({ start: 1, end: 31 }, revenueMonthRaw, "day"),
            year: buildRevenueBuckets({ start: 1, end: 12 }, revenueYearRaw, "month")
        };

        // ---------------- Revenue totals ----------------
        const totalRevenueResult = await ordersCollection.aggregate([
            { $match: { paymentStatus: "Completed" } },
            { $addFields: { amount: { $ifNull: ["$totalPrice", "$grandTotal"] } } },
            { $group: { _id: null, total: { $sum: "$amount" } } }
        ]).toArray();
        const totalRevenue = totalRevenueResult.length > 0 ? totalRevenueResult[0].total : 0;

        // ---------------- Top Districts per Timeframe ----------------
        const topDistrictsOverall = await getTopItems(ordersCollection, {}, "deliveryAddress.district", "districtName");
        const topDistrictsToday = await getTopItems(ordersCollection, { createdAt: { $gte: startOfToday } }, "deliveryAddress.district", "districtName");
        const topDistrictsWeek = await getTopItems(ordersCollection, { createdAt: { $gte: startOfWeek } }, "deliveryAddress.district", "districtName");
        const topDistrictsMonth = await getTopItems(ordersCollection, { createdAt: { $gte: startOfMonth } }, "deliveryAddress.district", "districtName");
        const topDistrictsYear = await getTopItems(ordersCollection, { createdAt: { $gte: oneYearAgo } }, "deliveryAddress.district", "districtName");

        // ---------------- Top Models per Timeframe ----------------
        const topModelsOverall = await getTopItems(ordersCollection, {}, "modelName", "modelName");
        const topModelsToday = await getTopItems(ordersCollection, { createdAt: { $gte: startOfToday } }, "modelName", "modelName");
        const topModelsWeek = await getTopItems(ordersCollection, { createdAt: { $gte: startOfWeek } }, "modelName", "modelName");
        const topModelsMonth = await getTopItems(ordersCollection, { createdAt: { $gte: startOfMonth } }, "modelName", "modelName");
        const topModelsYear = await getTopItems(ordersCollection, { createdAt: { $gte: oneYearAgo } }, "modelName", "modelName");

        // ---------------- Payload ----------------
        const payload = {
            payments: { total: paymentsTotal, successful: paymentsSuccess, pending: paymentsPending, timeline: paymentsTimeline },
            orders: { total: ordersTotal, successful: ordersSuccess, pending: ordersPending, timeline: ordersTimeline },
            revenue: { total: totalRevenue, timeline: revenueTimeline },
            users: {
                total: usersTotal,
                admin: adminsCount,
                technician: techniciansCount,
                end_user: endUsersCount,
                seller: sellersCount
            },
            topDistricts: {
                overall: topDistrictsOverall,
                today: topDistrictsToday,
                week: topDistrictsWeek,
                month: topDistrictsMonth,
                year: topDistrictsYear
            },
            topModels: {
                overall: topModelsOverall,
                today: topModelsToday,
                week: topModelsWeek,
                month: topModelsMonth,
                year: topModelsYear
            }
        };


        return res.status(200).json({ status: "Success", data: payload });

    } catch (error) {
        console.error("Error in GetAnalytics:", error);
        return res.status(500).json({ status: "Failed", message: "Internal Server Error" });
    }
};
// Get Analytics by District
const GetAnalyticsByDistrict = async (req, res) => {
  try {
    const { district } = req.query || {};
    if (!district || String(district).trim() === '') {
      return res.status(400).json({ status: 'Failed', message: 'district is required' });
    }

    const db = await database.connectToDatabase();
    const paymentsCollection = db.collection('payments');
    const ordersCollection = db.collection('orders');
    const usersCollection = db.collection('users');

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const currentDayOfWeek = now.getDay();
    const daysFromMonday = currentDayOfWeek === 0 ? 6 : currentDayOfWeek - 1;
    const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - daysFromMonday);
    startOfWeek.setHours(0, 0, 0, 0);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const oneYearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);

    const districtRegex = new RegExp(`^${String(district).trim()}$`, 'i');

    // ---------------- Helpers ----------------
    const countPaymentsByDistrict = async (filter = {}) => {
      const result = await paymentsCollection.aggregate([
        { $lookup: { from: 'orders', localField: 'orderId', foreignField: '_id', as: 'order' } },
        { $addFields: { order: { $arrayElemAt: ['$order', 0] } } },
        { $match: { 'order.deliveryAddress.district': districtRegex, ...filter } },
        { $count: 'count' }
      ]).toArray();
      return result[0]?.count || 0;
    };

    const groupPaymentsTimelineByDistrict = async (dateFilter, groupId, labelField) => {
      const result = await paymentsCollection.aggregate([
        { $lookup: { from: 'orders', localField: 'orderId', foreignField: '_id', as: 'order' } },
        { $addFields: { order: { $arrayElemAt: ['$order', 0] } } },
        { $match: { 'order.deliveryAddress.district': districtRegex, createdAt: dateFilter } },
        { $group: { _id: groupId, total: { $sum: 1 }, successful: { $sum: { $cond: [{ $eq: ['$paymentStatus', 'Completed'] }, 1, 0] } } } },
        { $project: { [labelField]: '$_id', total: 1, successful: 1, _id: 0 } },
        { $sort: { [labelField]: 1 } }
      ]).toArray();
      return result;
    };

    const groupTimeline = async (collection, filter, groupId, labelField) => {
      const result = await collection.aggregate([
        { $match: filter },
        { $group: { _id: groupId, total: { $sum: 1 }, successful: { $sum: { $cond: [{ $eq: ['$paymentStatus', 'Completed'] }, 1, 0] } } } },
        { $project: { [labelField]: '$_id', total: 1, successful: 1, _id: 0 } },
        { $sort: { [labelField]: 1 } }
      ]).toArray();
      return result;
    };

    const buildFixedBuckets = (range, results, labelKey = 'label') => {
      const buckets = [];
      for (let i = range.start; i <= range.end; i++) {
        const match = results.find(r => r[labelKey] === i);
        buckets.push({ [labelKey]: i, total: match ? match.total : 0, successful: match ? match.successful : 0 });
      }
      return buckets;
    };

    const groupRevenueTimeline = async (collection, filter, groupId, labelField) => {
      const result = await collection.aggregate([
        { $match: { ...filter, paymentStatus: 'Completed' } },
        { $addFields: { amount: { $ifNull: ['$totalPrice', '$grandTotal'] } } },
        { $group: { _id: groupId, revenue: { $sum: '$amount' } } },
        { $project: { [labelField]: '$_id', revenue: 1, _id: 0 } },
        { $sort: { [labelField]: 1 } }
      ]).toArray();
      return result;
    };

    const buildRevenueBuckets = (range, results, labelKey = 'label') => {
      const buckets = [];
      for (let i = range.start; i <= range.end; i++) {
        const match = results.find(r => r[labelKey] === i);
        buckets.push({ [labelKey]: i, revenue: match ? match.revenue : 0 });
      }
      return buckets;
    };

    const getTopItems = async (collection, filter, groupByField, labelField = 'name', limit = 5) => {
      const result = await collection.aggregate([
        { $match: { ...filter, paymentStatus: 'Completed', 'deliveryAddress.district': districtRegex } },
        {
          $group: {
            _id: `$${groupByField}`,
            devicesSold: { $sum: { $ifNull: ['$quantity', 1] } }
          }
        },
        { $match: { _id: { $ne: null, $ne: 'Unknown', $exists: true } } },
        { $sort: { devicesSold: -1 } },
        { $limit: limit },
        {
          $project: {
            [labelField]: '$_id',
            devicesSold: 1,
            _id: 0
          }
        }
      ]).toArray();
      return result;
    };

    // ---------------- Summary counts ----------------
    const [
      paymentsTotal, paymentsSuccess, paymentsPending,
      ordersTotal, ordersSuccess, ordersPending,
      usersTotal, adminsCount, techniciansCount, endUsersCount, sellersCount
    ] = await Promise.all([
      countPaymentsByDistrict({}),
      countPaymentsByDistrict({ paymentStatus: 'Completed' }),
      countPaymentsByDistrict({ paymentStatus: 'Pending' }),
      ordersCollection.countDocuments({ 'deliveryAddress.district': districtRegex }),
      ordersCollection.countDocuments({ 'deliveryAddress.district': districtRegex, paymentStatus: 'Completed' }),
      ordersCollection.countDocuments({ 'deliveryAddress.district': districtRegex, paymentStatus: 'Pending' }),
      usersCollection.countDocuments({ district: districtRegex }),
      usersCollection.countDocuments({ district: districtRegex, role_id: 1 }),
      usersCollection.countDocuments({ district: districtRegex, role_id: 2 }),
      usersCollection.countDocuments({ district: districtRegex, role_id: 3 }),
      usersCollection.countDocuments({ district: districtRegex, role_id: 4 })
    ]);

    // ---------------- Timelines ----------------
    const paymentsTodayRaw = await groupPaymentsTimelineByDistrict({ $gte: startOfToday }, { $hour: '$createdAt' }, 'hour');
    const paymentsWeekRaw = await groupPaymentsTimelineByDistrict({ $gte: startOfWeek }, { $dayOfWeek: '$createdAt' }, 'day');
    const paymentsMonthRaw = await groupPaymentsTimelineByDistrict({ $gte: startOfMonth }, { $dayOfMonth: '$createdAt' }, 'day');
    const paymentsYearRaw = await groupPaymentsTimelineByDistrict({ $gte: oneYearAgo }, { $month: '$createdAt' }, 'month');

    const paymentsTimeline = {
      today: buildFixedBuckets({ start: 0, end: 23 }, paymentsTodayRaw, 'hour'),
      week: buildFixedBuckets({ start: 1, end: 7 }, paymentsWeekRaw, 'day'),
      month: buildFixedBuckets({ start: 1, end: 31 }, paymentsMonthRaw, 'day'),
      year: buildFixedBuckets({ start: 1, end: 12 }, paymentsYearRaw, 'month')
    };

    const orderFilterBase = { 'deliveryAddress.district': districtRegex };

    const ordersTodayRaw = await groupTimeline(ordersCollection, { ...orderFilterBase, createdAt: { $gte: startOfToday } }, { $hour: '$createdAt' }, 'hour');
    const ordersWeekRaw = await groupTimeline(ordersCollection, { ...orderFilterBase, createdAt: { $gte: startOfWeek } }, { $dayOfWeek: '$createdAt' }, 'day');
    const ordersMonthRaw = await groupTimeline(ordersCollection, { ...orderFilterBase, createdAt: { $gte: startOfMonth } }, { $dayOfMonth: '$createdAt' }, 'day');
    const ordersYearRaw = await groupTimeline(ordersCollection, { ...orderFilterBase, createdAt: { $gte: oneYearAgo } }, { $month: '$createdAt' }, 'month');

    const ordersTimeline = {
      today: buildFixedBuckets({ start: 0, end: 23 }, ordersTodayRaw, 'hour'),
      week: buildFixedBuckets({ start: 1, end: 7 }, ordersWeekRaw, 'day'),
      month: buildFixedBuckets({ start: 1, end: 31 }, ordersMonthRaw, 'day'),
      year: buildFixedBuckets({ start: 1, end: 12 }, ordersYearRaw, 'month')
    };

    const revenueTodayRaw = await groupRevenueTimeline(ordersCollection, { ...orderFilterBase, createdAt: { $gte: startOfToday } }, { $hour: '$createdAt' }, 'hour');
    const revenueWeekRaw = await groupRevenueTimeline(ordersCollection, { ...orderFilterBase, createdAt: { $gte: startOfWeek } }, { $dayOfWeek: '$createdAt' }, 'day');
    const revenueMonthRaw = await groupRevenueTimeline(ordersCollection, { ...orderFilterBase, createdAt: { $gte: startOfMonth } }, { $dayOfMonth: '$createdAt' }, 'day');
    const revenueYearRaw = await groupRevenueTimeline(ordersCollection, { ...orderFilterBase, createdAt: { $gte: oneYearAgo } }, { $month: '$createdAt' }, 'month');

    const revenueTimeline = {
      today: buildRevenueBuckets({ start: 0, end: 23 }, revenueTodayRaw, 'hour'),
      week: buildRevenueBuckets({ start: 1, end: 7 }, revenueWeekRaw, 'day'),
      month: buildRevenueBuckets({ start: 1, end: 31 }, revenueMonthRaw, 'day'),
      year: buildRevenueBuckets({ start: 1, end: 12 }, revenueYearRaw, 'month')
    };

    const totalRevenueResult = await ordersCollection.aggregate([
      { $match: { ...orderFilterBase, paymentStatus: 'Completed' } },
      { $addFields: { amount: { $ifNull: ['$totalPrice', '$grandTotal'] } } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]).toArray();
    const totalRevenue = totalRevenueResult[0]?.total || 0;

    // ---------------- Top Districts per Timeframe ----------------
    const getTopDistricts = async (filter) => {
      const result = await ordersCollection.aggregate([
        { $match: { ...filter, paymentStatus: 'Completed', 'deliveryAddress.district': districtRegex } },
        {
          $group: {
            _id: '$deliveryAddress.district',
            devicesSold: { $sum: { $ifNull: ['$quantity', 1] } }
          }
        },
        { $match: { _id: { $ne: null, $ne: 'Unknown', $exists: true } } },
        { $sort: { devicesSold: -1 } },
        { $limit: 1 }, // Only the requested district
        {
          $project: {
            districtName: '$_id',
            devicesSold: 1,
            _id: 0
          }
        }
      ]).toArray();
      return result;
    };

    const topDistrictsOverall = await getTopDistricts({});
    const topDistrictsToday = await getTopDistricts({ createdAt: { $gte: startOfToday } });
    const topDistrictsWeek = await getTopDistricts({ createdAt: { $gte: startOfWeek } });
    const topDistrictsMonth = await getTopDistricts({ createdAt: { $gte: startOfMonth } });
    const topDistrictsYear = await getTopDistricts({ createdAt: { $gte: oneYearAgo } });

    // ---------------- Top Models per Timeframe ----------------
    const topModelsOverall = await getTopItems(ordersCollection, {}, 'modelName', 'modelName');
    const topModelsToday = await getTopItems(ordersCollection, { createdAt: { $gte: startOfToday } }, 'modelName', 'modelName');
    const topModelsWeek = await getTopItems(ordersCollection, { createdAt: { $gte: startOfWeek } }, 'modelName', 'modelName');
    const topModelsMonth = await getTopItems(ordersCollection, { createdAt: { $gte: startOfMonth } }, 'modelName', 'modelName');
    const topModelsYear = await getTopItems(ordersCollection, { createdAt: { $gte: oneYearAgo } }, 'modelName', 'modelName');

    // ---------------- Payload ----------------
    const payload = {
      payments: { total: paymentsTotal, successful: paymentsSuccess, pending: paymentsPending, timeline: paymentsTimeline },
      orders: { total: ordersTotal, successful: ordersSuccess, pending: ordersPending, timeline: ordersTimeline },
      revenue: { total: totalRevenue, timeline: revenueTimeline },
      users: {
        total: usersTotal,
        admin: adminsCount,
        technician: techniciansCount,
        end_user: endUsersCount,
        seller: sellersCount
      },
      topDistricts: {
        overall: topDistrictsOverall,
        today: topDistrictsToday,
        week: topDistrictsWeek,
        month: topDistrictsMonth,
        year: topDistrictsYear
      },
      topModels: {
        overall: topModelsOverall,
        today: topModelsToday,
        week: topModelsWeek,
        month: topModelsMonth,
        year: topModelsYear
      }
    };

    return res.status(200).json({ status: 'Success', data: payload });
  } catch (error) {
    console.error('Error in GetAnalyticsByDistrict:', error);
    return res.status(500).json({ status: 'Failed', message: 'Internal Server Error' });
  }
};
const FetchTechnicianTasksByUserId = async (req, res) => {
  const { user_id, technician_id, email } = req.body;

  if (!email || (!user_id && !technician_id)) {
    return res.status(400).json({
      status: 'Failed',
      message: 'email and either user_id or technician_id are required'
    });
  }

  try {
    const db = await database.connectToDatabase();
    const technicianCollection = db.collection('technician_details');
    const serviceRecordsCollection = db.collection('service_records');
    const ordersCollection = db.collection('orders');

    // Step 1: Find technician
    const emailNormalized = String(email).trim().toLowerCase();
    const rawConditions = [];

    if (user_id !== undefined && user_id !== null && String(user_id).trim() !== '') {
      const userIdTrimmed = String(user_id).trim();
      const userIdNumber = Number(userIdTrimmed);

      if (!Number.isNaN(userIdNumber)) {
        rawConditions.push({ user_id: userIdNumber });
      }

      rawConditions.push({ user_id: userIdTrimmed });
    }

    if (technician_id !== undefined && technician_id !== null && String(technician_id).trim() !== '') {
      rawConditions.push({ technician_id: String(technician_id).trim() });
    }

    const seenKeys = new Set();
    const conditions = [];

    for (const condition of rawConditions) {
      const key = JSON.stringify(condition);
      if (!seenKeys.has(key)) {
        seenKeys.add(key);
        conditions.push(condition);
      }
    }

    const technician = await technicianCollection.findOne(
      conditions.length > 1
        ? { email: emailNormalized, $or: conditions }
        : { email: emailNormalized, ...conditions[0] }
    );

    if (!technician) {
      return res.status(404).json({
        status: 'Failed',
        message: 'Technician not found for given user_id and email',
      });
    }

    if (!technician.technician_id) {
      return res.status(400).json({
        status: 'Failed',
        message: 'Technician record is missing technician_id',
      });
    }

    const assignedTechnicianId = technician.technician_id;

    // Step 2: Fetch tasks either directly assigned or in assignment history
    const tasks = await serviceRecordsCollection
      .find({
        $or: [
          { assigned_technician_id: assignedTechnicianId },
          { 'assignment_history.technician_id': assignedTechnicianId }
        ]
      })
      .toArray();

    if (!tasks.length) {
      return res.status(404).json({
        status: 'Failed',
        message: 'No tasks found for this technician (current or past assignments)',
      });
    }

    const buildTaskIdentifier = (task) => {
      if (!task || typeof task !== 'object') {
        return null;
      }
      if (task.task_id !== undefined && task.task_id !== null) {
        return String(task.task_id);
      }
      if (task.wp_device_id) {
        return String(task.wp_device_id);
      }
      if (task.device_id) {
        return String(task.device_id);
      }
      return task._id ? String(task._id) : null;
    };

    const assignmentHistoryMap = {};

    // Step 3: Enrich each task with order and assignment history details
    for (const task of tasks) {
      const orderId = task?.order_snapshot?.orderId || task?.order_id;
      if (orderId) {
        const order = await ordersCollection.findOne({
          _id: new ObjectId(orderId)
        });

        if (order) {
          task.order_details = {
            customOrderId: order.customOrderId,
            createdAt: order.createdAt,
            wp_device_id: order.wp_device_id,
            grandTotal: order.grandTotal,
            payment_status: order.payment_status,
            order_status: order.order_status,
            customer_name: order.customer_name,
            customer_email: order.customer_email,
            customer_phone: order.customer_phone
          };
        }
      }

      const historyEntries = Array.isArray(task.assignment_history) ? task.assignment_history : [];
      const key = buildTaskIdentifier(task);
      if (key) {
        assignmentHistoryMap[key] = {
          assignment_history: historyEntries,
          total_assignments: historyEntries.length,
          task_status: task.status,
          pending_reason: task.pending_reason,
          wp_device_id: task.wp_device_id,
          device_id: task.device_id,
          last_assigned_date: historyEntries.length ? historyEntries[historyEntries.length - 1]?.assigned_date || null : null,
        };
      }
    }

    // Step 4: Return enriched response
    return res.status(200).json({
      status: 'Success',
      technician: {
        technician_id: technician.technician_id,
        user_id: technician.user_id,
        email: technician.email,
        role_id: technician.role_id,
        status: technician.status,
      },
      data: {
        tasks,
        assignmentHistory: assignmentHistoryMap,
      },
    });
  } catch (error) {
    console.error('Error in FetchTechnicianTasksByUserId:', error);
    return res.status(500).json({
      status: 'Failed',
      message: 'Internal Server Error',
    });
  }
};


// Export controllers
module.exports = {
    getModules, authenticate, FetchAdminProfile, UpdateAdminProfile, AddProductModels, FetchProductModels, UpdateProductModels, AddDeviceDetails, FetchDeviceDetails,
    UpdateDeviceDetails, FetchCallRequest, FetchContact, FetchOrders, AddUserRoles, FetchUserRoles, UpdateUserRoles,
    AddUsers, FetchUsers, FetchSellers, FetchOrdersByDistrict, FetchTechniciansByDistrict, UpdateUsers, FetchInstallationService, FetchSelectUserOrders, AssignInstallation, ReAssignInstallation, FetchSelectInstallationTask,
    FetchSelectServiceTask, AssignService, ReAssignService, assignPermissions, fetchPermissionsByRole,
    GetUsersByDistrict, GetOrdersByDistrict, GetInstallationsByDistrict, GetServicesByDistrict,
    AssignSeller, ReAssignSeller, DeactivateSellerAssignment, FetchEndUserDevices, FetchOrdersByUserId, FetchTechnicianTasksByUserId, GetAnalytics,
    GetAnalyticsByDistrict,GetDistrictsWithSellers,ConfirmCodPayment
    // UpdateOrdersStatus,

};
