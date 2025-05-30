const { ObjectId } = require('mongodb');
const {connectToDatabase}=require('../../../config/db')



exports.getAllProductsWithPlans = async (req, res) => {
  try {
    const db = await connectToDatabase();  

    const products = await db.collection('product_models').find({}).toArray();

    res.status(200).json({
      status: 'Success',
      data: products,
    });
  } catch (err) {
    res.status(500).json({
      status: 'Error',
      message: 'Failed to fetch product models',
      error: err.message,
    });
  }
};


