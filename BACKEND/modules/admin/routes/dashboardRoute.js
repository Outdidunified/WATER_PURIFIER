

const express = require('express');
const router = express.Router();
const Controller = require('../controllers/dashboardController');
const verifyToken = require('../middlewares/dashboardAuthMiddleware');
const flatted = require('flatted');
const { ObjectId } = require('mongodb');
const { upload } = require('../middlewares/imgMiddleware');
const leaveRequestsRoute = require('./leaveRequestsRoute');

// 1.Login
// Route to check login credentials
router.post('/CheckLoginCredentials', Controller.authenticate);
router.post("/assign", Controller.assignPermissions);
router.get('/modules', Controller.getModules);

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
// Route to GetSearchProductsCount
router.get('/GetSearchProductsCount', verifyToken, Controller.GetSearchProductsCount);
// Route to SearchProducts
router.get('/SearchProducts', verifyToken, Controller.SearchProducts);

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
// Route to GetSearchDevicesCount
router.get('/GetSearchDevicesCount', verifyToken, Controller.GetSearchDevicesCount);
// Route to SearchDevices
router.get('/SearchDevices', verifyToken, Controller.SearchDevices);

// Route to UpdateDeviceDetails
router.post('/UpdateDeviceDetails', verifyToken, Controller.UpdateDeviceDetails);

// 5.Call Request
// Route to FetchCallRequest
router.post('/FetchCallRequest', verifyToken, Controller.FetchCallRequest);
// Route to GetSearchCallRequestsCount
router.get('/GetSearchCallRequestsCount', verifyToken, Controller.GetSearchCallRequestsCount);
// Route to SearchCallRequests
router.get('/SearchCallRequests', verifyToken, Controller.SearchCallRequests);

// 6.Contact
// Route to FetchContact
router.post('/FetchContact', verifyToken, Controller.FetchContact);
// Route to GetSearchContactCount
router.get('/GetSearchContactCount', verifyToken, Controller.GetSearchContactCount);
// Route to SearchContact
router.get('/SearchContact', verifyToken, Controller.SearchContact);

// 7.Manage orders
// Route to FetchOrders
router.post('/FetchOrders', verifyToken, Controller.FetchOrders);
// Route to GetSearchOrdersCount
router.get('/GetSearchOrdersCount', verifyToken, Controller.GetSearchOrdersCount);
// Route to SearchOrders
router.get('/SearchOrders', verifyToken, Controller.SearchOrders);
// Route to GetSearchInstallationsCount
router.get('/GetSearchInstallationsCount', verifyToken, Controller.GetSearchInstallationsCount);
// Route to SearchInstallations
router.get('/SearchInstallations', verifyToken, Controller.SearchInstallations);
// Route to GetSearchServicesCount
router.get('/GetSearchServicesCount', verifyToken, Controller.GetSearchServicesCount);
// Route to SearchServices
router.get('/SearchServices', verifyToken, Controller.SearchServices);
// Route to FetchOrdersByDistrict
router.post('/FetchOrdersByDistrict', verifyToken, Controller.FetchOrdersByDistrict);
// Route to FetchOrdersByUserId
router.post('/FetchOrdersByUserId',  Controller.FetchOrdersByUserId);
// Route to confirm COD payments manually
router.post('/ConfirmCodPayment', verifyToken, Controller.ConfirmCodPayment);
// Route to FetchEndUserDevices
router.post('/FetchEndUserDevices', verifyToken, Controller.FetchEndUserDevices);
// Route to FetchTechnicianTasksByUserId
router.post('/FetchTechnicianTasksByUserId', Controller.FetchTechnicianTasksByUserId);

// Route to UpdateOrdersStatus
// router.post('/UpdateOrdersStatus', verifyToken, Controller.UpdateOrdersStatus);

// 8.Manage Roles
// Route to AddUserRoles
router.post('/AddUserRoles', verifyToken, Controller.AddUserRoles);

// Route to FetchUserRoles
router.post('/FetchUserRoles', verifyToken, Controller.FetchUserRoles);
// Route to GetSearchRolesCount
router.get('/GetSearchRolesCount', verifyToken, Controller.GetSearchRolesCount);
// Route to SearchRoles
router.get('/SearchRoles', verifyToken, Controller.SearchRoles);

// Route to UpdateUserRoles
router.post('/UpdateUserRoles', verifyToken, Controller.UpdateUserRoles);

// 9.Manage User
// Route to AddUsers
router.post('/AddUsers', verifyToken, Controller.AddUsers);

