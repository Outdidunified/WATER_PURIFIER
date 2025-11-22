const database = require('../../../config/db');
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'default_secret_key';
const { ObjectId } = require("mongodb");
const logger = require('../../../middlewares/requestLogger');
const multerImg = require('../middlewares/imgMiddleware');
const nodemailer = require('nodemailer');
const MODULES = require('./modules.config');
const { normalizeDeliveryAddress } = require('../../../modules/website/models/DeliveryAddress');
const { getPaginationParams, formatPaginatedResponse } = require('../utils/paginationHelper');

const resolvePlanDuration = (planConfig) => {
    if (!planConfig || typeof planConfig !== 'object') {
        return null;
    }
    const pickFirst = (...values) => {
        for (const value of values) {
            if (value === undefined || value === null) {
                continue;
            }
            if (typeof value === 'string') {
                const trimmed = value.trim();
                if (trimmed) {
                    return trimmed;
                }
            } else if (typeof value === 'number' && !Number.isNaN(value)) {
                return String(value);
            }
        }
        return null;
    };
    const nestedSources = [];
    const addNestedSource = (source) => {
        if (Array.isArray(source)) {
            if (source.length > 0 && typeof source[0] === 'object') {
                nestedSources.push(source[0]);
            }
            return;
        }
        if (source && typeof source === 'object') {
            nestedSources.push(source);
        }
    };
    addNestedSource(planConfig.duration);
    addNestedSource(planConfig.duration_details);
    addNestedSource(planConfig.durationDetails);
    addNestedSource(planConfig.selectedDuration);
    addNestedSource(planConfig.durationConfig);
    addNestedSource(planConfig.duration_info);
    addNestedSource(planConfig.durationInfo);
    addNestedSource(planConfig.plan_duration);
    addNestedSource(planConfig.planDuration);
    const nestedValues = [];
    nestedSources.forEach((src) => {
        nestedValues.push(
            src.duration_time_limit,
            src.durationTimeLimit,
            src.duration_label,
            src.durationLabel,
            src.duration,
            src.label,
            src.name
        );
    });
    return pickFirst(
        planConfig.duration_time_limit,
        planConfig.durationTimeLimit,
        planConfig.duration_label,
        planConfig.durationLabel,
        planConfig.duration,
        planConfig.plan_duration,
        planConfig.planDuration,
        planConfig.validity,
        planConfig.tenure,
        planConfig.subscription_duration,
        planConfig.subscriptionDuration,
        ...nestedValues
    );
};

const resolvePlanDurationFromSources = (...sources) => {
    for (const source of sources) {
        if (!source) {
            continue;
        }
        if (Array.isArray(source)) {
            const nestedDuration = resolvePlanDurationFromSources(...source);
            if (nestedDuration) {
                return nestedDuration;
            }
            continue;
        }
        if (typeof source === "object") {
            const direct = resolvePlanDuration(source);
            if (direct) {
                return direct;
            }
            const nestedCandidates = [
                source.selectedDuration,
                source.plan_config,
                source.planConfig,
                source.planDetails,
                source.plan_details,
                source.durationConfig,
                source.duration_config,
                source.durationDetails,
                source.duration_details
            ].filter(Boolean);
            if (nestedCandidates.length) {
                const nestedDuration = resolvePlanDurationFromSources(...nestedCandidates);
                if (nestedDuration) {
                    return nestedDuration;
                }
            }
        }
    }
    return null;
};

const pickFirstValue = (...values) => {
    for (const value of values) {
        if (value === undefined || value === null) {
            continue;
        }
        if (typeof value === "string") {
            const trimmed = value.trim();
            if (trimmed) {
                return trimmed;
            }
            continue;
        }
        return value;
    }
    return null;
};

const resolveSelectedPlanSnapshot = (...sources) => {
    for (const source of sources) {
        if (!source) {
            continue;
        }
        if (Array.isArray(source)) {
            const nested = resolveSelectedPlanSnapshot(...source);
            if (nested) {
                return nested;
            }
            continue;
        }
        if (typeof source !== "object") {
            continue;
        }
        const plansId = pickFirstValue(source.plans_id, source.plan_id, source.planId, source.id);
        const label = pickFirstValue(source.label, source.plan_label, source.planLabel, source.name);
        const capacity = pickFirstValue(source.capacity, source.plan_capacity, source.totalWaterLimit, source.total_water_limit, source.totalLitre, source.total_litre);
        const price = pickFirstValue(source.price, source.plan_price, source.total_price, source.amount, source.gross_price);
        if (plansId !== null || label !== null || capacity !== null || price !== null) {
            const snapshot = {};
            if (plansId !== null) {
                snapshot.plans_id = plansId;
            }
            if (label !== null) {
                snapshot.label = label;
            }
            if (capacity !== null) {
                snapshot.capacity = capacity;
            }
            if (price !== null) {
                snapshot.price = price;
            }
            return snapshot;
        }
        const nested = resolveSelectedPlanSnapshot(
            source.selectedPlan,
            source.plan,
            source.plan_details,
            source.planDetails,
            source.plan_config,
            source.planConfig
        );
        if (nested) {
            return nested;
        }
    }
    return null;
};

const resolveSelectedDurationSnapshot = (...sources) => {
    for (const source of sources) {
        if (!source) {
            continue;
        }
        if (Array.isArray(source)) {
            const nested = resolveSelectedDurationSnapshot(...source);
            if (nested) {
                return nested;
            }
            continue;
        }
        if (typeof source !== "object") {
            continue;
        }
        const durationId = pickFirstValue(source.duration_id, source.durationId, source.id);
        let durationLimit = pickFirstValue(
            source.duration_time_limit,
            source.durationTimeLimit,
            source.duration_label,
            source.durationLabel,
            source.duration,
            source.label,
            source.name
        );
        const gst = pickFirstValue(source.gst, source.gst_amount, source.gstPercentage, source.gst_percentage);
        const discount = pickFirstValue(source.discount, source.discount_percentage, source.discountPercentage);
        // Removed securityDeposit as per requirement
        if (!durationLimit) {
            durationLimit = resolvePlanDurationFromSources(source);
        }
        const hasId = durationId !== null && durationId !== undefined;
        const hasLimit = Boolean(durationLimit);
        const hasGst = gst !== null && gst !== undefined;
        const hasDiscount = discount !== null && discount !== undefined;
        if (hasId || hasLimit || hasGst || hasDiscount) {
            const snapshot = {};
            if (hasId) {
                snapshot.duration_id = durationId;
            }
            if (hasLimit) {
                snapshot.duration_time_limit = durationLimit;
            }
            if (hasGst) {
                snapshot.gst = gst;
            }
            if (hasDiscount) {
                snapshot.discount = discount;
            }
            if (Object.keys(snapshot).length) {
                return snapshot;
            }
        }
        const nested = resolveSelectedDurationSnapshot(
            source.selectedDuration,
            source.duration,
            source.duration_config,
            source.durationConfig,
            source.duration_details,
            source.durationDetails,
            source.plan_duration,
            source.planDuration
        );
        if (nested) {
            return nested;
        }
    }
    const fallbackLimit = resolvePlanDurationFromSources(...sources);
    if (fallbackLimit) {
        return {
            duration_time_limit: fallbackLimit
        };
    }
    return null;
};

const buildProductSnapshot = ({ deviceId, modelName, planSources = [], durationSources = [] }) => {
    const selectedPlan = resolveSelectedPlanSnapshot(...planSources);
    const selectedDuration = resolveSelectedDurationSnapshot(...durationSources);
    if (!deviceId && !modelName && !selectedPlan && !selectedDuration) {
        return null;
    }
    return {
        model_name: modelName || null,
        wp_device_id: deviceId || null,
        selectedPlan: selectedPlan || null,
        selectedDuration: selectedDuration || null
    };
};

// Email transporter setup
const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
        user: "info@outdidunified.com",
        pass: "yylh zjwo psvr slqb",
    },
});

const waitForEmailWindow = (ms = 500) => new Promise((resolve) => setTimeout(resolve, ms));

// Function to send order success email to seller and admin
async function sendOrderSuccessEmailToSellerAndAdmin(order, user) {
  try {
    const db = await database.connectToDatabase();

    // Get all sellers and admins
    const sellersAndAdmins = await db.collection('users').find({
      role_id: { $in: [1, 4] } // 1 = Admin, 4 = Seller
    }).toArray();

    if (!sellersAndAdmins.length) {
      console.warn('No sellers or admins found to send order success email');
      return false;
    }

    const subject = `New Order Success - ${order.customOrderId}`;
    const text = `
Dear Team,

A new order has been successfully placed and payment confirmed.

Order Details:
- Order ID: ${order.customOrderId}
- Customer: ${user.name || 'N/A'} (${user.email})
- Product: ${order.modelName}
- Plan: ${order.selectedPlan?.label || 'N/A'}
- Amount: ₹${order.grandTotal}
- Device ID: ${order.wp_device_id}
- Payment Type: ${order.paymentType}

Please process this order accordingly.

Best regards,
IonHive System
    `;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border-radius: 10px; background-color: #f9f9f9; border: 1px solid #ddd;">
        <h2 style="color: #333;">New Order Success Notification</h2>
        <p style="font-size: 16px; color: #555;">A new order has been successfully placed and payment confirmed.</p>
        <div style="background-color: #fff; padding: 15px; border-radius: 5px; margin: 15px 0;">
          <h3 style="margin-top: 0; color: #333;">Order Details:</h3>
          <ul style="font-size: 16px; color: #555;">
            <li><strong>Order ID:</strong> ${order.customOrderId}</li>
            <li><strong>Customer:</strong> ${user.name || 'N/A'} (${user.email})</li>
            <li><strong>Product:</strong> ${order.modelName}</li>
            <li><strong>Plan:</strong> ${order.selectedPlan?.label || 'N/A'}</li>
            <li><strong>Amount:</strong> ₹${order.grandTotal}</li>
            <li><strong>Device ID:</strong> ${order.wp_device_id}</li>
            <li><strong>Payment Type:</strong> ${order.paymentType}</li>
          </ul>
        </div>
        <p style="font-size: 16px; color: #555;">Please process this order accordingly.</p>
        <p style="color: #555;">Best regards,<br><strong>IonHive System</strong></p>
        <p style="font-size: 14px; color: #888; text-align: center; margin-top: 30px; border-top: 1px solid #ddd; padding-top: 10px;">
          This is an automated message from IonHive Water Purifier.
        </p>
      </div>
    `;

    // Send email to all sellers and admins
    const emailPromises = sellersAndAdmins.map(recipient => {
      return sendEmailService(recipient.email, subject, text, html);
    });

    const results = await Promise.allSettled(emailPromises);
    const successCount = results.filter(result => result.status === 'fulfilled' && result.value).length;

    console.log(`Order success email sent to ${successCount}/${sellersAndAdmins.length} recipients`);
    return successCount > 0;

  } catch (error) {
    console.error('Error sending order success email to seller and admin:', error);
    return false;
  }
}

const sendMailWithRetry = async (payload, retries = 2) => {
    let attempt = 0;
    let lastError = null;
    while (attempt <= retries) {
        try {
            const delay = attempt === 0 ? 500 : Math.min(1500 * attempt, 5000);
            await waitForEmailWindow(delay);
            const info = await transporter.sendMail(payload);
            console.log('Message sent: %s', info.messageId);
            return info;
        } catch (error) {
            lastError = error;
            const code = error?.responseCode;
            if (!code || code < 500 || code >= 600) {
                break;
            }
        }
        attempt += 1;
    }
    throw lastError;
};

async function sendEmail(to, subject, text, html) {
    try {
        await sendMailWithRetry({
            from: `Water Purifier Service <info@outdidunified.com>`,
            to,
            subject,
            text,
            html,
        });
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
            { userId: user._id, role_id: user.role_id, district: user.district },
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
                createdby,
                model_type
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

            const normalizedModelType = typeof model_type === 'string' ? model_type.trim().toLowerCase() : '';
            if (!['base', 'smart'].includes(normalizedModelType)) {
                return res.status(400).json({ status: 'Failed', message: "model_type must be either 'Base' or 'Smart'" });
            }
            const formattedModelType = normalizedModelType === 'smart' ? 'Smart' : 'Base';

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
                model_type: formattedModelType,
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
        const { getPaginationParams, formatPaginatedResponse } = require('../utils/paginationHelper');
        const db = await database.connectToDatabase();
        const collection = db.collection("product_models");

        const { page, limit, skip } = getPaginationParams(req, 10);
        const total = await collection.countDocuments();
        const plans = await collection.find().sort({ _id: -1 }).skip(skip).limit(limit).toArray();

        return res.status(200).json(formatPaginatedResponse(plans, total, page, limit));

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
                status: rawStatus,
                model_type
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

            const normalizedModelType = typeof model_type === 'string' ? model_type.trim().toLowerCase() : '';
            if (!['base', 'smart'].includes(normalizedModelType)) {
                return res.status(400).json({ status: 'Failed', message: "model_type must be either 'Base' or 'Smart'" });
            }
            const formattedModelType = normalizedModelType === 'smart' ? 'Smart' : 'Base';

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
                        model_type: formattedModelType,
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
        const { getPaginationParams, formatPaginatedResponse } = require('../utils/paginationHelper');
        const db = await database.connectToDatabase();
        const collection = db.collection("device_details");

        const { page, limit, skip } = getPaginationParams(req, 10);
        const total = await collection.countDocuments();
        const deviceDetails = await collection.find().sort({ _id: -1 }).skip(skip).limit(limit).toArray();
        return res.status(200).json(formatPaginatedResponse(deviceDetails, total, page, limit));

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
        const { getPaginationParams, formatPaginatedResponse } = require('../utils/paginationHelper');
        const db = await database.connectToDatabase();
        const collection = db.collection("callRequests");

        const { page, limit, skip } = getPaginationParams(req, 10);
        const total = await collection.countDocuments();
        const CallRequest = await collection.find().sort({ created_date: -1 }).skip(skip).limit(limit).toArray();

        return res.status(200).json(formatPaginatedResponse(CallRequest, total, page, limit));

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
        const { getPaginationParams, formatPaginatedResponse } = require('../utils/paginationHelper');
        const db = await database.connectToDatabase();
        const collection = db.collection("contactUs");

        const { page, limit, skip } = getPaginationParams(req, 10);
        const total = await collection.countDocuments();
        const contact = await collection.find().sort({ created_date: -1 }).skip(skip).limit(limit).toArray();

        return res.status(200).json(formatPaginatedResponse(contact, total, page, limit));

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
        const { getPaginationParams, formatPaginatedResponse } = require('../utils/paginationHelper');
        const db = await database.connectToDatabase();
        const ordersCollection = db.collection("orders");
        const usersCollection = db.collection("users");

        const { page, limit, skip } = getPaginationParams(req, 10);
        
        // Get total count first
        const total = await ordersCollection.countDocuments();
        
        // Get paginated orders
        const orders = await ordersCollection.find().sort({ _id: -1 }).skip(skip).limit(limit).toArray();

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

        return res.status(200).json(formatPaginatedResponse(ordersWithEmails, total, page, limit));

    } catch (error) {
        console.error("Error in FetchOrders:", error);
        logger?.error?.(error);
        return res.status(500).json({ status: 'Failed', message: 'Internal Server Error' });
    }
};

const ConfirmCodPayment = async (req, res) => {
    try {
        const { wp_device_id, order_id } = req.body || {};

        if (!wp_device_id || !order_id) {
            return res.status(400).json({
                status: "failure",
                message: "wp_device_id and order_id are required",
            });
        }

        console.log(`ConfirmCodPayment -> wp_device_id: ${wp_device_id}, order_id: ${order_id}`);

        const db = await database.connectToDatabase();
        const ordersCollection = db.collection("orders");
        const serviceRecordsCollection = db.collection("service_records");

        // ✅ Find specific order by both fields
        const order = await ordersCollection.findOne({
            wp_device_id,
            customOrderId: order_id,
        });

        if (!order) {
            return res.status(404).json({
                status: "failure",
                message: "Order not found for this device and order_id",
            });
        }

        console.log("Order Found ->", {
            customOrderId: order.customOrderId,
            orderType: order.orderType,
            paymentStatus: order.paymentStatus,
            moneyReceived: order.moneyReceived,
        });

        // ✅ Payment must be completed to confirm COD
        if (order.paymentStatus !== "Completed") {
            return res.status(400).json({
                status: "failure",
                message: `${order.orderType} payment not completed yet`,
            });
        }

        const now = new Date();

        // ✅ Update Order Money Received
        await ordersCollection.updateOne(
            { wp_device_id, customOrderId: order_id },
            {
                $set: {
                    moneyReceived: true,
                    paymentCollectedAt: now,
                    updatedAt: now,
                    paymentCollectedBy: order.technician_id || null,
                },
            }
        );

        // ✅ Only Update Service Records for NON-Recharge orders
        if (order.orderType !== "Recharge") {
            console.log("Updating Service Record for non-recharge order...");
            await serviceRecordsCollection.updateOne(
                { wp_device_id, "order_snapshot.customOrderId": order_id },
                { $set: { "order_snapshot.moneyReceived": true, modified_date: now } }
            );
        } else {
            console.log("Order Type is Recharge → Skipping Service Record Update ✅");
        }

        // 📧 Send order success email to seller and admin for COD payment confirmation
        try {
            const user = await db.collection('users').findOne({ user_id: order.user_id });
            if (user) {
                await sendOrderSuccessEmailToSellerAndAdmin(order, user);
            }
        } catch (emailError) {
            console.error('Error sending order success email for COD confirmation:', emailError);
        }

        return res.status(200).json({
            status: "success",
            message: "COD payment confirmed successfully",
            data: {
                order_id,
                wp_device_id,
                orderType: order.orderType,
                moneyReceived: true,
                confirmedAt: now,
            },
        });

    } catch (error) {
        console.error("Error confirming COD payment:", error);
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

        const { page, limit, skip } = getPaginationParams(req, 10);
        const total = await collection.countDocuments({});
        const userRoles = await collection.find({}).sort({ created_date: -1 }).skip(skip).limit(limit).toArray();

        return res.status(200).json(formatPaginatedResponse(userRoles, total, page, limit));

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

async function sendUserUpdateEmail(email, updatedData) {
    try {
        const subject = `Your IonHive Account Has Been Updated`;
        const text = `
Hi,

Your IonHive account information has been updated. Here are your current details:

Email: ${email}
${updatedData.name ? `Name: ${updatedData.name}` : ''}
${updatedData.phone ? `Phone: ${updatedData.phone}` : ''}
${updatedData.addressline1 ? `Address: ${updatedData.addressline1}${updatedData.addressline2 ? `, ${updatedData.addressline2}` : ''}` : ''}
${updatedData.city ? `City: ${updatedData.city}` : ''}
${updatedData.district ? `District: ${updatedData.district}` : ''}
${updatedData.state ? `State: ${updatedData.state}` : ''}
${updatedData.country ? `Country: ${updatedData.country}` : ''}
${updatedData.pincode ? `Pincode: ${updatedData.pincode}` : ''}
${updatedData.status !== undefined ? `Status: ${updatedData.status ? 'Active' : 'Inactive'}` : ''}

If you did not request this change or have any questions, please contact our support team.

Thank you for being part of IonHive!
        `;

        const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border-radius: 10px; background-color: #f9f9f9; border: 1px solid #ddd;">
                <h2 style="color: #333;">Your IonHive Account Has Been Updated</h2>
                <p style="font-size: 16px; color: #555;">
                    Your IonHive account information has been updated. Here are your current details:
                </p>
                <ul style="font-size: 16px; color: #555;">
                    <li><strong>Email:</strong> ${email}</li>
                    ${updatedData.name ? `<li><strong>Name:</strong> ${updatedData.name}</li>` : ''}
                    ${updatedData.phone ? `<li><strong>Phone:</strong> ${updatedData.phone}</li>` : ''}
                    ${updatedData.addressline1 ? `<li><strong>Address:</strong> ${updatedData.addressline1}${updatedData.addressline2 ? `, ${updatedData.addressline2}` : ''}</li>` : ''}
                    ${updatedData.city ? `<li><strong>City:</strong> ${updatedData.city}</li>` : ''}
                    ${updatedData.district ? `<li><strong>District:</strong> ${updatedData.district}</li>` : ''}
                    ${updatedData.state ? `<li><strong>State:</strong> ${updatedData.state}</li>` : ''}
                    ${updatedData.country ? `<li><strong>Country:</strong> ${updatedData.country}</li>` : ''}
                    ${updatedData.pincode ? `<li><strong>Pincode:</strong> ${updatedData.pincode}</li>` : ''}
                    ${updatedData.status !== undefined ? `<li><strong>Status:</strong> ${updatedData.status ? 'Active' : 'Inactive'}</li>` : ''}
                </ul>
                <p style="font-size: 16px; color: #555;">
                    If you did not request this change or have any questions, please contact our support team.
                </p>
                <p style="color: #555;">Thank you for being part of <strong>IonHive</strong>!</p>
                <p style="font-size: 14px; color: #888; text-align: center; margin-top: 30px; border-top: 1px solid #ddd; padding-top: 10px;">
                    This is an automated message from IonHive Water Purifier.
                </p>
            </div>
        `;

        await sendEmailService(email, subject, text, html);
        return true;
    } catch (error) {
        console.error('Error in sendUserUpdateEmail:', error);
        return false;
    }
}

