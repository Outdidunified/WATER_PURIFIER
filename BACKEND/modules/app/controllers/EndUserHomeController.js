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

    const user = await usersCollection.findOne({
      user_id: parseInt(user_id),
      email: email.trim(),
    });

    if (!user) {
      return res.status(404).json({ error: true, message: 'User not found' });
    }

    if (!user.is_subscribed || !user.active_order_id) {
      return res.status(200).json({
        error: false,
        message: 'User is not subscribed',
        data: { subscription: null }
      });
    }

    const order = await ordersCollection.findOne({
      _id: new ObjectId(user.active_order_id),
    });

    if (!order) {
      return res.status(404).json({ error: true, message: 'Active order not found' });
    }

    return res.status(200).json({
      error: false,
      message: 'Active subscription fetched successfully',
      data: { subscription: order }
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
  