const express = require('express');
const router = express.Router();
const analytics = require('../controllers/AnalyticsController');
// const authMiddleware = require('../middlewares/AuthMiddleware'); 
const authMiddleware=require('../../../middlewares/authMiddleware')

router.post('/getDailyWaterConsumption', authMiddleware, analytics.getWaterAnalytics);           // Step 1: Send OTP
 

module.exports = router;