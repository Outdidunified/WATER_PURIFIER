const express = require('express');
const { addProduct ,getProductDetailsWithPlans,getAllProducts,getAllProductsWithPlans,getSelectedPlanPrice} = require('../controllers/ProductController');
const router = express.Router();

router.post('/addproducts', addProduct);
router.post('/productswithtitle',getProductDetailsWithPlans);
router.get('/productswithplan',getAllProductsWithPlans);
router.post('/getSelectedPlanPrice',getSelectedPlanPrice);


module.exports = router;
