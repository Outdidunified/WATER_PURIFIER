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



module.exports = router;