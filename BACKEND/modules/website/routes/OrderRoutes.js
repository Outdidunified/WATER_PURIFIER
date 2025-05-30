const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');  // your auth middleware

const {
  createSubscriptionOrder,
  verifyRazorpayPayment,
  getRechargeHistory  // import this from your controller
} = require('../controllers/OrderController');

// Place order (requires login)
router.post('/orderplace', auth, createSubscriptionOrder);

router.post('/orderverify', verifyRazorpayPayment);

// Recharge history - only for authenticated user
router.get('/rechargehistory', auth, getRechargeHistory);

module.exports = router;
