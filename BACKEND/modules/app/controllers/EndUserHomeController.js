const { connectToDatabase } = require('../../../config/db');
const { ObjectId } = require('mongodb');

exports.getActiveSubscriptionDetails = async (req, res) => {
  const { user_id, email, role_id } = req.body;

  if (!user_id || !email || !role_id) {
    return res.status(400).json({ error: true, message: 'user_id, email, and role_id are required' });
  }

  if (parseInt(role_id) !== 3) {
    return res.status(403).json({ error: true, message: 'Access denied: Only End Users can access this data' });
  }

  try {
    const db = await connectToDatabase();
    const usersCollection = db.collection('users');
    const ordersCollection = db.collection('orders');
    const serviceRecordsCollection = db.collection('service_records');

    const userId = parseInt(user_id);

    const [user, codOrder] = await Promise.all([
      usersCollection.findOne({
        user_id: userId,
        email: email.trim(),
      }),
      ordersCollection.findOne({
        user_id: userId,
        orderStatus: 'Confirmed',
        paymentType: 'COD'
      })
    ]);

    if (!user) {
      return res.status(404).json({ error: true, message: 'User not found' });
    }

    if (!user.is_subscribed || !user.active_order_id) {
      if (codOrder) {
        const now = new Date();
        await usersCollection.updateOne(
          { user_id: userId },
          {
            $set: {
              is_subscribed: true,
              subscribed_at: now,
              active_order_id: codOrder._id.toString(),
              active_label: codOrder.selectedPlan?.label || null,
              active_plan_id: codOrder.selectedPlan?.plans_id || null,
              active_duration_id: codOrder.selectedDuration?.duration_time_limit || null
            },
            $addToSet: { assigned_device_ids: codOrder.wp_device_id },
            $unset: { assigned_device_id: "" }
          }
        );
      } else {
        return res.status(200).json({
          error: false,
          message: 'User is not subscribed',
          data: { subscription: null }
        });
      }
    }

    const orders = await ordersCollection.find({ user_id: userId })
      .sort({ createdAt: -1 })
      .toArray();

    if (!orders.length) {
      return res.status(200).json({
        error: false,
        message: 'No orders found for this user',
        data: []
      });
    }

    const deviceHasRenewal = new Set();
    orders.forEach(order => {
      if (order.isRenewal === true || order.orderType === 'Recharge') {
        deviceHasRenewal.add(order.wp_device_id);
      }
    });

    const filteredOrders = orders.filter(order => {
      if (deviceHasRenewal.has(order.wp_device_id)) {
        return order.isRenewal === true || order.orderType === 'Recharge';
      }
      return true;
    });

    const deviceIds = [...new Set(filteredOrders.map(o => o.wp_device_id))];

    const serviceRecordsData = await serviceRecordsCollection.aggregate([
      { $match: { wp_device_id: { $in: deviceIds } } },
      {
        $lookup: {
          from: 'users',
          let: { techId: '$assigned_technician_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $or: [
                    { $eq: ['$technician_id', '$$techId'] },
                    { $eq: ['$employee_id', '$$techId'] }
                  ]
                }
              }
            },
            { $project: { name: 1, phone: 1 } },
            { $limit: 1 }
          ],
          as: 'technicianData'
        }
      },
      {
        $group: {
          _id: '$wp_device_id',
          tasks: {
            $push: {
              task_type: '$task_type',
              task_status: '$task_status',
              estimated_end: '$estimated_end',
              assigned_technician_id: '$assigned_technician_id',
              technician: { $arrayElemAt: ['$technicianData', 0] }
            }
          }
        }
      }
    ]).toArray();

    const tasksMap = serviceRecordsData.reduce((acc, record) => {
      acc[record._id] = record.tasks.map(task => ({
        task_type: task.task_type || null,
        task_status: task.task_status || null,
        estimated_end: task.estimated_end || null,
        assigned_technician_id: task.assigned_technician_id || null,
        technician: task.technician
          ? { name: task.technician.name || null, phone: task.technician.phone || null }
          : null
      }));
      return acc;
    }, {});

    const ordersWithStatus = filteredOrders.map(order => {
      let deliveryHistory = order.deliveryHistory || [];
      if (order.deliveryAcceptanceStatus && !deliveryHistory.some(h => h.status === 'accepted')) {
        deliveryHistory.unshift({
          status: 'accepted',
          timestamp: order.deliveryAcceptanceTimestamp || order.createdAt,
          notes: 'Order accepted',
          updatedBy: 'system'
        });
      }

      return {
        ...order,
        deliveryHistory,
        tasks: tasksMap[order.wp_device_id] || []
      };
    });

    return res.status(200).json({
      error: false,
      message: `Found ${ordersWithStatus.length} order(s) for user`,
      data: ordersWithStatus
    });

  } catch (error) {
    console.error('Error in getActiveSubscriptionDetails:', error);
    return res.status(500).json({ error: true, message: 'Server error' });
  }
};



