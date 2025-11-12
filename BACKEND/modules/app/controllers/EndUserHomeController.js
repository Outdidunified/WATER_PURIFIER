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

    // ✅ Verify user exists
    const user = await usersCollection.findOne({
      user_id: parseInt(user_id),
      email: email.trim(),
    });

    if (!user) {
      return res.status(404).json({ error: true, message: 'User not found' });
    }

    // ✅ Fallback check for COD orders (auto-subscribe user if needed)
    if (!user.is_subscribed || !user.active_order_id) {
      const codOrder = await ordersCollection.findOne({
        user_id: parseInt(user_id),
        orderStatus: 'Confirmed',
        paymentType: 'COD'
      });

      if (codOrder) {
        const now = new Date();
        await usersCollection.updateOne(
          { user_id: parseInt(user_id) },
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

    // ✅ Fetch all orders for user
    const orders = await ordersCollection.find({ user_id: parseInt(user_id) })
      .sort({ createdAt: -1 })
      .toArray();

    if (!orders.length) {
      return res.status(200).json({
        error: false,
        message: 'No orders found for this user',
        data: []
      });
    }

    const ordersWithStatus = await Promise.all(
      orders.map(async (order) => {
        const serviceRecords = await serviceRecordsCollection.find({
          wp_device_id: order.wp_device_id
        }).toArray();

        const tasks = await Promise.all(
          serviceRecords.map(async (record) => {
            let technician = null;

            if (record.assigned_technician_id) {
              technician = await usersCollection.findOne({
                $or: [
                  { technician_id: record.assigned_technician_id },
                  { employee_id: record.assigned_technician_id }
                ]
              });
            }

            return {
              task_type: record.task_type || null,
              task_status: record.task_status || null,
              estimated_end: record.estimated_end || null,
              assigned_technician_id: record.assigned_technician_id || null,
              technician: technician
                ? { name: technician.name || null, phone: technician.phone || null }
                : null,
            };
          })
        );

        return {
          ...order,
          tasks
        };
      })
    );

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

    // ✅ Find the order for this user and wp_device_id with Recharge type
    const orderFilter = {
      wp_device_id,
      user_id: Number(user_id),
      orderType: 'Recharge',
    };

    const order = await ordersCollection.findOne(orderFilter);
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

