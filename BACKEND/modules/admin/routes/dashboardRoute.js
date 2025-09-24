const express = require('express');
const router = express.Router();
const Controller = require('../controllers/dashboardController');
const verifyToken = require('../middlewares/dashboardAuthMiddleware');
const flatted = require('flatted');
const { ObjectId } = require('mongodb');
const { upload } = require('../middlewares/imgMiddleware');

// 1.Login
// Route to check login credentials
router.post('/CheckLoginCredentials', Controller.authenticate);
router.post("/assign", Controller.assignPermissions);

// Fetch permissions by role
router.get("/by-role", Controller.fetchPermissionsByRole);
// 2.Profile
// Route to FetchAdminProfile 
router.post('/FetchAdminProfile', verifyToken, Controller.FetchAdminProfile);

// Route to update Admin profile
router.post('/UpdateAdminProfile', verifyToken, Controller.UpdateAdminProfile);

// 3.Product Models
// Route to AddProductModels
router.post('/AddProductModels', verifyToken,
    upload.fields([
    { name: 'main_img', maxCount: 1 },
    { name: 'sub_img_1', maxCount: 1 },
    { name: 'sub_img_2', maxCount: 1 },
    { name: 'sub_img_3', maxCount: 1 },
    { name: 'sub_img_4', maxCount: 1 },
    { name: 'product_specifications', maxCount: 1 }  // PDF field
]), Controller.AddProductModels);

// Route to FetchProductModels
router.post('/FetchProductModels', verifyToken, Controller.FetchProductModels);

// Route to UpdateProductModels
// router.post('/UpdateProductModels', verifyToken, Controller.UpdateProductModels);
router.post( '/UpdateProductModels', verifyToken,
    upload.fields([
        { name: 'main_img', maxCount: 1 },
        { name: 'sub_img_1', maxCount: 1 },
        { name: 'sub_img_2', maxCount: 1 },
        { name: 'sub_img_3', maxCount: 1 },
        { name: 'sub_img_4', maxCount: 1 },
        { name: 'product_specifications', maxCount: 1 }
    ]),
    Controller.UpdateProductModels
);
  
// 4. Device Details
// Route to AddDeviceDetails
router.post('/AddDeviceDetails', verifyToken, Controller.AddDeviceDetails);

// Route to FetchDeviceDetails
router.post('/FetchDeviceDetails', verifyToken, Controller.FetchDeviceDetails);

// Route to UpdateDeviceDetails
router.post('/UpdateDeviceDetails', verifyToken, Controller.UpdateDeviceDetails);

// 5.Call Request
// Route to FetchCallRequest
router.post('/FetchCallRequest', verifyToken, Controller.FetchCallRequest);

// 6.Contact
// Route to FetchContact
router.post('/FetchContact', verifyToken, Controller.FetchContact);

// 7.Manage orders
// Route to FetchOrders
router.post('/FetchOrders', verifyToken, Controller.FetchOrders);

// Route to UpdateOrdersStatus 
// router.post('/UpdateOrdersStatus', verifyToken, Controller.UpdateOrdersStatus);

// 8.Manage Roles
// Route to AddUserRoles
router.post('/AddUserRoles', verifyToken, Controller.AddUserRoles);

// Route to FetchUserRoles
router.post('/FetchUserRoles', verifyToken, Controller.FetchUserRoles);

// Route to FetchOrders
router.post('/UpdateUserRoles', verifyToken, Controller.UpdateUserRoles);

// 9.Manage User
// Route to AddUsers
router.post('/AddUsers', verifyToken, Controller.AddUsers);

// Route to FetchUsers
router.post('/FetchUsers', verifyToken, Controller.FetchUsers);

// Route to UpdateUsers
router.post('/UpdateUsers', verifyToken, Controller.UpdateUsers);

//10.InstallationService
// Route to FetchInstallationService
router.post('/FetchInstallationService', verifyToken, Controller.FetchInstallationService);

// Route to FetchSelectUserOrders
router.post('/FetchSelectUserOrders', verifyToken, Controller.FetchSelectUserOrders);

// Route to AssignInstallation
router.post('/AssignInstallation', verifyToken, Controller.AssignInstallation);

// Route to ReAssignInstallation
router.post('/ReAssignInstallation', verifyToken, Controller.ReAssignInstallation);

// Route to FetchSelectInstallationTask
router.post('/FetchSelectInstallationTask', verifyToken, Controller.FetchSelectInstallationTask);

// Route to FetchSelectServiceTask
router.post('/FetchSelectServiceTask', verifyToken, Controller.FetchSelectServiceTask);

// Route to AssignService
router.post('/AssignService', verifyToken, Controller.AssignService);

// Route to ReAssignService
router.post('/ReAssignService', verifyToken, Controller.ReAssignService);

module.exports = router;
