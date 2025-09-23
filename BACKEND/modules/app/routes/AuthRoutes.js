const express = require('express');
const router = express.Router();
const auth = require('../controllers/Authcontroller');

router.post('/userlogingetotp', auth.login);           // Step 1: Send OTP
router.post('/userloginverifyotp', auth.verifyOtp);  
router.post('/technicianlogin', auth.technicianLogin);  

module.exports = router;



