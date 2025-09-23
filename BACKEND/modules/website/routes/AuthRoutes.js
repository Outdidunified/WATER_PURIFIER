const express = require('express');
const router = express.Router();
const auth = require('../controllers/AuthController');

router.post('/register', auth.register);
router.post('/email', auth.loginWithEmail);
router.post('/send-otp', auth.sendOtp);
router.post('/verify-otp', auth.verifyOtp);
router.post('/userlogingetotp', auth.login); 
router.post('/technicianlogin', auth.technicianLogin);  
   
// router.post('/verifyOtpforLogin',auth.verifyOtpforLogin)

module.exports = router;