async function sendUserCredentialsEmail(email, user_id, password, role_name, userDetails = {}) {
    try {
        const { name, createdby, addressline1, addressline2, city, district, state, country, pincode } = userDetails;
        const subject = `Welcome to IonHive - Your Account Credentials`;
        const text = `Hi ${name || role_name},

        Your IonHive account has been created successfully. Below are your login credentials and details:

        Email: ${email}
        User ID: ${user_id}
        Password: ${password}
        Role: ${role_name}
        Created By: ${createdby || 'System'}

        Address:
        ${addressline1 || ''} ${addressline2 || ''}
        ${city || ''}, ${district || ''}, ${state || ''}
        ${country || ''} - ${pincode || ''}

        Please use these credentials to log in to your IonHive account. For security, we recommend changing your password after your first login.

        Thank you for joining IonHive!`;

        const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border-radius: 10px; background-color: #f9f9f9; border: 1px solid #ddd;">
                <h2 style="color: #333;">Welcome to IonHive, ${name || role_name}!</h2>
                <p style="font-size: 16px; color: #555;">
                    Your IonHive account has been created successfully. Below are your login credentials and details:
                </p>
                <ul style="font-size: 16px; color: #555;">
                    <li><strong>Email:</strong> ${email}</li>
                    <li><strong>User ID:</strong> ${user_id}</li>
                    <li><strong>Password:</strong> ${password}</li>
                    <li><strong>Role:</strong> ${role_name}</li>
                    <li><strong>Created By:</strong> ${createdby || 'System'}</li>
                </ul>
                <p style="font-size: 16px; color: #555;"><strong>Address:</strong></p>
                <p style="font-size: 16px; color: #555;">
                    ${addressline1 || ''} ${addressline2 || ''}<br>
                    ${city || ''}, ${district || ''}, ${state || ''}<br>
                    ${country || ''} - ${pincode || ''}
                </p>
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

        // Send email to all users with their credentials and details
        for (const user of docsToInsert) {
            const emailSent = await sendUserCredentialsEmail(
                user.email,
                user.user_id,
                user.password,
                user.role_name,
                {
                    name: user.name,
                    createdby: user.createdby,
                    addressline1: user.addressline1,
                    addressline2: user.addressline2,
                    city: user.city,
                    district: user.district,
                    state: user.state,
                    country: user.country,
                    pincode: user.pincode
                }
            );
            if (!emailSent) {
                console.warn(`Failed to send credentials email to ${user.email}`);
                // Optionally, you could collect failed emails and include in response
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
        const { search } = req.query;

        // If search parameter is provided, delegate to SearchUsers
        if (search && search.trim()) {
            return SearchUsers(req, res);
        }

        // Regular fetch without search
        const { getPaginationParams, formatPaginatedResponse } = require('../utils/paginationHelper');
        const db = await database.connectToDatabase();
        const collection = db.collection("users");

        const { page, limit, skip } = getPaginationParams(req, 10);
        const total = await collection.countDocuments();
        const users = await collection.find().sort({ _id: -1 }).skip(skip).limit(limit).toArray();

        return res.status(200).json(formatPaginatedResponse(users, total, page, limit));

    } catch (error) {
        console.error("Error in FetchUsers:", error);
        logger?.error?.(error);
        return res.status(500).json({ status: 'Failed', message: 'Internal Server Error' });
    }
};

// GetSearchUsersCount - API to get total count for search (called before pagination)
const GetSearchUsersCount = async (req, res) => {
    try {
        const db = await database.connectToDatabase();
        const collection = db.collection("users");
        const { search } = req.query;

        let query = {};

        if (search && search.trim()) {
            const searchRegex = new RegExp(search.trim(), 'i');
            query = {
                $or: [
                    { name: searchRegex },
                    { email: searchRegex },
                    { phone: searchRegex },
                    { city: searchRegex },
                    { district: searchRegex },
                    { state: searchRegex }
                ]
            };
        }

        const total = await collection.countDocuments(query);

        return res.status(200).json({
            status: 'Success',
            totalRecords: total
        });

    } catch (error) {
        console.error("Error in GetSearchUsersCount:", error);
        logger?.error?.(error);
        return res.status(500).json({ status: 'Failed', message: 'Internal Server Error' });
    }
};

// SearchUsers - Separate API for search functionality with pagination
const SearchUsers = async (req, res) => {
    try {
        const { getPaginationParams, formatPaginatedResponse } = require('../utils/paginationHelper');
        const db = await database.connectToDatabase();
        const collection = db.collection("users");

        const { page, limit, skip } = getPaginationParams(req, 10);
        const { search } = req.query;

        let query = {};

        if (search && search.trim()) {
            const searchRegex = new RegExp(search.trim(), 'i');
            query = {
                $or: [
                    { name: searchRegex },
                    { email: searchRegex },
                    { phone: searchRegex },
                    { city: searchRegex },
                    { district: searchRegex },
                    { state: searchRegex }
                ]
            };
        }

        // Get paginated results (total count is calculated on client side using GetSearchUsersCount)
        const users = await collection.find(query).sort({ _id: -1 }).skip(skip).limit(limit).toArray();

        // For backward compatibility, still calculate total here
        const total = await collection.countDocuments(query);

        return res.status(200).json(formatPaginatedResponse(users, total, page, limit));

    } catch (error) {
        console.error("Error in SearchUsers:", error);
        logger?.error?.(error);
        return res.status(500).json({ status: 'Failed', message: 'Internal Server Error' });
    }
};

// GetSearchProductsCount - API to get total count for product search (called before pagination)
const GetSearchProductsCount = async (req, res) => {
    try {
        const db = await database.connectToDatabase();
        const collection = db.collection("product_models");
        const { search } = req.query;

        let query = {};

        if (search && search.trim()) {
            const searchRegex = new RegExp(search.trim(), 'i');
            query = {
                $or: [
                    { model_name: searchRegex },
                    { connectivity: searchRegex },
                    { model_type: searchRegex },
                    { product_details: searchRegex }
                ]
            };
        }

        const total = await collection.countDocuments(query);

        return res.status(200).json({
            status: 'Success',
            totalRecords: total
        });

    } catch (error) {
        console.error("Error in GetSearchProductsCount:", error);
        logger?.error?.(error);
        return res.status(500).json({ status: 'Failed', message: 'Internal Server Error' });
    }
};

// SearchProducts - Separate API for search functionality with pagination
const SearchProducts = async (req, res) => {
    try {
        const { getPaginationParams, formatPaginatedResponse } = require('../utils/paginationHelper');
        const db = await database.connectToDatabase();
        const collection = db.collection("product_models");

        const { page, limit, skip } = getPaginationParams(req, 10);
        const { search } = req.query;

        let query = {};

        if (search && search.trim()) {
            const searchRegex = new RegExp(search.trim(), 'i');
            query = {
                $or: [
                    { model_name: searchRegex },
                    { connectivity: searchRegex },
                    { model_type: searchRegex },
                    { product_details: searchRegex }
                ]
            };
        }

        const products = await collection.find(query).sort({ _id: -1 }).skip(skip).limit(limit).toArray();
        const total = await collection.countDocuments(query);

        return res.status(200).json(formatPaginatedResponse(products, total, page, limit));

    } catch (error) {
        console.error("Error in SearchProducts:", error);
        logger?.error?.(error);
        return res.status(500).json({ status: 'Failed', message: 'Internal Server Error' });
    }
};

// GetSearchDevicesCount - API to get total count for device search
const GetSearchDevicesCount = async (req, res) => {
    try {
        const db = await database.connectToDatabase();
        const collection = db.collection("device_details");
        const { search } = req.query;

        let query = {};

        if (search && search.trim()) {
            const searchRegex = new RegExp(search.trim(), 'i');
            query = {
                $or: [
                    { wp_device_id: searchRegex },
                    { model_name: searchRegex },
                    { connectivity: searchRegex }
                ]
            };
        }

        const total = await collection.countDocuments(query);

        return res.status(200).json({
            status: 'Success',
            totalRecords: total
        });

    } catch (error) {
        console.error("Error in GetSearchDevicesCount:", error);
        logger?.error?.(error);
        return res.status(500).json({ status: 'Failed', message: 'Internal Server Error' });
    }
};

// SearchDevices - Separate API for search functionality with pagination
const SearchDevices = async (req, res) => {
    try {
        const { getPaginationParams, formatPaginatedResponse } = require('../utils/paginationHelper');
        const db = await database.connectToDatabase();
        const collection = db.collection("device_details");

        const { page, limit, skip } = getPaginationParams(req, 10);
        const { search } = req.query;

        let query = {};

        if (search && search.trim()) {
            const searchRegex = new RegExp(search.trim(), 'i');
            query = {
                $or: [
                    { wp_device_id: searchRegex },
                    { model_name: searchRegex },
                    { connectivity: searchRegex }
                ]
            };
        }

        const devices = await collection.find(query).sort({ _id: -1 }).skip(skip).limit(limit).toArray();
        const total = await collection.countDocuments(query);

        return res.status(200).json(formatPaginatedResponse(devices, total, page, limit));

    } catch (error) {
        console.error("Error in SearchDevices:", error);
        logger?.error?.(error);
        return res.status(500).json({ status: 'Failed', message: 'Internal Server Error' });
    }
};

// GetSearchOrdersCount - API to get total count for order search
const GetSearchOrdersCount = async (req, res) => {
    try {
        const db = await database.connectToDatabase();
        const collection = db.collection("orders");
        const { search } = req.query;

        let query = {};

        if (search && search.trim()) {
            const searchRegex = new RegExp(search.trim(), 'i');
            query = {
                $or: [
                    { orderId: searchRegex },
                    { orderStatus: searchRegex },
                    { 'deliveryAddress.name': searchRegex },
                    { 'deliveryAddress.phone': searchRegex }
                ]
            };
        }

        const total = await collection.countDocuments(query);

        return res.status(200).json({
            status: 'Success',
            totalRecords: total
        });

    } catch (error) {
        console.error("Error in GetSearchOrdersCount:", error);
        logger?.error?.(error);
        return res.status(500).json({ status: 'Failed', message: 'Internal Server Error' });
    }
};

// SearchOrders - Separate API for search functionality with pagination
const SearchOrders = async (req, res) => {
    try {
        const { getPaginationParams, formatPaginatedResponse } = require('../utils/paginationHelper');
        const db = await database.connectToDatabase();
        const collection = db.collection("orders");

        const { page, limit, skip } = getPaginationParams(req, 10);
        const { search } = req.query;

        let query = {};

        if (search && search.trim()) {
            const searchRegex = new RegExp(search.trim(), 'i');
            query = {
                $or: [
                    { orderId: searchRegex },
                    { orderStatus: searchRegex },
                    { 'deliveryAddress.name': searchRegex },
                    { 'deliveryAddress.phone': searchRegex }
                ]
            };
        }

        const orders = await collection.find(query).sort({ _id: -1 }).skip(skip).limit(limit).toArray();
        const total = await collection.countDocuments(query);

        return res.status(200).json(formatPaginatedResponse(orders, total, page, limit));

    } catch (error) {
        console.error("Error in SearchOrders:", error);
        logger?.error?.(error);
        return res.status(500).json({ status: 'Failed', message: 'Internal Server Error' });
    }
};

// GetSearchRolesCount - API to get total count for role search
const GetSearchRolesCount = async (req, res) => {
    try {
        const db = await database.connectToDatabase();
        const collection = db.collection("user_roles");
        const { search } = req.query;

        let query = {};

        if (search && search.trim()) {
            const searchRegex = new RegExp(search.trim(), 'i');
            query = {
                $or: [
                    { role_name: searchRegex },
                    { description: searchRegex }
                ]
            };
        }

        const total = await collection.countDocuments(query);

        return res.status(200).json({
            status: 'Success',
            totalRecords: total
        });

    } catch (error) {
        console.error("Error in GetSearchRolesCount:", error);
        logger?.error?.(error);
        return res.status(500).json({ status: 'Failed', message: 'Internal Server Error' });
    }
};

// SearchRoles - Separate API for search functionality with pagination
const SearchRoles = async (req, res) => {
    try {
        const { getPaginationParams, formatPaginatedResponse } = require('../utils/paginationHelper');
        const db = await database.connectToDatabase();
        const collection = db.collection("user_roles");

        const { page, limit, skip } = getPaginationParams(req, 10);
        const { search } = req.query;

        let query = {};

        if (search && search.trim()) {
            const searchRegex = new RegExp(search.trim(), 'i');
            query = {
                $or: [
                    { role_name: searchRegex },
                    { description: searchRegex }
                ]
            };
        }

        const roles = await collection.find(query).sort({ _id: -1 }).skip(skip).limit(limit).toArray();
        const total = await collection.countDocuments(query);

        return res.status(200).json(formatPaginatedResponse(roles, total, page, limit));

    } catch (error) {
        console.error("Error in SearchRoles:", error);
        logger?.error?.(error);
        return res.status(500).json({ status: 'Failed', message: 'Internal Server Error' });
    }
};

// GetSearchCallRequestsCount - API to get total count for call request search
const GetSearchCallRequestsCount = async (req, res) => {
    try {
        const db = await database.connectToDatabase();
        const collection = db.collection("call_requests");
        const { search } = req.query;

        let query = {};

        if (search && search.trim()) {
            const searchRegex = new RegExp(search.trim(), 'i');
            query = {
                $or: [
                    { phone: searchRegex },
                    { email: searchRegex },
                    { issue: searchRegex }
                ]
            };
        }

        const total = await collection.countDocuments(query);

        return res.status(200).json({
            status: 'Success',
            totalRecords: total
        });

    } catch (error) {
        console.error("Error in GetSearchCallRequestsCount:", error);
        logger?.error?.(error);
        return res.status(500).json({ status: 'Failed', message: 'Internal Server Error' });
    }
};

// SearchCallRequests - Separate API for search functionality with pagination
const SearchCallRequests = async (req, res) => {
    try {
        const { getPaginationParams, formatPaginatedResponse } = require('../utils/paginationHelper');
        const db = await database.connectToDatabase();
        const collection = db.collection("call_requests");

        const { page, limit, skip } = getPaginationParams(req, 10);
        const { search } = req.query;

        let query = {};

        if (search && search.trim()) {
            const searchRegex = new RegExp(search.trim(), 'i');
            query = {
                $or: [
                    { phone: searchRegex },
                    { email: searchRegex },
                    { issue: searchRegex }
                ]
            };
        }

        const callRequests = await collection.find(query).sort({ _id: -1 }).skip(skip).limit(limit).toArray();
        const total = await collection.countDocuments(query);

        return res.status(200).json(formatPaginatedResponse(callRequests, total, page, limit));

    } catch (error) {
        console.error("Error in SearchCallRequests:", error);
        logger?.error?.(error);
        return res.status(500).json({ status: 'Failed', message: 'Internal Server Error' });
    }
};

// GetSearchContactCount - API to get total count for contact search
const GetSearchContactCount = async (req, res) => {
    try {
        const db = await database.connectToDatabase();
        const collection = db.collection("contactUs");
        const { search } = req.query;

        let query = {};

        if (search && search.trim()) {
            const searchRegex = new RegExp(search.trim(), 'i');
            query = {
                $or: [
                    { name: searchRegex },
                    { email: searchRegex },
                    { phone: searchRegex },
                    { message: searchRegex }
                ]
            };
        }

        const total = await collection.countDocuments(query);

        return res.status(200).json({
            status: 'Success',
            totalRecords: total
        });

    } catch (error) {
        console.error("Error in GetSearchContactCount:", error);
        logger?.error?.(error);
        return res.status(500).json({ status: 'Failed', message: 'Internal Server Error' });
    }
};

// SearchContact - Separate API for search functionality with pagination
const SearchContact = async (req, res) => {
    try {
        const { getPaginationParams, formatPaginatedResponse } = require('../utils/paginationHelper');
        const db = await database.connectToDatabase();
        const collection = db.collection("contactUs");

        const { page, limit, skip } = getPaginationParams(req, 10);
        const { search } = req.query;

        let query = {};

        if (search && search.trim()) {
            const searchRegex = new RegExp(search.trim(), 'i');
            query = {
                $or: [
                    { name: searchRegex },
                    { email: searchRegex },
                    { phone: searchRegex },
                    { message: searchRegex }
                ]
            };
        }

        const contacts = await collection.find(query).sort({ _id: -1 }).skip(skip).limit(limit).toArray();
        const total = await collection.countDocuments(query);

        return res.status(200).json(formatPaginatedResponse(contacts, total, page, limit));

    } catch (error) {
        console.error("Error in SearchContact:", error);
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

        // Send email notification to the updated user
        const emailSent = await sendUserUpdateEmail(existingUser.email, updatedData);
        if (!emailSent) {
            console.warn(`Failed to send update notification email to ${existingUser.email}`);
        }

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
        const { getPaginationParams, formatPaginatedResponse } = require('../utils/paginationHelper');
        const db = await database.connectToDatabase();
        const ordersCollection = db.collection("orders");

        // Pagination params - ensure 10 per page
        const { page, limit, skip } = getPaginationParams(req, 10);

        // Extract query parameters for filtering and sorting
        const {
            district,
            date_from,
            date_to,
            payment_type,
            sort_by = 'createdAt',
            sort_order = 'desc'
        } = req.query;

        // Build match stage with filters
        const matchStage = {
            orderStatus: "Confirmed",
            $or: [
                { paymentType: "COD" },
                { $and: [{ paymentType: "Online" }, { paymentStatus: "Completed" }] }
            ]
        };

        // Add district filter
        if (district && String(district).trim() !== '') {
            matchStage['deliveryAddress.district'] = new RegExp(`^${String(district).trim()}$`, 'i');
        }

        // Add date range filter
        if (date_from || date_to) {
            matchStage.createdAt = {};
            if (date_from) {
                matchStage.createdAt.$gte = new Date(date_from);
            }
            if (date_to) {
                matchStage.createdAt.$lte = new Date(date_to);
            }
        }

        // Add payment type filter
        if (payment_type && String(payment_type).trim() !== '') {
            matchStage.paymentType = String(payment_type).trim();
        }

        const total = await ordersCollection.countDocuments(matchStage);

        // Build sort stage
        const sortStage = {};
        const validSortFields = ['createdAt', 'customOrderId', 'grandTotal', '_id'];
        const sortField = validSortFields.includes(sort_by) ? sort_by : 'createdAt';
        const sortDirection = sort_order === 'asc' ? 1 : -1;
        sortStage[sortField] = sortDirection;

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
                        },
                        { $sort: { task_id: -1 } },
                        { $limit: 1 }
                    ],
                    as: "service_records"
                }
            },

            {
                $addFields: {
                    service_record: { $arrayElemAt: ["$service_records", 0] }
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
                    email: { $arrayElemAt: ["$user.email", 0] }
                }
            },

            {
                $lookup: {
                    from: "users",
                    localField: "service_record.assigned_technician_id",
                    foreignField: "technician_id",
                    as: "assignedTechnician"
                }
            },

            {
                $addFields: {
                    assignedTechnician: {
                        $arrayElemAt: ["$assignedTechnician", 0]
                    }
                }
            },

            { $project: { user: 0, service_records: 0 } },

            { $sort: sortStage },

            { $skip: skip },
            { $limit: limit }

        ]).toArray();

        // Add serial numbering starting from 1
        const startSerial = (page - 1) * limit + 1;
        const installationsWithSerial = installations.map((item, index) => ({
            ...item,
            serial_no: startSerial + index
        }));

        return res.status(200).json(
            formatPaginatedResponse(installationsWithSerial, total, page, limit)
        );

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
        const { getPaginationParams, formatPaginatedResponse } = require('../utils/paginationHelper');
        const db = await database.connectToDatabase();
        const ordersCollection = db.collection("orders");

        const { page, limit, skip } = getPaginationParams(req, 10);

        const matchStage = {
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
        };

        const total = await ordersCollection.countDocuments(matchStage);

        const enrichedOrders = await ordersCollection.aggregate([
            {
                $match: matchStage
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
            },
            {
                $skip: skip
            },
            {
                $limit: limit
            }
        ]).toArray();

        return res.status(200).json(formatPaginatedResponse(enrichedOrders, total, page, limit));

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

        // Check if technician is on leave
        const leaveRequestsCollection = db.collection('leave_requests');
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);

        const approvedLeaves = await leaveRequestsCollection.find({
            technician_id: technician_id,
            status: 'Approved',
            from_date: { $lte: todayEnd },
            to_date: { $gte: todayStart }
        }).toArray();

        if (approvedLeaves.length > 0) {
            return res.status(400).json({
                status: 'Failed',
                message: 'Technician is on approved leave and cannot be assigned'
            });
        }

        // Generate task ID and OTP
        const lastTask = await serviceRecords.find().sort({ task_id: -1 }).limit(1).toArray();
        const nextTaskId = lastTask.length > 0 ? lastTask[0].task_id + 1 : 1;
        const otp = Math.floor(100000 + Math.random() * 900000);
        const now = new Date();

        const paymentType = (orderDoc?.paymentType || '').toLowerCase();
        const paymentStatus = (orderDoc?.paymentStatus || '').toLowerCase();
        const orderStatus = (orderDoc?.orderStatus || '').toLowerCase();

        if (orderStatus !== 'confirmed') {
            return res.status(400).json({
                status: 'Failed',
                message: 'Cannot assign installation: order is not confirmed'
            });
        }

        if (paymentType !== 'cod' && paymentStatus !== 'completed') {
            return res.status(400).json({
                status: 'Failed',
                message: 'Cannot assign installation: payment not completed'
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

        // Get district sellers and send notification emails to admin, seller, and technician (NOT to user)
        const districtSellers = await getDistrictSellers(db, normalizedAddress.district);
        const sellerEmails = districtSellers.map(s => s.email);
        const adminEmails = ['admin@gmail.com'];
        const technicianEmail = [technicianUser.email];
        const allNotificationEmails = [...sellerEmails, ...adminEmails, ...technicianEmail];

        const notificationHtml = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border-radius: 10px; background-color: #f9f9f9; border: 1px solid #ddd;">
                <h2 style="color: #333;">New Installation Task Assigned</h2>
                <ul style="font-size: 16px; color: #555;">
                    <li><strong>Task ID:</strong> ${nextTaskId}</li>
                    <li><strong>Device ID:</strong> ${wp_device_id}</li>
                    <li><strong>Technician:</strong> ${technicianUser.name || 'N/A'}</li>
                    <li><strong>Customer Email:</strong> ${orderUser.email}</li>
                    <li><strong>Location:</strong> ${normalizedAddress.city}, ${normalizedAddress.district}, ${normalizedAddress.state}</li>
                    <li><strong>Product:</strong> ${orderDoc?.modelName}</li>
                </ul>
                <p style="font-size: 14px; color: #888; text-align: center; margin-top: 30px; border-top: 1px solid #ddd; padding-top: 10px;">This is an automated notification from IonHive Water Purifier.</p>
            </div>
        `;

        await sendEmailToMultiple(allNotificationEmails, 'Installation Task Assigned - IonHive', '', notificationHtml);

        // Log to assignment history
        await logToAssignmentHistory(db, {
            task_id: nextTaskId,
            task_type: 1,
            assignment_type: 'Installation',
            action: 'assign',
            assignment_mode: 'manual',
            technician_id: technician_id,
            technician_name: technicianUser.name,
            previous_technician_id: null,
            device_id: wp_device_id,
            customer_email: orderUser.email,
            location: {
                city: normalizedAddress.city,
                district: normalizedAddress.district,
                state: normalizedAddress.state
            },
            assigned_by: assigned_by,
            reason: null
        });

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

    // 4️⃣ Check related order payment status
    const relatedOrder = await ordersCollection.findOne({
      wp_device_id: existingTask.wp_device_id || existingTask.device_id,
    });
    
if (
  !relatedOrder ||
  (relatedOrder.paymentType?.toLowerCase() !== 'cod' &&
   relatedOrder.paymentStatus?.toLowerCase() !== 'completed')
) {
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

    // 7️⃣ Check if technician is on leave
    const leaveRequestsCollection = db.collection('leave_requests');
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const approvedLeaves = await leaveRequestsCollection.find({
      technician_id: technician_id,
      status: 'Approved',
      from_date: { $lte: todayEnd },
      to_date: { $gte: todayStart }
    }).toArray();

    if (approvedLeaves.length > 0) {
      return res.status(400).json({
        status: 'Failed',
        message: 'Technician is on approved leave and cannot be reassigned'
      });
    }

    // 8️⃣ Perform reassignment update
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
      // Get district sellers and send notification emails to admin, seller, and new technician (NOT to user)
      const districtSellers = await getDistrictSellers(db, normalizedOrderAddress.district);
      const sellerEmails = districtSellers.map(s => s.email);
      const adminEmails = ['admin@gmail.com'];
      const technicianEmail = [technicianUser.email];
      const allNotificationEmails = [...sellerEmails, ...adminEmails, ...technicianEmail];

      const notificationHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border-radius: 10px; background-color: #f9f9f9; border: 1px solid #ddd;">
              <h2 style="color: #333;">Installation Task Re-assigned</h2>
              <ul style="font-size: 16px; color: #555;">
                  <li><strong>Task ID:</strong> ${task_id}</li>
                  <li><strong>Device ID:</strong> ${existingTask.wp_device_id || existingTask.device_id}</li>
                  <li><strong>New Technician:</strong> ${technicianUser.name || 'N/A'}</li>
                  <li><strong>Previous Technician ID:</strong> ${existingTask.assigned_technician_id || 'N/A'}</li>
                  <li><strong>Location:</strong> ${normalizedOrderAddress.city}, ${normalizedOrderAddress.district}, ${normalizedOrderAddress.state}</li>
              </ul>
              <p style="font-size: 14px; color: #888; text-align: center; margin-top: 30px; border-top: 1px solid #ddd; padding-top: 10px;">This is an automated notification from IonHive Water Purifier.</p>
          </div>
      `;

      await sendEmailToMultiple(allNotificationEmails, 'Installation Task Re-assigned - IonHive', '', notificationHtml);

      // Log to assignment history
      await logToAssignmentHistory(db, {
          task_id: task_id,
          task_type: 1,
          assignment_type: 'Installation',
          action: 'reassign',
          assignment_mode: 'manual',
          technician_id: technician_id,
          technician_name: technicianUser.name,
          previous_technician_id: existingTask.assigned_technician_id,
          device_id: existingTask.wp_device_id || existingTask.device_id,
          location: {
              city: normalizedOrderAddress.city,
              district: normalizedOrderAddress.district,
              state: normalizedOrderAddress.state
          },
          modified_by: modified_by,
          reason: null
      });

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
        const { page, limit, skip } = getPaginationParams(req);
        const { status, search } = req.body;
        const db = await database.connectToDatabase();
        const ordersCollection = db.collection("orders");

        const matchStage = {
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
        };

        const buildStatusFilter = (status) => {
            if (!status) return null;
            const statusLower = status.toLowerCase();
            if (statusLower === 'pending') {
                return { 'service_records.task_status': 'Pending' };
            } else if (statusLower === 'inprogress' || statusLower === 'in_progress') {
                return { 'service_records.task_status': { $in: ['In Progress', 'In_Progress', 'in_progress'] } };
            } else if (statusLower === 'completed') {
                return { 'service_records.task_status': 'Completed' };
            } else if (statusLower === 'rejected') {
                return { 'service_records.task_status': 'Rejected' };
            } else if (statusLower === 'unassigned') {
                return { 'service_records.assigned_technician_id': { $in: [null, '', undefined] } };
            }
            return null;
        };

        const buildSearchFilter = (searchTerm) => {
            if (!searchTerm || !searchTerm.trim()) return null;
            const searchRegex = { $regex: searchTerm.trim(), $options: 'i' };
            return {
                $or: [
                    { 'service_records.task_id': searchRegex },
                    { 'service_records.assigned_technician_id': searchRegex },
                    { wp_device_id: searchRegex },
                    { customOrderId: searchRegex }
                ]
            };
        };

        const statusFilter = buildStatusFilter(status);
        const searchFilter = buildSearchFilter(search);

        const filterStage = {};
        if (statusFilter) Object.assign(filterStage, statusFilter);
        if (searchFilter) Object.assign(filterStage, searchFilter);

        const countPipeline = [
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
                $match: { service_records: { $ne: null } }
            }
        ];

        if (Object.keys(filterStage).length > 0) {
            countPipeline.push({ $match: filterStage });
        }

        countPipeline.push({ $count: "total" });

        const countResult = await ordersCollection.aggregate(countPipeline).toArray();
        const total = countResult.length > 0 ? countResult[0].total : 0;

        const dataPipeline = [
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
                $match: { service_records: { $ne: null } }
            }
        ];

        if (Object.keys(filterStage).length > 0) {
            dataPipeline.push({ $match: filterStage });
        }

        dataPipeline.push(
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
                $lookup: {
                    from: "users",
                    localField: "service_records.assigned_technician_id",
                    foreignField: "technician_id",
                    as: "assignedTechnician"
                }
            },
            {
                $addFields: {
                    assignedTechnician: {
                        $arrayElemAt: ["$assignedTechnician", 0]
                    }
                }
            },
            {
                $project: { user: 0, technicianData: 0 }
            },
            {
                $sort: { createdAt: -1 }
            },
            { $skip: skip },
            { $limit: limit }
        );

        const installations = await ordersCollection.aggregate(dataPipeline).toArray();

        return res.status(200).json(formatPaginatedResponse(installations, total, page, limit));

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
        const { page, limit, skip } = getPaginationParams(req);
        const db = await database.connectToDatabase();
        const collection = db.collection("service_records");

        // COUNT PIPELINE
        const countPipeline = [
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
            {
                $match: {
                    $or: [
                        { "order.paymentStatus": "Completed" },
                        { order: null }
                    ]
                }
            },
            { $count: "total" }
        ];

        const countResult = await collection.aggregate(countPipeline).toArray();
        const total = countResult.length > 0 ? countResult[0].total : 0;

        // MAIN FETCH PIPELINE
        const allServices = await collection.aggregate([
            { $match: { task_type: 2 } },
            { $addFields: {   wp_device_id: { $ifNull: ["$device_id", "$wp_device_id"] }} },
            {
                $lookup: {
                    from: "orders",
                    localField: "wp_device_id",
                    foreignField: "wp_device_id",
                    as: "order"
                }
            },
            { $addFields: { order: { $arrayElemAt: ["$order", 0] } } },

            // Updated match condition
            {
                $match: {
                    $or: [
                        { "order.paymentStatus": "Completed" },
                        { order: null }
                    ]
                }
            },

            {
                $lookup: {
                    from: "users",
                    let: { technicianId: "$assigned_technician_id" },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ["$technician_id", "$$technicianId"] },
                                        { $eq: ["$role_id", 2] }
                                    ]
                                }
                            }
                        }
                    ],
                    as: "assignedTechnician"
                }
            },

            {
                $addFields: {
                    assignedTechnician: {
                        $cond: {
                            if: { $gt: [{ $size: "$assignedTechnician" }, 0] },
                            then: { $arrayElemAt: ["$assignedTechnician", 0] },
                            else: null
                        }
                    }
                }
            },

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

            {
                $project: {
                    device_id: 0,
                    order: 0,
                    orderDelivery: 0,
                    normalizedAddress: 0
                }
            },

            { $sort: { created_date: -1 } },
            { $skip: skip },
            { $limit: limit }
        ]).toArray();

        return res.status(200).json(
            formatPaginatedResponse(allServices, total, page, limit)
        );

    } catch (error) {
        console.error("Error in FetchSelectServiceTask:", error);
        logger?.error?.(error);
        return res.status(500).json({
            status: "Failed",
            message: "Internal Server Error"
        });
    }
};


