const express = require('express');
const router = express.Router();
const settings = require('../controllers/Settingscontroller');
const authMiddleware = require('../middlewares/AuthMiddleware'); // ✅ FIXED: No destructuring

// Define routes for settings
router.post('/fetchuserdetails', authMiddleware,settings.fetchUserDetails); // Get all settings
router.post('/updateuserdetails', authMiddleware, settings.updateUserDetails); // Update user details

module.exports = router;