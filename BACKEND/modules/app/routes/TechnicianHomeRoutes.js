const express = require('express');
const router = express.Router();
const techhome = require('../controllers/TechHomecontroller');
const authMiddleware=require('../../../middlewares/authMiddleware')
const upload = require('../middlewares/multer');

// Define routes for settings
router.post('/getassignedtaskdetails', techhome.getAssignedTaskDetails); // ✅ FIXED: Use the correct controller function name
router.post(
    '/updateTaskDetails', 
    upload.fields([
        { name: 'image_before_service', maxCount: 1 },  // Limit to 1 image per upload
        { name: 'image_after_service', maxCount: 1 }    // Limit to 1 image per upload
    ]), 
    techhome.updateTaskDetails
);
router.post('/getAllAssignedTaskDetails', techhome.getAllAssignedTaskDetails);
router.post('/acceptDeclineTask', techhome.acceptDeclineTask);
router.post('/getRejectionHistory', techhome.getRejectionHistory);

// ============ LEAVE REQUEST ROUTES ============
router.post('/requestLeave', techhome.requestLeave);
router.post('/getTechnicianLeaveRequests', techhome.getTechnicianLeaveRequests);
router.post('/updateInProgressTaskLeaveAction', techhome.updateInProgressTaskLeaveAction);
router.post('/createRechargeOrder',techhome.createRechargeOrder);

// ============ BLE CONNECTION SETUP ROUTE ============
router.post('/setupBleConnection', authMiddleware, techhome.setupBleConnection);
router.post('/storeBleAck', authMiddleware, techhome.storeBleAck);

module.exports = router;