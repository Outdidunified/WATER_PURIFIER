const { connectToDatabase } = require('../../../config/db');
const { ObjectId } = require('mongodb');
const nodemailer = require('nodemailer');

// Email transporter setup
const transporter = nodemailer.createTransport({
    host: 'smtppro.zoho.in',
    port: 465,
    secure: true,
    auth: {
        user: process.env.SMTP_EMAIL,
        pass: process.env.SMTP_PASSWORD,
    },
});

/**
 * Get all leave requests with optional filters
 */
async function getAllLeaveRequests(filters = {}) {
    try {
        const db = await connectToDatabase();
        const leaveRequestsCollection = db.collection('leave_requests');

        // Build query
        let query = {};
        if (filters.status) {
            query.status = filters.status;
        }
        if (filters.technician_id) {
            query.technician_id = filters.technician_id;
        }
        if (filters.from_date && filters.to_date) {
            query.from_date = {
                $gte: new Date(filters.from_date),
                $lte: new Date(filters.to_date),
            };
        }

        // Get leave requests
        const leaveRequests = await leaveRequestsCollection
            .find(query)
            .sort({ requested_date: -1 })
            .toArray();

        // Get unique technician IDs
        const technicianIds = [...new Set(leaveRequests.map(leave => leave.technician_id))];

        // Fetch technician details
        const usersCollection = db.collection('users');
        const technicians = await usersCollection
            .find({ technician_id: { $in: technicianIds } })
            .project({ technician_id: 1, district: 1 })
            .toArray();

        // Create a map of technician_id to district
        const technicianDistrictMap = {};
        technicians.forEach(tech => {
            technicianDistrictMap[tech.technician_id] = tech.district;
        });

        // Add technician_district to each leave request
        const leaveRequestsWithDistrict = leaveRequests.map(leave => ({
            ...leave,
            technician_district: technicianDistrictMap[leave.technician_id] || null
        }));

        return leaveRequestsWithDistrict;
    } catch (error) {
        throw new Error(`Failed to fetch leave requests: ${error.message}`);
    }
}

/**
 * Get leave request by ID
 */
async function getLeaveRequestById(leaveRequestId) {
    try {
        const db = await connectToDatabase();
        const leaveRequestsCollection = db.collection('leave_requests');

        const leaveRequest = await leaveRequestsCollection.findOne({
            _id: new ObjectId(leaveRequestId),
        });

        return leaveRequest;
    } catch (error) {
        throw new Error(`Failed to fetch leave request: ${error.message}`);
    }
}

/**
 * Get all technician's tasks (all statuses)
 */
async function getTechnicianPendingTasks(technicianId, leaveFromDate, leaveToDate) {
    try {
        const db = await connectToDatabase();
        const serviceRecordsCollection = db.collection('service_records');

        // Find ALL tasks assigned to technician using assigned_technician_id
        // (technicianId is like "EMP026")
        const tasks = await serviceRecordsCollection
            .find({
                assigned_technician_id: technicianId,
            })
            .toArray();

        return tasks;
    } catch (error) {
        throw new Error(`Failed to fetch technician tasks: ${error.message}`);
    }
}

/**
 * Approve leave request
 */
async function approveLeaveRequest(leaveRequestId, approvedBy) {
    try {
        const db = await connectToDatabase();
        const leaveRequestsCollection = db.collection('leave_requests');

        const leaveRequest = await leaveRequestsCollection.findOne({
            _id: new ObjectId(leaveRequestId),
        });

        if (!leaveRequest) {
            throw new Error('Leave request not found');
        }

        // Update leave request
        const result = await leaveRequestsCollection.updateOne(
            { _id: new ObjectId(leaveRequestId) },
            {
                $set: {
                    status: 'Approved',
                    approval_date: new Date(),
                    approved_by: approvedBy,
                },
            }
        );

        // Send approval email (non-blocking - don't wait for it)
        sendApprovalEmail(leaveRequest).catch(err => {
            console.error(`⚠️ Failed to send approval email: ${err.message}`);
        });

        return result;
    } catch (error) {
        throw new Error(`Failed to approve leave request: ${error.message}`);
    }
}

/**
 * Reject leave request
 */
async function rejectLeaveRequest(leaveRequestId, rejectionReason, approvedBy) {
    try {
        const db = await connectToDatabase();
        const leaveRequestsCollection = db.collection('leave_requests');

        const leaveRequest = await leaveRequestsCollection.findOne({
            _id: new ObjectId(leaveRequestId),
        });

        if (!leaveRequest) {
            throw new Error('Leave request not found');
        }

        // Update leave request
        const result = await leaveRequestsCollection.updateOne(
            { _id: new ObjectId(leaveRequestId) },
            {
                $set: {
                    status: 'Rejected',
                    approval_date: new Date(),
                    approved_by: approvedBy,
                    rejection_reason: rejectionReason,
                },
            }
        );

        // Send rejection email (non-blocking - don't wait for it)
        sendRejectionEmail(leaveRequest, rejectionReason).catch(err => {
            console.error(`⚠️ Failed to send rejection email: ${err.message}`);
        });

        return result;
    } catch (error) {
        throw new Error(`Failed to reject leave request: ${error.message}`);
    }
}

/**
 * Send approval email to technician
 */
