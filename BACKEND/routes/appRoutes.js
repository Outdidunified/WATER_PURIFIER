const express = require('express');
const router = express.Router();


// Import individual route files
const authRoutes = require('../modules/app/routes/AuthRoutes');

// Mount routes under appropriate base paths
router.use('/auth', authRoutes);

module.exports = router;