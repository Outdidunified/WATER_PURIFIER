const { connectToDatabase } = require('../../../config/db');
const { normalizeDeliveryAddress, normalizeState } = require('../../../modules/website/models/DeliveryAddress');
const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

const fsPromises = fs.promises;
const overdueLogsDirectory = path.resolve(__dirname, '../../../logs');
const overdueLogPath = path.join(overdueLogsDirectory, 'overdue_reassignment.log');

// Single unified logger function
async function persistLog(message, metadata) {
    try {
        await fsPromises.mkdir(overdueLogsDirectory, { recursive: true });
        const timestamp = new Date().toISOString();
        const sanitizedMessage = typeof message === 'string' ? message : JSON.stringify(message);
        let serializedMetadata = '';
        if (metadata !== undefined && metadata !== null) {
            if (typeof metadata === 'string') {
                serializedMetadata = metadata;
            } else {
                try {
                    serializedMetadata = JSON.stringify(metadata);
                } catch (serializationError) {
                    serializedMetadata = `Could not serialize metadata: ${serializationError.message}`;
                }
            }
        }
        const suffix = serializedMetadata ? ` ${serializedMetadata}` : '';
        await fsPromises.appendFile(overdueLogPath, `${timestamp} ${sanitizedMessage}${suffix}\n`);
    } catch (error) {
        console.error(`Failed to persist log:`, error);
    }
}

async function logEvent(message, metadata) {
    console.log(message);
    await persistLog(message, metadata);
}

async function logOverdueEvent(message, metadata) {
    await logEvent(message, metadata);
}

async function persistOverdueLog(message, metadata) {
    await persistLog(message, metadata);
}

// Rate limiter to prevent email spam detection
async function delayForEmailRateLimit(delayMs = 500) {
    return new Promise(resolve => setTimeout(resolve, delayMs));
}

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

