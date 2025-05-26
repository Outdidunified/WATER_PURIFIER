// routes/requestCallRoutes.js
const express = require('express');
const router = express.Router();
const requestCallController = require('../controllers/CallRequestController');

router.post('/', requestCallController.requestCall);

module.exports = router;
