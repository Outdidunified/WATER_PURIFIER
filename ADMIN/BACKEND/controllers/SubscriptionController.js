const { getDB } = require('../config/db');
const { ObjectId } = require('mongodb');

// Add new subscription plan
exports.addPlan = async (req, res) => {
  try {
    const db = getDB();

    // Direct insert (schema-less)
    const result = await db.collection('subscriptionplans').insertOne(req.body);

    // Fetch the inserted plan with _id populated
    const plan = await db.collection('subscriptionplans').findOne({ _id: result.insertedId });

    res.status(200).json({
      message: 'Subscription plan added successfully',
      data: plan,
      status: 'success'
    });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to add subscription plan',
      error: error.message,
      status: 'error'
    });
  }
};

// Get all plans by product ID
exports.getPlansByProduct = async (req, res) => {
  try {
    const db = getDB();
    const productId = req.params.productId;

    // Validate ObjectId
    if (!ObjectId.isValid(productId)) {
      return res.status(400).json({
        message: 'Invalid product ID',
        status: 'failed'
      });
    }

    const plans = await db.collection('subscriptionplans').find({ productId: productId }).toArray();

    if (plans.length === 0) {
      return res.status(404).json({
        message: 'No plans found for the specified product',
        status: 'failed'
      });
    }

    res.status(200).json({
      message: 'Subscription plans retrieved successfully',
      data: plans,
      status: 'success'
    });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to retrieve subscription plans',
      error: error.message,
      status: 'error'
    });
  }
};
