const database = require('../../../config/db');
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'default_secret_key';
const { ObjectId } = require("mongodb");
const logger = require('../../../middlewares/requestLogger');
const multerImg = require('../middlewares/imgMiddleware');
const nodemailer = require('nodemailer');
const MODULES = require('./modules.config');

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

        // Check password (number or string)
        if (user.password !== Number(password) && user.password !== password) {
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
            const product_specifications = uploadedFiles['spec_pdf']?.[0]?.filename || product.product_specifications || "";

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
                plans: plans.map((p, idx) => ({ ...p, plans_id: idx + 1 })),
                duration: duration.map((d, idx) => ({ ...d, duration_id: idx + 1 })),
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

        for (const product of productModels) {
            let {
                model_id,
                model_name,
                wp_device_quantity,
                product_details,
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

            const plans = parseArray(product.plans);
            const duration = parseArray(product.duration);

            if (!model_id || !model_name || !plans.length || !duration.length || !modifiedby || typeof status !== 'boolean') {
                return res.status(400).json({ status: 'Failed', message: 'Missing or invalid required fields in product' });
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
            const product_specifications = req.files?.['spec_pdf']?.[0]?.filename || product.product_specifications || '';

            // Auto-assign missing plans_id
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

            // Auto-assign missing duration_id
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
        const ordersCollection = db.collection("orders");
        const usersCollection = db.collection("users");
        const serviceRecordsCollection = db.collection("service_records");

        // Step 1: Get all relevant orders
        const pendingOrders = await ordersCollection.find({
            orderStatus: "Confirmed",
            paymentStatus: "Completed"
        }).toArray();

        // Step 2: Enrich each order
        const enrichedOrders = await Promise.all(pendingOrders.map(async (order) => {
            const userId = order.user_id;
            const wpDeviceId = order.wp_device_id;

            // Get email from users table using user_id
            const user = await usersCollection.findOne({ user_id: userId });
            const userEmail = user ? user.email : null;

            // Find matching service record using wp_device_id
            const serviceRecord = await serviceRecordsCollection.findOne({ wp_device_id: wpDeviceId });

            return {
                ...order,
                user_email: userEmail,
                assigned_technician_id: serviceRecord ? serviceRecord.assigned_technician_id : null,
                task_status: serviceRecord ? (serviceRecord.task_status || null) : null
            };
        }));

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

        // Generate task ID and OTP
        const lastTask = await serviceRecords.find().sort({ task_id: -1 }).limit(1).toArray();
        const nextTaskId = lastTask.length > 0 ? lastTask[0].task_id + 1 : 1;
        const otp = Math.floor(100000 + Math.random() * 900000);
        const now = new Date();

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
                message: `Task with task id ${task_id} not found.`,
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
                message: `Service task ${task_id} reassigned successfully.`,
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
        if (!district || String(district).trim() === '') {
            return res.status(400).json({ status: 'Failed', message: 'district is required' });
        }

        const db = await database.connectToDatabase();
        const usersCollection = db.collection('users');

        const technicians = await usersCollection.find({
            role_id: 2,
            district: new RegExp(`^${String(district).trim()}$`, 'i')
        }).toArray();

        return res.status(200).json({ status: 'Success', data: technicians });
    } catch (error) {
        console.error('Error in FetchTechniciansByDistrict:', error);
        logger?.error?.(error);
        return res.status(500).json({ status: 'Failed', message: 'Internal Server Error' });
    }
};

module.exports = {
    getModules, authenticate, FetchAdminProfile, UpdateAdminProfile, AddProductModels, FetchProductModels, UpdateProductModels, AddDeviceDetails, FetchDeviceDetails,
    UpdateDeviceDetails, FetchCallRequest, FetchContact, FetchOrders, AddUserRoles, FetchUserRoles, UpdateUserRoles,
    AddUsers, FetchUsers, FetchSellers, FetchOrdersByDistrict, FetchTechniciansByDistrict, UpdateUsers, FetchInstallationService, FetchSelectUserOrders, AssignInstallation, ReAssignInstallation, FetchSelectInstallationTask,
    FetchSelectServiceTask, AssignService, ReAssignService, assignPermissions, fetchPermissionsByRole
    // UpdateOrdersStatus,
};
