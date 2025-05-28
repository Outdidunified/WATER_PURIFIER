const express = require('express');
const router = express.Router();
const enduserdetails = require('../controllers/EndUserHomeController');
const authMiddleware = require('../middlewares/AuthMiddleware'); // ✅ FIXED: No destructuring

// Define routes for settings

router.post('/getActiveSubscriptionDetails',authMiddleware,enduserdetails.getActiveSubscriptionDetails);
router.post('/getLatestFeatureValues',authMiddleware,enduserdetails.getLatestFeatureValues);

module.exports = router;