const sendMailWithRetry = async (payload, retries = 2) => {
    let attempt = 0;
    let lastError = null;
    while (attempt <= retries) {
        try {
            const delay = attempt === 0 ? 500 : Math.min(1500 * attempt, 5000);
            await delayForEmailRateLimit(delay);
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

// Send OTP email for installation
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
        return { subject, text, html };
    } catch (error) {
        console.error('Error in sendAssignInstallationEmail:', error);
        return null;
    }
}

// Send OTP email for service
async function sendAssignServiceEmail(email, otp) {
    try {
        const subject = 'Service OTP - IonHive Water Purifier';
        const text = `Hi IonHive water purifier user,

        Your service OTP is: ${otp}

        Once your IonHive device is serviced by our technician, please share this OTP with them to complete the service process.

        Thank you for choosing IonHive!`;

        const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border-radius: 10px; background-color: #f9f9f9; border: 1px solid #ddd;">
                <h2 style="color: #333;">Hi IonHive Water Purifier User,</h2>
                <p style="font-size: 16px; color: #555;">
                    Your service OTP is: <strong style="color: #000;">${otp}</strong>
                </p>
                <p style="font-size: 16px; color: #555;">
                    Once our service technician completes your maintenance, they will request this OTP from you to verify successful service.
                </p>
                <p style="color: #555;">Thank you for choosing <strong>IonHive</strong>!</p>
                <p style="font-size: 14px; color: #888; text-align: center; margin-top: 30px; border-top: 1px solid #ddd; padding-top: 10px;">
                    This is an automated message from IonHive Water Purifier.
                </p>
            </div>
        `;

        await sendEmail(email, subject, text, html);
        return { subject, text, html };
    } catch (error) {
        console.error('Error in sendAssignServiceEmail:', error);
        return null;
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
    console.log('Attempting to log to assignment_history:', historyData);
    try {
        const assignmentHistory = db.collection('assignment_history');
        const result = await assignmentHistory.insertOne({
            ...historyData,
            created_at: new Date()
        });
        console.log('Successfully logged to assignment_history:', result.insertedId);
    } catch (err) {
        console.error('Error logging to assignment history:', err);
        throw err; // Re-throw to see if it affects the assignment
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

async function sendTechnicianAssignmentEmail(technician, { taskId, taskType, normalizedAddress, isReassignment = false }) {
    if (!technician?.email) {
        return null;
    }

    const taskTitle = taskType === 1 ? 'Installation' : 'Service';
    const taskLabel = taskTitle.toLowerCase();
    const technicianName = technician.name || 'Technician';
    const locationString = [normalizedAddress?.city, normalizedAddress?.district, normalizedAddress?.state]
        .filter(Boolean)
        .join(', ');
    
    const assignmentType = isReassignment ? 'Re-assigned' : 'assigned';
    const subject = `${isReassignment ? 'Re-assigned' : 'New'} ${taskTitle} Task - IonHive`;
    const locationText = locationString ? `\nLocation: ${locationString}` : '';
    const locationListItem = locationString ? `<li><strong>Location:</strong> ${locationString}</li>` : '';

    const text = `Hello ${technicianName},

A ${taskLabel} task (Task ID: ${taskId}) has been ${assignmentType} to you. Please review the schedule and reach out to the customer to confirm the appointment.${locationText}

Thank you,
IonHive Team`;

    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border-radius: 10px; background-color: #f9f9f9; border: 1px solid #ddd;">
            <h2 style="color: #333;">${isReassignment ? 'Re-assigned' : 'New'} ${taskTitle} Task</h2>
            <p style="font-size: 16px; color: #555;">You have been ${assignmentType} a ${taskLabel} task.</p>
            <ul style="font-size: 16px; color: #555;">
                <li><strong>Task ID:</strong> ${taskId}</li>
                ${locationListItem}
            </ul>
            <p style="font-size: 16px; color: #555;">Please contact the customer to coordinate the ${taskLabel}.</p>
            <p style="font-size: 14px; color: #888; text-align: center; margin-top: 30px; border-top: 1px solid #ddd; padding-top: 10px;">This is an automated message from IonHive Water Purifier.</p>
        </div>
    `;

    await sendEmail(technician.email, subject, text, html);
    return { subject, text, html };
}

// Find the best technician based on location and workload
async function findBestTechnician(normalizedAddress, excludedTechnicianIds = [], options = {}) {
    const { ensureNotOnLeave = true, assignmentDate = new Date() } = options;
    const db = await connectToDatabase();
    const usersCollection = db.collection('users');
    const serviceRecordsCollection = db.collection('service_records');
    const leaveRequestsCollection = db.collection('leave_requests');

    if (!normalizedAddress?.state || !normalizedAddress?.district) {
        return null;
    }

    const { state, district } = normalizedAddress;

    // Normalize excluded technician ids for easy comparison
    const excludedSet = new Set(
        (excludedTechnicianIds || [])
            .map(id => (id !== undefined && id !== null) ? id.toString().trim() : null)
            .filter(Boolean)
    );

    const todayStart = new Date(assignmentDate);
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(assignmentDate);
    todayEnd.setHours(23, 59, 59, 999);

    // Find all technicians (we'll filter by normalized state)
    const allTechnicians = await usersCollection.find({
        role_id: 2,
        status: true
    }).toArray();

    // Filter by exact state and district match only
    let technicians = allTechnicians.filter(tech => {
        const normalizedTechState = normalizeState(tech.state || '');
        const techDistrictNormalized = normalizeDeliveryAddress({ district: tech.district || '' }).district;
        const technicianId = (tech.technician_id !== undefined && tech.technician_id !== null)
            ? tech.technician_id.toString().trim()
            : null;
        const matchesLocation =
            normalizedTechState.toLowerCase() === state.toLowerCase() &&
            techDistrictNormalized.toLowerCase() === district.toLowerCase();
        const notExcluded = technicianId ? !excludedSet.has(technicianId) : false;
        return matchesLocation && notExcluded;
    });

    if (ensureNotOnLeave && technicians.length) {
        const technicianIds = technicians
            .map(tech => tech.technician_id)
            .filter(id => id !== undefined && id !== null);

        if (technicianIds.length) {
            const approvedLeaves = await leaveRequestsCollection.find({
                technician_id: { $in: technicianIds },
                status: 'Approved',
                from_date: { $lte: todayEnd },
                to_date: { $gte: todayStart }
            }).toArray();

            const onLeaveIds = new Set(approvedLeaves.map(leave => leave.technician_id));
            technicians = technicians.filter(tech => !onLeaveIds.has(tech.technician_id));
        }
    }

    console.log(`Found ${technicians.length} technicians for state: ${state}, district: ${district}`);

    if (technicians.length === 0) return null;

    // For each technician, get pending tasks count
    const techWithWorkload = await Promise.all(technicians.map(async (tech) => {
        const pendingTasks = await serviceRecordsCollection.countDocuments({
            assigned_technician_id: tech.technician_id,
            task_status: { $in: ['Pending', 'Initiated'] }
        });
        return { ...tech, pendingTasks };
    }));

    // Filter those with fewer than 20 pending tasks
    const availableTechs = techWithWorkload.filter(t => t.pendingTasks < 20);

    console.log(`Available technicians after workload filter: ${availableTechs.length}`);

    if (availableTechs.length === 0) return null;

    // Sort by pendingTasks asc
    availableTechs.sort((a, b) => a.pendingTasks - b.pendingTasks);

    return availableTechs[0];
}

function isTechnicianMatchingDistrict(technician, normalizedAddress) {
    if (!technician || !normalizedAddress) {
        return false;
    }

    const targetState = normalizeState(normalizedAddress.state || '');
    const targetDistrict = normalizeDeliveryAddress({ district: normalizedAddress.district || '' }).district;
    const technicianState = normalizeState(technician.state || '');
    const technicianDistrict = normalizeDeliveryAddress({ district: technician.district || '' }).district;

    if (!targetState || !targetDistrict || !technicianState || !technicianDistrict) {
        return false;
    }

    return technicianState.toLowerCase() === targetState.toLowerCase()
        && technicianDistrict.toLowerCase() === targetDistrict.toLowerCase();
}

// Auto assign installation after order confirmation
async function autoAssignInstallation(order) {
    try {
        // Validate order object exists
        if (!order) {
            console.error('Error: order object is undefined or null in autoAssignInstallation');
            return;
        }

        if (order.isRecharge) {
            console.log(`Skipping auto-assign for recharge order ${order.customOrderId}`);
            return;
        }


        const db = await connectToDatabase();
        const serviceRecords = db.collection("service_records");
        const usersCollection = db.collection("users");
        const ordersCollection = db.collection("orders");
        const paymentsCollection = db.collection("payments");
        const technicianDetailsCollection = db.collection("technician_details");

        console.log('Auto-assign processing for order:', {
            customOrderId: order.customOrderId,
            wp_device_id: order.wp_device_id,
            hasDeliveryAddress: !!order.deliveryAddress
        });

        const normalizedAddress = normalizeDeliveryAddress(order.deliveryAddress || {});

        // Check if Installation already assigned
        const existingInstallation = await serviceRecords.findOne({
            wp_device_id: order.wp_device_id,
            task_type: 1,
            task_status: { $ne: 'Unassigned' }
        });

        if (existingInstallation) {
            console.log(`Installation already assigned for device ${order.wp_device_id}`);
            return;
        }

        // Check if there's an existing Unassigned task to assign instead of creating new
        let task = await serviceRecords.findOne({
            wp_device_id: order.wp_device_id,
            task_type: 1,
            task_status: 'Unassigned'
        });

        let taskId;
        const now = new Date();

        if (!task) {
            // Enforce order confirmation and payment rules based on payment type
            const normalizedPaymentType = (order.paymentType || '').toString().toUpperCase();
            const isOrderConfirmed = order.orderStatus === 'Confirmed';
            const isPaymentCompleted = order.paymentStatus === 'Completed';
            const isDeliveryCompleted = order.deliveryCurrentStatus === 'completed';

            if (!isOrderConfirmed) {
                console.log(`Skipping auto-assign for unconfirmed order ${order.customOrderId || order.wp_device_id}`);
                return;
            }

            if (normalizedPaymentType !== 'COD' && !isPaymentCompleted) {
                console.log(`Skipping auto-assign for unpaid order ${order.customOrderId || order.wp_device_id} (paymentType: ${normalizedPaymentType || 'N/A'})`);
                return;
            }

            if (!isDeliveryCompleted) {
                console.log(`Skipping auto-assign for order ${order.customOrderId || order.wp_device_id}: delivery not marked completed (currentStatus: ${order.deliveryCurrentStatus})`);
                return;
            }

            const paymentDetails = order?._id ? await paymentsCollection.findOne({ orderId: order._id }) : null;

            const normalizeId = (value) =>
                value && typeof value.toString === 'function' ? value.toString() : value ?? null;

            const sanitizeDuration = (duration) => {
                if (!duration || typeof duration !== 'object') return duration ?? null;
                const { plans, ...rest } = duration;
                return rest;
            };

            const orderSnapshot = {
                orderId: normalizeId(order?._id),
                customOrderId: order?.customOrderId ?? null,
                user_id: order?.user_id ?? null,
                productModelId: order?.productModelId ?? null,
                modelName: order?.modelName ?? null,
                modeltype: order?.modeltype ?? null,
                main_image: order?.main_image ?? null,
                sub_images: Array.isArray(order?.sub_images) ? order.sub_images : [],
                wp_device_id: order?.wp_device_id ?? null,
                selectedPlan: order?.selectedPlan ?? null,
                selectedDuration: sanitizeDuration(order?.selectedDuration ?? null),
                grandTotal: order?.grandTotal ?? null,
                price: order?.price ?? null,
                subtotal: order?.subtotal ?? null,
                securityDeposit: order?.securityDeposit ?? null,
                paymentType: normalizedPaymentType || null,
                paymentStatus: order?.paymentStatus ?? null,
                orderStatus: order?.orderStatus ?? null,
                razorpayOrderId: order?.razorpayOrderId ?? null,
                deliveryAddress: order?.deliveryAddress ?? null,
                totalLitre: order?.totalLitre ?? null,
                createdAt: order?.createdAt ?? null,
                updatedAt: order?.updatedAt ?? null
            };

            const paymentSnapshot = paymentDetails
                ? {
                      paymentId: normalizeId(paymentDetails._id),
                      orderId: normalizeId(paymentDetails.orderId),
                      paymentType: paymentDetails.paymentType ?? null,
                      paymentStatus: paymentDetails.paymentStatus ?? null,
                      finalMonthlyPrice: paymentDetails.finalMonthlyPrice ?? null,
                      discountAmount: paymentDetails.discountAmount ?? null,
                      priceWithGST: paymentDetails.priceWithGST ?? null,
                      gstAmount: paymentDetails.gstAmount ?? null,
                      securityDeposit: paymentDetails.securityDeposit ?? null,
                      totalPrice: paymentDetails.totalPrice ?? null,
                      subtotal: paymentDetails.subtotal ?? null,
                      price: paymentDetails.price ?? null,
                      razorpayOrderId: paymentDetails.razorpayOrderId ?? null,
                      razorpayPaymentId: paymentDetails.razorpayPaymentId ?? null,
                      createdAt: paymentDetails.createdAt ?? null,
                      updatedAt: paymentDetails.updatedAt ?? null
                  }
                : null;

            // Generate task ID
            const lastTask = await serviceRecords.find().sort({ task_id: -1 }).limit(1).toArray();
            taskId = lastTask.length > 0 ? lastTask[0].task_id + 1 : 1;

            // Prepare new task (unassigned initially)
            const newTask = {
                task_id: taskId,
                task_status: "Unassigned",
                task_type: 1, // Installation
                task_description: "Ordered a new device",
                assigned_technician_id: null,
                task_created_by_user_id: order.user_id,
                task_created_by_user_email: null,
                wp_device_id: order.wp_device_id,
                created_date: now,
                created_by: 'system',
                assignment_history: [],
                address: normalizedAddress,
                product: {
                    model_name: order.modelName,
                    modeltype: order.modeltype ?? null,
                    wp_device_id: order.wp_device_id,
                    selectedPlan: order.selectedPlan,
                    selectedDuration: sanitizeDuration(order.selectedDuration)
                },
                order_snapshot: orderSnapshot,
                payment_snapshot: paymentSnapshot
            };

            // Insert task
            await serviceRecords.insertOne(newTask);
            task = newTask;
        } else {
            taskId = task.task_id;
        }

        // Fetch user info (needed for emails)
        let orderUser = await usersCollection.findOne({ user_id: order.user_id });
        if (!orderUser) {
            console.log('User not found for order');
            return;
        }

        // Update task with user email if it was just created
        if (!task?.task_created_by_user_email) {
            await serviceRecords.updateOne(
                { task_id: taskId },
                { $set: { task_created_by_user_email: orderUser.email } }
            );
        }

        // Find best technician
        const technician = await findBestTechnician(normalizedAddress);

        if (!technician) {
            console.log(`No available technician for installation, task created as unassigned`);
        } else if (!isTechnicianMatchingDistrict(technician, normalizedAddress)) {
            console.log(`Found technician ${technician.technician_id} for installation but district mismatch, leaving task unassigned`);
        } else {
            const otp = Math.floor(100000 + Math.random() * 900000);
            const estimatedEnd = new Date(now.getTime() + 3 * 60 * 60 * 1000); // 3 hours from assignment

            // Assign the task
            await serviceRecords.updateOne(
                { task_id: taskId },
                {
                    $set: {
                        task_status: "Pending",
                        assigned_technician_id: technician.technician_id,
                        assigned_date: now,
                        estimated_end: estimatedEnd,
                        otp: otp,
                        assigned_by: 'system',
                        pending_reason: null
                    },
                    $push: {
                        assignment_history: {
                            technician_id: technician.technician_id,
                            assigned_date: now,
                            assigned_by: 'system'
                        }
                    }
                }
            );

            // Update technician details
            await technicianDetailsCollection.updateOne(
                { user_id: technician.user_id, role_id: technician.role_id, technician_id: technician.technician_id },
                {
                    $set: {
                        user_id: technician.user_id,
                        role_id: technician.role_id,
                        email: technician.email,
                        technician_id: technician.technician_id,
                        status: true
                    },
                    $inc: { total_assigned_services: 1 }
                },
                { upsert: true }
            );

            // Send OTP email ONLY if not already sent
            await serviceRecords.updateOne(
                { task_id: taskId },
                {
                    $set: {
                        otp_sent: true,
                        otp_sent_date: now
                    }
                }
            );

            await sendAssignInstallationEmail(orderUser.email, otp);
            await delayForEmailRateLimit(500);
            await sendTechnicianAssignmentEmail(technician, {
                taskId: taskId,
                otp,
                taskType: 1,
                normalizedAddress,
                isReassignment: false
            });
            await delayForEmailRateLimit(500);

            const districtSellers = await getDistrictSellers(db, normalizedAddress.district);
            const sellerEmails = districtSellers.map(s => s.email);
            const adminEmails = ['admin@gmail.com'];
            const allNotificationEmails = [...sellerEmails, ...adminEmails];

            const notificationHtml = `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border-radius: 10px; background-color: #f9f9f9; border: 1px solid #ddd;">
                    <h2 style="color: #333;">Installation Task Auto-assigned</h2>
                    <ul style="font-size: 16px; color: #555;">
                        <li><strong>Task ID:</strong> ${taskId}</li>
                        <li><strong>Device ID:</strong> ${order.wp_device_id}</li>
                        <li><strong>Technician:</strong> ${technician.name || 'N/A'}</li>
                        <li><strong>Customer Email:</strong> ${orderUser.email}</li>
                        <li><strong>Location:</strong> ${normalizedAddress.city}, ${normalizedAddress.district}, ${normalizedAddress.state}</li>
                        <li><strong>Product:</strong> ${order.modelName}</li>
                    </ul>
                    <p style="font-size: 14px; color: #888; text-align: center; margin-top: 30px; border-top: 1px solid #ddd; padding-top: 10px;">This is an automated notification from IonHive Water Purifier.</p>
                </div>
            `;

            await sendEmailToMultiple(allNotificationEmails, 'Installation Task Auto-assigned - IonHive', '', notificationHtml);
            await delayForEmailRateLimit(500);

            // Log to assignment history
            await logToAssignmentHistory(db, {
                task_id: taskId,
                task_type: 1,
                assignment_type: 'Installation',
                action: 'assign',
                assignment_mode: 'auto',
                technician_id: technician.technician_id,
                technician_name: technician.name,
                previous_technician_id: null,
                device_id: order.wp_device_id,
                customer_email: orderUser.email,
                location: {
                    city: normalizedAddress.city,
                    district: normalizedAddress.district,
                    state: normalizedAddress.state
                },
                assigned_by: 'system',
                reason: null
            });

            console.log(`Installation auto-assigned to technician ${technician.technician_id}`);
        }

    } catch (err) {
        console.error("Error in autoAssignInstallation:", err);
    }
}

// Auto assign all pending installations (for confirmed orders without tasks)
async function autoAssignPendingInstallations() {
    try {
        const db = await connectToDatabase();
        const ordersCollection = db.collection("orders");
        const serviceRecords = db.collection("service_records");

        // Find all confirmed and paid orders
        const confirmedOrders = await ordersCollection.find({
            orderStatus: 'Confirmed',
            $or: [
                { paymentStatus: 'Completed' },
                { paymentType: { $regex: /^cod$/i } }
            ]
        }).toArray();

        for (const order of confirmedOrders) {
            // Check if task already exists
            const existingTask = await serviceRecords.findOne({
                wp_device_id: order.wp_device_id,
                task_type: 1
            });
            if (!existingTask) {
                console.log(`Assigning pending installation for order ${order.customOrderId}`);
                await autoAssignInstallation(order);
            }
        }

        console.log('Finished auto-assigning pending installations');

    } catch (err) {
        console.error("Error in autoAssignPendingInstallations:", err);
    }
}

// Auto assign service after service request creation
async function autoAssignService(taskId) {
    try {
        const db = await connectToDatabase();
        const serviceRecords = db.collection("service_records");
        const usersCollection = db.collection("users");
        const ordersCollection = db.collection("orders");
        const technicianDetailsCollection = db.collection("technician_details");

        // Find the task
        const task = await serviceRecords.findOne({ task_id: taskId });
        if (!task) {
            console.log(`Task ${taskId} not found`);
            return;
        }

        // For service tasks tied to an order/device, enforce payment check and prefer the order's delivery address
        let relatedOrder = null;
        if (task.wp_device_id) {
            relatedOrder = await ordersCollection.findOne({ wp_device_id: task.wp_device_id });
        }

        if (!relatedOrder && task.device_id) {
            const matchedInstallTask = await serviceRecords.findOne({
                task_type: 1,
                wp_device_id: task.device_id
            });
            if (matchedInstallTask?.order?.customOrderId) {
                relatedOrder = await ordersCollection.findOne({ customOrderId: matchedInstallTask.order.customOrderId });
            }
        }

        if (!relatedOrder) {
            console.log(`❌ Skipping auto-assign service for task ${taskId}: no matching order found by wp_device_id or device_id`);
            return;
        }

        if (relatedOrder.paymentStatus !== 'Completed') {
            console.log(`⚠️ Skipping auto-assign service for unpaid order ${relatedOrder.customOrderId || task.wp_device_id || task.device_id}`);
            return;
        }

        // Use ONLY order delivery address (no user profile fallback)
        let normalizedAddress = null;
        if (relatedOrder?.deliveryAddress) {
            normalizedAddress = normalizeDeliveryAddress(relatedOrder.deliveryAddress);
            console.log(`✅ autoAssignService - Task ${taskId}: Using ORDER address - ${normalizedAddress.state}, ${normalizedAddress.district}`);
        }

        if (!normalizedAddress) {
            console.log(`❌ Skipping auto-assign service for task ${taskId}: order has no delivery address`);
            return;
        }

        const historyTechnicianIds = (task.assignment_history || [])
            .map(entry => (entry?.technician_id !== undefined && entry?.technician_id !== null)
                ? entry.technician_id.toString().trim()
                : null)
            .filter(Boolean);
        if (task.assigned_technician_id) {
            historyTechnicianIds.push(task.assigned_technician_id.toString().trim());
        }

        // Find best technician
        console.log(`Attempting auto-assign for service task ${taskId} (wp_device_id: ${task.wp_device_id || 'N/A'}, device_id: ${task.device_id || 'N/A'}) with address`, normalizedAddress);

        if (!task.address) {
            await serviceRecords.updateOne(
                { task_id: taskId },
                {
                    $set: { address: normalizedAddress }
                }
            );
        }

        const technician = await findBestTechnician(normalizedAddress, historyTechnicianIds);
        if (technician && !isTechnicianMatchingDistrict(technician, normalizedAddress)) {
            console.log(`Found technician ${technician.technician_id} for service task ${taskId} but district mismatch, leaving task unassigned`);
            return;
        }

        if (!technician) {
            console.log(`No available technician for service task ${taskId} (wp_device_id: ${task.wp_device_id || 'N/A'}, device_id: ${task.device_id || 'N/A'})`);
            return;
        }

        const otp = Math.floor(100000 + Math.random() * 900000);
        const now = new Date();

        // Update the task
        const updateSet = {
            task_status: "Pending",
            assigned_technician_id: technician.technician_id,
            assigned_date: now,
            otp: otp,
            assigned_by: 'system',
            modified_by: 'system',
            modified_date: now
        };

        if (!task.address) {
            updateSet.address = normalizedAddress;
        }

        await serviceRecords.updateOne(
            { task_id: taskId },
            {
                $set: updateSet,
                $push: {
                    assignment_history: {
                        technician_id: technician.technician_id,
                        assigned_date: now,
                        assigned_by: 'system'
                    }
                }
            }
        );

        // Update technician details
        await technicianDetailsCollection.updateOne(
            { technician_id: technician.technician_id },
            {
                $set: {
                    user_id: technician.user_id,
                    role_id: technician.role_id,
                    email: technician.email,
                    technician_id: technician.technician_id,
                    status: true
                },
                $inc: { total_assigned_services: 1 }
            },
            { upsert: true }
        );

        // Send notifications with rate limiting
        await sendAssignServiceEmail(task.task_created_by_user_email, otp);
        await delayForEmailRateLimit(500); // Rate limiting to prevent email spam detection
        await sendTechnicianAssignmentEmail(technician, {
            taskId: taskId,
            otp,
            taskType: 2,
            normalizedAddress
        });
        await delayForEmailRateLimit(500); // Rate limiting to prevent email spam detection

        // Get district sellers and send notification emails
        const districtSellers = await getDistrictSellers(db, normalizedAddress.district);
        const sellerEmails = districtSellers.map(s => s.email);
        const adminEmails = ['admin@gmail.com'];
        const allNotificationEmails = [...sellerEmails, ...adminEmails];

        const notificationHtml = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border-radius: 10px; background-color: #f9f9f9; border: 1px solid #ddd;">
                <h2 style="color: #333;">Service Task Auto-assigned</h2>
                <ul style="font-size: 16px; color: #555;">
                    <li><strong>Task ID:</strong> ${taskId}</li>
                    <li><strong>Device ID:</strong> ${task.wp_device_id || task.device_id}</li>
                    <li><strong>Technician:</strong> ${technician.name || 'N/A'}</li>
                    <li><strong>Customer Email:</strong> ${task.task_created_by_user_email}</li>
                    <li><strong>Location:</strong> ${normalizedAddress.city}, ${normalizedAddress.district}, ${normalizedAddress.state}</li>
                </ul>
                <p style="font-size: 14px; color: #888; text-align: center; margin-top: 30px; border-top: 1px solid #ddd; padding-top: 10px;">This is an automated notification from IonHive Water Purifier.</p>
            </div>
        `;

        await sendEmailToMultiple(allNotificationEmails, 'Service Task Auto-assigned - IonHive', '', notificationHtml);
        await delayForEmailRateLimit(500);

        // Log to assignment history
        await logToAssignmentHistory(db, {
            task_id: taskId,
            task_type: 2,
            assignment_type: 'Service',
            action: 'assign',
            assignment_mode: 'auto',
            technician_id: technician.technician_id,
            technician_name: technician.name,
            previous_technician_id: null,
            device_id: task.wp_device_id || task.device_id,
            customer_email: task.task_created_by_user_email,
            location: {
                city: normalizedAddress.city,
                district: normalizedAddress.district,
                state: normalizedAddress.state
            },
            assigned_by: 'system',
            reason: null
        });

        console.log(`Service auto-assigned to technician ${technician.technician_id}`);

    } catch (err) {
        console.error("Error in autoAssignService:", err);
    }
}

// Auto assign pending tasks (unassigned installations or services)
async function autoAssignPendingTasks() {
    try {
        const db = await connectToDatabase();
        const serviceRecords = db.collection("service_records");
        const usersCollection = db.collection("users");
        const ordersCollection = db.collection("orders");
        const technicianDetailsCollection = db.collection("technician_details");

        // Find all unassigned tasks
        const pendingTasks = await serviceRecords.find({
            assigned_technician_id: null,
            task_status: { $in: ["Unassigned", "Pending", "Initiated"] }
        }).toArray();

        console.log(`Found ${pendingTasks.length} pending tasks`);

        for (const task of pendingTasks) {
            let normalizedAddress = null;

            if (task.task_type === 1) {
                // Installation: use address from task or fetch from order
                if (task.address) {
                    normalizedAddress = task.address;
                } else if (task.order && task.order.customOrderId) {
                    const order = await ordersCollection.findOne({ customOrderId: task.order.customOrderId });
                    if (order && order.deliveryAddress) {
                        normalizedAddress = normalizeDeliveryAddress(order.deliveryAddress);
                    }
                }
            } else if (task.task_type === 2) {
                // Service: ONLY use order delivery address (no user profile fallback)
                let relatedOrder = null;
                if (task.wp_device_id || task.device_id) {
                    if (task.wp_device_id) {    
                        relatedOrder = await ordersCollection.findOne({ wp_device_id: task.wp_device_id });
                    } else if (task.device_id) {
                        relatedOrder = await ordersCollection.findOne({ wp_device_id: task.device_id });
                    }
                    else {
                        console.log(`❌ Task ${task.task_id} has no wp_device_id or device_id. Cannot determine order. Skipping task.`);
                    }

                    if (!relatedOrder) {
                        console.log(`❌ No order found for device_id: ${task.wp_device_id} (task ${task.task_id}). Skipping task.`);
                    } else if (relatedOrder?.deliveryAddress) {
                        normalizedAddress = normalizeDeliveryAddress(relatedOrder.deliveryAddress);
                        console.log(`✅ Service task ${task.task_id}: Using ORDER address - ${normalizedAddress.state}, ${normalizedAddress.district}`);
                    } else {
                        console.log(`❌ Order found for device_id: ${task.wp_device_id} (task ${task.task_id}) but has no delivery address. Skipping task.`);
                    }
                } else {
                    console.log(`❌ Task ${task.task_id} has no wp_device_id. Cannot determine address. Skipping task.`);
                }
            }

            if (!normalizedAddress) {
                console.log(`No address found for task ${task.task_id}, skipping`);
                continue;
            }

            // Handle tasks already assigned but with mismatched district
            if (task.assigned_technician_id) {
                const currentTechnician = await usersCollection.findOne({ technician_id: task.assigned_technician_id });
                if (currentTechnician && !isTechnicianMatchingDistrict(currentTechnician, normalizedAddress)) {
                    await serviceRecords.updateOne(
                        { task_id: task.task_id },
                        {
                            $set: {
                                assigned_technician_id: null,
                                task_status: "Unassigned",
                                pending_reason: "Technician district mismatch",
                                otp: null,
                                modified_by: 'system',
                                modified_date: new Date()
                            },
                            $push: {
                                assignment_history: {
                                    technician_id: currentTechnician.technician_id,
                                    unassigned_date: new Date(),
                                    unassigned_by: 'system',
                                    unassigned_reason: 'Technician district mismatch'
                                }
                            }
                        }
                    );
                    console.log(`Cleared assignment for task ${task.task_id} due to technician district mismatch`);
                }
            }

            // Find best technician
            const assignmentHistoryIds = (task.assignment_history || [])
                .map(entry => (entry?.technician_id !== undefined && entry?.technician_id !== null)
                    ? entry.technician_id.toString().trim()
                    : null)
                .filter(Boolean);

            const technician = await findBestTechnician(normalizedAddress, assignmentHistoryIds);
            if (!technician) {
                console.log(`No available technician for task ${task.task_id}`);
                continue;
            }

            if (!isTechnicianMatchingDistrict(technician, normalizedAddress)) {
                console.log(`Found technician ${technician.technician_id} for pending task ${task.task_id} but district mismatch, skipping assignment`);
                continue;
            }

            const otp = Math.floor(100000 + Math.random() * 900000);
            const now = new Date();

            if (task.task_type === 1) {
                // Assign installation
                await serviceRecords.updateOne(
                    { task_id: task.task_id },
                    {
                        $set: {
                            task_status: "Pending",
                            assigned_technician_id: technician.technician_id,
                            assigned_date: now,
                            otp: otp,
                            assigned_by: 'system',
                            modified_by: 'system',
                            modified_date: now,
                            pending_reason: null
                        },
                        $push: {
                            assignment_history: {
                                technician_id: technician.technician_id,
                                assigned_date: now,
                                assigned_by: 'system'
                            }
                        }
                    }
                );

                // Update technician details
                await technicianDetailsCollection.updateOne(
                    { technician_id: technician.technician_id },
                    {
                        $set: {
                            user_id: technician.user_id,
                            role_id: technician.role_id,
                            email: technician.email,
                            technician_id: technician.technician_id,
                            status: true
                        },
                        $inc: { total_assigned_services: 1 }
                    },
                    { upsert: true }
                );

                // Send OTP email ONLY if not already sent
                const user = await usersCollection.findOne({ user_id: task.task_created_by_user_id });
                if (user && !task.otp_sent) {
                    await sendAssignInstallationEmail(user.email, otp);
                    await delayForEmailRateLimit(500);
                    
                    // Mark OTP as sent to prevent duplicate emails
                    await serviceRecords.updateOne(
                        { task_id: task.task_id },
                        { $set: { otp_sent: true, otp_sent_date: new Date() } }
                    );
                }

                await sendTechnicianAssignmentEmail(technician, {
                    taskId: task.task_id,
                    otp,
                    taskType: 1,
                    normalizedAddress
                });
                await delayForEmailRateLimit(500); // Rate limiting to prevent email spam detection

                // Log to assignment history
                await logToAssignmentHistory(db, {
                    task_id: task.task_id,
                    task_type: 1,
                    assignment_type: 'Installation',
                    action: 'assign',
                    assignment_mode: 'auto',
                    technician_id: technician.technician_id,
                    technician_name: technician.name,
                    previous_technician_id: null,
                    device_id: task.wp_device_id,
                    customer_email: user?.email,
                    location: {
                        city: normalizedAddress.city,
                        district: normalizedAddress.district,
                        state: normalizedAddress.state
                    },
                    assigned_by: 'system',
                    reason: null
                });

            } else if (task.task_type === 2) {
                const serviceUpdateSet = {
                    task_status: "Pending",
                    assigned_technician_id: technician.technician_id,
                    assigned_date: now,
                    otp: otp,
                    assigned_by: 'system',
                    modified_by: 'system',
                    modified_date: now,
                    pending_reason: null
                };

                if (!task.address) {
                    serviceUpdateSet.address = normalizedAddress;
                }

                await serviceRecords.updateOne(
                    { task_id: task.task_id },
                    {
                        $set: serviceUpdateSet,
                        $push: {
                            assignment_history: {
                                technician_id: technician.technician_id,
                                assigned_date: now,
                                assigned_by: 'system'
                            }
                        }
                    }
                );

                await technicianDetailsCollection.updateOne(
                    { technician_id: technician.technician_id },
                    {
                        $set: {
                            user_id: technician.user_id,
                            role_id: technician.role_id,
                            email: technician.email,
                            technician_id: technician.technician_id,
                            status: true
                        },
                        $inc: { total_assigned_services: 1 }
                    },
                    { upsert: true }
                );

                // Send OTP email ONLY if not already sent
                if (task.task_created_by_user_email && !task.otp_sent) {
                    await sendAssignServiceEmail(task.task_created_by_user_email, otp);
                    await delayForEmailRateLimit(500);
                    
                    // Mark OTP as sent to prevent duplicate emails
                    await serviceRecords.updateOne(
                        { task_id: task.task_id },
                        { $set: { otp_sent: true, otp_sent_date: new Date() } }
                    );
                }
                
                await sendTechnicianAssignmentEmail(technician, {
                    taskId: task.task_id,
                    otp,
                    taskType: 2,
                    normalizedAddress
                });
                await delayForEmailRateLimit(500);

                // Log to assignment history
                await logToAssignmentHistory(db, {
                    task_id: task.task_id,
                    task_type: 2,
                    assignment_type: 'Service',
                    action: 'assign',
                    assignment_mode: 'auto',
                    technician_id: technician.technician_id,
                    technician_name: technician.name,
                    previous_technician_id: null,
                    device_id: task.wp_device_id || task.device_id,
                    customer_email: task.task_created_by_user_email,
                    location: {
                        city: normalizedAddress.city,
                        district: normalizedAddress.district,
                        state: normalizedAddress.state
                    },
                    assigned_by: 'system',
                    reason: null
                });
            }

            console.log(`Auto-assigned pending task ${task.task_id} to technician ${technician.technician_id}`);
        }

    } catch (err) {
        console.error("Error in autoAssignPendingTasks:", err);
    }
}

async function autoReassignOverdueTasks() {
    try {
        const db = await connectToDatabase();
        const serviceRecords = db.collection("service_records");
        const usersCollection = db.collection("users");
        const ordersCollection = db.collection("orders");
        const technicianDetailsCollection = db.collection("technician_details");

        const now = new Date();
        const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);

        const candidateTasks = await serviceRecords
            .find({
                task_type: { $in: [1, 2] },
                assigned_technician_id: { $ne: null },
                task_status: { $in: ["Pending", "Initiated", "In Progress"] },
                $or: [
                    { estimated_end: { $lt: now } },
                    { estimated_start: { $ne: null, $lte: threeDaysAgo } },
                    { assigned_date: { $ne: null, $lte: threeDaysAgo } },
                    { created_date: { $ne: null, $lte: threeDaysAgo } }
                ]
            })
            .sort({ assigned_date: 1, task_id: 1 })
            .limit(50)
            .toArray();

        await logOverdueEvent(`Found ${candidateTasks.length} overdue reassignment candidates`);

        for (const task of candidateTasks) {
            const estimatedStart = task.estimated_start ? new Date(task.estimated_start) : null;
            const estimatedEnd = task.estimated_end ? new Date(task.estimated_end) : null;
            const assignedDate = task.assigned_date ? new Date(task.assigned_date) : null;
            const createdDate = task.created_date ? new Date(task.created_date) : null;
            const taskTypeLabel = task.task_type === 1 ? 'Installation' : 'Service';

            const isStartValid = estimatedStart && !Number.isNaN(estimatedStart.getTime());
            const isAssignedValid = assignedDate && !Number.isNaN(assignedDate.getTime());
            const isCreatedValid = createdDate && !Number.isNaN(createdDate.getTime());
            const effectiveStart = isStartValid
                ? estimatedStart
                : isAssignedValid
                    ? assignedDate
                    : isCreatedValid
                        ? createdDate
                        : null;
            const effectiveStartLabel = isStartValid
                ? 'estimated_start'
                : isAssignedValid
                    ? 'assigned_date'
                    : isCreatedValid
                        ? 'created_date'
                        : null;

            const isEndValid = estimatedEnd && !Number.isNaN(estimatedEnd.getTime());
            const isStartOverdue = effectiveStart && effectiveStart <= threeDaysAgo;
            const isEndOverdue = isEndValid && estimatedEnd < now;

            await logOverdueEvent(
                `Overdue evaluation for ${taskTypeLabel} task ${task.task_id}: ` +
                `effectiveStart=${effectiveStart ? effectiveStart.toISOString() : 'null'} ` +
                `(threshold=${threeDaysAgo.toISOString()}, field=${effectiveStartLabel || 'n/a'}), ` +
                `estimatedEnd=${estimatedEnd ? estimatedEnd.toISOString() : 'null'} ` +
                `(now=${now.toISOString()})`
            );

            if (!isStartOverdue && !isEndOverdue) {
                await logOverdueEvent(`Skipping ${taskTypeLabel} task ${task.task_id} - not overdue (trigger field: ${effectiveStartLabel || 'n/a'})`);
                continue;
            }

            const currentTechnicianId = task.assigned_technician_id;
            const currentTechnicianIdStr = (currentTechnicianId !== undefined && currentTechnicianId !== null)
                ? currentTechnicianId.toString().trim()
                : null;

            const assignmentHistory = Array.isArray(task.assignment_history) ? [...task.assignment_history] : [];
            let historyUpdated = false;
            const unassignedReason = isEndOverdue
                ? 'Estimated end date exceeded'
                : effectiveStartLabel === 'assigned_date'
                    ? 'Assigned date overdue'
                    : effectiveStartLabel === 'created_date'
                        ? 'Created date overdue'
                        : 'Estimated start overdue';

            await logOverdueEvent(`Processing overdue ${taskTypeLabel} task ${task.task_id} for technician ${currentTechnicianIdStr || 'N/A'} (trigger: ${unassignedReason})`);

            if (currentTechnicianIdStr) {
                for (let i = assignmentHistory.length - 1; i >= 0; i -= 1) {
                    const entry = assignmentHistory[i];
                    if (!entry) {
                        continue;
                    }

                    const entryTechnicianId = (entry.technician_id !== undefined && entry.technician_id !== null)
                        ? entry.technician_id.toString().trim()
                        : null;

                    if (!entryTechnicianId) {
                        continue;
                    }

                    if (entryTechnicianId === currentTechnicianIdStr && !entry.unassigned_date) {
                        assignmentHistory[i] = {
                            ...entry,
                            unassigned_date: now,
                            unassigned_by: 'system',
                            unassigned_reason: unassignedReason
                        };
                        historyUpdated = true;
                        break;
                    }
                }
            }

            if (historyUpdated) {
                await serviceRecords.updateOne(
                    { task_id: task.task_id },
                    { $set: { assignment_history: assignmentHistory } }
                );
            }

            const historyTechnicianIds = assignmentHistory
                .map(entry => (entry?.technician_id !== undefined && entry?.technician_id !== null)
                    ? entry.technician_id.toString().trim()
                    : null)
                .filter(Boolean);

            if (currentTechnicianIdStr && !historyTechnicianIds.includes(currentTechnicianIdStr)) {
                historyTechnicianIds.push(currentTechnicianIdStr);
            }

            let normalizedAddress = null;
            if (task.task_type === 1) {
                if (task.address) {
                    normalizedAddress = task.address;
                } else if (task.order?.customOrderId) {
                    const order = await ordersCollection.findOne({ customOrderId: task.order.customOrderId });
                    if (order?.deliveryAddress) {
                        normalizedAddress = normalizeDeliveryAddress(order.deliveryAddress);
                    }
                }
            } else if (task.task_type === 2) {
                // Service: ONLY use order delivery address (no user profile fallback)
                let relatedOrder = null;
                if (task.wp_device_id || task.device_id) {
                    if (task.wp_device_id) {    
                        relatedOrder = await ordersCollection.findOne({ wp_device_id: task.wp_device_id });
                    } else if (task.device_id) {
                        relatedOrder = await ordersCollection.findOne({ wp_device_id: task.device_id });
                    }

                    if (!relatedOrder) {
                        console.log(`❌ Reassignment - No order found for device_id: ${task.wp_device_id || task.device_id} (task ${task.task_id}). Skipping task.`);
                    } else if (relatedOrder?.deliveryAddress) {
                        normalizedAddress = normalizeDeliveryAddress(relatedOrder.deliveryAddress);
                        console.log(`✅ Reassignment - Service task ${task.task_id}: Using ORDER address - ${normalizedAddress.state}, ${normalizedAddress.district}`);
                    } else {
                        console.log(`❌ Reassignment - Order found for task ${task.task_id} (device_id: ${task.wp_device_id || task.device_id}) but has no delivery address. Skipping task.`);
                    }
                } else {
                    console.log(`❌ Reassignment - Task ${task.task_id} has no wp_device_id or device_id. Cannot determine address. Skipping task.`);
                }
            }

            const commonSet = {
                modified_by: 'system',
                modified_date: now,
                estimated_start: null,
                estimated_end: null
            };

            if (!normalizedAddress) {
                await serviceRecords.updateOne(
                    { task_id: task.task_id },
                    {
                        $set: {
                            assigned_technician_id: null,
                            task_status: "Unassigned",
                            pending_reason: "Missing address for reassignment",
                            otp: null,
                            ...commonSet
                        }
                    }
                );
                await logOverdueEvent(`Overdue ${taskTypeLabel} task ${task.task_id} unassigned due to missing address`);
                continue;
            }

            const locationSummary = `${normalizedAddress.city || 'N/A'}, ${normalizedAddress.district || 'N/A'}, ${normalizedAddress.state || 'N/A'}`;
            await logOverdueEvent(`Searching technicians for overdue ${taskTypeLabel} task ${task.task_id} at ${locationSummary}`);

            const technician = await findBestTechnician(normalizedAddress, historyTechnicianIds);
            if (!technician || !isTechnicianMatchingDistrict(technician, normalizedAddress)) {
                await serviceRecords.updateOne(
                    { task_id: task.task_id },
                    {
                        $set: {
                            assigned_technician_id: null,
                            task_status: "Unassigned",
                            pending_reason: !technician
                                ? "No technicians available for overdue reassignment"
                                : "Technician district mismatch during overdue reassignment",
                            otp: null,
                            ...commonSet
                        }
                    }
                );
                await logOverdueEvent(
                    !technician
                        ? `Overdue ${taskTypeLabel} task ${task.task_id} left unassigned - no technicians available for ${locationSummary}`
                        : `Overdue ${taskTypeLabel} task ${task.task_id} left unassigned - technician district mismatch for ${locationSummary}`
                );
                continue;
            }

            const otp = Math.floor(100000 + Math.random() * 900000);

            const reassignmentSet = {
                task_status: "Pending",
                assigned_technician_id: technician.technician_id,
                assigned_date: now,
                pending_reason: null,
                assigned_by: 'system',
                otp,
                ...commonSet
            };

            if (!task.address) {
                reassignmentSet.address = normalizedAddress;
            }

            reassignmentSet.otp_sent = false;
            reassignmentSet.otp_resent = true;
            reassignmentSet.otp_resent_date = now;

            await serviceRecords.updateOne(
                { task_id: task.task_id },
                {
                    $set: reassignmentSet,
                    $push: {
                        assignment_history: {
                            technician_id: technician.technician_id,
                            assigned_date: now,
                            assigned_by: 'system',
                            reassigned_reason: unassignedReason
                        }
                    }
                }
            );

            await technicianDetailsCollection.updateOne(
                { technician_id: technician.technician_id },
                {
                    $set: {
                        user_id: technician.user_id,
                        role_id: technician.role_id,
                        email: technician.email,
                        technician_id: technician.technician_id,
                        status: true
                    },
                    $inc: { total_assigned_services: 1 }
                },
                { upsert: true }
            );

            if (task.task_created_by_user_email && !task.otp_resent) {
                if (task.task_type === 1) {
                    await sendAssignInstallationEmail(task.task_created_by_user_email, otp);
                } else if (task.task_type === 2) {
                    await sendAssignServiceEmail(task.task_created_by_user_email, otp);
                }
            }

            await sendTechnicianAssignmentEmail(technician, {
                taskId: task.task_id,
                otp,
                taskType: task.task_type,
                normalizedAddress
            });
            await delayForEmailRateLimit(500); // Rate limiting to prevent email spam detection

            // Log to assignment history
            await logToAssignmentHistory(db, {
                task_id: task.task_id,
                task_type: task.task_type,
                assignment_type: task.task_type === 1 ? 'Installation' : 'Service',
                action: 'reassign',
                assignment_mode: 'auto',
                technician_id: technician.technician_id,
                technician_name: technician.name,
                previous_technician_id: currentTechnicianId,
                device_id: task.wp_device_id || task.device_id,
                customer_email: task.task_created_by_user_email,
                location: {
                    city: normalizedAddress.city,
                    district: normalizedAddress.district,
                    state: normalizedAddress.state
                },
                assigned_by: 'system',
                reason: unassignedReason
            });

            await logOverdueEvent(`Overdue ${taskTypeLabel} task ${task.task_id} reassigned to technician ${technician.technician_id} at ${locationSummary}`);
        }

        await logOverdueEvent('Finished processing overdue task reassignment');
    } catch (err) {
        console.error("Error in autoReassignOverdueTasks:", err);
        await persistOverdueLog('Error in autoReassignOverdueTasks', {
            message: err?.message,
            stack: err?.stack
        });
    }
}

// Auto reassign rejected tasks to a different technician
async function autoReassignRejectedTasks() {
    try {
        const db = await connectToDatabase();
        const serviceRecords = db.collection("service_records");
        const usersCollection = db.collection("users");
        const ordersCollection = db.collection("orders");
        const technicianDetailsCollection = db.collection("technician_details");

        // Find all rejected tasks
        const rejectedTasks = await serviceRecords.find({
            task_status: "Rejected"
        }).toArray();

        console.log(`Found ${rejectedTasks.length} rejected tasks for reassignment`);

        for (const task of rejectedTasks) {
            try {
                let normalizedAddress = null;
                let relatedOrder = null;

                // Get normalized address based on task type
                if (task.task_type === 1) {
                    // Installation: use address from task
                    if (task.address) {
                        normalizedAddress = normalizeDeliveryAddress(task.address);
                    }
                } else if (task.task_type === 2) {
                    // Service: use order delivery address
                    if (task.wp_device_id || task.device_id) {
                        if (task.wp_device_id) {
                            relatedOrder = await ordersCollection.findOne({ wp_device_id: task.wp_device_id });
                        } else if (task.device_id) {
                            relatedOrder = await ordersCollection.findOne({ wp_device_id: task.device_id });
                        }

                        if (relatedOrder?.deliveryAddress) {
                            normalizedAddress = normalizeDeliveryAddress(relatedOrder.deliveryAddress);
                        }
                    }
                }

                if (!normalizedAddress) {
                    console.log(`⚠️ Cannot reassign rejected task ${task.task_id}: no address found`);
                    continue;
                }

                // Build excluded technician list from assignment history
                const excludedTechnicianIds = (task.assignment_history || [])
                    .map(entry => (entry?.technician_id !== undefined && entry?.technician_id !== null)
                        ? entry.technician_id.toString().trim()
                        : null)
                    .filter(Boolean);

                if (task.assigned_technician_id) {
                    excludedTechnicianIds.push(task.assigned_technician_id.toString().trim());
                }

                console.log(`🔄 Reassigning rejected task ${task.task_id} (Type: ${task.task_type === 1 ? 'Installation' : 'Service'}) - Excluded technicians: ${excludedTechnicianIds.join(', ')}`);

                // Find best available technician (excluding all from history)
                const technician = await findBestTechnician(normalizedAddress, excludedTechnicianIds);

                if (!technician) {
                    console.log(`❌ No available technician to reassign rejected task ${task.task_id}`);
                    continue;
                }

                if (!isTechnicianMatchingDistrict(technician, normalizedAddress)) {
                    console.log(`❌ Found technician ${technician.technician_id} for rejected task ${task.task_id} but district mismatch`);
                    continue;
                }

                // Generate new OTP
                const otp = Math.floor(100000 + Math.random() * 900000);
                const now = new Date();

                // Mark previous assignment as unassigned in history (if exists)
                if (task.assigned_technician_id) {
                    // Update the last assignment history entry with unassigned info
                    const updatedHistory = task.assignment_history ? [...task.assignment_history] : [];
                    if (updatedHistory.length > 0) {
                        updatedHistory[updatedHistory.length - 1].unassigned_date = now;
                        updatedHistory[updatedHistory.length - 1].unassigned_by = 'system';
                        updatedHistory[updatedHistory.length - 1].unassigned_reason = 'Rejected by technician';
                    }

                    // Add new assignment entry to history
                    updatedHistory.push({
                        technician_id: technician.technician_id,
                        assigned_date: now,
                        assigned_by: 'system',
                        reassigned_reason: 'Rejected by previous technician'
                    });

                    // Update task with new assignment and updated history
                    const rejectedUpdateSet = {
                        task_status: "Pending",
                        assigned_technician_id: technician.technician_id,
                        assigned_date: now,
                        otp: otp,
                        assigned_by: 'system',
                        modified_by: 'system',
                        modified_date: now,
                        assignment_history: updatedHistory
                    };

                    if (!task.address) {
                        rejectedUpdateSet.address = normalizedAddress;
                    }

                    await serviceRecords.updateOne(
                        { task_id: task.task_id },
                        {
                            $set: rejectedUpdateSet
                        }
                    );
                } else {
                    const firstRejectedUpdateSet = {
                        task_status: "Pending",
                        assigned_technician_id: technician.technician_id,
                        assigned_date: now,
                        otp: otp,
                        assigned_by: 'system',
                        modified_by: 'system',
                        modified_date: now
                    };

                    if (!task.address) {
                        firstRejectedUpdateSet.address = normalizedAddress;
                    }

                    await serviceRecords.updateOne(
                        { task_id: task.task_id },
                        {
                            $set: firstRejectedUpdateSet,
                            $push: {
                                assignment_history: {
                                    technician_id: technician.technician_id,
                                    assigned_date: now,
                                    assigned_by: 'system'
                                }
                            }
                        }
                    );
                }

                // Update technician details
                await technicianDetailsCollection.updateOne(
                    { technician_id: technician.technician_id },
                    {
                        $set: {
                            user_id: technician.user_id,
                            role_id: technician.role_id,
                            email: technician.email,
                            technician_id: technician.technician_id,
                            status: true
                        },
                        $inc: { total_assigned_services: 1 }
                    },
                    { upsert: true }
                );

                // Send notifications with rate limiting to prevent email spam detection
                // Only send if not recently sent (within 5 minutes)
                const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
                const lastSendTime = task.otp_resent_date ? new Date(task.otp_resent_date) : null;
                
                if (task.task_created_by_user_email && (!lastSendTime || lastSendTime < fiveMinutesAgo)) {
                    if (task.task_type === 1) {
                        await sendAssignInstallationEmail(task.task_created_by_user_email, otp);
                    } else if (task.task_type === 2) {
                        await sendAssignServiceEmail(task.task_created_by_user_email, otp);
                    }
                    await delayForEmailRateLimit(500);
                }

                await sendTechnicianAssignmentEmail(technician, {
                    taskId: task.task_id,
                    otp,
                    taskType: task.task_type,
                    normalizedAddress
                });
                await delayForEmailRateLimit(500); // 500ms delay after technician email

                // Log to assignment history
                await logToAssignmentHistory(db, {
                    task_id: task.task_id,
                    task_type: task.task_type,
                    assignment_type: task.task_type === 1 ? 'Installation' : 'Service',
                    action: 'reassign',
                    assignment_mode: 'auto',
                    technician_id: technician.technician_id,
                    technician_name: technician.name,
                    previous_technician_id: task.assigned_technician_id,
                    device_id: task.wp_device_id || task.device_id,
                    customer_email: task.task_created_by_user_email,
                    location: {
                        city: normalizedAddress.city,
                        district: normalizedAddress.district,
                        state: normalizedAddress.state
                    },
                    assigned_by: 'system',
                    reason: 'Rejected by previous technician'
                });

                console.log(`✅ Rejected task ${task.task_id} reassigned to technician ${technician.technician_id}`);

            } catch (taskErr) {
                console.error(`Error reassigning rejected task ${task.task_id}:`, taskErr);
            }
        }

        console.log('✅ Finished processing rejected task reassignments');

    } catch (err) {
        console.error("Error in autoReassignRejectedTasks:", err);
    }
}

// NEW: Auto-reassign based on time thresholds (3hrs for Pending, 24hrs for In Progress)
async function autoReassignTimeBasedTasks() {
    try {
        const db = await connectToDatabase();
        const serviceRecords = db.collection("service_records");
        const usersCollection = db.collection("users");
        const ordersCollection = db.collection("orders");
        const technicianDetailsCollection = db.collection("technician_details");

        const now = new Date();
        
        // === PENDING TASKS: 3 hours ===
        const threeHoursAgo = new Date(now.getTime() - 3 * 60 * 60 * 1000);
        const pendingCandidates = await serviceRecords
            .find({
                task_type: { $in: [1, 2] },
                task_status: "Pending",
                assigned_technician_id: { $ne: null },
                assigned_date: { $ne: null, $lte: threeHoursAgo },
                $expr: { $gt: [{ $size: { $ifNull: ["$assignment_history", []] } }, 0] } // Not first assignment
            })
            .sort({ assigned_date: 1 })
            .limit(50)
            .toArray();

        await logEvent(`Found ${pendingCandidates.length} Pending tasks ready for 3-hour reassignment`);

        for (const task of pendingCandidates) {
            try {
                const currentTechnicianId = task.assigned_technician_id;
                const assignmentHistory = Array.isArray(task.assignment_history) ? [...task.assignment_history] : [];
                const historyTechnicianIds = assignmentHistory
                    .map(entry => (entry?.technician_id !== undefined && entry?.technician_id !== null)
                        ? entry.technician_id.toString().trim()
                        : null)
                    .filter(Boolean);

                if (currentTechnicianId && !historyTechnicianIds.includes(currentTechnicianId.toString().trim())) {
                    historyTechnicianIds.push(currentTechnicianId.toString().trim());
                }

                // Get task address
                let normalizedAddress = null;
                if (task.task_type === 1 && task.address) {
                    normalizedAddress = task.address;
                } else if (task.task_type === 2 && task.wp_device_id) {
                    const order = await ordersCollection.findOne({ wp_device_id: task.wp_device_id });
                    if (order?.deliveryAddress) {
                        normalizedAddress = normalizeDeliveryAddress(order.deliveryAddress);
                    }
                }

                if (!normalizedAddress) {
                    await logEvent(`Skipping task ${task.task_id} - No address found`);
                    continue;
                }

                // Find best technician
                const technician = await findBestTechnician(normalizedAddress, historyTechnicianIds);
                if (!technician || !isTechnicianMatchingDistrict(technician, normalizedAddress)) {
                    await logEvent(`Task ${task.task_id} - No available technician in ${normalizedAddress.district}, ${normalizedAddress.state}`);
                    continue;
                }

                const otp = Math.floor(100000 + Math.random() * 900000);
                const reassignmentReason = `Pending for over 3 hours. Reassigned from ${currentTechnicianId}`;

                const pendingReassignSet = {
                    assigned_technician_id: technician.technician_id,
                    assigned_date: now,
                    otp,
                    modified_by: 'system',
                    modified_date: now
                };

                if (!task.address) {
                    pendingReassignSet.address = normalizedAddress;
                }

                await serviceRecords.updateOne(
                    { task_id: task.task_id },
                    {
                        $set: pendingReassignSet,
                        $push: {
                            assignment_history: {
                                technician_id: technician.technician_id,
                                assigned_date: now,
                                assigned_by: 'system',
                                reassigned_reason: reassignmentReason
                            }
                        }
                    }
                );

                // Update technician details
                await technicianDetailsCollection.updateOne(
                    { technician_id: technician.technician_id },
                    {
                        $set: {
                            user_id: technician.user_id,
                            role_id: technician.role_id,
                            email: technician.email,
                            technician_id: technician.technician_id,
                            status: true
                        },
                        $inc: { total_assigned_services: 1 }
                    },
                    { upsert: true }
                );

                // Send OTP only to CUSTOMER if not recently sent (within 5 minutes)
                const fiveMinutesAgoPending = new Date(now.getTime() - 5 * 60 * 1000);
                const lastSendTimePending = task.otp_resent_date ? new Date(task.otp_resent_date) : null;
                
                if (task.task_created_by_user_email && (!lastSendTimePending || lastSendTimePending < fiveMinutesAgoPending)) {
                    if (task.task_type === 1) {
                        await sendAssignInstallationEmail(task.task_created_by_user_email, otp);
                    } else if (task.task_type === 2) {
                        await sendAssignServiceEmail(task.task_created_by_user_email, otp);
                    }
                    await delayForEmailRateLimit(500);
                }

                // Send assignment notification to technician (NO OTP)
                await sendTechnicianAssignmentEmail(technician, {
                    taskId: task.task_id,
                    taskType: task.task_type,
                    normalizedAddress,
                    isReassignment: true
                });
                await delayForEmailRateLimit(500);

                await logEvent(`Task ${task.task_id} reassigned to ${technician.technician_id} | Reason: ${reassignmentReason}`);

            } catch (taskErr) {
                await logEvent(`Error processing Pending task reassignment: ${taskErr.message} | Task: ${task?.task_id}`);
            }
        }

        // === IN-PROGRESS TASKS: 24 hours (SKIP if waiting_status = true) ===
        const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        const inProgressCandidates = await serviceRecords
            .find({
                task_type: { $in: [1, 2] },
                task_status: "In Progress",
                waiting_status: { $ne: true }, // SKIP if waiting for something
                assigned_technician_id: { $ne: null },
                assigned_date: { $ne: null, $lte: twentyFourHoursAgo },
                $expr: { $gt: [{ $size: { $ifNull: ["$assignment_history", []] } }, 0] } // Not first assignment
            })
            .sort({ assigned_date: 1 })
            .limit(50)
            .toArray();

        await logEvent(`Found ${inProgressCandidates.length} In-Progress tasks ready for 24-hour reassignment`);

        for (const task of inProgressCandidates) {
            try {
                const currentTechnicianId = task.assigned_technician_id;
                const assignmentHistory = Array.isArray(task.assignment_history) ? [...task.assignment_history] : [];
                const historyTechnicianIds = assignmentHistory
                    .map(entry => (entry?.technician_id !== undefined && entry?.technician_id !== null)
                        ? entry.technician_id.toString().trim()
                        : null)
                    .filter(Boolean);

                if (currentTechnicianId && !historyTechnicianIds.includes(currentTechnicianId.toString().trim())) {
                    historyTechnicianIds.push(currentTechnicianId.toString().trim());
                }

                // Get task address
                let normalizedAddress = null;
                if (task.task_type === 1 && task.address) {
                    normalizedAddress = task.address;
                } else if (task.task_type === 2 && task.wp_device_id) {
                    const order = await ordersCollection.findOne({ wp_device_id: task.wp_device_id });
                    if (order?.deliveryAddress) {
                        normalizedAddress = normalizeDeliveryAddress(order.deliveryAddress);
                    }
                }

                if (!normalizedAddress) {
                    await logEvent(`Skipping task ${task.task_id} - No address found`);
                    continue;
                }

                // Find best technician
                const technician = await findBestTechnician(normalizedAddress, historyTechnicianIds);
                if (!technician || !isTechnicianMatchingDistrict(technician, normalizedAddress)) {
                    await logEvent(`Task ${task.task_id} - No available technician in ${normalizedAddress.district}, ${normalizedAddress.state}`);
                    continue;
                }

                const otp = Math.floor(100000 + Math.random() * 900000);
                const reassignmentReason = `In-Progress for over 24 hours. Reassigned from ${currentTechnicianId}`;

                const inProgressReassignSet = {
                    assigned_technician_id: technician.technician_id,
                    assigned_date: now,
                    otp,
                    task_status: "Pending",
                    modified_by: 'system',
                    modified_date: now
                };

                if (!task.address) {
                    inProgressReassignSet.address = normalizedAddress;
                }

                await serviceRecords.updateOne(
                    { task_id: task.task_id },
                    {
                        $set: inProgressReassignSet,
                        $push: {
                            assignment_history: {
                                technician_id: technician.technician_id,
                                assigned_date: now,
                                assigned_by: 'system',
                                reassigned_reason: reassignmentReason
                            }
                        }
                    }
                );

                // Update technician details
                await technicianDetailsCollection.updateOne(
                    { technician_id: technician.technician_id },
                    {
                        $set: {
                            user_id: technician.user_id,
                            role_id: technician.role_id,
                            email: technician.email,
                            technician_id: technician.technician_id,
                            status: true
                        },
                        $inc: { total_assigned_services: 1 }
                    },
                    { upsert: true }
                );

                // Send OTP only to CUSTOMER if not recently sent (within 5 minutes)
                const fiveMinutesAgoInProgress = new Date(now.getTime() - 5 * 60 * 1000);
                const lastSendTimeInProgress = task.otp_resent_date ? new Date(task.otp_resent_date) : null;
                
                if (task.task_created_by_user_email && (!lastSendTimeInProgress || lastSendTimeInProgress < fiveMinutesAgoInProgress)) {
                    if (task.task_type === 1) {
                        await sendAssignInstallationEmail(task.task_created_by_user_email, otp);
                    } else if (task.task_type === 2) {
                        await sendAssignServiceEmail(task.task_created_by_user_email, otp);
                    }
                    await delayForEmailRateLimit(500);
                }

                // Send assignment notification to technician (NO OTP)
                await sendTechnicianAssignmentEmail(technician, {
                    taskId: task.task_id,
                    taskType: task.task_type,
                    normalizedAddress,
                    isReassignment: true
                });
                await delayForEmailRateLimit(500);

                await logEvent(`Task ${task.task_id} reassigned to ${technician.technician_id} | Reason: ${reassignmentReason}`);

            } catch (taskErr) {
                await logEvent(`Error processing In-Progress task reassignment: ${taskErr.message} | Task: ${task?.task_id}`);
            }
        }

        await logEvent(`✅ Completed 3-hour Pending task reassignments`);
        await logEvent(`✅ Completed 24-hour In-Progress task reassignments`);

    } catch (err) {
        await logEvent(`Error in autoReassignTimeBasedTasks: ${err.message}`);
    }
}

// NEW: Immediately reassign Rejected tasks with same process
async function autoReassignRejectedTasksImmediate() {
    try {
        const db = await connectToDatabase();
        const serviceRecords = db.collection("service_records");
        const technicianDetailsCollection = db.collection("technician_details");
        const ordersCollection = db.collection("orders");
        const now = new Date();

        const rejectedCandidates = await serviceRecords
            .find({
                task_type: { $in: [1, 2] },
                task_status: "Rejected",
                assigned_technician_id: { $ne: null }
            })
            .sort({ assigned_date: -1 })
            .limit(50)
            .toArray();

        await logEvent(`[REJECTED] Found ${rejectedCandidates.length} Rejected tasks for immediate reassignment`);

        for (const task of rejectedCandidates) {
            try {
                const currentTechnicianId = task.assigned_technician_id;
                const assignmentHistory = Array.isArray(task.assignment_history) ? [...task.assignment_history] : [];
                const historyTechnicianIds = assignmentHistory
                    .map(entry => (entry?.technician_id !== undefined && entry?.technician_id !== null)
                        ? entry.technician_id.toString().trim()
                        : null)
                    .filter(Boolean);

                if (currentTechnicianId && !historyTechnicianIds.includes(currentTechnicianId.toString().trim())) {
                    historyTechnicianIds.push(currentTechnicianId.toString().trim());
                }

                // Get task address
                let normalizedAddress = null;
                if (task.task_type === 1 && task.address) {
                    normalizedAddress = task.address;
                } else if (task.task_type === 2 && task.wp_device_id) {
                    const order = await ordersCollection.findOne({ wp_device_id: task.wp_device_id });
                    if (order?.deliveryAddress) {
                        normalizedAddress = normalizeDeliveryAddress(order.deliveryAddress);
                    }
                }

                if (!normalizedAddress) {
                    await logEvent(`[REJECTED] Skipping task ${task.task_id} - No address found`);
                    continue;
                }

                // Find best technician
                const technician = await findBestTechnician(normalizedAddress, historyTechnicianIds);
                if (!technician || !isTechnicianMatchingDistrict(technician, normalizedAddress)) {
                    await logEvent(`[REJECTED] Task ${task.task_id} - No available technician in ${normalizedAddress.district}, ${normalizedAddress.state}`);
                    continue;
                }

                if (technician.technician_id === currentTechnicianId) {
                    await logEvent(`[REJECTED] Task ${task.task_id} - Only previously rejected technician ${currentTechnicianId} available. Skipping reassignment`);
                    continue;
                }

                const otp = Math.floor(100000 + Math.random() * 900000);
                const reassignmentReason = `Task Rejected by ${currentTechnicianId}. Immediately reassigned`;

                // Update task - change status to Pending
                await serviceRecords.updateOne(
                    { task_id: task.task_id },
                    {
                        $set: {
                            assigned_technician_id: technician.technician_id,
                            assigned_date: now,
                            otp,
                            task_status: "Pending",
                            pending_reason: null,
                            modified_by: 'system',
                            modified_date: now
                        },
                        $push: {
                            assignment_history: {
                                technician_id: technician.technician_id,
                                assigned_date: now,
                                assigned_by: 'system',
                                reassigned_reason: reassignmentReason
                            }
                        }
                    }
                );

                // Update technician details
                await technicianDetailsCollection.updateOne(
                    { technician_id: technician.technician_id },
                    {
                        $set: {
                            user_id: technician.user_id,
                            role_id: technician.role_id,
                            email: technician.email,
                            technician_id: technician.technician_id,
                            status: true
                        },
                        $inc: { total_assigned_services: 1 }
                    },
                    { upsert: true }
                );

                // Send OTP to CUSTOMER
                if (task.task_created_by_user_email) {
                    if (task.task_type === 1) {
                        await sendAssignInstallationEmail(task.task_created_by_user_email, otp);
                    } else if (task.task_type === 2) {
                        await sendAssignServiceEmail(task.task_created_by_user_email, otp);
                    }
                    await delayForEmailRateLimit(500);
                }

                // Send notification to technician
                await sendTechnicianAssignmentEmail(technician, {
                    taskId: task.task_id,
                    taskType: task.task_type,
                    normalizedAddress,
                    isReassignment: true
                });
                await delayForEmailRateLimit(500);

                // Log to assignment history
                await logToAssignmentHistory(db, {
                    task_id: task.task_id,
                    task_type: task.task_type,
                    assignment_type: task.task_type === 1 ? 'Installation' : 'Service',
                    action: 'reassign',
                    assignment_mode: 'auto',
                    technician_id: technician.technician_id,
                    technician_name: technician.name,
                    previous_technician_id: currentTechnicianId,
                    device_id: task.wp_device_id || task.device_id,
                    customer_email: task.task_created_by_user_email,
                    location: {
                        city: normalizedAddress.city,
                        district: normalizedAddress.district,
                        state: normalizedAddress.state
                    },
                    assigned_by: 'system',
                    reason: reassignmentReason
                });

                await logEvent(`[REJECTED] Task ${task.task_id} reassigned to ${technician.technician_id} | Reason: ${reassignmentReason}`);

            } catch (taskErr) {
                await logEvent(`[REJECTED] Error processing task reassignment: ${taskErr.message} | Task: ${task?.task_id}`);
            }
        }

        await logEvent(`[REJECTED] ✅ Completed Rejected task immediate reassignments`);

    } catch (err) {
        await logEvent(`[REJECTED] Error in autoReassignRejectedTasksImmediate: ${err.message}`);
    }
}

// NEW: Immediately reassign Forwarded tasks with same process
async function autoReassignForwardedTasksImmediate() {
    try {
        const db = await connectToDatabase();
        const serviceRecords = db.collection("service_records");
        const technicianDetailsCollection = db.collection("technician_details");
        const ordersCollection = db.collection("orders");
        const now = new Date();

        const forwardedCandidates = await serviceRecords
            .find({
                task_type: { $in: [1, 2] },
                task_status: "Forwarded",
                assigned_technician_id: { $ne: null }
            })
            .sort({ assigned_date: -1 })
            .limit(50)
            .toArray();

        await logEvent(`[FORWARDED] Found ${forwardedCandidates.length} Forwarded tasks for immediate reassignment`);

        for (const task of forwardedCandidates) {
            try {
                const currentTechnicianId = task.assigned_technician_id;
                const assignmentHistory = Array.isArray(task.assignment_history) ? [...task.assignment_history] : [];
                const historyTechnicianIds = assignmentHistory
                    .map(entry => (entry?.technician_id !== undefined && entry?.technician_id !== null)
                        ? entry.technician_id.toString().trim()
                        : null)
                    .filter(Boolean);

                if (currentTechnicianId && !historyTechnicianIds.includes(currentTechnicianId.toString().trim())) {
                    historyTechnicianIds.push(currentTechnicianId.toString().trim());
                }

                // Get task address
                let normalizedAddress = null;
                if (task.task_type === 1 && task.address) {
                    normalizedAddress = task.address;
                } else if (task.task_type === 2 && task.wp_device_id) {
                    const order = await ordersCollection.findOne({ wp_device_id: task.wp_device_id });
                    if (order?.deliveryAddress) {
                        normalizedAddress = normalizeDeliveryAddress(order.deliveryAddress);
                    }
                }

                if (!normalizedAddress) {
                    await logEvent(`[FORWARDED] Skipping task ${task.task_id} - No address found`);
                    continue;
                }

                // Find best technician
                const technician = await findBestTechnician(normalizedAddress, historyTechnicianIds);
                if (!technician || !isTechnicianMatchingDistrict(technician, normalizedAddress)) {
                    await logEvent(`[FORWARDED] Task ${task.task_id} - No available technician in ${normalizedAddress.district}, ${normalizedAddress.state}`);
                    continue;
                }

                if (technician.technician_id === currentTechnicianId) {
                    await logEvent(`[FORWARDED] Task ${task.task_id} - Only previously assigned technician ${currentTechnicianId} available. Skipping reassignment`);
                    continue;
                }

                const otp = Math.floor(100000 + Math.random() * 900000);
                const reassignmentReason = `Task Forwarded by ${currentTechnicianId}. Immediately reassigned`;

                // Update task - change status to Pending
                await serviceRecords.updateOne(
                    { task_id: task.task_id },
                    {
                        $set: {
                            assigned_technician_id: technician.technician_id,
                            assigned_date: now,
                            otp,
                            task_status: "Pending",
                            pending_reason: null,
                            modified_by: 'system',
                            modified_date: now
                        },
                        $push: {
                            assignment_history: {
                                technician_id: technician.technician_id,
                                assigned_date: now,
                                assigned_by: 'system',
                                reassigned_reason: reassignmentReason
                            }
                        }
                    }
                );

                // Update technician details
                await technicianDetailsCollection.updateOne(
                    { technician_id: technician.technician_id },
                    {
                        $set: {
                            user_id: technician.user_id,
                            role_id: technician.role_id,
                            email: technician.email,
                            technician_id: technician.technician_id,
                            status: true
                        },
                        $inc: { total_assigned_services: 1 }
                    },
                    { upsert: true }
                );

                // Send OTP to CUSTOMER
                if (task.task_created_by_user_email) {
                    if (task.task_type === 1) {
                        await sendAssignInstallationEmail(task.task_created_by_user_email, otp);
                    } else if (task.task_type === 2) {
                        await sendAssignServiceEmail(task.task_created_by_user_email, otp);
                    }
                    await delayForEmailRateLimit(500);
                }

                // Send notification to technician
                await sendTechnicianAssignmentEmail(technician, {
                    taskId: task.task_id,
                    taskType: task.task_type,
                    normalizedAddress,
                    isReassignment: true
                });
                await delayForEmailRateLimit(500);

                await logEvent(`[FORWARDED] Task ${task.task_id} reassigned to ${technician.technician_id} | Reason: ${reassignmentReason}`);

            } catch (taskErr) {
                await logEvent(`[FORWARDED] Error processing task reassignment: ${taskErr.message} | Task: ${task?.task_id}`);
            }
        }

        await logEvent(`[FORWARDED] ✅ Completed Forwarded task immediate reassignments`);

    } catch (err) {
        await logEvent(`[FORWARDED] Error in autoReassignForwardedTasksImmediate: ${err.message}`);
    }
}

module.exports = {
    autoAssignInstallation,
    autoAssignService,
    autoAssignPendingTasks,
    autoAssignPendingInstallations,
    autoReassignOverdueTasks,
    autoReassignRejectedTasks,
    autoReassignTimeBasedTasks,
    autoReassignRejectedTasksImmediate,
    autoReassignForwardedTasksImmediate
};