// Send OTP email
async function sendEmailService(to, subject, text, html) {
    try {
        await sendMailWithRetry({
            from: `IonHive Water Purifier <kesavan@outdidtech.com>`,
            to,
            subject,
            text,
            html,
        });
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

async function getDistrictSellers(db, district) {
    if (!district) return [];
    try {
        const usersCollection = db.collection('users');
        const sellers = await usersCollection.find({
            role_id: 4,
            district: { $regex: new RegExp(district, 'i') }
        }).toArray();
        return sellers.map(s => ({ email: s.email, name: s.name })).filter(s => s.email);
    } catch (err) {
        console.error('Error fetching district sellers:', err);
        return [];
    }
}

async function logToAssignmentHistory(db, historyData) {
    try {
        const assignmentHistory = db.collection('assignment_history');
        await assignmentHistory.insertOne({
            ...historyData,
            created_at: new Date()
        });
    } catch (err) {
        console.error('Error logging to assignment history:', err);
    }
}

async function sendEmailToMultiple(recipients, subject, text, html) {
    if (!Array.isArray(recipients) || recipients.length === 0) return;
    for (const recipient of recipients) {
        try {
            await sendEmail(recipient, subject, text, html);
        } catch (err) {
            console.error(`Error sending email to ${recipient}:`, err);
        }
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

        // Check if technician is on leave
        const leaveRequestsCollection = db.collection('leave_requests');
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);

        const approvedLeaves = await leaveRequestsCollection.find({
            technician_id: assigned_technician_id,
            status: 'Approved',
            from_date: { $lte: todayEnd },
            to_date: { $gte: todayStart }
        }).toArray();

        if (approvedLeaves.length > 0) {
            return res.status(400).json({
                status: 'Failed',
                message: 'Technician is on approved leave and cannot be assigned'
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

        // Get district sellers and send notification emails to admin, seller, and technician (NOT to user)
        const districtSellers = await getDistrictSellers(db, normalizedOrderAddress.district);
        const sellerEmails = districtSellers.map(s => s.email);
        const adminEmails = ['admin@gmail.com'];
        const technicianEmail = [technicianUser.email];
        const allNotificationEmails = [...sellerEmails, ...adminEmails, ...technicianEmail];

        const notificationHtml = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border-radius: 10px; background-color: #f9f9f9; border: 1px solid #ddd;">
                <h2 style="color: #333;">New Service Task Assigned</h2>
                <ul style="font-size: 16px; color: #555;">
                    <li><strong>Task ID:</strong> ${task_id}</li>
                    <li><strong>Device ID:</strong> ${wpId}</li>
                    <li><strong>Technician:</strong> ${technicianUser.name || 'N/A'}</li>
                    <li><strong>Customer Email:</strong> ${task_created_by_user_email}</li>
                    <li><strong>Location:</strong> ${normalizedOrderAddress.city}, ${normalizedOrderAddress.district}, ${normalizedOrderAddress.state}</li>
                </ul>
                <p style="font-size: 14px; color: #888; text-align: center; margin-top: 30px; border-top: 1px solid #ddd; padding-top: 10px;">This is an automated notification from IonHive Water Purifier.</p>
            </div>
        `;

        await sendEmailToMultiple(allNotificationEmails, 'Service Task Assigned - IonHive', '', notificationHtml);

        // Log to assignment history
        await logToAssignmentHistory(db, {
            task_id: task_id,
            task_type: 2,
            assignment_type: 'Service',
            action: 'assign',
            assignment_mode: 'manual',
            technician_id: assigned_technician_id,
            technician_name: technicianUser.name,
            previous_technician_id: null,
            device_id: wpId,
            customer_email: task_created_by_user_email,
            location: {
                city: normalizedOrderAddress.city,
                district: normalizedOrderAddress.district,
                state: normalizedOrderAddress.state
            },
            assigned_by: assigned_by,
            reason: null
        });

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

    // 7️⃣ Check if technician is on leave
    const leaveRequestsCollection = db.collection('leave_requests');
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const approvedLeaves = await leaveRequestsCollection.find({
      technician_id: technician_id,
      status: 'Approved',
      from_date: { $lte: todayEnd },
      to_date: { $gte: todayStart }
    }).toArray();

    if (approvedLeaves.length > 0) {
      return res.status(400).json({
        status: 'Failed',
        message: 'Technician is on approved leave and cannot be reassigned'
      });
    }

    // 8️⃣ Update task assignment
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
      // Get district sellers and send notification emails to admin, seller, and new technician (NOT to user)
      const districtSellers = await getDistrictSellers(db, normalizedOrderAddress.district);
      const sellerEmails = districtSellers.map(s => s.email);
      const adminEmails = ['admin@gmail.com'];
      const technicianEmail = [technicianUser.email];
      const allNotificationEmails = [...sellerEmails, ...adminEmails, ...technicianEmail];

      const notificationHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border-radius: 10px; background-color: #f9f9f9; border: 1px solid #ddd;">
              <h2 style="color: #333;">Service Task Re-assigned</h2>
              <ul style="font-size: 16px; color: #555;">
                  <li><strong>Task ID:</strong> ${task_id}</li>
                  <li><strong>Device ID:</strong> ${existingTask.wp_device_id || existingTask.device_id}</li>
                  <li><strong>New Technician:</strong> ${technicianUser.name || 'N/A'}</li>
                  <li><strong>Previous Technician ID:</strong> ${existingTask.assigned_technician_id || 'N/A'}</li>
                  <li><strong>Location:</strong> ${normalizedOrderAddress.city}, ${normalizedOrderAddress.district}, ${normalizedOrderAddress.state}</li>
              </ul>
              <p style="font-size: 14px; color: #888; text-align: center; margin-top: 30px; border-top: 1px solid #ddd; padding-top: 10px;">This is an automated notification from IonHive Water Purifier.</p>
          </div>
      `;

      await sendEmailToMultiple(allNotificationEmails, 'Service Task Re-assigned - IonHive', '', notificationHtml);

      // Log to assignment history
      await logToAssignmentHistory(db, {
          task_id: task_id,
          task_type: 2,
          assignment_type: 'Service',
          action: 'reassign',
          assignment_mode: 'manual',
          technician_id: technician_id,
          technician_name: technicianUser.name,
          previous_technician_id: existingTask.assigned_technician_id,
          device_id: existingTask.wp_device_id || existingTask.device_id,
          location: {
              city: normalizedOrderAddress.city,
              district: normalizedOrderAddress.district,
              state: normalizedOrderAddress.state
          },
          modified_by: modified_by,
          reason: null
      });

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
        const { getPaginationParams, formatPaginatedResponse } = require('../utils/paginationHelper');
        const { district } = req.body || {};
        const db = await database.connectToDatabase();
        const usersCollection = db.collection('users');

        const { page, limit, skip } = getPaginationParams(req, 10);

        const query = { role_id: 4 };
        if (district && String(district).trim() !== '') {
            query.district = new RegExp(`^${String(district).trim()}$`, 'i');
        }

        const total = await usersCollection.countDocuments(query);
        const sellers = await usersCollection.find(query).skip(skip).limit(limit).toArray();
        return res.status(200).json(formatPaginatedResponse(sellers, total, page, limit));
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

        return res.status(200).json({
            status: 'Success',
            data: technicians,
            total: technicians.length
        });
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
        const { district, search } = req.query || {};
        if (!district || String(district).trim() === '') {
            return res.status(400).json({ status: 'Failed', message: 'district is required' });
        }
        const db = await database.connectToDatabase();
        const usersCollection = db.collection('users');

        let query = {
            district: new RegExp(`^${String(district).trim()}$`, 'i'),
            role_id: { $in: [2, 3] }
        };

        // Add search functionality
        if (search && search.trim()) {
            const searchRegex = new RegExp(search.trim(), 'i');
            query = {
                ...query,
                $or: [
                    { name: searchRegex },
                    { email: searchRegex },
                    { phone: searchRegex },
                    { city: searchRegex },
                    { state: searchRegex }
                ]
            };
        }

        const { page, limit, skip } = getPaginationParams(req, 10);
        const total = await usersCollection.countDocuments(query);
        const users = await usersCollection.find(query).sort({ _id: -1 }).skip(skip).limit(limit).toArray();

        return res.status(200).json(formatPaginatedResponse(users, total, page, limit));
    } catch (error) {
        console.error('Error in GetUsersByDistrict:', error);
        logger?.error?.(error);
        return res.status(500).json({ status: 'Failed', message: 'Internal Server Error' });
    }
};

// GetUsersByDistrictCount - API to get total count for district users with search
const GetUsersByDistrictCount = async (req, res) => {
    try {
        const { district, search } = req.query || {};
        if (!district || String(district).trim() === '') {
            return res.status(400).json({ status: 'Failed', message: 'district is required' });
        }
        const db = await database.connectToDatabase();
        const usersCollection = db.collection('users');

        let query = {
            district: new RegExp(`^${String(district).trim()}$`, 'i'),
            role_id: { $in: [2, 3] }
        };

        // Add search functionality
        if (search && search.trim()) {
            const searchRegex = new RegExp(search.trim(), 'i');
            query = {
                ...query,
                $or: [
                    { name: searchRegex },
                    { email: searchRegex },
                    { phone: searchRegex },
                    { city: searchRegex },
                    { state: searchRegex }
                ]
            };
        }

        const total = await usersCollection.countDocuments(query);

        return res.status(200).json({
            status: 'Success',
            totalRecords: total
        });
    } catch (error) {
        console.error('Error in GetUsersByDistrictCount:', error);
        logger?.error?.(error);
        return res.status(500).json({ status: 'Failed', message: 'Internal Server Error' });
    }
};

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
        const query = { 'deliveryAddress.district': districtRegex };

        const { page, limit, skip } = getPaginationParams(req, 10);
        const total = await ordersCollection.countDocuments(query);
        const orders = await ordersCollection.find(query).sort({ _id: -1 }).skip(skip).limit(limit).toArray();

        const userIds = [...new Set(orders.map(o => o.user_id))];
        const users = await usersCollection.find({ user_id: { $in: userIds } }).toArray();
        const userMap = {};
        users.forEach(u => { userMap[u.user_id] = u.email; });
        const ordersWithEmail = orders.map(o => ({ ...o, email: userMap[o.user_id] || null }));

        return res.status(200).json(formatPaginatedResponse(ordersWithEmail, total, page, limit));
    } catch (error) {
        console.error('Error in GetOrdersByDistrict:', error);
        logger?.error?.(error);
        return res.status(500).json({ status: 'Failed', message: 'Internal Server Error' });
    }
};

const GetInstallationsByDistrict = async (req, res) => {
  try {
    const { district, status, search } = req.query || {};
    const { page, limit, skip } = getPaginationParams(req);

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
      matchStage["deliveryAddress.district"] = new RegExp(`^${String(district).trim()}$`, "i");
    }

    const buildStatusFilter = (status) => {
      if (!status) return null;
      const statusLower = status.toLowerCase();
      if (statusLower === 'pending') {
        return { 'service_records.task_status': 'Pending' };
      } else if (statusLower === 'inprogress' || statusLower === 'in_progress') {
        return { 'service_records.task_status': { $in: ['In Progress', 'In_Progress', 'in_progress'] } };
      } else if (statusLower === 'completed') {
        return { 'service_records.task_status': 'Completed' };
      } else if (statusLower === 'rejected') {
        return { 'service_records.task_status': 'Rejected' };
      } else if (statusLower === 'unassigned') {
        return { 'service_records.assigned_technician_id': { $in: [null, '', undefined] } };
      }
      return null;
    };

    const buildSearchFilter = (searchTerm) => {
      if (!searchTerm || !searchTerm.trim()) return null;
      const searchRegex = { $regex: searchTerm.trim(), $options: 'i' };
      return {
        $or: [
          { 'service_records.task_id': searchRegex },
          { 'service_records.assigned_technician_id': searchRegex },
          { wp_device_id: searchRegex },
          { customOrderId: searchRegex }
        ]
      };
    };

    const statusFilter = buildStatusFilter(status);
    const searchFilter = buildSearchFilter(search);

    const filterStage = {};
    if (statusFilter) Object.assign(filterStage, statusFilter);
    if (searchFilter) Object.assign(filterStage, searchFilter);

    const totalCountPipeline = [
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
        $match: { service_records: { $ne: null } }
      }
    ];

    if (Object.keys(filterStage).length > 0) {
      totalCountPipeline.push({ $match: filterStage });
    }

    totalCountPipeline.push({ $count: "total" });

    const countResult = await ordersCollection.aggregate(totalCountPipeline).toArray();
    const total = countResult.length > 0 ? countResult[0].total : 0;

    const dataPipeline = [
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
        $match: { service_records: { $ne: null } }
      }
    ];

    if (Object.keys(filterStage).length > 0) {
      dataPipeline.push({ $match: filterStage });
    }

    dataPipeline.push(
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
        $lookup: {
          from: "users",
          let: { techId: { $arrayElemAt: ["$service_records.assigned_technician_id", 0] } },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$employee_id", "$$techId"] }
              }
            }
          ],
          as: "technicianData"
        }
      },
      {
        $addFields: {
          assignedTechnician: {
            $cond: [
              { $gt: [{ $size: "$technicianData" }, 0] },
              {
                technician_id: { $arrayElemAt: ["$technicianData.employee_id", 0] },
                technician_name: { $arrayElemAt: ["$technicianData.name", 0] },
                technician_email: { $arrayElemAt: ["$technicianData.email", 0] },
                technician_phone: { $arrayElemAt: ["$technicianData.phone", 0] },
                name: { $arrayElemAt: ["$technicianData.name", 0] },
                email: { $arrayElemAt: ["$technicianData.email", 0] },
                phone: { $arrayElemAt: ["$technicianData.phone", 0] }
              },
              null
            ]
          }
        }
      },
      {
        $project: { user: 0, technicianData: 0 }
      },
      {
        $sort: { createdAt: -1 }
      },
      { $skip: skip },
      { $limit: limit }
    );

    const installations = await ordersCollection.aggregate(dataPipeline).toArray();

    return res.status(200).json(formatPaginatedResponse(installations, total, page, limit));

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
    const { page, limit, skip } = getPaginationParams(req);
    const db = await database.connectToDatabase();
    const serviceRecordsCollection = db.collection("service_records");

    const baseMatchStage = {
      task_type: 2
    };

    const countPipeline = [
      { $match: baseMatchStage },
      {
        $addFields: {
          resolvedDeviceId: {
            $ifNull: ["$wp_device_id", "$device_id"]
          }
        }
      },
      {
        $lookup: {
          from: "orders",
          localField: "resolvedDeviceId",
          foreignField: "wp_device_id",
          as: "order"
        }
      },
      {
        $addFields: {
          order: { $arrayElemAt: ["$order", 0] }
        }
      },
      {
        $addFields: {
          orderDelivery: "$order.deliveryAddress"
        }
      },
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
      { $match: { "order.paymentStatus": "Completed" } },
      { $count: "total" }
    ];

    const countResult = await serviceRecordsCollection.aggregate(countPipeline).toArray();
    const total = countResult.length > 0 ? countResult[0].total : 0;

    const pipeline = [
      { $match: baseMatchStage },
      {
        $addFields: {
          resolvedDeviceId: {
            $ifNull: ["$wp_device_id", "$device_id"]
          }
        }
      },
      {
        $lookup: {
          from: "orders",
          localField: "resolvedDeviceId",
          foreignField: "wp_device_id",
          as: "order"
        }
      },
      {
        $addFields: {
          order: { $arrayElemAt: ["$order", 0] }
        }
      },
      {
        $addFields: {
          orderDelivery: "$order.deliveryAddress"
        }
      },
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
      { $match: { "order.paymentStatus": "Completed" } },
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
      {
        $addFields: {
          wp_device_id: { $ifNull: ["$wp_device_id", "$resolvedDeviceId"] }
        }
      },
      {
        $project: {
          device_id: 0,
          order: 0,
          orderDelivery: 0,
          addressObject: 0,
          resolvedDeviceId: 0
        }
      },
      {
        $sort: { createdAt: -1 }
      },
      { $skip: skip },
      { $limit: limit }
    ];

    const services = await serviceRecordsCollection.aggregate(pipeline).toArray();

    return res.status(200).json(formatPaginatedResponse(services, total, page, limit));

  } catch (error) {
    console.error('Error in GetServicesByDistrict:', error);
    logger?.error?.(error);
    return res.status(500).json({ status: 'Failed', message: 'Internal Server Error' });
  }
};


