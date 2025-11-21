const { ObjectId } = require('mongodb');
const {connectToDatabase}=require('../../../config/db')


// exports.getAllProductsWithPlans = async (req, res) => {
//   try {
//     const db = await connectToDatabase();

//     // Get all product models
//     const products = await db.collection('product_models').find({}).toArray();

//     // Get all devices already assigned to completed orders
//     const completedOrders = await db.collection('orders').find({
//       paymentStatus: 'Completed',
//       wp_device_id: { $exists: true, $ne: null }
//     }).toArray();

//     // Extract all used wp_device_ids
//     const usedDeviceIds = new Set(completedOrders.map(order => order.wp_device_id));

//     const availableProducts = [];

//     for (const product of products) {
//       // Check if there's any available device not already used in orders
//       const availableDevice = await db.collection('device_details').findOne({
//         model_id: Number(product.model_id),
//         status: true,
//         wp_device_id: { $nin: Array.from(usedDeviceIds) }
//       });

//       if (availableDevice) {
//         availableProducts.push(product);
//       }
//     }

//     res.status(200).json({
//       status: 'Success',
//       error: false,
//       data: availableProducts
//     });

//   } catch (err) {
//     console.error('Failed to fetch product models:', err);
//     res.status(500).json({
//       status: 'Error',
//       error: true,
//       message: 'Failed to fetch product models',
//       details: err.message
//     });
//   }
// };


exports.getAllProductsWithPlans = async (req, res) => {
  try {
    const db = await connectToDatabase();

    const [usedDevices, assignedDevices] = await Promise.all([
      db.collection('orders').distinct('wp_device_id', {
        $or: [
          { paymentStatus: 'Completed' },
          { orderStatus: 'Confirmed' }
        ],
        wp_device_id: { $exists: true, $ne: null }
      }),
      db.collection('users').aggregate([
        { $match: { assigned_device_ids: { $exists: true, $type: 'array' } } },
        { $unwind: '$assigned_device_ids' },
        { $group: { _id: null, devices: { $push: '$assigned_device_ids' } } }
      ]).toArray().then(result => result[0]?.devices || [])
    ]);

    const unavailableIds = [...new Set([...usedDevices, ...assignedDevices])];

    const results = await db.collection('product_models').aggregate([
      { $match: { status: true } },
      {
        $lookup: {
          from: 'device_details',
          let: { modelId: '$model_id' },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ['$model_id', '$$modelId'] },
                status: true,
                wp_device_id: { $nin: unavailableIds }
              }
            },
            { $limit: 1 },
            { $project: { wp_device_id: 1 } }
          ],
          as: 'device'
        }
      },
      {
        $addFields: {
          wp_device_id: { $arrayElemAt: ['$device.wp_device_id', 0] }
        }
      },
      { $project: { device: 0 } }
    ]).toArray();

    return res.status(200).json({
      status: 'Success',
      error: false,
      data: results
    });

  } catch (err) {
    console.error('Failed to fetch product models:', err);
    return res.status(500).json({
      status: 'Error',
      error: true,
      message: 'Failed to fetch product models',
      details: err.message
    });
  }
};

