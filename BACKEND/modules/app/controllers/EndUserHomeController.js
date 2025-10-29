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

    const user = await usersCollection.findOne({
      user_id: parseInt(user_id),
      email: email.trim(),
    });

    if (!user) {
      return res.status(404).json({ error: true, message: 'User not found' });
    }

    // ✅ Fallback: If not subscribed, check for COD confirmed orders
    if (!user.is_subscribed || !user.active_order_id) {
      const codOrder = await ordersCollection.findOne({
        user_id: parseInt(user_id),
        orderStatus: 'Confirmed',
        paymentType: 'COD'
      });

      if (codOrder) {
        // ✅ Auto-update user
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

    // ✅ Fetch all orders
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

    // ✅ Add installation_status from service_records for each order
    const ordersWithStatus = await Promise.all(
      orders.map(async (order) => {
        const serviceRecord = await serviceRecordsCollection.findOne({
          wp_device_id: order.wp_device_id
        });
        
        return {
          ...order,
          installation_status: serviceRecord?.task_status || null
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
  