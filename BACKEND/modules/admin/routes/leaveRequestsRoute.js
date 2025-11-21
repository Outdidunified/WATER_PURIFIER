const express = require('express');
const router = express.Router();
const verifyToken = require('../middlewares/dashboardAuthMiddleware');
const Controller = require('../controllers/leaveRequestsController');

/**
 * GET: Fetch all leave requests
 * Query params: status, technician_id, from_date, to_date (optional)
 */
router.get('/leave-requests', verifyToken, Controller.FetchLeaveRequests);

/**
 * GET: Fetch leave requests by seller's district
 * Query params: page, limit (optional, default 10)
 */
router.get('/leave-requests-by-district', verifyToken, Controller.FetchLeaveRequestsBySellerDistrict);

/**
 * GET: Fetch single leave request with technician's pending tasks
 */
router.get('/leave-requests/:leaveRequestId', verifyToken, Controller.GetLeaveRequestDetails);

/**
 * POST: Approve leave request
 * Body: { approvedBy: "admin_name_or_id" }
 */
router.post('/leave-requests/:leaveRequestId/approve', verifyToken, Controller.ApproveLeaveRequest);

/**
 * POST: Reject leave request
 * Body: { rejectionReason: "reason", approvedBy: "admin_name_or_id" }
 */
router.post('/leave-requests/:leaveRequestId/reject', verifyToken, Controller.RejectLeaveRequest);

module.exports = router;