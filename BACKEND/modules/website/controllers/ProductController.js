const { ObjectId } = require('mongodb');
const {connectToDatabase}=require('../../../config/db')


exports.getAllProductsWithPlans = async (req, res) => {
  try {
    const db = await connectToDatabase();
    const userId = parseInt(req.query.user_id);

    // Fetch all product models
    const products = await db.collection('product_models').find({}).toArray();

    // Fetch all completed orders with assigned devices
    const allPurchasedOrders = await db.collection('orders').find({
      paymentStatus: 'Completed',
      wp_device_id: { $exists: true, $ne: null }
    }).toArray();

    // Get all purchased product model IDs
    const purchasedProductModelIds = new Set(
      allPurchasedOrders.map(order => order.productModelId?.toString())
    );

    // Filter out products where isOutOfStockForUser would be true
    const availableProducts = products.filter(product => {
      const productModelIdStr = product._id.toString();
      const isOutOfStockForUser = purchasedProductModelIds.has(productModelIdStr);
      return !isOutOfStockForUser;
    });

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






