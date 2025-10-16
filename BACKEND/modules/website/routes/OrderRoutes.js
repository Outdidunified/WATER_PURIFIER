const express = require('express');
const router = express.Router();
const authMiddleware = require('../../../middlewares/authMiddleware');
const uploadSubscription = require('../../website/middlewares/uploadSubscription');

const {
  createSubscriptionOrder,
  verifyRazorpayPayment,
  getRechargeHistory,
  downloadInvoice
} = require('../controllers/OrderController');

// Multer middleware for subscription images
router.post(
  '/orderplace',
  authMiddleware,
  
  createSubscriptionOrder
);

router.post('/orderverify', authMiddleware, verifyRazorpayPayment);
router.get('/rechargehistory', authMiddleware, getRechargeHistory);
router.get('/:orderId/invoice', downloadInvoice);

module.exports = router;
