const {
    getAllLeaveRequests,
    getLeaveRequestById,
    getTechnicianPendingTasks,
    approveLeaveRequest,
    rejectLeaveRequest,
} = require('../services/leaveRequestsService');

/**
 * GET: Fetch all leave requests with optional filters
 */
async function FetchLeaveRequests(req, res) {
    try {
        const { status, technician_id, from_date, to_date } = req.query;

        const filters = {};
        if (status) filters.status = status;
        if (technician_id) filters.technician_id = technician_id;
        if (from_date && to_date) {
            filters.from_date = from_date;
            filters.to_date = to_date;
        }

        const leaveRequests = await getAllLeaveRequests(filters);

        return res.status(200).json({
            success: true,
            message: 'Leave requests fetched successfully',
            data: leaveRequests,
        });
    } catch (error) {
        console.error('Error fetching leave requests:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch leave requests',
            error: error.message,
        });
    }
}

/**
 * GET: Fetch single leave request with technician's pending tasks
 */
async function GetLeaveRequestDetails(req, res) {
    try {
        const { leaveRequestId } = req.params;

        const leaveRequest = await getLeaveRequestById(leaveRequestId);

        if (!leaveRequest) {
            return res.status(404).json({
                success: false,
                message: 'Leave request not found',
            });
        }

        // Fetch technician's pending tasks
        const pendingTasks = await getTechnicianPendingTasks(
            leaveRequest.technician_id,
            leaveRequest.from_date,
            leaveRequest.to_date
        );

        return res.status(200).json({
            success: true,
            message: 'Leave request details fetched successfully',
            data: {
                leaveRequest,
                pendingTasks,
            },
        });
    } catch (error) {
        console.error('Error fetching leave request details:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch leave request details',
            error: error.message,
        });
    }
}

/**
 * POST: Approve leave request
 */
async function ApproveLeaveRequest(req, res) {
    try {
        const { leaveRequestId } = req.params;
        const { approvedBy } = req.body;

        if (!approvedBy) {
            return res.status(400).json({
                success: false,
                message: 'approvedBy field is required',
            });
        }

        const result = await approveLeaveRequest(leaveRequestId, approvedBy);

        if (result.modifiedCount === 0) {
            return res.status(404).json({
                success: false,
                message: 'Leave request not found or already processed',
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Leave request approved successfully and email sent',
            data: result,
        });
    } catch (error) {
        console.error('Error approving leave request:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to approve leave request',
            error: error.message,
        });
    }
}

/**
 * POST: Reject leave request
 */
async function RejectLeaveRequest(req, res) {
    try {
        const { leaveRequestId } = req.params;
        const { rejectionReason, approvedBy } = req.body;

        if (!rejectionReason || !approvedBy) {
            return res.status(400).json({
                success: false,
                message: 'rejectionReason and approvedBy fields are required',
            });
        }

        const result = await rejectLeaveRequest(leaveRequestId, rejectionReason, approvedBy);

        if (result.modifiedCount === 0) {
            return res.status(404).json({
                success: false,
                message: 'Leave request not found or already processed',
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Leave request rejected successfully and email sent',
            data: result,
        });
    } catch (error) {
        console.error('Error rejecting leave request:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to reject leave request',
            error: error.message,
        });
    }
}

module.exports = {
    FetchLeaveRequests,
    GetLeaveRequestDetails,
    ApproveLeaveRequest,
    RejectLeaveRequest,
};