const FetchInstalledDevicesForRequests = async (req, res) => {
  try {
    const { district } = req.body || {};
    const db = await database.connectToDatabase();
    const serviceRecordsCollection = db.collection("service_records");
    const ordersCollection = db.collection("orders");
    const usersCollection = db.collection("users");

    const installations = await serviceRecordsCollection.find({
      task_type: 1,
      task_status: { $regex: /^completed$/i }
    }).toArray();

    if (!installations.length) {
      return res.status(200).json({ status: 'Success', data: [] });
    }

    const normalizeDeviceKey = (value) => {
      if (value === null || value === undefined) {
        return '';
      }
      const stringValue = String(value).trim();
      return stringValue.toLowerCase();
    };

    const deviceIds = installations
      .map(item => item.wp_device_id || item.device_id)
      .filter(Boolean);

    const manualTasks = deviceIds.length
      ? await serviceRecordsCollection.find(
          {
            task_type: 3,
            $or: [
              { wp_device_id: { $in: deviceIds } },
              { device_id: { $in: deviceIds } }
            ]
          },
          { projection: { wp_device_id: 1, device_id: 1, task_status: 1 } }
        ).toArray()
      : [];

    const blockedDeviceIds = new Set();
    manualTasks.forEach(task => {
      const status = String(task?.task_status || '').trim().toLowerCase();
      if (status !== 'completed') {
        const id = task?.wp_device_id || task?.device_id;
        const normalized = normalizeDeviceKey(id);
        if (normalized) {
          blockedDeviceIds.add(normalized);
        }
      }
    });

    const orders = deviceIds.length
      ? await ordersCollection.find({ wp_device_id: { $in: deviceIds } }).toArray()
      : [];

    const deviceDetailsCollection = db.collection("device_details");
    const deviceDetails = deviceIds.length
      ? await deviceDetailsCollection.find({ wp_device_id: { $in: deviceIds } }).toArray()
      : [];

    // Get product models
    const modelIds = [...new Set(deviceDetails.map(device => device.model_id).filter(Boolean))];
    const productModelsCollection = db.collection("product_models");
    const productModels = await productModelsCollection.find({}).toArray();

    const orderMap = new Map();
    orders.forEach(order => {
      if (order?.wp_device_id) {
        orderMap.set(order.wp_device_id, order);
      }
    });

    const deviceDetailMap = new Map();
    deviceDetails.forEach(detail => {
      if (detail?.wp_device_id) {
        deviceDetailMap.set(detail.wp_device_id, detail);
      }
    });

    const userIdsSet = new Set();
    installations.forEach(item => {
      if (item.task_created_by_user_id) {
        userIdsSet.add(item.task_created_by_user_id);
      }
      const order = orderMap.get(item.wp_device_id || item.device_id);
      if (order?.user_id) {
        userIdsSet.add(order.user_id);
      }
    });

    const userIds = Array.from(userIdsSet);
    const users = userIds.length
      ? await usersCollection.find({ user_id: { $in: userIds } }).toArray()
      : [];
    const userMap = new Map();
    users.forEach(user => {
      userMap.set(user.user_id, user);
    });

    const modelMap = new Map();
    productModels.forEach(model => {
      const id = model.model_id || model._id?.toString() || model.id;
      if (id) {
        modelMap.set(id, model);
        // Also set by string version for cross-matching
        modelMap.set(id.toString(), model);
      }
    });

    const normalizedDistrict = String(district || '').trim().toLowerCase();

    const devices = installations
      .map(item => {
        const deviceId = item.wp_device_id || item.device_id || '';
        const normalizedDeviceKey = normalizeDeviceKey(deviceId);
        if (blockedDeviceIds.has(normalizedDeviceKey)) {
          return null;
        }
        const order = orderMap.get(deviceId) || null;
        const detail = deviceDetailMap.get(deviceId) || null;
        const ownerUserId = item.task_created_by_user_id || order?.user_id || null;
        const owner = ownerUserId !== null ? userMap.get(ownerUserId) || null : null;
        const addressSource = item.deliveryAddress || item.address || order?.deliveryAddress || {};
        const normalizedAddress = normalizeDeliveryAddress(addressSource || {});
        const planConfig = detail?.plan_config || {};
        const currentPlan =
          planConfig?.name ||
          planConfig?.planName ||
          planConfig?.plan ||
          planConfig?.totalWaterLimit ||
          null;
        const currentPlanEndDate = planConfig?.endDate || null;
        const currentDuration = resolvePlanDurationFromSources(
          planConfig,
          detail?.selectedDuration,
          order?.selectedDuration,
          item?.selectedDuration
        );
        const macId = detail?.mac_id || detail?.enter_mac_id || null;
        const modelId =
          detail?.model_id ||
          order?.model_id ||
          order?.productModelId ||
          null;
        const modelName =
          detail?.model_name ||
          order?.modelName ||
          item.product?.model_name ||
          modelMap.get(modelId)?.model_name ||
          modelMap.get(modelId)?.modelName ||
          modelMap.get(modelId)?.name ||
          null;
        const modelType =
          detail?.model_type ||
          order?.modelType ||
          order?.modeltype ||
          modelMap.get(modelId)?.model_type ||
          modelMap.get(modelId)?.modelType ||
          modelMap.get(modelId)?.modeltype ||
          null;
        const detailId = detail?._id ? detail._id.toString() : null;

        return {
          task_id: item.task_id || null,
          wp_device_id: deviceId,
          user_id: ownerUserId,
          customer_name: owner?.name || normalizedAddress?.name || null,
          customer_email: owner?.email || normalizedAddress?.email || null,
          customer_phone: owner?.phone || normalizedAddress?.phone || null,
          district: normalizedAddress.district || '',
          state: normalizedAddress.state || '',
          city: normalizedAddress.city || '',
          deliveryAddress: addressSource || {},
          model_id: modelId,
          model_name: modelName,
          model_type: modelType,
          current_plan: currentPlan,
          current_plan_end_date: currentPlanEndDate,
          current_duration: currentDuration,
          mac_id: macId,
          device_detail_id: detailId,
          customOrderId: order?.customOrderId || null,
          order_id: order?._id ? order._id.toString() : null
        };
      })
      .filter(record => {
        if (!record) {
          return false;
        }
        if (!normalizedDistrict) {
          return true;
        }
        return record.district && record.district.toLowerCase() === normalizedDistrict;
      });

    return res.status(200).json({ status: 'Success', data: devices });
  } catch (error) {
    console.error('Error in FetchInstalledDevicesForRequests:', error);
    logger?.error?.(error);
    return res.status(500).json({ status: 'Failed', message: 'Internal Server Error' });
  }
};