// Route to FetchUsers
router.post('/FetchUsers', verifyToken, Controller.FetchUsers);
// Route to GetSearchUsersCount
router.get('/GetSearchUsersCount', verifyToken, Controller.GetSearchUsersCount);
// Route to SearchUsers
router.get('/SearchUsers', verifyToken, Controller.SearchUsers);
// Route to FetchSellers (role 4)
router.post('/FetchSellers', verifyToken, Controller.FetchSellers);
// Route to FetchTechniciansByDistrict (role 2)
router.post('/FetchTechniciansByDistrict', verifyToken, Controller.FetchTechniciansByDistrict);
// Route to GetDistrictsWithSellers - Get unique districts with state where sellers exist
router.get('/GetDistrictsWithSellers',  Controller.GetDistrictsWithSellers);

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

// Route to UnAssignTask
router.post('/UnAssignTask', verifyToken, Controller.UnAssignTask);

// Manual request routes
router.post('/FetchInstalledDevicesForRequests', verifyToken, Controller.FetchInstalledDevicesForRequests);
router.post('/CreateManualRequest', verifyToken, Controller.CreateManualRequest);
router.post('/FetchManualRequests', verifyToken, Controller.FetchManualRequests);
router.post('/FetchManualRequestsBySellerDistrict', verifyToken, Controller.FetchManualRequestsBySellerDistrict);
router.post('/AssignManualRequest', verifyToken, Controller.AssignManualRequest);
router.post('/ReAssignManualRequest', verifyToken, Controller.ReAssignManualRequest);

// Seller assignment routes
router.post('/AssignSeller', verifyToken, Controller.AssignSeller);
router.post('/ReAssignSeller', verifyToken, Controller.ReAssignSeller);
router.post('/DeactivateSellerAssignment', verifyToken, Controller.DeactivateSellerAssignment);

// New GET APIs by district
// Users by district (optional role_id)
router.get('/users/by-district', verifyToken, Controller.GetUsersByDistrict);
// Users by district count
router.get('/users/by-district/count', verifyToken, Controller.GetUsersByDistrictCount);
// Orders by district
router.get('/orders/by-district', verifyToken, Controller.GetOrdersByDistrict);
// Installations by district
router.get('/installations/by-district', verifyToken, Controller.GetInstallationsByDistrict);
// Services by district
router.get('/services/by-district', verifyToken, Controller.GetServicesByDistrict);

// Analytics API
router.get('/analytics',  Controller.GetAnalytics);
// Analytics by district
router.get('/analytics/by-district',  Controller.GetAnalyticsByDistrict);

// Assignment History API
router.get('/assignment-history/:task_id', Controller.getAssignmentHistory);

// User Counts API
// Get user counts by all roles (admin, technician, endUser, seller, totalUsers)
router.get('/users/counts/by-role', verifyToken, Controller.GetUserCountsByRole);
// Get user count by specific type
router.get('/users/counts/by-type', verifyToken, Controller.GetUserCountByType);
// Get user counts grouped by district
router.get('/users/counts/by-district', verifyToken, Controller.GetUserCountByDistrict);

// Orders Count API
// Get order counts by status, payment status, payment type
router.get('/orders/counts', verifyToken, Controller.GetOrdersCounts);

// Installations Count API
// Get installation counts by status and district
router.get('/installations/counts', verifyToken, Controller.GetInstallationsCounts);

// Services Count API
// Get service counts by status and district
router.get('/services/counts', verifyToken, Controller.GetServicesCounts);

// Manual Requests Count API
// Get manual request counts by status and district
router.get('/requests/counts', verifyToken, Controller.GetManualRequestsCounts);

// Leave Requests Count API
// Get leave request counts by status, district, and technician_id
router.get('/leave-requests/counts', verifyToken, Controller.GetLeaveRequestsCounts);

// Orders Count By District API
// Get order counts grouped by district
router.get('/orders/counts/by-district', verifyToken, Controller.GetOrdersCountsByDistrict);

// Installations Count By District API
// Get installation counts grouped by district
router.get('/installations/counts/by-district', verifyToken, Controller.GetInstallationsCountsByDistrict);

// Services Count By District API
// Get service counts grouped by district
router.get('/services/counts/by-district', verifyToken, Controller.GetServicesCountsByDistrict);

// Manual Requests Count By District API
// Get manual request counts grouped by district
router.get('/requests/counts/by-district', verifyToken, Controller.GetManualRequestsCountsByDistrict);

// Leave Requests Count By District API
// Get leave request counts grouped by district
router.get('/leave-requests/counts/by-district', verifyToken, Controller.GetLeaveRequestsCountsByDistrict);

// 11. Leave Requests Management
router.use('/', leaveRequestsRoute);

module.exports = router;
