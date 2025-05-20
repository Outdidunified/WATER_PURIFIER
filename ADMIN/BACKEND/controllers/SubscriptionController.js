const SubscriptionPlan = require('../models/SubscriptionPlan');

// Add new subscription plan
exports.addPlan = async (req, res) => {
  try {
    const plan = await SubscriptionPlan.create(req.body);
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
    const plans = await SubscriptionPlan.find({ productId: req.params.productId });

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
