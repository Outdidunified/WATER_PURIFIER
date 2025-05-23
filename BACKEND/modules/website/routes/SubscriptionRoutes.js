const express = require('express');
const { addPlan, getPlansByProduct } = require('../controllers/SubscriptionController');
const router = express.Router();

router.post('/addplan', addPlan);
router.get('/:productId', getPlansByProduct);

module.exports = router;