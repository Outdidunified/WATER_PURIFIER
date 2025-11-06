const express = require('express');
const router = express.Router();
const authMiddleware = require('../../../middlewares/authMiddleware');
const uploadSubscription = require('../../website/middlewares/uploadSubscription');

const {
  createSubscriptionOrder,
  renewSubscription,
  verifyRazorpayPayment,
  getRechargeHistory,
  downloadInvoice,
  getDeliveryHistory,
  updateDeliveryStatus,
  getUserDevices
} = require('../controllers/OrderController');

// Multer middleware for subscription images
router.post(
  '/orderplace',
  authMiddleware,
  createSubscriptionOrder
);

router.post('/renewsubscription', authMiddleware, renewSubscription);
router.post('/orderverify', authMiddleware, verifyRazorpayPayment);
router.get('/rechargehistory', authMiddleware, getRechargeHistory);
router.get('/userdevices/:userId', getUserDevices);
router.get('/:orderId/invoice', downloadInvoice);
router.get('/:orderId/delivery-history', getDeliveryHistory);
router.post('/:orderId/update-delivery-status', authMiddleware, updateDeliveryStatus);

module.exports = router;