async function sendApprovalEmail(leaveRequest) {
    try {
        const emailContent = `
            <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <h2 style="color: #2ecc71;">✅ Leave Request Approved</h2>
                
                <p>Dear <strong>${leaveRequest.technician_name}</strong>,</p>
                
                <p>Your leave request has been <strong style="color: #2ecc71;">APPROVED</strong> by the admin.</p>
                
                <div style="background-color: #f5f5f5; padding: 15px; border-left: 4px solid #2ecc71; margin: 20px 0;">
                    <p><strong>Leave Details:</strong></p>
                    <ul style="list-style: none; padding: 0;">
                        <li><strong>From:</strong> ${new Date(leaveRequest.from_date).toLocaleDateString()}</li>
                        <li><strong>To:</strong> ${new Date(leaveRequest.to_date).toLocaleDateString()}</li>
                        <li><strong>Number of Days:</strong> ${leaveRequest.number_of_days}</li>
                        <li><strong>Reason:</strong> ${leaveRequest.reason}</li>
                    </ul>
                </div>
                
                <p>You are now marked as unavailable for tasks during this period.</p>
                
                <p style="margin-top: 30px; color: #888; font-size: 12px;">
                    This is an automated message from Water Purifier Admin System.
                </p>
            </div>
        `;

        await transporter.sendMail({
            from: process.env.SMTP_EMAIL,
            to: leaveRequest.technician_email,
            subject: '✅ Your Leave Request Has Been Approved',
            html: emailContent,
        });

        console.log(`✅ Approval email sent to ${leaveRequest.technician_email}`);
    } catch (error) {
        console.error(`❌ Failed to send approval email: ${error.message}`);
        throw error;
    }
}

/**
 * Send rejection email to technician
 */
async function sendRejectionEmail(leaveRequest, rejectionReason) {
    try {
        const emailContent = `
            <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <h2 style="color: #e74c3c;">❌ Leave Request Rejected</h2>
                
                <p>Dear <strong>${leaveRequest.technician_name}</strong>,</p>
                
                <p>Your leave request has been <strong style="color: #e74c3c;">REJECTED</strong>.</p>
                
                <div style="background-color: #f5f5f5; padding: 15px; border-left: 4px solid #e74c3c; margin: 20px 0;">
                    <p><strong>Leave Details:</strong></p>
                    <ul style="list-style: none; padding: 0;">
                        <li><strong>From:</strong> ${new Date(leaveRequest.from_date).toLocaleDateString()}</li>
                        <li><strong>To:</strong> ${new Date(leaveRequest.to_date).toLocaleDateString()}</li>
                        <li><strong>Number of Days:</strong> ${leaveRequest.number_of_days}</li>
                        <li><strong>Reason:</strong> ${leaveRequest.reason}</li>
                        <li style="margin-top: 10px;"><strong>Rejection Reason:</strong> <span style="color: #e74c3c;">${rejectionReason}</span></li>
                    </ul>
                </div>
                
                <p>Please contact the admin for more information or to resubmit your leave request.</p>
                
                <p style="margin-top: 30px; color: #888; font-size: 12px;">
                    This is an automated message from Water Purifier Admin System.
                </p>
            </div>
        `;

        await transporter.sendMail({
            from: process.env.SMTP_EMAIL,
            to: leaveRequest.technician_email,
            subject: '❌ Your Leave Request Has Been Rejected',
            html: emailContent,
        });

        console.log(`✅ Rejection email sent to ${leaveRequest.technician_email}`);
    } catch (error) {
        console.error(`❌ Failed to send rejection email: ${error.message}`);
        throw error;
    }
}

/**
 * Get leave requests by seller's district
 */
async function getLeaveRequestsByDistrict(sellerDistrict) {
    try {
        const db = await connectToDatabase();
        const leaveRequestsCollection = db.collection('leave_requests');
        const usersCollection = db.collection('users');

        // Get all leave requests
        const leaveRequests = await leaveRequestsCollection
            .find({})
            .sort({ requested_date: -1 })
            .toArray();

        // Get unique technician IDs
        const technicianIds = [...new Set(leaveRequests.map(leave => leave.technician_id))];

        // Fetch technician details including district
        const technicians = await usersCollection
            .find({ technician_id: { $in: technicianIds } })
            .project({ technician_id: 1, district: 1, assigned_district: 1, name: 1, email: 1 })
            .toArray();

        // Create a map of technician_id to district
        const technicianMap = {};
        technicians.forEach(tech => {
            technicianMap[tech.technician_id] = {
                district: tech.district || tech.assigned_district,
                name: tech.name,
                email: tech.email
            };
        });

        // Filter leave requests by seller's district
        const filteredLeaveRequests = leaveRequests.filter(leave => {
            const techInfo = technicianMap[leave.technician_id];
            return techInfo && techInfo.district && 
                   techInfo.district.toLowerCase() === sellerDistrict.toLowerCase();
        });

        // Add technician info to each leave request
        const leaveRequestsWithTechInfo = filteredLeaveRequests.map(leave => ({
            ...leave,
            technician_district: technicianMap[leave.technician_id]?.district || null,
            technician_name: technicianMap[leave.technician_id]?.name || leave.technician_name || null,
            technician_email: technicianMap[leave.technician_id]?.email || leave.technician_email || null
        }));

        return leaveRequestsWithTechInfo;
    } catch (error) {
        throw new Error(`Failed to fetch leave requests by district: ${error.message}`);
    }
}

module.exports = {
    getAllLeaveRequests,
    getLeaveRequestById,
    getTechnicianPendingTasks,
    approveLeaveRequest,
    rejectLeaveRequest,
    sendApprovalEmail,
    sendRejectionEmail,
    getLeaveRequestsByDistrict,
};