exports.userStoreBleAck = async (req, res) => {
  const {
    wp_device_id,
    mac_id,
    status,
    timestamp,
    user_id,
    plan_config: planConfigPayload,
  } = req.body;

  if (!wp_device_id || !mac_id || !user_id) {
    return res.status(400).json({
      error: true,
      message: 'wp_device_id, mac_id, and user_id are required',
    });
  }

  const numericStatus = parseInt(status, 10);
  if (Number.isNaN(numericStatus) || numericStatus !== 1) {
    return res.status(400).json({
      error: true,
      message: 'Invalid firmware status. Expected status value 1 for success',
    });
  }

  let planConfig = planConfigPayload ?? null;
  if (typeof planConfig === 'string') {
    try {
      planConfig = JSON.parse(planConfig);
    } catch (err) {
      return res.status(400).json({
        error: true,
        message: 'plan_config must be valid JSON',
      });
    }
  }

  if (planConfig && (typeof planConfig !== 'object' || Array.isArray(planConfig))) {
    return res.status(400).json({
      error: true,
      message: 'plan_config must be an object',
    });
  }

  if (planConfig && planConfig.totalWaterLimit !== undefined) {
    const totalLimit = Number(planConfig.totalWaterLimit);
    if (!Number.isNaN(totalLimit)) {
      planConfig.totalWaterLimit = totalLimit;
    }
  }

  const hasPlanConfig = Boolean(planConfig && Object.keys(planConfig).length > 0);
  const normalizedMacId = mac_id.toUpperCase();

  let ackTimestamp = timestamp ? new Date(timestamp) : new Date();
  if (Number.isNaN(ackTimestamp.getTime())) {
    ackTimestamp = new Date();
  }

  try {
    const db = await connectToDatabase();
    const deviceDetailsCollection = db.collection('device_details');
    const ordersCollection = db.collection('orders');

    // ✅ Find the most recent order for this user and wp_device_id with Recharge type
    const orderFilter = {
      wp_device_id,
      user_id: Number(user_id),
      orderType: 'Recharge',
    };

    const orders = await ordersCollection.find(orderFilter).sort({ createdAt: -1 }).limit(1).toArray();
    const order = orders[0];
    if (!order) {
      return res.status(404).json({
        error: true,
        message: 'No Recharge order found for this user and device',
      });
    }

    // ✅ Find the device
    const deviceFilter = {
      wp_device_id: { $regex: new RegExp(`^${wp_device_id}$`, 'i') },
    };

    const device = await deviceDetailsCollection.findOne(deviceFilter);
    if (!device) {
      return res.status(404).json({
        error: true,
        message: 'Device not found in device_details for this acknowledgement',
      });
    }

    // ✅ Prepare BLE ack entry
    const ackHistoryEntry = {
      status: numericStatus,
      mac_id: normalizedMacId,
      timestamp: ackTimestamp,
      recorded_at: new Date(),
      user_id: Number(user_id),
      source: 'end_user',
    };

    // ✅ Update Device details
    const deviceUpdatePayload = {
      $set: {
        mac_id: normalizedMacId,
        ble_ack_status: numericStatus,
        ble_ack_timestamp: ackTimestamp,
        isSetup: true,
        updatedAt: new Date(),
        ...(hasPlanConfig ? { plan_config: planConfig } : {}),
        last_ble_ack_by_user: Number(user_id),
      },
      $push: { ble_ack_history: ackHistoryEntry },
    };

    await deviceDetailsCollection.updateOne(deviceFilter, deviceUpdatePayload);

    // ✅ Update Order (Recharge)
    const orderUpdatePayload = {
      $set: {
        mac_id: normalizedMacId,
        ble_ack_status: numericStatus,
        ble_ack_timestamp: ackTimestamp,
        isSetup: true,
        updatedAt: new Date(),
        ...(hasPlanConfig ? { plan_config: planConfig } : {}),
      },
      $push: { ble_ack_history: ackHistoryEntry },
    };

    await ordersCollection.updateOne({ _id: order._id }, orderUpdatePayload);

    console.log(`⚙️ End user BLE acknowledgement stored for order ${order.customOrderId}`);

    // ✅ Response
    return res.status(200).json({
      error: false,
      message: 'End user BLE acknowledgement stored successfully',
      data: {
        wp_device_id,
        mac_id: normalizedMacId,
        status: numericStatus,
        ack_timestamp: ackTimestamp.toISOString(),
        plan_config: hasPlanConfig ? planConfig : null,
        isSetup: true,
        orderType: order.orderType,
        user_id: Number(user_id),
      },
    });
  } catch (error) {
    console.error('Error storing end user BLE acknowledgement:', error);
    return res.status(500).json({
      error: true,
      message: 'Server error while storing end user BLE acknowledgement',
      details: error.message,
    });
  }
};


exports.getLatestFeatureValues = async (req, res) => {
  const { wp_device_id, user_id } = req.body;

  if (!wp_device_id || !user_id) {
    return res.status(400).json({
      error: true,
      message: 'Both wp_device_id and user_id are required',
    });
  }

  try {
    const db = await connectToDatabase();

    const deviceDetailsCollection = db.collection('device_details');
    const usersCollection = db.collection('users');
    const deviceStatusCollection = db.collection('device_status');

    // Step 1: Check device exists
    const device = await deviceDetailsCollection.findOne({
      wp_device_id: { $regex: new RegExp(`^${wp_device_id}$`, 'i') }
    });

    if (!device) {
      return res.status(404).json({
        error: true,
        message: 'Device not found in device_details',
      });
    }

    // Step 2: Check user has access to this device
    const user = await usersCollection.findOne({
      user_id: parseInt(user_id),
      assigned_device_ids: { $in: [wp_device_id] }
    });

    if (!user) {
      return res.status(403).json({
        error: true,
        message: 'User is not authorized to access this device',
      });
    }

    // Step 3: Fetch latest status
    const latestStatus = await deviceStatusCollection.findOne({
      deviceId: wp_device_id
    });

    if (!latestStatus) {
      return res.status(404).json({
        error: true,
        message: 'No device status found for this device',
      });
    }

    return res.status(200).json({
      error: false,
      message: 'Device status fetched successfully',
      data: latestStatus
    });

  } catch (error) {
    console.error('Error in getLatestFeatureValues:', error);
    return res.status(500).json({
      error: true,
      message: 'Server error while fetching device status',
    });
  }
};
