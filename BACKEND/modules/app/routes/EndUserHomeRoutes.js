const express = require('express');
const router = express.Router();
const settings = require('../controllers/Settingscontroller');
const authMiddleware = require('../middlewares/AuthMiddleware'); // ✅ FIXED: No destructuring

// Define routes for settings



module.exports = router;