const { connectToDatabase } = require('../../../config/db');
const { normalizeDeliveryAddress, normalizeState } = require('../../../modules/website/models/DeliveryAddress');
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

async function sendTechnicianAssignmentEmail(technician, { taskId, otp, taskType, normalizedAddress }) {
    if (!technician?.email) {
        return null;
    }

    const taskTitle = taskType === 1 ? 'Installation' : 'Service';
    const taskLabel = taskTitle.toLowerCase();
    const technicianName = technician.name || 'Technician';
    const locationString = [normalizedAddress?.city, normalizedAddress?.district, normalizedAddress?.state]
        .filter(Boolean)
        .join(', ');

    const subject = `New ${taskTitle} Task Assigned - IonHive`;
    const locationText = locationString ? `\nLocation: ${locationString}` : '';
    const locationListItem = locationString ? `<li><strong>Location:</strong> ${locationString}</li>` : '';

    const text = `Hello ${technicianName},

A new ${taskLabel} task (Task ID: ${taskId}) has been assigned to you. Please review the schedule and reach out to the customer to confirm the appointment.

Customer OTP: ${otp}${locationText}

Thank you,
IonHive Team`;

    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border-radius: 10px; background-color: #f9f9f9; border: 1px solid #ddd;">
            <h2 style="color: #333;">New ${taskTitle} Assignment</h2>
            <p style="font-size: 16px; color: #555;">You have been assigned a new ${taskLabel} task.</p>
            <ul style="font-size: 16px; color: #555;">
                <li><strong>Task ID:</strong> ${taskId}</li>
                <li><strong>Customer OTP:</strong> ${otp}</li>
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
async function findBestTechnician(normalizedAddress, excludedTechnicianIds = []) {
    const db = await connectToDatabase();
    const usersCollection = db.collection('users');
    const serviceRecordsCollection = db.collection('service_records');

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
        const matchesLocation = normalizedTechState.toLowerCase() === state.toLowerCase() && techDistrictNormalized === district;
        const notExcluded = technicianId ? !excludedSet.has(technicianId) : false;
        return matchesLocation && notExcluded;
    });

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

