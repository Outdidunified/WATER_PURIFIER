const express = require('express');
const router = express.Router();
const enduserdetails = require('../controllers/EndUserHomeController');
// const authMiddleware = require('../middlewares/AuthMiddleware'); 
const authMiddleware=require('../../../middlewares/authMiddleware')

// Define routes for settings

router.post('/getActiveSubscriptionDetails',enduserdetails.getActiveSubscriptionDetails);
router.post('/getLatestFeatureValues',authMiddleware,enduserdetails.getLatestFeatureValues);

module.exports = router;