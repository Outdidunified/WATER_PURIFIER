const express = require('express');
const router = express.Router();
const settings = require('../controllers/Settingscontroller');
const authMiddleware=require('../../../middlewares/authMiddleware')


// Define routes for settings
router.post('/fetchuserdetails', authMiddleware,settings.fetchUserDetails); // Get all settings
router.post('/updateuserdetails', authMiddleware, settings.updateUserDetails); // Update user details
router.post('/createServiceRequest',authMiddleware,settings.createServiceRequest);
router.post('/fetchpaymenthistory',settings.fetchpaymenthistory);


module.exports = router;