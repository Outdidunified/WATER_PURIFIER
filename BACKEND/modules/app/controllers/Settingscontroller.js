const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const { connectToDatabase } = require('../../../config/db');
const { ObjectId } = require('mongodb');
const { autoAssignService } = require('../../admin/services/autoAssignmentService');

exports.fetchUserDetails = async (req, res) => { 
  const { user_id, email, role_id } = req.body;

  if (!user_id || !email || !role_id) {
    return res.status(400).json({ error: true, message: 'user_id, email, and role_id are required' });
  }

  try {
    const db = await connectToDatabase();
    const usersCollection = db.collection('users');
    const technicianCollection = db.collection('technician_details');

    const user = await usersCollection.findOne({
      user_id: parseInt(user_id),
      email,
      role_id: parseInt(role_id)
    });

    if (!user) {
      return res.status(404).json({ error: true, message: 'User not found with provided credentials' });
    }

    let technicianData = null;
    if (parseInt(role_id) === 2) {
      technicianData = await technicianCollection.findOne({ user_id: parseInt(user_id), role_id: 2 });
    }

    const {
      user_id: dbUserId,
      name,
      email: dbEmail,
      phone,
      password,
      addressline1,
      addressline2,
      city,
      district,
      state,
      country,
      pincode,
      status,
      is_subscribed,
      createdDate
    } = user;

    const responseData = {
      user_id: dbUserId,
      name,
      email: dbEmail,
      phone,
      password,
      addressline1,
      addressline2: addressline2 || '',
      city,
      district,
      state,
      country,
      pincode,
      status,
      is_subscribed,
      createdDate,
    };

    if (technicianData) {
      responseData.technician_info = {
        technician_code: technicianData.technician_code,
        total_completed_services: technicianData.total_completed_services || 0,
        total_incomplete_services: technicianData.total_incomplete_services || 0,
      };
    }

    res.status(200).json({
      error: false,
      message: 'User details fetched successfully',
      data: responseData
    });

  } catch (error) {
    console.error('Fetch user error:', error);
    res.status(500).json({ error: true, message: 'Server error while fetching user details' });
  }
};

  
  
