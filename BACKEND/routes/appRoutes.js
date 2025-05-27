const express = require('express');
const router = express.Router();


// Import individual route files
const authRoutes = require('../modules/app/routes/AuthRoutes');
const settingsRoutes = require('../modules/app/routes/SettingsRoutes');
const technicianHomeRoutes = require('../modules/app/routes/TechnicianHomeRoutes');

// Mount routes under appropriate base paths
router.use('/auth', authRoutes);
router.use('/settings', settingsRoutes);
router.use('/technicianhome', technicianHomeRoutes);

module.exports = router;