
const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const {
  createSubscriptionOrder,
  verifyRazorpayPayment
} = require('../controllers/OrderController');

// Place order (requires login)
router.post('/orderplace', auth, createSubscriptionOrder);

// Razorpay Webhook endpoint
router.post('/orderverify', verifyRazorpayPayment);

module.exports = router;
