const { ObjectId } = require('mongodb');
const {connectToDatabase}=require('../../../config/db')


exports.getAllProductsWithPlans = async (req, res) => {
  try {
    const db = await connectToDatabase();

    // Get all product models
    const products = await db.collection('product_models').find({}).toArray();

    // Get all devices already assigned to completed orders
    const completedOrders = await db.collection('orders').find({
      paymentStatus: 'Completed',
      wp_device_id: { $exists: true, $ne: null }
    }).toArray();

    // Extract all used wp_device_ids
    const usedDeviceIds = new Set(completedOrders.map(order => order.wp_device_id));

    const availableProducts = [];

    for (const product of products) {
      // Check if there's any available device not already used in orders
      const availableDevice = await db.collection('device_details').findOne({
        model_id: Number(product.model_id),
        status: true,
        wp_device_id: { $nin: Array.from(usedDeviceIds) }
      });

      if (availableDevice) {
        availableProducts.push(product);
      }
    }

    res.status(200).json({
      status: 'Success',
      error: false,
      data: availableProducts
    });

  } catch (err) {
    console.error('Failed to fetch product models:', err);
    res.status(500).json({
      status: 'Error',
      error: true,
      message: 'Failed to fetch product models',
      details: err.message
    });
  }
};







