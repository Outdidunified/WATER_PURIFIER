const express = require('express');
const router = express.Router();
const Controller = require('../controllers/dashboardController');
const verifyToken = require('../middlewares/dashboardAuthMiddleware');
const flatted = require('flatted');
const { ObjectId } = require('mongodb');

// 1.Login
// Route to check login credentials
router.post('/CheckLoginCredentials', Controller.authenticate);

// 2.Profile
// Route to FetchAdminProfile 
router.post('/FetchAdminProfile', verifyToken, Controller.FetchAdminProfile);

// Route to update Admin profile
router.post('/UpdateAdminProfile', verifyToken, Controller.UpdateAdminProfile);

// 3.Subscription Plans
// Route to AddSubscriptionPlans
router.post('/AddSubscriptionPlans', verifyToken, Controller.AddSubscriptionPlans);

// Route to FetchSubscriptionPlans
router.post('/FetchSubscriptionPlans', verifyToken, Controller.FetchSubscriptionPlans);

// Route to UpdateSubscriptionPlans
router.post('/UpdateSubscriptionPlans', verifyToken, Controller.UpdateSubscriptionPlans);

// 4.Call Request
// Route to FetchCallRequest
router.post('/FetchCallRequest', verifyToken, Controller.FetchCallRequest);

// 5.Contact
// Route to FetchContact
router.post('/FetchContact', verifyToken, Controller.FetchContact);

// 6.Manage orders
// Route to FetchOrders
router.post('/FetchOrders', verifyToken, Controller.FetchOrders);

// Route to UpdateOrdersStatus 
router.post('/UpdateOrdersStatus', verifyToken, Controller.UpdateOrdersStatus);

module.exports = router;
