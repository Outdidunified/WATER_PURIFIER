const { ObjectId } = require('mongodb');
const { getDB } = require('../config/db');

// Add a new product
exports.addProduct = async (req, res) => {
  try {
    const db = getDB();
    const productData = req.body;

    const result = await db.collection('products').insertOne(productData);

    res.status(201).json({
      status: 'success',
      message: 'Product added successfully',
      data: { _id: result.insertedId, ...productData },
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to add product',
      error: error.message,
    });
  }
};

// Get all products with their subscription plans
exports.getAllProductsWithPlans = async (req, res) => {
  try {
    const db = getDB();

    const products = await db.collection('products').find({}).toArray();

    // For each product, fetch subscription plans
    const results = await Promise.all(
      products.map(async (product) => {
        const plans = await db
          .collection('subscriptionplans')
          .find({ productId: product._id })
          .toArray();

        return {
          ...product,
          subscriptionPlans: plans,
        };
      })
    );

    res.status(200).json({
      status: 'success',
      message: 'Products with subscription plans retrieved successfully',
      data: results,
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch products with subscription plans',
      error: error.message,
    });
  }
};

// Get product details by ID with subscription plans
exports.getProductDetailsWithPlans = async (req, res) => {
  try {
    const db = getDB();
    const { id, title } = req.body;

    if (!id || !title) {
      return res.status(400).json({
        status: 'failed',
        message: 'Product ID and title are required in the request body',
      });
    }

    const product = await db.collection('products').findOne({ _id: new ObjectId(id) });

    if (!product) {
      return res.status(404).json({
        status: 'failed',
        message: 'Product not found',
      });
    }

    if (product.title !== title) {
      return res.status(400).json({
        status: 'failed',
        message: 'Product title does not match the given ID',
      });
    }

    const plans = await db.collection('subscriptionplans').find({ productId: product._id }).toArray();

    // Format plans
    const formattedPlans = plans.map(plan => ({
      ...plan,
      plans: plan.plans.map(p => ({
        _id: p._id,
        duration: p.duration,
        pricePerMonth: p.pricePerMonth,
      })),
    }));

    res.status(200).json({
      status: 'success',
      message: 'Product details with subscription plans retrieved successfully',
      data: {
        ...product,
        subscriptionPlans: formattedPlans,
      },
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve product details with subscription plans',
      error: error.message,
    });
  }
};

// Get selected plan price
exports.getSelectedPlanPrice = async (req, res) => {
  try {
    const db = getDB();
    const { id, title, selectedType, selectedPlanId } = req.body;

    if (!id || !title || !selectedType || !selectedPlanId) {
      return res.status(400).json({
        status: 'failed',
        message: 'Product ID, title, selectedType, and selectedPlanId are required',
      });
    }

    const product = await db.collection('products').findOne({ _id: new ObjectId(id) });

    if (!product) {
      return res.status(404).json({
        status: 'failed',
        message: 'Product not found',
      });
    }

    if (product.title !== title) {
      return res.status(400).json({
        status: 'failed',
        message: 'Product title does not match the given ID',
      });
    }

    // Find the subscription plan document by productId and type
    const selectedTypeObj = await db.collection('subscriptionplans').findOne({
      productId: product._id,
      type: selectedType,
    });

    if (!selectedTypeObj) {
      return res.status(404).json({
        status: 'failed',
        message: 'Selected type not found',
      });
    }

    // Find the selected plan inside the plans array
    const selectedPlan = selectedTypeObj.plans.find(p => p._id.toString() === selectedPlanId);

    if (!selectedPlan) {
      return res.status(404).json({
        status: 'failed',
        message: 'Selected plan not found in selected type',
      });
    }

    // Helper: convert duration string to months
    const parseDurationToMonths = (durationStr) => {
      const [value, unit] = durationStr.split(' ');
      const number = parseInt(value);
      if (isNaN(number)) return 1;
      if (unit.toLowerCase().includes('month')) return number;
      if (unit.toLowerCase().includes('day')) return number / 30;
      return 1;
    };

    const months = parseDurationToMonths(selectedPlan.duration);
    const baseTotal = selectedPlan.pricePerMonth * months;

    const selectedPlanInfo = {
      subscriptionId: selectedTypeObj._id,
      _id: selectedPlan._id,
      duration: selectedPlan.duration,
      pricePerMonth: selectedPlan.pricePerMonth,
      gst: selectedPlan.gst,
      securityDeposit: selectedPlan.securityDeposit,
      totalPrice: baseTotal.toFixed(2),
    };

    res.status(200).json({
      status: 'success',
      message: 'Selected plan and product details retrieved successfully',
      data: {
        product: {
          _id: product._id,
          title: product.title,
        },
        selectedType,
        selectedPlan: selectedPlanInfo,
      },
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve selected plan price',
      error: error.message,
    });
  }
};
