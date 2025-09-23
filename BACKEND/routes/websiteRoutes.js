const express = require('express');
const router = express.Router();

// Import individual route files
const authRoutes = require('../modules/website/routes/AuthRoutes');
const productRoutes = require('../modules/website/routes/ProductRoutes');
const orderRoutes = require('../modules/website/routes/OrderRoutes');
const contactRoutes = require('../modules/website/routes/ContactusRoutes');
const callRequestRoutes = require('../modules/website/routes/CallRequestRoutes');

// Mount routes under appropriate base paths
router.use('/auth', authRoutes);
router.use('/products', productRoutes);
router.use('/orders', orderRoutes);
router.use('/contact', contactRoutes);
router.use('/callRequest', callRequestRoutes);

module.exports = router;
