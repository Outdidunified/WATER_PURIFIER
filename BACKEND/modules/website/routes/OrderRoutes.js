const express = require('express');
const router = express.Router();
const authMiddleware=require('../../../middlewares/authMiddleware')

const {
  createSubscriptionOrder,
  verifyRazorpayPayment,
  getRechargeHistory  // import this from your controller
} = require('../controllers/OrderController');

// Place order (requires login)
router.post('/orderplace', authMiddleware, createSubscriptionOrder);

router.post('/orderverify', authMiddleware,verifyRazorpayPayment);

// Recharge history - only for authenticated user
router.get('/rechargehistory', authMiddleware, getRechargeHistory);

module.exports = router;
