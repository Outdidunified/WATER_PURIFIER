const express = require('express');
const router = express.Router();
const auth = require('../controllers/Authcontroller');

router.post('/login', auth.login);           // Step 1: Send OTP
router.post('/verify-otp', auth.verifyOtp);  // Step 2: Verify OTP & Login

module.exports = router;