exports.updateUserDetails = async (req, res) => {
  const { 
    user_id, 
    email, 
    role_id, 
    name, 
    phone, 
    password, // optional
    addressline1,
    addressline2, // optional
    city, 
    district,
    state,
    country,
    pincode
  } = req.body;

  // Validate required fields
  if (!user_id || !email || !role_id) {
    return res.status(400).json({ error: true, message: 'user_id, email, and role_id are required' });
  }

  // Validate required address fields
  const missingFields = [];
  if (!addressline1) missingFields.push('addressline1');
  if (!city) missingFields.push('city');
  if (!district) missingFields.push('district');
  if (!state) missingFields.push('state');
  if (!country) missingFields.push('country');
  if (!pincode) missingFields.push('pincode');

  if (missingFields.length) {
    return res.status(400).json({
      error: true,
      message: `Missing required fields: ${missingFields.join(', ')}`,
      missing: missingFields
    });
  }

  try {
    const db = await connectToDatabase();
    const usersCollection = db.collection('users');

    // Fetch existing user
    const existingUser = await usersCollection.findOne({
      user_id: parseInt(user_id),
      role_id: parseInt(role_id)
    });

    if (!existingUser) {
      return res.status(404).json({ error: true, message: 'User not found with provided user_id and role_id' });
    }

    // Check if new values differ from existing ones
    const isSameData =
      (name === undefined || name === existingUser.name) &&
      (phone === undefined || phone === existingUser.phone) &&
      (password === undefined || password === existingUser.password) &&
      (addressline1 === undefined || addressline1 === existingUser.addressline1) &&
      (addressline2 === undefined || addressline2 === existingUser.addressline2) &&
      (city === undefined || city === existingUser.city) &&
      (district === undefined || district === existingUser.district) &&
      (state === undefined || state === existingUser.state) &&
      (country === undefined || country === existingUser.country) &&
      (pincode === undefined || pincode === existingUser.pincode);

    if (isSameData) {
      return res.status(200).json({ error: false, message: 'No changes were made. Same data submitted.' });
    }

    // Prepare update object
    const updateFields = {
      ...(name !== undefined && { name }),
      ...(phone !== undefined && { phone }),
      ...(password !== undefined && { password }), // optional plain-text update
      ...(addressline1 !== undefined && { addressline1 }),
      ...(addressline2 !== undefined && { addressline2 }),
      ...(city !== undefined && { city }),
      ...(district !== undefined && { district }),
      ...(state !== undefined && { state }),
      ...(country !== undefined && { country }),
      ...(pincode !== undefined && { pincode }),
      modifiedBy: email,
      modifiedDate: new Date()
    };

    // Update user
    await usersCollection.updateOne(
      { user_id: parseInt(user_id), role_id: parseInt(role_id) },
      { $set: updateFields }
    );

    return res.status(200).json({
      error: false,
      message: 'User details updated successfully',
      data: {
        user_id: parseInt(user_id),
        ...updateFields
      }
    });

  } catch (error) {
    console.error('Update user error:', error);
    return res.status(500).json({ error: true, message: 'Server error while updating user details' });
  }
};


  
 exports.createServiceRequest = async (req, res) => {
  const {
    task_created_by_user_id,
    task_created_by_user_email,
    task_description,
    role_id,
    device_id  // NEW: Get device_id from request body
  } = req.body;

  // Basic validation
  if (
    !task_created_by_user_id ||
    !task_created_by_user_email ||
    !task_description ||
    !role_id
  ) {
    return res.status(400).json({
      error: true,
      message: 'task_created_by_user_id, task_created_by_user_email, task_description, role_id, and device_id are required',
    });
  }

  try {
    const db = await connectToDatabase();
    const usersCollection = db.collection('users');
    const serviceRecordsCollection = db.collection('service_records');

    // ✅ Step 1: Check if device_id is assigned to the user
    const user = await usersCollection.findOne({ user_id: task_created_by_user_id });

    if (!user) {
      return res.status(404).json({
        error: true,
        message: 'User not found',
      });
    }

    const isDeviceAssigned = user.assigned_device_ids;
    console.log('isDeviceAssigned',isDeviceAssigned)

    if (!isDeviceAssigned) {
      return res.status(403).json({
        error: true,
        message: 'Device not assigned to the user',
      });
    }

    // ✅ Step 2: Get the latest task_id and increment it
    const lastTask = await serviceRecordsCollection
      .find({})
      .sort({ task_id: -1 })
      .limit(1)
      .toArray();

    const newTaskId = lastTask.length > 0 ? lastTask[0].task_id + 1 : 1;

    // ✅ Step 3: Create the new task object
    const newServiceRecord = {
      task_id: newTaskId,
      task_status: "Initiated",
      task_type: 2,
      assigned_technician_id: null,
      pending_reason: null,
      created_date: new Date(),
      modified_by: null,
      modified_date: null,
      assigned_date: null,
      task_description,
      image_before_service: [],
      image_after_service: [],
      task_created_by_user_id,
      task_created_by_user_email,
      role_id,
      device_id, // Include device_id in record
      otp: null
    };

    // ✅ Step 4: Insert into collection 
    await serviceRecordsCollection.insertOne(newServiceRecord);

    // Auto assign service
    await autoAssignService(newTaskId);

    return res.status(200).json({
      error: false,
      message: 'Service request created successfully',
      data: newServiceRecord,
    });

  } catch (error) {
    console.error('Error creating service request:', error);
    return res.status(500).json({
      error: true,
      message: 'Internal server error while creating service request',
    });
  }
};

//   exports.fetchpaymenthistory = async (req, res) => {
//   try {
//     const { user_id } = req.body;

//     if (!user_id) {
//       return res
//         .status(400)
//         .json({ success: false, message: 'user_id is required in request body' });
//     }

//     const db = await connectToDatabase();
//     const paymentCollection = db.collection('payments');
//     const orderCollection = db.collection('orders');
//     const productModelsCollection = db.collection('product_models');
//     const serviceRecordsCollection = db.collection('service_records');

//     // 1️⃣ Fetch payments for the user
//     const payments = await paymentCollection.find({ user_id }).toArray();

//     // 2️⃣ Extract valid order ObjectIds
//     const validOrderObjectIds = [];
//     for (const payment of payments) {
//       if (payment.orderId) {
//         try {
//           validOrderObjectIds.push(new ObjectId(payment.orderId));
//         } catch {
//           // ignore invalid ObjectIds
//         }
//       }
//     }

//     // 3️⃣ Fetch all matching orders
//     const orders = await orderCollection
//       .find({ _id: { $in: validOrderObjectIds } })
//       .toArray();

//     // 4️⃣ Fetch all service records (only task_type = 1)
//     const serviceRecords = await serviceRecordsCollection
//       .find({ task_type: 1 })
//       .toArray();

//     // 5️⃣ Map wp_device_id → task_status (case-insensitive)
//     const serviceRecordMap = {};
//     for (const record of serviceRecords) {
//       if (record.wp_device_id) {
//         serviceRecordMap[record.wp_device_id.toLowerCase()] = record.task_status;
//       }
//     }

//     // 6️⃣ Build order map for quick lookup
//     const orderMap = {};
//     for (const order of orders) {
//       orderMap[order._id.toString()] = order;
//     }