const CreateManualRequest = async (req, res) => {
  try {
    const {
      wp_device_id,
      customer_user_id,
      request_source,
      priority,
      preferred_schedule,
      address,
      assigned_technician_id,
      technician_id,
      request_type
    } = req.body || {};

    const deviceId = typeof wp_device_id === 'string' ? wp_device_id.trim() : '';
    const parsedCustomerId = Number(customer_user_id);
    const requestedTechnicianId = typeof assigned_technician_id === 'string' && assigned_technician_id.trim()
      ? assigned_technician_id.trim()
      : typeof technician_id === 'string' && technician_id.trim()
        ? technician_id.trim()
        : '';

    const normalizedRequestType = typeof request_type === 'string' ? request_type.trim().toLowerCase() : '';
    const requestTypeValue = normalizedRequestType === 'return' || normalizedRequestType === 'renewal' ? normalizedRequestType : '';

    if (!deviceId || !Number.isInteger(parsedCustomerId)) {
      return res.status(400).json({ status: 'Failed', message: 'wp_device_id and customer_user_id are required' });
    }

    const db = await database.connectToDatabase();
    const serviceRecordsCollection = db.collection("service_records");
    const ordersCollection = db.collection("orders");
    const usersCollection = db.collection("users");
    const deviceDetailsCollection = db.collection("device_details");
    const technicianDetailsCollection = db.collection("technician_details");

    const customerUser = await usersCollection.findOne({ user_id: parsedCustomerId });
    if (!customerUser) {
      return res.status(404).json({ status: 'Failed', message: 'Customer not found' });
    }

    const installationRecord = await serviceRecordsCollection.findOne({ wp_device_id: deviceId, task_type: 1 });
    if (!installationRecord) {
      return res.status(404).json({ status: 'Failed', message: 'Installation record not found for the device' });
    }
    if (!installationRecord.task_status || installationRecord.task_status.toLowerCase() !== 'completed') {
      return res.status(400).json({ status: 'Failed', message: 'Installation is not completed for the selected device' });
    }

    const orderDoc = await ordersCollection.findOne({ wp_device_id: deviceId });
    const deviceDetail = await deviceDetailsCollection.findOne({ wp_device_id: deviceId });

    if (!deviceDetail) {
      return res.status(404).json({ status: 'Failed', message: 'Device details not found for the selected device' });
    }

    // Fetch product model to get model object id
    const productModelsCollection = db.collection('product_models');
    const productModel = deviceDetail.model_id ? await productModelsCollection.findOne({ model_id: deviceDetail.model_id }) : null;

    const addressSource = address && typeof address === 'object'
      ? address
      : installationRecord.deliveryAddress || installationRecord.address || orderDoc?.deliveryAddress || {};
    const normalizedAddress = normalizeDeliveryAddress(addressSource || {});

    let requester = null;
    if (req.user?.userId) {
      try {
        requester = await usersCollection.findOne({ _id: new ObjectId(req.user.userId) });
      } catch (err) {
        requester = null;
      }
    }

    if (req.user?.role_id === 4) {
      const sellerDistrict = String(requester?.assigned_district || requester?.district || '').trim().toLowerCase();
      const requestDistrict = String(normalizedAddress.district || '').trim().toLowerCase();
      if (sellerDistrict && requestDistrict && sellerDistrict !== requestDistrict) {
        return res.status(403).json({ status: 'Failed', message: 'Seller can only create requests within assigned district' });
      }
    }

    let technician = null;
    if (requestedTechnicianId) {
      technician = await usersCollection.findOne({ technician_id: requestedTechnicianId });
      if (!technician) {
        return res.status(404).json({ status: 'Failed', message: 'Technician not found' });
      }
    }

    if (requestedTechnicianId) {
      const technicianDistrict = normalizeDeliveryAddress({ district: technician.district || technician.assigned_district || '' }).district;
      const requestDistrict = normalizedAddress.district || '';
      if (technicianDistrict && requestDistrict && technicianDistrict.toLowerCase() !== requestDistrict.toLowerCase()) {
        return res.status(400).json({ status: 'Failed', message: 'Technician district does not match request district' });
      }
    }

    const lastTask = await serviceRecordsCollection.find().sort({ task_id: -1 }).limit(1).toArray();
    const nextTaskId = lastTask.length > 0 ? lastTask[0].task_id + 1 : 1;
    const now = new Date();

    const planConfig = deviceDetail?.plan_config || {};
    const currentPlan =
      planConfig?.name ||
      planConfig?.planName ||
      planConfig?.plan ||
      planConfig?.totalWaterLimit ||
      null;
    const currentPlanEndDate = planConfig?.endDate || null;
    const currentDuration = resolvePlanDuration(planConfig);
    const macId = deviceDetail?.mac_id || deviceDetail?.enter_mac_id || null;
    const modelName = deviceDetail?.model_name || orderDoc?.modelName || installationRecord?.product?.model_name || null;
    const modelType = deviceDetail?.model_type || orderDoc?.modelType || null;
    const modelId = deviceDetail?.model_id || orderDoc?.model_id || null;
    const detailId = deviceDetail?._id ? deviceDetail._id.toString() : null;

    const productSnapshot = buildProductSnapshot({
      deviceId,
      modelName,
      planSources: [
        req.body?.product?.selectedPlan,
        req.body?.selectedPlan,
        installationRecord?.product?.selectedPlan,
        orderDoc?.selectedPlan,
        deviceDetail?.selectedPlan,
        deviceDetail?.plan_config?.selectedPlan,
        deviceDetail?.plan_config?.plan,
        deviceDetail?.plan_config?.plans,
        deviceDetail?.plan_config
      ],
      durationSources: [
        req.body?.product?.selectedDuration,
        req.body?.selectedDuration,
        installationRecord?.product?.selectedDuration,
        orderDoc?.selectedDuration,
        deviceDetail?.selectedDuration,
        deviceDetail?.plan_config?.selectedDuration,
        deviceDetail?.plan_config?.duration,
        deviceDetail?.plan_config?.duration_details,
        deviceDetail?.plan_config?.durationDetails
      ]
    });

    let taskStatus = 'Unassigned';
    let assignedDate = null;
    let assignmentHistory = [];
    let assignedBy = null;
    let modifiedBy = null;
    let modifiedDate = null;
    let otp = null;

    if (requestedTechnicianId) {
      taskStatus = 'Pending';
      assignedDate = now;
      assignedBy = requester?.email || 'system';
      modifiedBy = assignedBy;
      modifiedDate = now;
      otp = Math.floor(100000 + Math.random() * 900000);
      assignmentHistory = [
        {
          technician_id: requestedTechnicianId,
          assigned_by: assignedBy,
          assigned_date: now
        }
      ];
    }

    const newTask = {
      task_id: nextTaskId,
      task_type: 3,
      task_status: taskStatus,
      wp_device_id: deviceId,
      task_created_by_user_id: customerUser.user_id,
      task_created_by_user_email: customerUser.email,
      customer_phone: customerUser.phone || null,
      created_date: now,
      created_by: requester?.email || customerUser.email,
      created_by_user_id: requester?.user_id || null,
      created_by_role_id: req.user?.role_id || null,
      request_source: request_source || 'manual',
      request_type: requestTypeValue || null,
      priority: priority || 'normal',
      preferred_schedule: preferred_schedule || null,
      assigned_technician_id: requestedTechnicianId || null,
      assigned_date: assignedDate,
      pending_reason: null,
      assignment_history: assignmentHistory,
      deliveryAddress: addressSource || {},
      district: normalizedAddress.district || '',
      state: normalizedAddress.state || '',
      city: normalizedAddress.city || '',
      customOrderId: orderDoc?.customOrderId || null,
      order_user_id: orderDoc?.user_id || customerUser.user_id,
      order_reference_id: orderDoc?._id ? orderDoc._id.toString() : null,
      model_id: modelId,
      model_object_id: productModel?._id ? productModel._id.toString() : null,
      model_name: modelName,
      model_type: modelType,
      current_plan: currentPlan,
      current_plan_end_date: currentPlanEndDate,
      current_duration: currentDuration,
      mac_id: macId,
      device_detail_id: detailId,
      assigned_by: assignedBy,
      modified_by: modifiedBy,
      modified_date: modifiedDate,
      otp,
      ...(productSnapshot ? { product: productSnapshot } : {})
    };

    Object.keys(newTask).forEach(key => {
      if (newTask[key] === undefined) {
        delete newTask[key];
      }
    });

    const insertResult = await serviceRecordsCollection.insertOne(newTask);
    newTask._id = insertResult.insertedId;

    if (requestedTechnicianId) {
      await technicianDetailsCollection.updateOne(
        { technician_id: requestedTechnicianId },
        {
          $set: {
            user_id: technician.user_id,
            role_id: technician.role_id,
            email: technician.email,
            technician_id: requestedTechnicianId,
            status: true
          },
          $inc: { total_assigned_services: 1 }
        },
        { upsert: true }
      );

      let customerEmail = newTask.task_created_by_user_email || null;
      if (!customerEmail && newTask.task_created_by_user_id) {
        const customer = await usersCollection.findOne({ user_id: newTask.task_created_by_user_id });
        if (customer?.email) {
          customerEmail = customer.email;
        }
      }

      if (customerEmail && otp) {
        await sendAssignServiceEmail(customerEmail, otp);
      }
    }

    return res.status(200).json({ status: 'Success', message: 'Manual request created successfully', data: newTask });
  } catch (error) {
    console.error('Error in CreateManualRequest:', error);
    logger?.error?.(error);
    return res.status(500).json({ status: 'Failed', message: 'Internal Server Error' });
  }
};

