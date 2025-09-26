const { connectToDatabase } = require('../../../config/db');
const { normalizeDeliveryAddress } = require('../../../modules/website/models/DeliveryAddress');
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
    } catch (error) {
        console.error('Error in sendAssignInstallationEmail:', error);
        return false;
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
    } catch (error) {
        console.error('Error in sendAssignServiceEmail:', error);
        return false;
    }
}

// Find the best technician based on location and workload
async function findBestTechnician(normalizedAddress) {
    const db = await connectToDatabase();
    const usersCollection = db.collection('users');
    const serviceRecordsCollection = db.collection('service_records');

    const { state, district, city } = normalizedAddress;

    // Find technicians matching both state and district exactly
    const technicians = await usersCollection.find({
        role_id: 2,
        status: true,
        state: new RegExp(`^${state}$`, 'i'),
        district: new RegExp(`^${district}$`, 'i')
    }).toArray();

    if (technicians.length === 0) return null;

    // For each technician, get pending tasks count
    const techWithWorkload = await Promise.all(technicians.map(async (tech) => {
        const pendingTasks = await serviceRecordsCollection.countDocuments({
            assigned_technician_id: tech.technician_id,
            task_status: { $in: ['Pending', 'Initiated'] }
        });
        return { ...tech, pendingTasks };
    }));

    // Filter those with fewer than 10 pending tasks
    const availableTechs = techWithWorkload.filter(t => t.pendingTasks < 10);

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

        // Find best technician
        const technician = await findBestTechnician(normalizedAddress);
        if (!technician) {
            console.log('No available technician for installation');
            return;
        }

        // Fetch user info
        const orderUser = await usersCollection.findOne({ user_id: order.user_id });
        if (!orderUser) {
            console.log('User not found for order');
            return;
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
            task_type: 1, // Installation
            task_description: "Ordered a new device",
            assigned_technician_id: technician.technician_id,
            assigned_date: now,
            task_created_by_user_id: order.user_id,
            task_created_by_user_email: orderUser.email,
            wp_device_id: order.wp_device_id,
            otp: otp,
            created_date: now,
            created_by: 'system',
            assigned_by: 'system',
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
            }
        };

        // Insert task
        await serviceRecords.insertOne(newTask);

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

        // Send OTP email
        await sendAssignInstallationEmail(orderUser.email, otp);

        console.log(`Installation auto-assigned to technician ${technician.technician_id}`);

    } catch (err) {
        console.error("Error in autoAssignInstallation:", err);
    }
}

// Auto assign service after service request creation
async function autoAssignService(taskId) {
    try {
        const db = await connectToDatabase();
        const serviceRecords = db.collection("service_records");
        const usersCollection = db.collection("users");
        const technicianDetailsCollection = db.collection("technician_details");

        // Find the task
        const task = await serviceRecords.findOne({ task_id: taskId });
        if (!task) {
            console.log(`Task ${taskId} not found`);
            return;
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

        // Find best technician
        const technician = await findBestTechnician(normalizedAddress);
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
        await sendAssignServiceEmail(task.task_created_by_user_email, otp);

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
            assigned_technician_id: null
        }).toArray();

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
            const technician = await findBestTechnician(normalizedAddress);
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
                            modified_date: now
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
                            modified_date: now
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
                await sendAssignServiceEmail(task.task_created_by_user_email, otp);
            }

            console.log(`Auto-assigned pending task ${task.task_id} to technician ${technician.technician_id}`);
        }

    } catch (err) {
        console.error("Error in autoAssignPendingTasks:", err);
    }
}

module.exports = {
    autoAssignInstallation,
    autoAssignService,
    autoAssignPendingTasks
};