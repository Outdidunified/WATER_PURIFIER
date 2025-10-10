const express = require('express');
const router = express.Router();
const authMiddleware=require('../../../middlewares/authMiddleware')

const {
  createSubscriptionOrder,
  verifyRazorpayPayment,
  getRechargeHistory, // import this from your controller
  downloadInvoice
} = require('../controllers/OrderController');

// Place order (requires login)
router.post('/orderplace', authMiddleware, createSubscriptionOrder);

router.post('/orderverify', authMiddleware,verifyRazorpayPayment);

// Recharge history - only for authenticated user
router.get('/rechargehistory', authMiddleware, getRechargeHistory);

// Invoice download - public access
router.get('/:orderId/invoice', downloadInvoice);

module.exports = router;
