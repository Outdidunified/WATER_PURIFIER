const express = require('express');
const { getAllProductsWithPlans, fetchpaymenthistory } = require('../controllers/ProductController');
const router = express.Router();

router.get('/productswithplan',getAllProductsWithPlans);
router.post('/fetchpaymenthistory',fetchpaymenthistory);


module.exports = router;
