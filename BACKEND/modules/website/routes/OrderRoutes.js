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

// Use Multer middleware for subscription images
router.post(
  '/orderplace',
  authMiddleware,
  uploadSubscription.fields([
    { name: 'main_image', maxCount: 1 },
    { name: 'sub_images', maxCount: 10 }
  ]),
  createSubscriptionOrder
);

router.post('/orderverify', authMiddleware, verifyRazorpayPayment);
router.get('/rechargehistory', authMiddleware, getRechargeHistory);
router.get('/:orderId/invoice', downloadInvoice);

module.exports = router;
