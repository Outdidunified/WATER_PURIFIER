// routes/requestCallRoutes.js
const express = require('express');
const router = express.Router();
const requestCallController = require('../controllers/CallRequestController');

router.post('/callRequest', requestCallController.requestCall);

module.exports = router;
