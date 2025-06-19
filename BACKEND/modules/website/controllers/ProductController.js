const { ObjectId } = require('mongodb');
const {connectToDatabase}=require('../../../config/db')


exports.getAllProductsWithPlans = async (req, res) => {
  try {
    const db = await connectToDatabase();

    // 1. Get all wp_device_ids used in completed orders by any user
    const allCompletedOrders = await db.collection('orders').find({
      paymentStatus: 'Completed',
      wp_device_id: { $exists: true, $ne: null }
    }).toArray();

    const usedDeviceIds = new Set(allCompletedOrders.map(order => order.wp_device_id));

    // 2. Get all product models
    const allProducts = await db.collection('product_models').find({}).toArray();
//available
    const availableProducts = [];

    for (const product of allProducts) {
      // 3. Find any device for this product model that is still unused
      const availableDevice = await db.collection('device_details').findOne({
        model_id: Number(product.model_id),
        status: true,
        wp_device_id: { $nin: Array.from(usedDeviceIds) } // Only unused devices
      });

      if (availableDevice) {
        availableProducts.push({
          ...product,
          availableDeviceId: availableDevice.wp_device_id // Optional
        });
      }
    }

    return res.status(200).json({
      status: 'Success',
      error: false,
      data: availableProducts
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