// Auto assign installation after order confirmation
async function autoAssignInstallation(order) {
    try {
        const db = await connectToDatabase();
        const serviceRecords = db.collection("service_records");
        const usersCollection = db.collection("users");
        const ordersCollection = db.collection("orders");
        const paymentsCollection = db.collection("payments");
        const technicianDetailsCollection = db.collection("technician_details");

        const normalizedAddress = normalizeDeliveryAddress(order.deliveryAddress || {});

        // Check if Installation already assigned
        const existingInstallation = await serviceRecords.findOne({
            wp_device_id: order.wp_device_id,
            task_type: 1,
        });

        if (existingInstallation) {
            console.log(`Installation already assigned for device ${order.wp_device_id}`);
            return;
        }

        // Enforce order confirmation and payment rules based on payment type
        const normalizedPaymentType = (order.paymentType || '').toString().toUpperCase();
        const isOrderConfirmed = order.orderStatus === 'Confirmed';
        const isPaymentCompleted = order.paymentStatus === 'Completed';

        if (!isOrderConfirmed) {
            console.log(`Skipping auto-assign for unconfirmed order ${order.customOrderId || order.wp_device_id}`);
            return;
        }

        if (normalizedPaymentType !== 'COD' && !isPaymentCompleted) {
            console.log(`Skipping auto-assign for unpaid order ${order.customOrderId || order.wp_device_id} (paymentType: ${normalizedPaymentType || 'N/A'})`);
            return;
        }

        const paymentDetails = order?._id ? await paymentsCollection.findOne({ orderId: order._id }) : null;

        const normalizeId = (value) =>
            value && typeof value.toString === 'function' ? value.toString() : value ?? null;

        const orderSnapshot = {
            orderId: normalizeId(order?._id),
            customOrderId: order?.customOrderId ?? null,
            user_id: order?.user_id ?? null,
            productModelId: order?.productModelId ?? null,
            modelName: order?.modelName ?? null,
            main_image: order?.main_image ?? null,
            sub_images: Array.isArray(order?.sub_images) ? order.sub_images : [],
            wp_device_id: order?.wp_device_id ?? null,
            selectedPlan: order?.selectedPlan ?? null,
            selectedDuration: order?.selectedDuration ?? null,
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

        const orderDetailsForRecord = {
            customOrderId: order.customOrderId,
            user_id: order.user_id,
            orderMongoId: orderSnapshot.orderId,
            paymentType: normalizedPaymentType || null,
            paymentStatus: order.paymentStatus ?? null,
            orderStatus: order.orderStatus ?? null,
            grandTotal: order.grandTotal ?? null,
            price: order.price ?? null,
            subtotal: order.subtotal ?? null,
            securityDeposit: order.securityDeposit ?? null,
            razorpayOrderId: order.razorpayOrderId ?? null
        };

        // Fetch user info
        const orderUser = await usersCollection.findOne({ user_id: order.user_id });
        if (!orderUser) {
            console.log('User not found for order');
            return;
        }

        // Generate task ID
        const lastTask = await serviceRecords.find().sort({ task_id: -1 }).limit(1).toArray();
        const nextTaskId = lastTask.length > 0 ? lastTask[0].task_id + 1 : 1;
        const now = new Date();

        // Prepare new task (unassigned initially)
        const newTask = {
            task_id: nextTaskId,
            task_status: "Unassigned",
            task_type: 1, // Installation
            task_description: "Ordered a new device",
            assigned_technician_id: null,
            task_created_by_user_id: order.user_id,
            task_created_by_user_email: orderUser.email,
            wp_device_id: order.wp_device_id,
            created_date: now,
            created_by: 'system',
            assignment_history: [],
            address: normalizedAddress,
            product: {
                model_name: order.modelName,
                wp_device_id: order.wp_device_id,
                selectedPlan: order.selectedPlan,
                selectedDuration: order.selectedDuration
            },
            order: {
                customOrderId: order.customOrderId,
                user_id: order.user_id
            },
            order_details: orderDetailsForRecord,
            order_snapshot: orderSnapshot,
            payment_snapshot: paymentSnapshot
        };

        // Insert task
        await serviceRecords.insertOne(newTask);

        // Find best technician
        const technician = await findBestTechnician(normalizedAddress);
        if (technician) {
            const otp = Math.floor(100000 + Math.random() * 900000);

            // Assign the task
            await serviceRecords.updateOne(
                { task_id: nextTaskId },
                {
                    $set: {
                        task_status: "Pending",
                        assigned_technician_id: technician.technician_id,
                        assigned_date: now,
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

            // Send notifications
            await sendAssignInstallationEmail(orderUser.email, otp);
            await sendTechnicianAssignmentEmail(technician, {
                taskId: nextTaskId,
                otp,
                taskType: 1,
                normalizedAddress
            });

            console.log(`Installation auto-assigned to technician ${technician.technician_id}`);
        } else {
            console.log(`No available technician for installation, task created as unassigned`);
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
            paymentStatus: 'Completed'
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

        // For service tasks tied to an order/device, enforce payment check
        if (task.wp_device_id) {
            const order = await ordersCollection.findOne({ wp_device_id: task.wp_device_id });
            if (!order || order.paymentStatus !== 'Completed') {
                console.log(`Skipping auto-assign service for unpaid/unknown order with device ${task.wp_device_id}`);
                return;
            }
        }

        // Get user address
        const user = await usersCollection.findOne({ user_id: task.task_created_by_user_id });
        if (!user) {
            console.log('User not found for service');
            return;
        }

        const normalizedAddress = normalizeDeliveryAddress({
            state: user.state,
            district: user.district,
            city: user.city
        });

        const historyTechnicianIds = (task.assignment_history || [])
            .map(entry => (entry?.technician_id !== undefined && entry?.technician_id !== null)
                ? entry.technician_id.toString().trim()
                : null)
            .filter(Boolean);
        if (task.assigned_technician_id) {
            historyTechnicianIds.push(task.assigned_technician_id.toString().trim());
        }

        // Find best technician
        const technician = await findBestTechnician(normalizedAddress, historyTechnicianIds);
        if (!technician) {
            console.log('No available technician for service');
            return;
        }

        const otp = Math.floor(100000 + Math.random() * 900000);
        const now = new Date();

        // Update the task
        await serviceRecords.updateOne(
            { task_id: taskId },
            {
                $set: {
                    task_status: "Pending",
                    assigned_technician_id: technician.technician_id,
                    assigned_date: now,
                    otp: otp,
                    assigned_by: 'system',
                    modified_by: 'system',
                    modified_date: now
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

        // Send notifications
        await sendAssignServiceEmail(task.task_created_by_user_email, otp);
        await sendTechnicianAssignmentEmail(technician, {
            taskId: taskId,
            otp,
            taskType: 2,
            normalizedAddress
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
            task_status: { $in: ["Unassigned", "Pending"] }
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
                // Service: use user's address
                const user = await usersCollection.findOne({ user_id: task.task_created_by_user_id });
                if (user) {
                    normalizedAddress = normalizeDeliveryAddress({
                        state: user.state,
                        district: user.district,
                        city: user.city
                    });
                }
            }

            if (!normalizedAddress) {
                console.log(`No address found for task ${task.task_id}, skipping`);
                continue;
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

                // Send OTP email
                const user = await usersCollection.findOne({ user_id: task.task_created_by_user_id });
                if (user) {
                    await sendAssignInstallationEmail(user.email, otp);
                }

                await sendTechnicianAssignmentEmail(technician, {
                    taskId: task.task_id,
                    otp,
                    taskType: 1,
                    normalizedAddress
                });

            } else if (task.task_type === 2) {
                // Assign service
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

                // Send notifications
                await sendAssignServiceEmail(task.task_created_by_user_email, otp);
                await sendTechnicianAssignmentEmail(technician, {
                    taskId: task.task_id,
                    otp,
                    taskType: 2,
                    normalizedAddress
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

        const candidateTasksCursor = serviceRecords.find({
            task_type: { $in: [1, 2] },
            assigned_technician_id: { $ne: null },
            task_status: { $in: ["Pending", "Initiated", "In Progress"] }
        }).limit(50);

        for await (const task of candidateTasksCursor) {
            const estimatedStart = task.estimated_start ? new Date(task.estimated_start) : null;
            const estimatedEnd = task.estimated_end ? new Date(task.estimated_end) : null;

            const isStartValid = estimatedStart && !Number.isNaN(estimatedStart.getTime());
            const isEndValid = estimatedEnd && !Number.isNaN(estimatedEnd.getTime());
            const isStartOverdue = isStartValid && estimatedStart <= threeDaysAgo;
            const isEndOverdue = isEndValid && estimatedEnd < now;

            if (!isStartOverdue && !isEndOverdue) {
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
                : 'Estimated start overdue';

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
                const user = await usersCollection.findOne({ user_id: task.task_created_by_user_id });
                if (user) {
                    normalizedAddress = normalizeDeliveryAddress({
                        state: user.state,
                        district: user.district,
                        city: user.city
                    });
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
                console.log(`Overdue task ${task.task_id} unassigned due to missing address`);
                continue;
            }

            const technician = await findBestTechnician(normalizedAddress, historyTechnicianIds);
            if (!technician) {
                await serviceRecords.updateOne(
                    { task_id: task.task_id },
                    {
                        $set: {
                            assigned_technician_id: null,
                            task_status: "Unassigned",
                            pending_reason: "No technicians available for overdue reassignment",
                            otp: null,
                            ...commonSet
                        }
                    }
                );
                console.log(`Overdue task ${task.task_id} left unassigned - no technicians available`);
                continue;
            }

            const otp = Math.floor(100000 + Math.random() * 900000);

            await serviceRecords.updateOne(
                { task_id: task.task_id },
                {
                    $set: {
                        task_status: "Pending",
                        assigned_technician_id: technician.technician_id,
                        assigned_date: now,
                        pending_reason: null,
                        assigned_by: 'system',
                        otp,
                        ...commonSet
                    },
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

            if (task.task_created_by_user_email) {
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

            console.log(`Overdue task ${task.task_id} reassigned to technician ${technician.technician_id}`);
        }

        console.log('Finished processing overdue task reassignment');
    } catch (err) {
        console.error("Error in autoReassignOverdueTasks:", err);
    }
}

module.exports = {
    autoAssignInstallation,
    autoAssignService,
    autoAssignPendingTasks,
    autoAssignPendingInstallations,
    autoReassignOverdueTasks
};