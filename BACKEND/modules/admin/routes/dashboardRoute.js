const express = require('express');
const router = express.Router();
const Controller = require('../controllers/dashboardController');
const verifyToken = require('../middlewares/dashboardAuthMiddleware');
const flatted = require('flatted');
const { ObjectId } = require('mongodb');

// 1.Login
// Route to check login credentials
router.post('/CheckLoginCredentials', Controller.authenticate);

module.exports = router;