exports.fetchpaymenthistory = async (req, res) => {
  try {
    const { user_id, page = 1, limit = 3 } = req.body;

    if (!user_id) {
      return res.status(400).json({
        success: false,
        message: "user_id is required in request body",
      });
    }

    const db = await connectToDatabase();
    const paymentsCol = db.collection("payments");

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // ---------------------------
    // ONE FAST AGGREGATION QUERY
    // ---------------------------
    const pipeline = [
      { $match: { user_id } },

      // SORT FIRST PAGE (initial sort)
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: limitNum },

      // JOIN ORDERS
      {
        $lookup: {
          from: "orders",
          localField: "orderId",
          foreignField: "_id",
          as: "orders"
        }
      },

      // ALWAYS KEEP ARRAY
      {
        $addFields: {
          orders: {
            $cond: {
              if: { $isArray: "$orders" },
              then: "$orders",
              else: []
            }
          }
        }
      },

      // UNWIND ORDER
      { $unwind: { path: "$orders", preserveNullAndEmptyArrays: true } },

      // PRODUCT MODEL IMAGES
      {
        $lookup: {
          from: "product_models",
          localField: "orders.productModelId",
          foreignField: "_id",
          as: "productModel"
        }
      },
      { $unwind: { path: "$productModel", preserveNullAndEmptyArrays: true } },

      // SERVICE RECORD JOIN
      {
        $lookup: {
          from: "service_records",
          let: { d: "$orders.wp_device_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: [
                    { $toLower: "$wp_device_id" },
                    { $toLower: "$$d" }
                  ]
                }
              }
            },
            { $match: { task_type: { $in: [1, 2, 3] } } }
          ],
          as: "serviceRecord"
        }
      },
      { $unwind: { path: "$serviceRecord", preserveNullAndEmptyArrays: true } },

      // GROUP BACK (this breaks sorting)
      {
        $group: {
          _id: "$_id",
          payment: { $first: "$$ROOT" },
          orders: {
            $push: {
              _id: "$orders._id",
              customOrderId: "$orders.customOrderId",
              user_id: "$orders.user_id",
              productModelId: "$orders.productModelId",
              orderType: "$orders.orderType",
              modelName: "$orders.modelName",
              modeltype: "$orders.modeltype",
              main_image: "$orders.main_image",
              sub_images: "$orders.sub_images",
              wp_device_id: "$orders.wp_device_id",
              selectedPlan: "$orders.selectedPlan",
              selectedDuration: "$orders.selectedDuration",
              grandTotal: "$orders.grandTotal",
              deliveryAddress: "$orders.deliveryAddress",
              paymentType: "$orders.paymentType",
              paymentStatus: "$orders.paymentStatus",
              orderStatus: "$orders.orderStatus",
              razorpayOrderId: "$orders.razorpayOrderId",
              totalLitre: "$orders.totalLitre",
              price: "$orders.price",
              subtotal: "$orders.subtotal",
              codFee: "$orders.codFee",
              deliveryAcceptanceStatus: "$orders.deliveryAcceptanceStatus",
              deliveryAcceptanceTimestamp: "$orders.deliveryAcceptanceTimestamp",
              deliveryCompletionTimestamp: "$orders.deliveryCompletionTimestamp",
              createdAt: "$orders.createdAt",
              updatedAt: "$orders.updatedAt",
              deliveryCurrentStatus: "$orders.deliveryCurrentStatus",
              deliveryHistory: "$orders.deliveryHistory",
              deliveryCompletionStatus: "$orders.deliveryCompletionStatus",

              // Final service details
              task_status: { $ifNull: ["$serviceRecord.task_status", "N/A"] },
              task_type: "$serviceRecord.task_type",

              // Final product model images
              product_model_images: {
                _id: "$productModel._id",
                main_img: "$productModel.main_img",
                sub_img_1: "$productModel.sub_img_1",
                sub_img_2: "$productModel.sub_img_2",
                sub_img_3: "$productModel.sub_img_3",
                sub_img_4: "$productModel.sub_img_4"
              }
            }
          }
        }
      },

      // 🔥 THE FIX — SORT AGAIN AFTER GROUPING
      {
        $sort: {
          "payment.createdAt": -1
        }
      },

      // PROJECT CLEAN OUTPUT
      {
        $project: {
          _id: 1,
          user_id: "$payment.user_id",
          orderId: "$payment.orderId",
          razorpayOrderId: "$payment.razorpayOrderId",
          discountedPrice: "$payment.discountedPrice",
          discountAmount: "$payment.discountAmount",
          priceWithGST: "$payment.priceWithGST",
          gstAmount: "$payment.gstAmount",
          securityDeposit: "$payment.securityDeposit",
          totalPrice: "$payment.totalPrice",
          totalLitre: "$payment.totalLitre",
          paymentStatus: "$payment.paymentStatus",
          paymentType: "$payment.paymentType",
          price: "$payment.price",
          subtotal: "$payment.subtotal",
          codFee: "$payment.codFee",
          createdAt: "$payment.createdAt",
          updatedAt: "$payment.updatedAt",
          razorpayPaymentId: "$payment.razorpayPaymentId",
          orders: "$orders"
        }
      }
    ];

    const data = await paymentsCol.aggregate(pipeline).toArray();
    const totalRecords = await paymentsCol.countDocuments({ user_id });

    return res.status(200).json({
      success: true,
      message: "Payment history fetched successfully",
      page: pageNum,
      limit: limitNum,
      totalRecords,
      totalPages: Math.ceil(totalRecords / limitNum),
      data
    });

  } catch (error) {
    console.error("❌ ERROR:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};







