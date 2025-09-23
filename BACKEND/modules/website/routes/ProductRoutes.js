const express = require('express');
const { getAllProductsWithPlans} = require('../controllers/ProductController');
const router = express.Router();

router.get('/productswithplan',getAllProductsWithPlans);


module.exports = router;