const FetchManualRequests = async (req, res) => {
  try {
    const { district } = req.body || {};
    const db = await database.connectToDatabase();
    const serviceRecordsCollection = db.collection("service_records");
    const ordersCollection = db.collection("orders");
    const usersCollection = db.collection("users");
    const deviceDetailsCollection = db.collection("device_details");

    const { page, limit, skip } = getPaginationParams(req, 10);

    const baseFilter = { task_type: 3 };
    const total = await serviceRecordsCollection.countDocuments(baseFilter);

    if (!total) {
      return res.status(200).json(formatPaginatedResponse([], 0, page, limit));
    }

    const tasks = await serviceRecordsCollection
      .find(baseFilter)
      .sort({ created_date: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    const deviceIds = tasks
      .map(task => task.wp_device_id || task.device_id)
      .filter(Boolean);

    const orders = deviceIds.length
      ? await ordersCollection.find({ wp_device_id: { $in: deviceIds } }).toArray()
      : [];

    const deviceDetails = deviceIds.length
      ? await deviceDetailsCollection.find({ wp_device_id: { $in: deviceIds } }).toArray()
      : [];

    const orderMap = new Map();
    orders.forEach(order => {
      if (order?.wp_device_id) {
        orderMap.set(order.wp_device_id, order);
      }
    });

    const deviceDetailMap = new Map();
    deviceDetails.forEach(detail => {
      if (detail?.wp_device_id) {
        deviceDetailMap.set(detail.wp_device_id, detail);
      }
    });

    const technicianIds = tasks
      .map(task => task.assigned_technician_id)
      .filter(Boolean);

    const technicians = technicianIds.length
      ? await usersCollection.find({ technician_id: { $in: technicianIds } }).toArray()
      : [];

    const technicianMap = new Map();
    technicians.forEach(tech => {
      if (tech?.technician_id) {
        technicianMap.set(tech.technician_id, tech);
      }
    });

    const requestDistrict = String(district || '').trim().toLowerCase();

    const response = tasks
      .map(task => {
        const deviceId = task.wp_device_id || task.device_id || '';
        const order = orderMap.get(deviceId) || null;
        const detail = deviceDetailMap.get(deviceId) || null;
        const addressSource = task.deliveryAddress || task.address || order?.deliveryAddress || {};
        const normalizedAddress = normalizeDeliveryAddress(addressSource || {});
        const technician = task.assigned_technician_id ? technicianMap.get(task.assigned_technician_id) || null : null;
        const planConfig = detail?.plan_config || {};
        const currentPlan =
          task.current_plan ||
          planConfig?.name ||
          planConfig?.planName ||
          planConfig?.plan ||
          planConfig?.totalWaterLimit ||
          null;
        const currentPlanEndDate = task.current_plan_end_date || planConfig?.endDate || null;
        const currentDuration = task.current_duration || resolvePlanDuration(planConfig);
        const macId = task.mac_id || detail?.mac_id || detail?.enter_mac_id || null;
        const modelName = task.model_name || detail?.model_name || order?.modelName || null;
        const modelType = task.model_type || detail?.model_type || order?.modelType || null;
        const modelId = task.model_id || detail?.model_id || order?.model_id || null;
        const detailId = task.device_detail_id || (detail?._id ? detail._id.toString() : null);

        const sanitizedTask = { ...task };
        delete sanitizedTask.address;
        delete sanitizedTask.task_description;
        delete sanitizedTask.metadata;
        delete sanitizedTask.modelName;
        delete sanitizedTask.modelType;
        delete sanitizedTask.currentPlan;
        delete sanitizedTask.currentPlanEndDate;
        delete sanitizedTask.currentDuration;
        delete sanitizedTask.macId;
        delete sanitizedTask.deviceDetailId;
        delete sanitizedTask.product;

        const productSnapshot = buildProductSnapshot({
          deviceId,
          modelName,
          planSources: [
            task.product?.selectedPlan,
            task.selectedPlan,
            order?.selectedPlan,
            detail?.selectedPlan,
            detail?.plan_config?.selectedPlan,
            detail?.plan_config?.plan,
            detail?.plan_config?.plans,
            detail?.plan_config
          ],
          durationSources: [
            task.product?.selectedDuration,
            task.selectedDuration,
            order?.selectedDuration,
            detail?.selectedDuration,
            detail?.plan_config?.selectedDuration,
            detail?.plan_config?.duration,
            detail?.plan_config?.duration_details,
            detail?.plan_config?.durationDetails,
            task.current_duration ? { duration_time_limit: task.current_duration } : null
          ]
        });

        return {
          ...sanitizedTask,
          deliveryAddress: addressSource || {},
          order_snapshot: order
            ? {
                ...order,
                _id: order._id ? order._id.toString() : null
              }
            : null,
          district: normalizedAddress.district || task.district || '',
          state: normalizedAddress.state || task.state || '',
          city: normalizedAddress.city || task.city || '',
          model_id: modelId,
          model_name: modelName,
          model_type: modelType,
          current_plan: currentPlan,
          current_plan_end_date: currentPlanEndDate,
          current_duration: currentDuration,
          mac_id: macId,
          device_detail_id: detailId,
          product: productSnapshot || null,
          assignedTechnician: technician
            ? {
                technician_id: technician.technician_id,
                name: technician.name,
                email: technician.email,
                phone: technician.phone || technician.mobile || null,
                user_id: technician.user_id || null,
                role_id: technician.role_id || null,
                district: technician.district || technician.assigned_district || null
              }
            : null
        };
      })
      .filter(task => {
        if (!requestDistrict) {
          return true;
        }
        return task.district && task.district.toLowerCase() === requestDistrict;
      });

    return res.status(200).json(formatPaginatedResponse(response, total, page, limit));
  } catch (error) {
    console.error('Error in FetchManualRequests:', error);
    logger?.error?.(error);
    return res.status(500).json({ status: 'Failed', message: 'Internal Server Error' });
  }
};

const FetchManualRequestsBySellerDistrict = async (req, res) => {
  try {
    let sellerDistrict = '';

    if (req.user?.role_id === 4) {
      const db = await database.connectToDatabase();
      const usersCollection = db.collection("users");

      let requester = null;
      if (req.user?.userId) {
        try {
          requester = await usersCollection.findOne({ _id: new ObjectId(req.user.userId) });
        } catch (err) {
          requester = null;
        }
      }

      sellerDistrict = String(requester?.assigned_district || requester?.district || '').trim().toLowerCase();
      if (!sellerDistrict) {
        return res.status(400).json(formatPaginatedResponse([], 0, 1, 10));
      }
    }

    const db = await database.connectToDatabase();
    const serviceRecordsCollection = db.collection("service_records");
    const ordersCollection = db.collection("orders");
    const usersCollection = db.collection("users");
    const deviceDetailsCollection = db.collection("device_details");

    const { page, limit, skip } = getPaginationParams(req, 10);

    const baseFilter = { task_type: 3 };
    let total = await serviceRecordsCollection.countDocuments(baseFilter);

    if (!total) {
      return res.status(200).json(formatPaginatedResponse([], 0, page, limit));
    }

    const tasks = await serviceRecordsCollection
      .find(baseFilter)
      .sort({ created_date: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    const deviceIds = tasks
      .map(task => task.wp_device_id || task.device_id)
      .filter(Boolean);

    const orders = deviceIds.length
      ? await ordersCollection.find({ wp_device_id: { $in: deviceIds } }).toArray()
      : [];

    const deviceDetails = deviceIds.length
      ? await deviceDetailsCollection.find({ wp_device_id: { $in: deviceIds } }).toArray()
      : [];

    const orderMap = new Map();
    orders.forEach(order => {
      if (order?.wp_device_id) {
        orderMap.set(order.wp_device_id, order);
      }
    });

    const deviceDetailMap = new Map();
    deviceDetails.forEach(detail => {
      if (detail?.wp_device_id) {
        deviceDetailMap.set(detail.wp_device_id, detail);
      }
    });

    const technicianIds = tasks
      .map(task => task.assigned_technician_id)
      .filter(Boolean);

    const technicians = technicianIds.length
      ? await usersCollection.find({ technician_id: { $in: technicianIds } }).toArray()
      : [];

    const technicianMap = new Map();
    technicians.forEach(tech => {
      if (tech?.technician_id) {
        technicianMap.set(tech.technician_id, tech);
      }
    });

    const response = tasks
      .map(task => {
        const deviceId = task.wp_device_id || task.device_id || '';
        const order = orderMap.get(deviceId) || null;
        const detail = deviceDetailMap.get(deviceId) || null;
        const addressSource = task.deliveryAddress || task.address || order?.deliveryAddress || {};
        const normalizedAddress = normalizeDeliveryAddress(addressSource || {});
        const technician = task.assigned_technician_id ? technicianMap.get(task.assigned_technician_id) || null : null;
        const planConfig = detail?.plan_config || {};
        const currentPlan =
          task.current_plan ||
          planConfig?.name ||
          planConfig?.planName ||
          planConfig?.plan ||
          planConfig?.totalWaterLimit ||
          null;
        const currentPlanEndDate = task.current_plan_end_date || planConfig?.endDate || null;
        const currentDuration = task.current_duration || resolvePlanDuration(planConfig);
        const macId = task.mac_id || detail?.mac_id || detail?.enter_mac_id || null;
        const modelName = task.model_name || detail?.model_name || order?.modelName || null;
        const modelType = task.model_type || detail?.model_type || order?.modelType || null;
        const modelId = task.model_id || detail?.model_id || order?.model_id || null;
        const detailId = task.device_detail_id || (detail?._id ? detail._id.toString() : null);

        const sanitizedTask = { ...task };
        delete sanitizedTask.address;
        delete sanitizedTask.task_description;
        delete sanitizedTask.metadata;
        delete sanitizedTask.modelName;
        delete sanitizedTask.modelType;
        delete sanitizedTask.currentPlan;
        delete sanitizedTask.currentPlanEndDate;
        delete sanitizedTask.currentDuration;
        delete sanitizedTask.macId;
        delete sanitizedTask.deviceDetailId;
        delete sanitizedTask.product;

        const productSnapshot = buildProductSnapshot({
          deviceId,
          modelName,
          planSources: [
            task.product?.selectedPlan,
            task.selectedPlan,
            order?.selectedPlan,
            detail?.selectedPlan,
            detail?.plan_config?.selectedPlan,
            detail?.plan_config?.plan,
            detail?.plan_config?.plans,
            detail?.plan_config
          ],
          durationSources: [
            task.product?.selectedDuration,
            task.selectedDuration,
            order?.selectedDuration,
            detail?.selectedDuration,
            detail?.plan_config?.selectedDuration,
            detail?.plan_config?.duration,
            detail?.plan_config?.duration_details,
            detail?.plan_config?.durationDetails,
            task.current_duration ? { duration_time_limit: task.current_duration } : null
          ]
        });

        return {
          ...sanitizedTask,
          deliveryAddress: addressSource || {},
          order_snapshot: order
            ? {
                ...order,
                _id: order._id ? order._id.toString() : null
              }
            : null,
          district: normalizedAddress.district || task.district || '',
          state: normalizedAddress.state || task.state || '',
          city: normalizedAddress.city || task.city || '',
          model_id: modelId,
          model_name: modelName,
          model_type: modelType,
          current_plan: currentPlan,
          current_plan_end_date: currentPlanEndDate,
          current_duration: currentDuration,
          mac_id: macId,
          device_detail_id: detailId,
          product: productSnapshot || null,
          assignedTechnician: technician
            ? {
                technician_id: technician.technician_id,
                name: technician.name,
                email: technician.email,
                phone: technician.phone || technician.mobile || null,
                user_id: technician.user_id || null,
                role_id: technician.role_id || null,
                district: technician.district || technician.assigned_district || null
              }
            : null
        };
      })
      .filter(task => {
        if (!sellerDistrict) {
          return true;
        }
        return task.district && task.district.toLowerCase() === sellerDistrict;
      });

    const filteredTotal = response.length;
    const paginatedResponse = response.slice(0, limit);

    return res.status(200).json(formatPaginatedResponse(paginatedResponse, filteredTotal, page, limit));
  } catch (error) {
    console.error('Error in FetchManualRequestsBySellerDistrict:', error);
    logger?.error?.(error);
    return res.status(500).json({ status: 'Failed', message: 'Internal Server Error' });
  }
};

const AssignManualRequest = async (req, res) => {
  try {
    const { task_id, technician_id } = req.body || {};

    const numericTaskId = Number(task_id);
    if (!Number.isInteger(numericTaskId) || !technician_id) {
      return res.status(400).json({ status: 'Failed', message: 'task_id and technician_id are required' });
    }

    const db = await database.connectToDatabase();
    const serviceRecordsCollection = db.collection("service_records");
    const usersCollection = db.collection("users");
    const technicianDetailsCollection = db.collection("technician_details");

    const task = await serviceRecordsCollection.findOne({ task_id: numericTaskId, task_type: 3 });
    if (!task) {
      return res.status(404).json({ status: 'Failed', message: 'Manual request not found' });
    }

    if (task.task_status && task.task_status.toLowerCase() === 'completed') {
      return res.status(400).json({ status: 'Failed', message: 'Completed requests cannot be assigned' });
    }

    const technician = await usersCollection.findOne({ technician_id });
    if (!technician) {
      return res.status(404).json({ status: 'Failed', message: 'Technician not found' });
    }

    let requester = null;
    if (req.user?.userId) {
      try {
        requester = await usersCollection.findOne({ _id: new ObjectId(req.user.userId) });
      } catch (err) {
        requester = null;
      }
    }

    if (req.user?.role_id === 4) {
      const sellerDistrict = String(requester?.assigned_district || requester?.district || '').trim().toLowerCase();
      const normalizedTaskAddress = normalizeDeliveryAddress(task.deliveryAddress || task.address || {});
      const requestDistrict = String(normalizedTaskAddress.district || '').trim().toLowerCase();
      if (sellerDistrict && requestDistrict && sellerDistrict !== requestDistrict) {
        return res.status(403).json({ status: 'Failed', message: 'Seller can only assign requests within assigned district' });
      }
    }

    const technicianDistrict = normalizeDeliveryAddress({ district: technician.district || technician.assigned_district || '' }).district;
    const taskDistrict = normalizeDeliveryAddress(task.deliveryAddress || task.address || {}).district;
    if (taskDistrict && technicianDistrict && taskDistrict.toLowerCase() !== technicianDistrict.toLowerCase()) {
      return res.status(400).json({ status: 'Failed', message: 'Technician district does not match request district' });
    }

    // Check if technician is on leave
    const leaveRequestsCollection = db.collection('leave_requests');
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const approvedLeaves = await leaveRequestsCollection.find({
      technician_id: technician_id,
      status: 'Approved',
      from_date: { $lte: todayEnd },
      to_date: { $gte: todayStart }
    }).toArray();

    if (approvedLeaves.length > 0) {
      return res.status(400).json({ status: 'Failed', message: 'Technician is on approved leave and cannot be assigned' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000);
    const assignedBy = requester?.email || 'system';
    const now = new Date();

    const updateResult = await serviceRecordsCollection.updateOne(
      { task_id: numericTaskId },
      {
        $set: {
          task_status: "Pending",
          assigned_technician_id: technician_id,
          assigned_date: now,
          assigned_by: assignedBy,
          modified_by: assignedBy,
          modified_date: now,
          otp
        },
        $push: {
          assignment_history: {
            technician_id,
            assigned_by: assignedBy,
            assigned_date: now
          }
        }
      }
    );

    if (!updateResult.matchedCount) {
      return res.status(404).json({ status: 'Failed', message: 'Manual request not found' });
    }

    await technicianDetailsCollection.updateOne(
      { technician_id },
      {
        $set: {
          user_id: technician.user_id,
          role_id: technician.role_id,
          email: technician.email,
          technician_id,
          status: true
        },
        $inc: { total_assigned_services: 1 }
      },
      { upsert: true }
    );

    let customerEmail = task.task_created_by_user_email || null;
    if (!customerEmail && task.task_created_by_user_id) {
      const customer = await usersCollection.findOne({ user_id: task.task_created_by_user_id });
      if (customer?.email) {
        customerEmail = customer.email;
      }
    }

    // Send notification emails to admin, seller, and technician (NOT to user)
    const districtSellers = await getDistrictSellers(db, taskDistrict);
    const sellerEmails = districtSellers.map(s => s.email);
    const adminEmails = ['admin@gmail.com'];
    const technicianEmail = [technician.email];
    const allNotificationEmails = [...sellerEmails, ...adminEmails, ...technicianEmail];

    const notificationHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border-radius: 10px; background-color: #f9f9f9; border: 1px solid #ddd;">
            <h2 style="color: #333;">New Manual Request Assigned</h2>
            <ul style="font-size: 16px; color: #555;">
                <li><strong>Task ID:</strong> ${numericTaskId}</li>
                <li><strong>Technician:</strong> ${technician.name || 'N/A'}</li>
                <li><strong>Customer Email:</strong> ${customerEmail || 'N/A'}</li>
                <li><strong>Location:</strong> ${taskDistrict || 'N/A'}</li>
                <li><strong>Description:</strong> ${task.task_description || 'Manual request'}</li>
            </ul>
            <p style="font-size: 14px; color: #888; text-align: center; margin-top: 30px; border-top: 1px solid #ddd; padding-top: 10px;">This is an automated notification from IonHive Water Purifier.</p>
        </div>
    `;

    // Log to assignment history
    await logToAssignmentHistory(db, {
        task_id: numericTaskId,
        task_type: 3, // Manual request
        assignment_type: 'Manual Request',
        action: 'assign',
        assignment_mode: 'manual',
        technician_id: technician_id,
        technician_name: technician.name,
        previous_technician_id: null,
        device_id: null, // Manual requests don't have device_id
        customer_email: customerEmail,
        location: {
            city: taskDistrict ? null : null, // Manual requests may not have structured address
            district: taskDistrict,
            state: null
        },
        assigned_by: assignedBy,
        reason: null
    });

    await sendEmailToMultiple(allNotificationEmails, 'Manual Request Assigned - IonHive', '', notificationHtml);

    return res.status(200).json({ status: 'Success', message: 'Manual request assigned successfully' });
  } catch (error) {
    console.error('Error in AssignManualRequest:', error);
    logger?.error?.(error);
    return res.status(500).json({ status: 'Failed', message: 'Internal Server Error' });
  }
};

const ReAssignManualRequest = async (req, res) => {
  try {
    const { task_id, technician_id } = req.body || {};

    const numericTaskId = Number(task_id);
    if (!Number.isInteger(numericTaskId) || !technician_id) {
      return res.status(400).json({ status: 'Failed', message: 'task_id and technician_id are required' });
    }

    const db = await database.connectToDatabase();
    const serviceRecordsCollection = db.collection("service_records");
    const usersCollection = db.collection("users");
    const technicianDetailsCollection = db.collection("technician_details");

    const task = await serviceRecordsCollection.findOne({ task_id: numericTaskId, task_type: 3 });
    if (!task) {
      return res.status(404).json({ status: 'Failed', message: 'Manual request not found' });
    }

    if (task.task_status && task.task_status.toLowerCase() === 'completed') {
      return res.status(400).json({ status: 'Failed', message: 'Completed requests cannot be reassigned' });
    }

    if (task.assigned_technician_id && task.assigned_technician_id === technician_id) {
      return res.status(400).json({ status: 'Failed', message: 'Request is already assigned to the selected technician' });
    }

    const technician = await usersCollection.findOne({ technician_id });
    if (!technician) {
      return res.status(404).json({ status: 'Failed', message: 'Technician not found' });
    }

    let requester = null;
    if (req.user?.userId) {
      try {
        requester = await usersCollection.findOne({ _id: new ObjectId(req.user.userId) });
      } catch (err) {
        requester = null;
      }
    }

    if (req.user?.role_id === 4) {
      const sellerDistrict = String(requester?.assigned_district || requester?.district || '').trim().toLowerCase();
      const normalizedTaskAddress = normalizeDeliveryAddress(task.deliveryAddress || task.address || {});
      const requestDistrict = String(normalizedTaskAddress.district || '').trim().toLowerCase();
      if (sellerDistrict && requestDistrict && sellerDistrict !== requestDistrict) {
        return res.status(403).json({ status: 'Failed', message: 'Seller can only reassign requests within assigned district' });
      }
    }

    const technicianDistrict = normalizeDeliveryAddress({ district: technician.district || technician.assigned_district || '' }).district;
    const taskDistrict = normalizeDeliveryAddress(task.deliveryAddress || task.address || {}).district;
    if (taskDistrict && technicianDistrict && taskDistrict.toLowerCase() !== technicianDistrict.toLowerCase()) {
      return res.status(400).json({ status: 'Failed', message: 'Technician district does not match request district' });
    }

    // Check if technician is on leave
    const leaveRequestsCollection = db.collection('leave_requests');
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const approvedLeaves = await leaveRequestsCollection.find({
      technician_id: technician_id,
      status: 'Approved',
      from_date: { $lte: todayEnd },
      to_date: { $gte: todayStart }
    }).toArray();

    if (approvedLeaves.length > 0) {
      return res.status(400).json({ status: 'Failed', message: 'Technician is on approved leave and cannot be reassigned' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000);
    const assignedBy = requester?.email || 'system';
    const now = new Date();

    const updateResult = await serviceRecordsCollection.updateOne(
      { task_id: numericTaskId },
      {
        $set: {
          task_status: "Pending",
          assigned_technician_id: technician_id,
          assigned_date: now,
          assigned_by: assignedBy,
          modified_by: assignedBy,
          modified_date: now,
          otp,
          pending_reason: null
        },
        $push: {
          assignment_history: {
            technician_id,
            assigned_by: assignedBy,
            assigned_date: now,
            reassigned_from: task.assigned_technician_id || null
          }
        }
      }
    );

    if (!updateResult.matchedCount) {
      return res.status(404).json({ status: 'Failed', message: 'Manual request not found' });
    }

    await technicianDetailsCollection.updateOne(
      { technician_id },
      {
        $set: {
          user_id: technician.user_id,
          role_id: technician.role_id,
          email: technician.email,
          technician_id,
          status: true
        },
        $inc: { total_assigned_services: 1 }
      },
      { upsert: true }
    );

    let customerEmail = task.task_created_by_user_email || null;
    if (!customerEmail && task.task_created_by_user_id) {
      const customer = await usersCollection.findOne({ user_id: task.task_created_by_user_id });
      if (customer?.email) {
        customerEmail = customer.email;
      }
    }

    // Send notification emails to admin, seller, and technician (NOT to user)
    const districtSellers = await getDistrictSellers(db, taskDistrict);
    const sellerEmails = districtSellers.map(s => s.email);
    const adminEmails = ['admin@gmail.com'];
    const technicianEmail = [technician.email];
    const allNotificationEmails = [...sellerEmails, ...adminEmails, ...technicianEmail];

    const notificationHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border-radius: 10px; background-color: #f9f9f9; border: 1px solid #ddd;">
            <h2 style="color: #333;">Manual Request Re-assigned</h2>
            <ul style="font-size: 16px; color: #555;">
                <li><strong>Task ID:</strong> ${numericTaskId}</li>
                <li><strong>New Technician:</strong> ${technician.name || 'N/A'}</li>
                <li><strong>Previous Technician ID:</strong> ${task.assigned_technician_id || 'N/A'}</li>
                <li><strong>Customer Email:</strong> ${customerEmail || 'N/A'}</li>
                <li><strong>Location:</strong> ${taskDistrict || 'N/A'}</li>
                <li><strong>Description:</strong> ${task.task_description || 'Manual request'}</li>
            </ul>
            <p style="font-size: 14px; color: #888; text-align: center; margin-top: 30px; border-top: 1px solid #ddd; padding-top: 10px;">This is an automated notification from IonHive Water Purifier.</p>
        </div>
    `;

    await sendEmailToMultiple(allNotificationEmails, 'Manual Request Re-assigned - IonHive', '', notificationHtml);

    return res.status(200).json({ status: 'Success', message: 'Manual request reassigned successfully' });
  } catch (error) {
    console.error('Error in ReAssignManualRequest:', error);
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
                razorpayOrderId: payment?.razorpayOrderId || order.razorpayOrderId || null,
                customOrderId: order.customOrderId || null,
                orderId: order._id?.toString() || null,
                order_id: order._id || null
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

        const currentDayOfWeek = now.getDay();
        const daysFromMonday = currentDayOfWeek === 0 ? 6 : currentDayOfWeek - 1;
        const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - daysFromMonday);
        startOfWeek.setHours(0, 0, 0, 0);

        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const oneYearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);

        // ---------------- Helpers ----------------
        const countDocuments = (collection, filter) => collection.countDocuments(filter);

        const groupTimeline = async (collection, filter, groupId, labelField) => {
            return collection.aggregate([
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
        };

        const buildFixedBuckets = (range, results, labelKey = "label") => {
            const buckets = [];
            for (let i = range.start; i <= range.end; i++) {
                const match = results.find((r) => r[labelKey] === i);
                buckets.push({
                    [labelKey]: i,
                    total: match ? match.total : 0,
                    successful: match ? match.successful : 0
                });
            }
            return buckets;
        };

        const groupRevenueTimeline = async (collection, filter, groupId, labelField) => {
            return collection.aggregate([
                { $match: { ...filter, paymentStatus: "Completed" } },
                {
                    $addFields: {
                        amount: {
                            $toDouble: {
                                $ifNull: ["$totalPrice", "$grandTotal"]
                            }
                        }
                    }
                },
                { $group: { _id: groupId, revenue: { $sum: "$amount" } } },
                { $project: { [labelField]: "$_id", revenue: 1, _id: 0 } },
                { $sort: { [labelField]: 1 } }
            ]).toArray();
        };

        const buildRevenueBuckets = (range, results, labelKey = "label") => {
            const buckets = [];
            for (let i = range.start; i <= range.end; i++) {
                const match = results.find((r) => r[labelKey] === i);
                buckets.push({
                    [labelKey]: i,
                    revenue: match ? match.revenue : 0
                });
            }
            return buckets;
        };

        const getTopItems = async (collection, filter, groupByField, labelField = "name") => {
            return collection.aggregate([
                { $match: { ...filter, paymentStatus: "Completed" } },
                {
                    $group: {
                        _id: `$${groupByField}`,
                        devicesSold: { $sum: { $ifNull: ["$quantity", 1] } }
                    }
                },
                { $match: { _id: { $ne: null, $exists: true } } },
                { $sort: { devicesSold: -1 } },
                { $limit: 5 }, 
                {
                    $project: {
                        [labelField]: "$_id",
                        devicesSold: 1,
                        _id: 0
                    }
                }
            ]).toArray();
        };

        // ---------------- Summary Counts ----------------
        const [
            paymentsTotal,
            paymentsSuccess,
            paymentsPending,
            ordersTotal,
            ordersSuccess,
            ordersPending,
            usersTotal,
            adminsCount,
            techniciansCount,
            endUsersCount,
            sellersCount
        ] = await Promise.all([
            countDocuments(paymentsCollection, {}),
            countDocuments(paymentsCollection, { paymentStatus: "Completed" }),
            countDocuments(paymentsCollection, { paymentStatus: "Pending" }),
            countDocuments(ordersCollection, {}),
            countDocuments(ordersCollection, { paymentStatus: "Completed" }),
            countDocuments(ordersCollection, { paymentStatus: "Pending" }),
            countDocuments(usersCollection, { role_id: { $in: [2, 3, 4] } }),
            countDocuments(usersCollection, { role_id: 1 }),
            countDocuments(usersCollection, { role_id: 2 }),
            countDocuments(usersCollection, { role_id: 3 }),
            countDocuments(usersCollection, { role_id: 4 })
        ]);

        // ---------------- Timelines ----------------
        const paymentsTimeline = {
            today: buildFixedBuckets(
                { start: 0, end: 23 },
                await groupTimeline(paymentsCollection, { createdAt: { $gte: startOfToday } }, { $hour: "$createdAt" }, "hour"),
                "hour"
            ),
            week: buildFixedBuckets(
                { start: 1, end: 7 },
                await groupTimeline(paymentsCollection, { createdAt: { $gte: startOfWeek } }, { $dayOfWeek: "$createdAt" }, "day"),
                "day"
            ),
            month: buildFixedBuckets(
                { start: 1, end: 31 },
                await groupTimeline(paymentsCollection, { createdAt: { $gte: startOfMonth } }, { $dayOfMonth: "$createdAt" }, "day"),
                "day"
            ),
            year: buildFixedBuckets(
                { start: 1, end: 12 },
                await groupTimeline(paymentsCollection, { createdAt: { $gte: oneYearAgo } }, { $month: "$createdAt" }, "month"),
                "month"
            )
        };

        const ordersTimeline = {
            today: buildFixedBuckets(
                { start: 0, end: 23 },
                await groupTimeline(ordersCollection, { createdAt: { $gte: startOfToday } }, { $hour: "$createdAt" }, "hour"),
                "hour"
            ),
            week: buildFixedBuckets(
                { start: 1, end: 7 },
                await groupTimeline(ordersCollection, { createdAt: { $gte: startOfWeek } }, { $dayOfWeek: "$createdAt" }, "day"),
                "day"
            ),
            month: buildFixedBuckets(
                { start: 1, end: 31 },
                await groupTimeline(ordersCollection, { createdAt: { $gte: startOfMonth } }, { $dayOfMonth: "$createdAt" }, "day"),
                "day"
            ),
            year: buildFixedBuckets(
                { start: 1, end: 12 },
                await groupTimeline(ordersCollection, { createdAt: { $gte: oneYearAgo } }, { $month: "$createdAt" }, "month"),
                "month"
            )
        };

        const revenueTimeline = {
            today: buildRevenueBuckets(
                { start: 0, end: 23 },
                await groupRevenueTimeline(ordersCollection, { createdAt: { $gte: startOfToday } }, { $hour: "$createdAt" }, "hour"),
                "hour"
            ),
            week: buildRevenueBuckets(
                { start: 1, end: 7 },
                await groupRevenueTimeline(ordersCollection, { createdAt: { $gte: startOfWeek } }, { $dayOfWeek: "$createdAt" }, "day"),
                "day"
            ),
            month: buildRevenueBuckets(
                { start: 1, end: 31 },
                await groupRevenueTimeline(ordersCollection, { createdAt: { $gte: startOfMonth } }, { $dayOfMonth: "$createdAt" }, "day"),
                "day"
            ),
            year: buildRevenueBuckets(
                { start: 1, end: 12 },
                await groupRevenueTimeline(ordersCollection, { createdAt: { $gte: oneYearAgo } }, { $month: "$createdAt" }, "month"),
                "month"
            )
        };

        // ---------------- Correct Revenue Sum ----------------
        const totalRevenueResult = await ordersCollection.aggregate([
            { $match: { paymentStatus: "Completed" } },
            {
                $addFields: {
                    amount: {
                        $toDouble: {
                            $ifNull: ["$totalPrice", "$grandTotal"]
                        }
                    }
                }
            },
            { $group: { _id: null, total: { $sum: "$amount" } } }
        ]).toArray();

        const totalRevenue = totalRevenueResult[0]?.total || 0;

        // ---------------- Top Items ----------------
        const topDistricts = {
            overall: await getTopItems(ordersCollection, {}, "deliveryAddress.district", "districtName"),
            today: await getTopItems(ordersCollection, { createdAt: { $gte: startOfToday } }, "deliveryAddress.district", "districtName"),
            week: await getTopItems(ordersCollection, { createdAt: { $gte: startOfWeek } }, "deliveryAddress.district", "districtName"),
            month: await getTopItems(ordersCollection, { createdAt: { $gte: startOfMonth } }, "deliveryAddress.district", "districtName"),
            year: await getTopItems(ordersCollection, { createdAt: { $gte: oneYearAgo } }, "deliveryAddress.district", "districtName")
        };

        const topModels = {
            overall: await getTopItems(ordersCollection, {}, "modelName", "modelName"),
            today: await getTopItems(ordersCollection, { createdAt: { $gte: startOfToday } }, "modelName", "modelName"),
            week: await getTopItems(ordersCollection, { createdAt: { $gte: startOfWeek } }, "modelName", "modelName"),
            month: await getTopItems(ordersCollection, { createdAt: { $gte: startOfMonth } }, "modelName", "modelName"),
            year: await getTopItems(ordersCollection, { createdAt: { $gte: oneYearAgo } }, "modelName", "modelName")
        };

        // ---------------- Final Payload ----------------
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
            topDistricts,
            topModels
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
      return paymentsCollection.aggregate([
        { $lookup: { from: 'orders', localField: 'orderId', foreignField: '_id', as: 'order' } },
        { $addFields: { order: { $arrayElemAt: ['$order', 0] } } },
        { $match: { 'order.deliveryAddress.district': districtRegex, createdAt: dateFilter } },
        {
          $group: {
            _id: groupId,
            total: { $sum: 1 },
            successful: { $sum: { $cond: [{ $eq: ['$paymentStatus', 'Completed'] }, 1, 0] } }
          }
        },
        { $project: { [labelField]: '$_id', total: 1, successful: 1, _id: 0 } },
        { $sort: { [labelField]: 1 } }
      ]).toArray();
    };

    const groupTimeline = async (collection, filter, groupId, labelField) => {
      return collection.aggregate([
        { $match: filter },
        {
          $group: {
            _id: groupId,
            total: { $sum: 1 },
            successful: { $sum: { $cond: [{ $eq: ['$paymentStatus', 'Completed'] }, 1, 0] } }
          }
        },
        { $project: { [labelField]: '$_id', total: 1, successful: 1, _id: 0 } },
        { $sort: { [labelField]: 1 } }
      ]).toArray();
    };

    const buildFixedBuckets = (range, results, labelKey = 'label') => {
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
      return collection.aggregate([
        { $match: { ...filter, paymentStatus: 'Completed' } },
        {
          $addFields: {
            amount: {
              $toDouble: {
                $ifNull: ['$totalPrice', '$grandTotal']
              }
            }
          }
        },
        { $group: { _id: groupId, revenue: { $sum: '$amount' } } },
        { $project: { [labelField]: '$_id', revenue: 1, _id: 0 } },
        { $sort: { [labelField]: 1 } }
      ]).toArray();
    };

    const buildRevenueBuckets = (range, results, labelKey = 'label') => {
      const buckets = [];
      for (let i = range.start; i <= range.end; i++) {
        const match = results.find(r => r[labelKey] === i);
        buckets.push({ [labelKey]: i, revenue: match ? match.revenue : 0 });
      }
      return buckets;
    };

    // ⭐⭐⭐ TOP MODELS & TOP DISTRICTS (TOP 5 ONLY) ⭐⭐⭐
    const getTopItems = async (collection, filter, groupByField, labelField = 'name') => {
      return collection.aggregate([
        { $match: { ...filter, paymentStatus: 'Completed', 'deliveryAddress.district': districtRegex } },
        {
          $group: {
            _id: `$${groupByField}`,
            devicesSold: { $sum: { $ifNull: ['$quantity', 1] } }
          }
        },
        { $match: { _id: { $ne: null, $exists: true } } },
        { $sort: { devicesSold: -1 } },
        { $limit: 5 },   // ⭐ TOP 5 MODELS
        {
          $project: {
            [labelField]: '$_id',
            devicesSold: 1,
            _id: 0
          }
        }
      ]).toArray();
    };

    const getTopDistricts = async (filter) => {
      return ordersCollection.aggregate([
        { $match: { ...filter, paymentStatus: 'Completed', 'deliveryAddress.district': districtRegex } },
        {
          $group: {
            _id: '$deliveryAddress.district',
            devicesSold: { $sum: { $ifNull: ['$quantity', 1] } }
          }
        },
        { $match: { _id: { $ne: null, $exists: true } } },
        { $sort: { devicesSold: -1 } },
        { $limit: 5 },  // ⭐ TOP 5 DISTRICTS
        {
          $project: {
            districtName: '$_id',
            devicesSold: 1,
            _id: 0
          }
        }
      ]).toArray();
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
      {
        $addFields: {
          amount: {
            $toDouble: {
              $ifNull: ['$totalPrice', '$grandTotal']
            }
          }
        }
      },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]).toArray();

    const totalRevenue = totalRevenueResult[0]?.total || 0;

    // ---------------- TOP 5 DISTRICTS & MODELS ----------------
    const topDistrictsOverall = await getTopDistricts({});
    const topDistrictsToday = await getTopDistricts({ createdAt: { $gte: startOfToday } });
    const topDistrictsWeek = await getTopDistricts({ createdAt: { $gte: startOfWeek } });
    const topDistrictsMonth = await getTopDistricts({ createdAt: { $gte: startOfMonth } });
    const topDistrictsYear = await getTopDistricts({ createdAt: { $gte: oneYearAgo } });

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
          _id: new ObjectId(orderId.toString())
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

const UnAssignTask = async (req, res) => {
  try {
    const db = await database.connectToDatabase();
    const serviceRecords = db.collection("service_records");
    const { task_id, modified_by } = req.body;

    if (!task_id || !modified_by) {
      return res.status(400).json({
        status: 'Failed',
        message: 'Invalid or missing required fields: task_id and modified_by are required',
      });
    }

    const existingTask = await serviceRecords.findOne({ task_id });
    if (!existingTask) {
      return res.status(404).json({
        status: 'Failed',
        message: `Task with task_id ${task_id} not found.`,
      });
    }

    const previousTechnicianId = existingTask.assigned_technician_id;
    const now = new Date();

    const updateResult = await serviceRecords.updateOne(
      { task_id },
      {
        $set: {
          assigned_technician_id: null,
          task_status: 'Unassigned',
          pending_reason: null,
          modified_by,
          modified_date: now,
          unassigned_date: now,
        },
      }
    );

    if (updateResult.modifiedCount === 1) {
      // Get technician info for notification
      const usersCollection = db.collection("users");
      const technicianUser = previousTechnicianId ? await usersCollection.findOne({ technician_id: previousTechnicianId }) : null;

      // Get district info
      const taskType = existingTask.task_type === 1 ? 'Installation' : 'Service';
      const location = existingTask.address || {
        city: 'N/A',
        district: 'N/A',
        state: 'N/A'
      };

      // Get district sellers and send notification emails
      const districtSellers = await getDistrictSellers(db, location.district);
      const sellerEmails = districtSellers.map(s => s.email);
      const adminEmails = ['admin@gmail.com'];
      const allNotificationEmails = [...sellerEmails, ...adminEmails];

      const notificationHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border-radius: 10px; background-color: #f9f9f9; border: 1px solid #ddd;">
              <h2 style="color: #333;">${taskType} Task Unassigned</h2>
              <ul style="font-size: 16px; color: #555;">
                  <li><strong>Task ID:</strong> ${task_id}</li>
                  <li><strong>Device ID:</strong> ${existingTask.wp_device_id || existingTask.device_id}</li>
                  <li><strong>Previous Technician:</strong> ${technicianUser?.name || 'N/A'}</li>
                  <li><strong>Location:</strong> ${location.city}, ${location.district}, ${location.state}</li>
                  <li><strong>Unassigned By:</strong> ${modified_by}</li>
              </ul>
              <p style="font-size: 14px; color: #888; text-align: center; margin-top: 30px; border-top: 1px solid #ddd; padding-top: 10px;">This is an automated notification from IonHive Water Purifier.</p>
          </div>
      `;

      await sendEmailToMultiple(allNotificationEmails, `${taskType} Task Unassigned - IonHive`, '', notificationHtml);

      // Log to assignment history
      await logToAssignmentHistory(db, {
          task_id: task_id,
          task_type: existingTask.task_type,
          assignment_type: taskType,
          action: 'unassign',
          assignment_mode: 'manual',
          technician_id: null,
          technician_name: null,
          previous_technician_id: previousTechnicianId,
          device_id: existingTask.wp_device_id || existingTask.device_id,
          customer_email: existingTask.task_created_by_user_email,
          location: location,
          modified_by: modified_by,
          reason: null
      });

      return res.status(200).json({
        status: 'Success',
        message: `${taskType} task ${task_id} unassigned successfully.`,
      });
    }

    return res.status(500).json({
      status: 'Failed',
      message: 'Task update failed. Please try again.',
    });

  } catch (error) {
    console.error('Error in UnAssignTask:', error);
    return res.status(500).json({
      status: 'Failed',
      message: 'Internal Server Error',
    });
  }
};

const getAssignmentHistory = async (req, res) => {
  try {
    const { task_id } = req.params;

    if (!task_id) {
      return res.status(400).json({
        status: 'Failed',
        message: 'task_id parameter is required'
      });
    }

    const db = await database.connectToDatabase();
    const assignmentHistoryCollection = db.collection('assignment_history');

    const history = await assignmentHistoryCollection
      .find({ task_id: parseInt(task_id) })
      .sort({ created_at: -1 })
      .toArray();

    return res.status(200).json({
      status: 'Success',
      message: 'Assignment history fetched successfully',
      data: history
    });

  } catch (error) {
    console.error('Error in getAssignmentHistory:', error);
    return res.status(500).json({
      status: 'Failed',
      message: 'Internal Server Error',
    });
  }
};

const GetUserCountsByRole = async (req, res) => {
  try {
    const db = await database.connectToDatabase();
    const collection = db.collection('users');

    const allUsersCount = await collection.countDocuments();
    const adminCount = await collection.countDocuments({ role_id: 1 });
    const technicianCount = await collection.countDocuments({ role_id: 2 });
    const endUserCount = await collection.countDocuments({ role_id: 3 });
    const sellerCount = await collection.countDocuments({ role_id: 4 });

    return res.status(200).json({
      status: 'Success',
      message: 'User counts by role fetched successfully',
      data: {
        totalUsers: allUsersCount,
        admin: adminCount,
        technician: technicianCount,
        endUser: endUserCount,
        seller: sellerCount
      }
    });

  } catch (error) {
    console.error('Error in GetUserCountsByRole:', error);
    logger?.error?.(error);
    return res.status(500).json({
      status: 'Failed',
      message: 'Internal Server Error'
    });
  }
};

const GetUserCountByType = async (req, res) => {
  try {
    const { type } = req.query;

    if (!type) {
      return res.status(400).json({
        status: 'Failed',
        message: 'User type is required (admin, technician, endUser, seller, all)'
      });
    }

    const db = await database.connectToDatabase();
    const collection = db.collection('users');

    let roleId = null;
    const typeMap = {
      'admin': 1,
      'technician': 2,
      'endUser': 3,
      'seller': 4,
      'all': null
    };

    roleId = typeMap[type.toLowerCase()];

    let count;
    if (roleId === null) {
      count = await collection.countDocuments();
    } else {
      count = await collection.countDocuments({ role_id: roleId });
    }

    return res.status(200).json({
      status: 'Success',
      message: `${type} count fetched successfully`,
      data: {
        type: type,
        count: count
      }
    });

  } catch (error) {
    console.error('Error in GetUserCountByType:', error);
    logger?.error?.(error);
    return res.status(500).json({
      status: 'Failed',
      message: 'Internal Server Error'
    });
  }
};

const GetUserCountByDistrict = async (req, res) => {
  try {
    const { district } = req.query;
    const db = await database.connectToDatabase();
    const collection = db.collection('users');

    let query = {};
    if (district) {
      query = { district: { $regex: new RegExp(district, 'i') } };
    }

    const counts = await collection.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$district',
          total: { $sum: 1 },
          admin: {
            $sum: { $cond: [{ $eq: ['$role_id', 1] }, 1, 0] }
          },
          technician: {
            $sum: { $cond: [{ $eq: ['$role_id', 2] }, 1, 0] }
          },
          endUser: {
            $sum: { $cond: [{ $eq: ['$role_id', 3] }, 1, 0] }
          },
          seller: {
            $sum: { $cond: [{ $eq: ['$role_id', 4] }, 1, 0] }
          }
        }
      },
      { $sort: { total: -1 } }
    ]).toArray();

    return res.status(200).json({
      status: 'Success',
      message: 'User counts by district fetched successfully',
      data: counts
    });

  } catch (error) {
    console.error('Error in GetUserCountByDistrict:', error);
    logger?.error?.(error);
    return res.status(500).json({
      status: 'Failed',
      message: 'Internal Server Error'
    });
  }
};

const GetOrdersCounts = async (req, res) => {
  try {
    const { district: districtParam } = req.query;
    const userRole = req.user?.role_id;
    const userDistrict = req.user?.district;
    const db = await database.connectToDatabase();
    const collection = db.collection('orders');

    let matchStage = {};
    const isSeller = Number(userRole) === 4;
    const filterDistrict = isSeller ? userDistrict : districtParam;

    if (filterDistrict) {
      matchStage = { 'deliveryAddress.district': { $regex: new RegExp(filterDistrict, 'i') } };
    }

    const counts = await collection.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          pending: {
            $sum: { $cond: [{ $and: [{ $ne: ['$deliveryCompletionStatus', true] }, { $ne: ['$orderStatus', 'Delivered'] }, { $ne: ['$orderStatus', 'Confirmed'] }] }, 1, 0] }
          },
          confirmed: {
            $sum: { $cond: [{ $eq: ['$orderStatus', 'Confirmed'] }, 1, 0] }
          },
          completed: {
            $sum: { $cond: [{ $or: [{ $eq: ['$deliveryCompletionStatus', true] }, { $eq: ['$orderStatus', 'Delivered'] }] }, 1, 0] }
          },
          paymentCompleted: {
            $sum: { $cond: [{ $eq: ['$paymentStatus', 'Completed'] }, 1, 0] }
          },
          pendingPayment: {
            $sum: { $cond: [{ $eq: ['$paymentStatus', 'Pending'] }, 1, 0] }
          },
          cod: {
            $sum: { $cond: [{ $eq: ['$paymentType', 'COD'] }, 1, 0] }
          },
          online: {
            $sum: { $cond: [{ $eq: ['$paymentType', 'Online'] }, 1, 0] }
          }
        }
      }
    ]).toArray();

    const data = counts.length > 0 ? counts[0] : {
      totalOrders: 0,
      pending: 0,
      confirmed: 0,
      completed: 0,
      paymentCompleted: 0,
      pendingPayment: 0,
      cod: 0,
      online: 0
    };

    return res.status(200).json({
      status: 'Success',
      message: 'Order counts fetched successfully',
      data
    });

  } catch (error) {
    console.error('Error in GetOrdersCounts:', error);
    logger?.error?.(error);
    return res.status(500).json({
      status: 'Failed',
      message: 'Internal Server Error'
    });
  }
};

const GetInstallationsCounts = async (req, res) => {
  try {
    const { district: districtParam } = req.query;
    const userRole = req.user?.role_id;
    const userDistrict = req.user?.district;
    const db = await database.connectToDatabase();
    const collection = db.collection('service_records');

    let matchStage = { task_type: 1 };
    const isSeller = Number(userRole) === 4;
    const filterDistrict = isSeller ? userDistrict : districtParam;
    
    if (filterDistrict) {
      const ordersCollection = db.collection('orders');
      const deviceIds = await ordersCollection.find({
        'deliveryAddress.district': { $regex: new RegExp(filterDistrict, 'i') }
      }).project({ wp_device_id: 1 }).toArray();

      const deviceIdList = deviceIds.map(d => d.wp_device_id);
      matchStage.wp_device_id = { $in: deviceIdList };
    }

    const counts = await collection.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          totalInstallations: { $sum: 1 },
          pending: {
            $sum: { $cond: [{ $eq: ['$task_status', 'Pending'] }, 1, 0] }
          },
          assigned: {
            $sum: { $cond: [{ $ne: ['$assigned_technician_id', null] }, 1, 0] }
          },
          completed: {
            $sum: { $cond: [{ $eq: ['$task_status', 'Completed'] }, 1, 0] }
          },
          onHold: {
            $sum: { $cond: [{ $in: ['$task_status', ['In Progress', 'In_Progress', 'in_progress']] }, 1, 0] }
          }
        }
      }
    ]).toArray();

    const data = counts.length > 0 ? counts[0] : {
      totalInstallations: 0,
      pending: 0,
      assigned: 0,
      completed: 0,
      onHold: 0
    };

    return res.status(200).json({
      status: 'Success',
      message: 'Installation counts fetched successfully',
      data
    });

  } catch (error) {
    console.error('Error in GetInstallationsCounts:', error);
    logger?.error?.(error);
    return res.status(500).json({
      status: 'Failed',
      message: 'Internal Server Error'
    });
  }
};

const GetServicesCounts = async (req, res) => {
  try {
    const { district: districtParam } = req.query;
    const userRole = req.user?.role_id;
    const userDistrict = req.user?.district;
    const db = await database.connectToDatabase();
    const collection = db.collection('service_records');

    let matchStage = { task_type: 2 };
    const isSeller = Number(userRole) === 4;
    const filterDistrict = isSeller ? userDistrict : districtParam;
    
    if (filterDistrict) {
      const ordersCollection = db.collection('orders');
      const deviceIds = await ordersCollection.find({
        'deliveryAddress.district': { $regex: new RegExp(filterDistrict, 'i') }
      }).project({ wp_device_id: 1 }).toArray();

      const deviceIdList = deviceIds.map(d => d.wp_device_id);
      matchStage.wp_device_id = { $in: deviceIdList };
    }

    const counts = await collection.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          totalServices: { $sum: 1 },
          pending: {
            $sum: { $cond: [{ $eq: ['$task_status', 'Pending'] }, 1, 0] }
          },
          assigned: {
            $sum: { $cond: [{ $ne: ['$assigned_technician_id', null] }, 1, 0] }
          },
          completed: {
            $sum: { $cond: [{ $eq: ['$task_status', 'Completed'] }, 1, 0] }
          },
          onHold: {
            $sum: { $cond: [{ $in: ['$task_status', ['In Progress', 'In_Progress', 'in_progress']] }, 1, 0] }
          }
        }
      }
    ]).toArray();

    const data = counts.length > 0 ? counts[0] : {
      totalServices: 0,
      pending: 0,
      assigned: 0,
      completed: 0,
      onHold: 0
    };

    return res.status(200).json({
      status: 'Success',
      message: 'Service counts fetched successfully',
      data
    });

  } catch (error) {
    console.error('Error in GetServicesCounts:', error);
    logger?.error?.(error);
    return res.status(500).json({
      status: 'Failed',
      message: 'Internal Server Error'
    });
  }
};

const GetManualRequestsCounts = async (req, res) => {
  try {
    const { district: districtParam } = req.query;
    const userRole = req.user?.role_id;
    const userDistrict = req.user?.district;
    const db = await database.connectToDatabase();
    const collection = db.collection('manual_requests');

    let matchStage = {};
    const isSeller = Number(userRole) === 4;
    const filterDistrict = isSeller ? userDistrict : districtParam;

    if (filterDistrict) {
      matchStage = { 'address.district': { $regex: new RegExp(filterDistrict, 'i') } };
    }

    const counts = await collection.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          totalRequests: { $sum: 1 },
          pending: {
            $sum: { $cond: [{ $eq: ['$status', 'Pending'] }, 1, 0] }
          },
          assigned: {
            $sum: { $cond: [{ $eq: ['$status', 'Assigned'] }, 1, 0] }
          },
          completed: {
            $sum: { $cond: [{ $eq: ['$status', 'Completed'] }, 1, 0] }
          },
          rejected: {
            $sum: { $cond: [{ $eq: ['$status', 'Rejected'] }, 1, 0] }
          }
        }
      }
    ]).toArray();

    const data = counts.length > 0 ? counts[0] : {
      totalRequests: 0,
      pending: 0,
      assigned: 0,
      completed: 0,
      rejected: 0
    };

    return res.status(200).json({
      status: 'Success',
      message: 'Manual request counts fetched successfully',
      data
    });

  } catch (error) {
    console.error('Error in GetManualRequestsCounts:', error);
    logger?.error?.(error);
    return res.status(500).json({
      status: 'Failed',
      message: 'Internal Server Error'
    });
  }
};

const GetLeaveRequestsCounts = async (req, res) => {
  try {
    const { district: districtParam, technician_id } = req.query;
    const userRole = req.user?.role_id;
    const userDistrict = req.user?.district;
    const db = await database.connectToDatabase();
    const collection = db.collection('leave_requests');

    let matchStage = {};
    const isSeller = Number(userRole) === 4;
    const filterDistrict = isSeller ? userDistrict : districtParam;
    
    if (technician_id) {
      matchStage.technician_id = technician_id;
    }
    
    if (filterDistrict) {
      const usersCollection = db.collection('users');
      const technicians = await usersCollection.find({
        role_id: 2,
        district: { $regex: new RegExp(filterDistrict, 'i') }
      }).project({ technician_id: 1 }).toArray();

      const technicianIds = technicians.map(t => t.technician_id);
      matchStage.technician_id = { $in: technicianIds };
    }

    const counts = await collection.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          totalLeaves: { $sum: 1 },
          pending: {
            $sum: { $cond: [{ $eq: ['$status', 'Pending'] }, 1, 0] }
          },
          approved: {
            $sum: { $cond: [{ $eq: ['$status', 'Approved'] }, 1, 0] }
          },
          rejected: {
            $sum: { $cond: [{ $eq: ['$status', 'Rejected'] }, 1, 0] }
          }
        }
      }
    ]).toArray();

    const data = counts.length > 0 ? counts[0] : {
      totalLeaves: 0,
      pending: 0,
      approved: 0,
      rejected: 0
    };

    return res.status(200).json({
      status: 'Success',
      message: 'Leave request counts fetched successfully',
      data
    });

  } catch (error) {
    console.error('Error in GetLeaveRequestsCounts:', error);
    logger?.error?.(error);
    return res.status(500).json({
      status: 'Failed',
      message: 'Internal Server Error'
    });
  }
};

const GetOrdersCountsByDistrict = async (req, res) => {
  try {
    const db = await database.connectToDatabase();
    const collection = db.collection('orders');

    const counts = await collection.aggregate([
      {
        $group: {
          _id: { $toLower: '$deliveryAddress.district' },
          totalOrders: { $sum: 1 },
          pending: {
            $sum: { $cond: [{ $and: [{ $ne: ['$deliveryCompletionStatus', true] }, { $ne: ['$orderStatus', 'Delivered'] }, { $ne: ['$orderStatus', 'Confirmed'] }] }, 1, 0] }
          },
          confirmed: {
            $sum: { $cond: [{ $eq: ['$orderStatus', 'Confirmed'] }, 1, 0] }
          },
          completed: {
            $sum: { $cond: [{ $or: [{ $eq: ['$deliveryCompletionStatus', true] }, { $eq: ['$orderStatus', 'Delivered'] }] }, 1, 0] }
          },
          paymentCompleted: {
            $sum: { $cond: [{ $eq: ['$paymentStatus', 'Completed'] }, 1, 0] }
          },
          pendingPayment: {
            $sum: { $cond: [{ $eq: ['$paymentStatus', 'Pending'] }, 1, 0] }
          },
          cod: {
            $sum: { $cond: [{ $eq: ['$paymentType', 'COD'] }, 1, 0] }
          },
          online: {
            $sum: { $cond: [{ $eq: ['$paymentType', 'Online'] }, 1, 0] }
          }
        }
      },
      { $sort: { _id: 1 } }
    ]).toArray();

    return res.status(200).json({
      status: 'Success',
      message: 'Order counts by district fetched successfully',
      data: counts
    });

  } catch (error) {
    console.error('Error in GetOrdersCountsByDistrict:', error);
    logger?.error?.(error);
    return res.status(500).json({
      status: 'Failed',
      message: 'Internal Server Error'
    });
  }
};

const GetInstallationsCountsByDistrict = async (req, res) => {
  try {
    const db = await database.connectToDatabase();
    const serviceCollection = db.collection('service_records');
    const ordersCollection = db.collection('orders');

    const districts = await ordersCollection.aggregate([
      {
        $group: {
          _id: { $toLower: '$deliveryAddress.district' }
        }
      }
    ]).toArray();

    const data = [];
    for (const districtDoc of districts) {
      const district = districtDoc._id;
      const deviceIds = await ordersCollection.find({
        'deliveryAddress.district': { $regex: new RegExp(district, 'i') }
      }).project({ wp_device_id: 1 }).toArray();

      const deviceIdList = deviceIds.map(d => d.wp_device_id);

      const counts = await serviceCollection.aggregate([
        { $match: { task_type: 1, wp_device_id: { $in: deviceIdList } } },
        {
          $group: {
            _id: null,
            totalInstallations: { $sum: 1 },
            pending: { $sum: { $cond: [{ $eq: ['$task_status', 'Pending'] }, 1, 0] } },
            assigned: { $sum: { $cond: [{ $ne: ['$assigned_technician_id', null] }, 1, 0] } },
            completed: { $sum: { $cond: [{ $eq: ['$task_status', 'Completed'] }, 1, 0] } },
            onHold: { $sum: { $cond: [{ $in: ['$task_status', ['In Progress', 'In_Progress', 'in_progress']] }, 1, 0] } }
          }
        }
      ]).toArray();

      data.push({
        district,
        ...(counts.length > 0 ? counts[0] : {
          _id: null,
          totalInstallations: 0,
          pending: 0,
          assigned: 0,
          completed: 0,
          onHold: 0
        })
      });
    }

    return res.status(200).json({
      status: 'Success',
      message: 'Installation counts by district fetched successfully',
      data
    });

  } catch (error) {
    console.error('Error in GetInstallationsCountsByDistrict:', error);
    logger?.error?.(error);
    return res.status(500).json({
      status: 'Failed',
      message: 'Internal Server Error'
    });
  }
};

const GetServicesCountsByDistrict = async (req, res) => {
  try {
    const db = await database.connectToDatabase();
    const serviceCollection = db.collection('service_records');
    const ordersCollection = db.collection('orders');

    const districts = await ordersCollection.aggregate([
      {
        $group: {
          _id: { $toLower: '$deliveryAddress.district' }
        }
      }
    ]).toArray();

    const data = [];
    for (const districtDoc of districts) {
      const district = districtDoc._id;
      const deviceIds = await ordersCollection.find({
        'deliveryAddress.district': { $regex: new RegExp(district, 'i') }
      }).project({ wp_device_id: 1 }).toArray();

      const deviceIdList = deviceIds.map(d => d.wp_device_id);

      const counts = await serviceCollection.aggregate([
        { $match: { task_type: 2, wp_device_id: { $in: deviceIdList } } },
        {
          $group: {
            _id: null,
            totalServices: { $sum: 1 },
            pending: { $sum: { $cond: [{ $eq: ['$task_status', 'Pending'] }, 1, 0] } },
            assigned: { $sum: { $cond: [{ $ne: ['$assigned_technician_id', null] }, 1, 0] } },
            completed: { $sum: { $cond: [{ $eq: ['$task_status', 'Completed'] }, 1, 0] } },
            onHold: { $sum: { $cond: [{ $in: ['$task_status', ['In Progress', 'In_Progress', 'in_progress']] }, 1, 0] } }
          }
        }
      ]).toArray();

      data.push({
        district,
        ...(counts.length > 0 ? counts[0] : {
          _id: null,
          totalServices: 0,
          pending: 0,
          assigned: 0,
          completed: 0,
          onHold: 0
        })
      });
    }

    return res.status(200).json({
      status: 'Success',
      message: 'Service counts by district fetched successfully',
      data
    });

  } catch (error) {
    console.error('Error in GetServicesCountsByDistrict:', error);
    logger?.error?.(error);
    return res.status(500).json({
      status: 'Failed',
      message: 'Internal Server Error'
    });
  }
};

const GetManualRequestsCountsByDistrict = async (req, res) => {
  try {
    const db = await database.connectToDatabase();
    const collection = db.collection('manual_requests');

    const counts = await collection.aggregate([
      {
        $group: {
          _id: { $toLower: '$address.district' },
          totalRequests: { $sum: 1 },
          pending: { $sum: { $cond: [{ $eq: ['$status', 'Pending'] }, 1, 0] } },
          assigned: { $sum: { $cond: [{ $eq: ['$status', 'Assigned'] }, 1, 0] } },
          completed: { $sum: { $cond: [{ $eq: ['$status', 'Completed'] }, 1, 0] } },
          rejected: { $sum: { $cond: [{ $eq: ['$status', 'Rejected'] }, 1, 0] } }
        }
      },
      { $sort: { _id: 1 } }
    ]).toArray();

    return res.status(200).json({
      status: 'Success',
      message: 'Manual request counts by district fetched successfully',
      data: counts.map(d => ({ district: d._id, ...d }))
    });

  } catch (error) {
    console.error('Error in GetManualRequestsCountsByDistrict:', error);
    logger?.error?.(error);
    return res.status(500).json({
      status: 'Failed',
      message: 'Internal Server Error'
    });
  }
};

const GetLeaveRequestsCountsByDistrict = async (req, res) => {
  try {
    const db = await database.connectToDatabase();
    const leaveCollection = db.collection('leave_requests');
    const usersCollection = db.collection('users');

    const techniciansGrouped = await usersCollection.aggregate([
      { $match: { role_id: 2 } },
      {
        $group: {
          _id: { $toLower: '$district' },
          technician_ids: { $push: '$technician_id' }
        }
      }
    ]).toArray();

    const data = [];
    for (const techGroup of techniciansGrouped) {
      const counts = await leaveCollection.aggregate([
        { $match: { technician_id: { $in: techGroup.technician_ids } } },
        {
          $group: {
            _id: null,
            totalLeaves: { $sum: 1 },
            pending: { $sum: { $cond: [{ $eq: ['$status', 'Pending'] }, 1, 0] } },
            approved: { $sum: { $cond: [{ $eq: ['$status', 'Approved'] }, 1, 0] } },
            rejected: { $sum: { $cond: [{ $eq: ['$status', 'Rejected'] }, 1, 0] } }
          }
        }
      ]).toArray();

      data.push({
        district: techGroup._id,
        ...(counts.length > 0 ? counts[0] : {
          _id: null,
          totalLeaves: 0,
          pending: 0,
          approved: 0,
          rejected: 0
        })
      });
    }

    return res.status(200).json({
      status: 'Success',
      message: 'Leave request counts by district fetched successfully',
      data
    });

  } catch (error) {
    console.error('Error in GetLeaveRequestsCountsByDistrict:', error);
    logger?.error?.(error);
    return res.status(500).json({
      status: 'Failed',
      message: 'Internal Server Error'
    });
  }
};

// GetSearchInstallationsCount - Multi-field search for installations
const GetSearchInstallationsCount = async (req, res) => {
  try {
    const db = await database.connectToDatabase();
    const collection = db.collection('service_records');
    const { search } = req.query;
    const userRole = req.user?.role_id;
    const userDistrict = req.user?.district;

    let matchStage = { task_type: 1 };
    
    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      matchStage.$or = [
        { task_id: searchRegex },
        { wp_device_id: searchRegex },
        { model: searchRegex },
        { customer_name: searchRegex },
        { customer_email: searchRegex },
        { assigned_technician_name: searchRegex },
        { assigned_technician_id: searchRegex },
        { device_name: searchRegex }
      ];
    }

    if (Number(userRole) === 4) {
      const filterDistrict = userDistrict;
      if (filterDistrict) {
        const ordersCollection = db.collection('orders');
        const deviceIds = await ordersCollection.find({
          'deliveryAddress.district': { $regex: new RegExp(filterDistrict, 'i') }
        }).project({ wp_device_id: 1 }).toArray();
        const deviceIdList = deviceIds.map(d => d.wp_device_id);
        matchStage.wp_device_id = { $in: deviceIdList };
      }
    }

    const total = await collection.countDocuments(matchStage);

    return res.status(200).json({
      status: 'Success',
      totalRecords: total
    });
  } catch (error) {
    console.error('Error in GetSearchInstallationsCount:', error);
    logger?.error?.(error);
    return res.status(500).json({ status: 'Failed', message: 'Internal Server Error' });
  }
};

// SearchInstallations - Multi-field search for installations with pagination
const SearchInstallations = async (req, res) => {
  try {
    const { getPaginationParams, formatPaginatedResponse } = require('../utils/paginationHelper');
    const db = await database.connectToDatabase();
    const collection = db.collection('service_records');
    const { page, limit, skip } = getPaginationParams(req, 10);
    const { search } = req.query;
    const userRole = req.user?.role_id;
    const userDistrict = req.user?.district;

    let matchStage = { task_type: 1 };
    
    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      matchStage.$or = [
        { task_id: searchRegex },
        { wp_device_id: searchRegex },
        { model: searchRegex },
        { customer_name: searchRegex },
        { customer_email: searchRegex },
        { assigned_technician_name: searchRegex },
        { assigned_technician_id: searchRegex },
        { device_name: searchRegex }
      ];
    }

    if (Number(userRole) === 4) {
      const filterDistrict = userDistrict;
      if (filterDistrict) {
        const ordersCollection = db.collection('orders');
        const deviceIds = await ordersCollection.find({
          'deliveryAddress.district': { $regex: new RegExp(filterDistrict, 'i') }
        }).project({ wp_device_id: 1 }).toArray();
        const deviceIdList = deviceIds.map(d => d.wp_device_id);
        matchStage.wp_device_id = { $in: deviceIdList };
      }
    }

    const installations = await collection
      .find(matchStage)
      .sort({ created_date: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();
    const total = await collection.countDocuments(matchStage);

    return res.status(200).json(formatPaginatedResponse(installations, total, page, limit));
  } catch (error) {
    console.error('Error in SearchInstallations:', error);
    logger?.error?.(error);
    return res.status(500).json({ status: 'Failed', message: 'Internal Server Error' });
  }
};

// GetSearchServicesCount - Multi-field search for services
const GetSearchServicesCount = async (req, res) => {
  try {
    const db = await database.connectToDatabase();
    const collection = db.collection('service_records');
    const { search } = req.query;
    const userRole = req.user?.role_id;
    const userDistrict = req.user?.district;

    let matchStage = { task_type: 2 };
    
    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      matchStage.$or = [
        { task_id: searchRegex },
        { wp_device_id: searchRegex },
        { model: searchRegex },
        { customer_name: searchRegex },
        { customer_email: searchRegex },
        { assigned_technician_name: searchRegex },
        { assigned_technician_id: searchRegex },
        { device_name: searchRegex }
      ];
    }

    if (Number(userRole) === 4) {
      const filterDistrict = userDistrict;
      if (filterDistrict) {
        const ordersCollection = db.collection('orders');
        const deviceIds = await ordersCollection.find({
          'deliveryAddress.district': { $regex: new RegExp(filterDistrict, 'i') }
        }).project({ wp_device_id: 1 }).toArray();
        const deviceIdList = deviceIds.map(d => d.wp_device_id);
        matchStage.wp_device_id = { $in: deviceIdList };
      }
    }

    const total = await collection.countDocuments(matchStage);

    return res.status(200).json({
      status: 'Success',
      totalRecords: total
    });
  } catch (error) {
    console.error('Error in GetSearchServicesCount:', error);
    logger?.error?.(error);
    return res.status(500).json({ status: 'Failed', message: 'Internal Server Error' });
  }
};

// SearchServices - Multi-field search for services with pagination
const SearchServices = async (req, res) => {
  try {
    const { getPaginationParams, formatPaginatedResponse } = require('../utils/paginationHelper');
    const db = await database.connectToDatabase();
    const collection = db.collection('service_records');
    const { page, limit, skip } = getPaginationParams(req, 10);
    const { search } = req.query;
    const userRole = req.user?.role_id;
    const userDistrict = req.user?.district;

    let matchStage = { task_type: 2 };
    
    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      matchStage.$or = [
        { task_id: searchRegex },
        { wp_device_id: searchRegex },
        { model: searchRegex },
        { customer_name: searchRegex },
        { customer_email: searchRegex },
        { assigned_technician_name: searchRegex },
        { assigned_technician_id: searchRegex },
        { device_name: searchRegex }
      ];
    }

    if (Number(userRole) === 4) {
      const filterDistrict = userDistrict;
      if (filterDistrict) {
        const ordersCollection = db.collection('orders');
        const deviceIds = await ordersCollection.find({
          'deliveryAddress.district': { $regex: new RegExp(filterDistrict, 'i') }
        }).project({ wp_device_id: 1 }).toArray();
        const deviceIdList = deviceIds.map(d => d.wp_device_id);
        matchStage.wp_device_id = { $in: deviceIdList };
      }
    }

    const services = await collection
      .find(matchStage)
      .sort({ created_date: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();
    const total = await collection.countDocuments(matchStage);

    return res.status(200).json(formatPaginatedResponse(services, total, page, limit));
  } catch (error) {
    console.error('Error in SearchServices:', error);
    logger?.error?.(error);
    return res.status(500).json({ status: 'Failed', message: 'Internal Server Error' });
  }
};

// Export controllers
module.exports = {
    getModules, authenticate, FetchAdminProfile, UpdateAdminProfile, AddProductModels, FetchProductModels, UpdateProductModels, AddDeviceDetails, FetchDeviceDetails,
    UpdateDeviceDetails, FetchCallRequest, FetchContact, FetchOrders, AddUserRoles, FetchUserRoles, UpdateUserRoles,
    AddUsers, FetchUsers, GetSearchUsersCount, SearchUsers, FetchSellers, FetchOrdersByDistrict, FetchTechniciansByDistrict, UpdateUsers, FetchInstallationService, FetchSelectUserOrders, AssignInstallation, ReAssignInstallation, FetchSelectInstallationTask,
    FetchSelectServiceTask, AssignService, ReAssignService, FetchInstalledDevicesForRequests, CreateManualRequest, FetchManualRequests, FetchManualRequestsBySellerDistrict, AssignManualRequest, ReAssignManualRequest, assignPermissions, fetchPermissionsByRole,
    GetUsersByDistrict, GetUsersByDistrictCount, GetOrdersByDistrict, GetInstallationsByDistrict, GetServicesByDistrict,
    AssignSeller, ReAssignSeller, DeactivateSellerAssignment, FetchEndUserDevices, FetchOrdersByUserId, FetchTechnicianTasksByUserId, GetAnalytics,
    GetAnalyticsByDistrict,GetDistrictsWithSellers,ConfirmCodPayment, UnAssignTask, getAssignmentHistory,
    GetSearchProductsCount, SearchProducts, GetSearchDevicesCount, SearchDevices, GetSearchOrdersCount, SearchOrders,
    GetSearchInstallationsCount, SearchInstallations, GetSearchServicesCount, SearchServices,
    GetSearchRolesCount, SearchRoles, GetSearchCallRequestsCount, SearchCallRequests, GetSearchContactCount, SearchContact,
    GetUserCountsByRole, GetUserCountByType, GetUserCountByDistrict,
    GetOrdersCounts, GetInstallationsCounts, GetServicesCounts, GetManualRequestsCounts, GetLeaveRequestsCounts,
    GetOrdersCountsByDistrict, GetInstallationsCountsByDistrict, GetServicesCountsByDistrict, GetManualRequestsCountsByDistrict, GetLeaveRequestsCountsByDistrict
    // UpdateOrdersStatus,

};