//     // 7️⃣ Merge payment + order + task_status logic
//     const paymentsWithOrders = await Promise.all(
//       payments.map(async payment => {
//         const order = orderMap[payment.orderId];
//         let taskStatus = 'N/A';
//         let productModel = null;

//         if (
//           payment.paymentStatus === 'Completed' &&
//           order?.orderStatus === 'Confirmed'
//         ) {
//           const possibleDeviceId =
//             order.wp_device_id || order.device_id || '';
//           const normalizedId = possibleDeviceId.toString().toLowerCase();

//           if (serviceRecordMap[normalizedId]) {
//             taskStatus = serviceRecordMap[normalizedId];
//           }
//         }

//         if (order?.productModelId) {
//           const productData = await productModelsCollection.findOne({
//             _id: new ObjectId(order.productModelId)
//           });

//           if (productData) {
//             productModel = {
//               _id: productData._id,
//               main_img: productData.main_img || '',
//               sub_img_1: productData.sub_img_1 || '',
//               sub_img_2: productData.sub_img_2 || '',
//               sub_img_3: productData.sub_img_3 || '',
//               sub_img_4: productData.sub_img_4 || '',
//             };
//           }
//         }

//         return {
//           ...payment,
//           orders: order
//             ? [
//                 {
//                   ...order,
//                   task_status: taskStatus,
//                   product_model_images: productModel,
//                 },
//               ]
//             : [],
//         };
//       })
//     );

//     // ✅ Final response
//     res.status(200).json({
//       success: true,
//       message:
//         'Payment history with orders and conditional task status fetched successfully',
//       data: paymentsWithOrders,
//     });
//   } catch (error) {
//     console.error('❌ Error fetching payment history:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Server error while fetching payment history',
//     });
//   }
// };

exports.fetchpaymenthistory = async (req, res) => {
  try {
    const { user_id } = req.body;

    if (!user_id) {
      return res.status(400).json({
        success: false,
        message: "user_id is required in request body",
      });
    }

    const db = await connectToDatabase();
    const paymentCollection = db.collection("payments");
    const orderCollection = db.collection("orders");
    const productModelsCollection = db.collection("product_models");
    const serviceRecordsCollection = db.collection("service_records");

    const { ObjectId } = require("mongodb");

    // ✅ 1️⃣ Fetch payments
    const payments = await paymentCollection.find({ user_id }).toArray();

    // ✅ 2️⃣ Extract only VALID Mongo ObjectIds
    const validOrderObjectIds = payments
      .filter((p) => ObjectId.isValid(p.orderId))
      .map((p) => new ObjectId(p.orderId));

    // 3️⃣ Fetch orders based on valid IDs
    const orders = await orderCollection
      .find({ _id: { $in: validOrderObjectIds } })
      .toArray();

    // 4️⃣ Fetch service records
    const serviceRecords = await serviceRecordsCollection
      .find({ task_type: 1 })
      .toArray();

    const serviceRecordMap = {};
    for (const record of serviceRecords) {
      if (record.wp_device_id) {
        serviceRecordMap[record.wp_device_id.toString().toLowerCase()] =
          record.task_status;
      }
    }

    const orderMap = {};
    for (const order of orders) {
      orderMap[order._id.toString()] = order;
    }

    // ✅ 5️⃣ Merge everything safely
    const paymentsWithOrders = await Promise.all(
      payments.map(async (payment) => {
        const order = orderMap[payment.orderId];
        let taskStatus = "N/A";
        let productModel = null;

        if (
          order &&
          payment.paymentStatus === "Completed" &&
          order.orderStatus === "Confirmed"
        ) {
          const deviceId =
            (order.wp_device_id || order.device_id || "").toString().toLowerCase();

          if (serviceRecordMap[deviceId]) {
            taskStatus = serviceRecordMap[deviceId];
          }
        }

        if (order?.productModelId && ObjectId.isValid(order.productModelId)) {
          const productData = await productModelsCollection.findOne({
            _id: new ObjectId(order.productModelId),
          });

          if (productData) {
            productModel = {
              _id: productData._id,
              main_img: productData.main_img || "",
              sub_img_1: productData.sub_img_1 || "",
              sub_img_2: productData.sub_img_2 || "",
              sub_img_3: productData.sub_img_3 || "",
              sub_img_4: productData.sub_img_4 || "",
            };
          }
        }

        return {
          ...payment,
          orders: order
            ? [
                {
                  ...order,
                  task_status: taskStatus,
                  product_model_images: productModel,
                },
              ]
            : [],
        };
      })
    );

    res.status(200).json({
      success: true,
      message:
        "Payment history with orders and conditional task status fetched successfully",
      data: paymentsWithOrders,
    });
  } catch (error) {
    console.error("❌ Error fetching payment history:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching payment history",
    });
  }
};
