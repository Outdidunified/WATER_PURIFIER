const { ObjectId } = require('mongodb');
const {connectToDatabase}=require('../../../config/db')


exports.getAllProductsWithPlans = async (req, res) => {
  try {
    const db = await connectToDatabase();
    const userId = parseInt(req.query.user_id);

    const products = await db.collection('product_models').find({}).toArray();

    // Get all orders with completed payment and a device assigned
    const allPurchasedOrders = await db.collection('orders').find({
      paymentStatus: 'Completed',
      wp_device_id: { $exists: true, $ne: null }
    }).toArray();

    // Collect all purchased productModelIds
    const purchasedProductModelIds = new Set(
      allPurchasedOrders.map(order => order.productModelId?.toString())
    );

    const enrichedProducts = products.map(product => {
      const productModelIdStr = product._id.toString();
      const isPurchased = purchasedProductModelIds.has(productModelIdStr);

      return {
        ...product,
        isOutOfStockForUser: isPurchased
      };
    });

    res.status(200).json({
      status: 'Success',
      error: false,
      data: enrichedProducts
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





