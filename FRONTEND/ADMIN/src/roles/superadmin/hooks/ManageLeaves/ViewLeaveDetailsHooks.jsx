import { useState, useEffect } from 'react';
import { showErrorAlert, showSuccessAlert } from '../../../../utils/alert';
import axiosInstance from '../../../../utils/utils';

const ViewLeaveDetailsHooks = (leaveRequestId, leaveFromState) => {
    const [leaveDetails, setLeaveDetails] = useState(null);
    const [pendingTasks, setPendingTasks] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [actionLoading, setActionLoading] = useState(false);
    const [rejectionReason, setRejectionReason] = useState('');
    const [actionError, setActionError] = useState(null);
    const adminName = sessionStorage.getItem('superAdminName') || 'Admin';

    // Fetch leave request details
    useEffect(() => {
        // If data is passed from state, use it directly
        if (leaveFromState) {
            setLeaveDetails(leaveFromState);
            setLoading(false);
            // Fetch tasks from API
            if (leaveRequestId) {
                fetchTasksFromAPI();
            }
        } else if (leaveRequestId) {
            // Otherwise fetch from API
            fetchLeaveDetails();
        } else {
            setError('No leave request ID provided');
        }
    }, [leaveRequestId, leaveFromState]);

    const fetchLeaveDetails = async () => {
        try {
            setLoading(true);
            setError(null);

            const token = sessionStorage.getItem('superAdminToken');
            const response = await fetch(`/api/api/admin/leave-requests/${leaveRequestId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token && { 'Authorization': `Bearer ${token}` }),
                },
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `HTTP ${response.status}: Failed to fetch leave details`);
            }

            const data = await response.json();

            if (data.success) {
                setLeaveDetails(data.data.leaveRequest);
                setPendingTasks(data.data.pendingTasks);
            } else {
                showErrorAlert('Error', data.message || 'Failed to fetch leave details');
            }
        } catch (err) {
            console.error('Error fetching leave details:', err);
            const errorMsg = err.message || 'Failed to fetch leave details';
            setError(errorMsg);
            showErrorAlert('Error', errorMsg);
        } finally {
            setLoading(false);
        }
    };

    // Fetch only tasks from API (when details are passed from state)
    const fetchTasksFromAPI = async () => {
        try {
            const token = sessionStorage.getItem('superAdminToken');
            const response = await fetch(`/api/api/admin/leave-requests/${leaveRequestId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token && { 'Authorization': `Bearer ${token}` }),
                },
            });

            if (!response.ok) {
                console.warn(`Failed to fetch tasks: HTTP ${response.status}`);
                return;
            }

            const data = await response.json();

            if (data.success && data.data.pendingTasks) {
                setPendingTasks(data.data.pendingTasks);
            }
        } catch (err) {
            console.error('Error fetching tasks:', err);
        }
    };

    const approveLeave = async () => {
        try {
            setActionLoading(true);
            setActionError(null);

            const token = sessionStorage.getItem('superAdminToken');
            const response = await fetch(`/api/api/admin/leave-requests/${leaveRequestId}/approve`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token && { 'Authorization': `Bearer ${token}` }),
                },
                body: JSON.stringify({ approvedBy: adminName }),
            });

            console.log('Approve Leave Response Status:', response.status);

            if (!response.ok) {
                try {
                    const errorData = await response.json();
                    throw new Error(errorData.message || `HTTP ${response.status}: Failed to approve leave`);
                } catch (parseErr) {
                    throw new Error(`HTTP ${response.status}: Failed to approve leave`);
                }
            }

            let data;
            try {
                data = await response.json();
            } catch (parseErr) {
                console.warn('Could not parse response as JSON, assuming success');
                // If response is ok but can't parse, assume it worked
                setLeaveDetails((prev) => ({
                    ...prev,
                    status: 'Approved',
                    approval_date: new Date(),
                    approved_by: adminName,
                }));
                showSuccessAlert('Success', 'Leave approved successfully');
                return { success: true, message: 'Leave approved successfully' };
            }

            console.log('Approve Leave Response Data:', data);

            if (data.success || response.status === 200) {
                setLeaveDetails((prev) => ({
                    ...prev,
                    status: 'Approved',
                    approval_date: new Date(),
                    approved_by: adminName,
                }));
                showSuccessAlert('Success', 'Leave approved successfully');
                return { success: true, message: 'Leave approved successfully' };
            } else {
                const errorMsg = data.message || 'Failed to approve leave';
                setActionError(errorMsg);
                showErrorAlert('Error', errorMsg);
                return { success: false, message: errorMsg };
            }
        } catch (err) {
            console.error('Error approving leave:', err);
            const errorMsg = err.message || 'Failed to approve leave';
            setActionError(errorMsg);
            showErrorAlert('Error', errorMsg);
            return { success: false, message: errorMsg };
        } finally {
            setActionLoading(false);
        }
    };

    const rejectLeave = async () => {
        if (!rejectionReason.trim()) {
            setActionError('Please provide a rejection reason');
            showErrorAlert('Error', 'Rejection reason is required');
            return { success: false, message: 'Rejection reason is required' };
        }

        try {
            setActionLoading(true);
            setActionError(null);

            const token = sessionStorage.getItem('superAdminToken');
            const response = await fetch(`/api/api/admin/leave-requests/${leaveRequestId}/reject`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token && { 'Authorization': `Bearer ${token}` }),
                },
                body: JSON.stringify({
                    rejectionReason: rejectionReason,
                    approvedBy: adminName,
                }),
            });

            console.log('Reject Leave Response Status:', response.status);

            if (!response.ok) {
                try {
                    const errorData = await response.json();
                    throw new Error(errorData.message || `HTTP ${response.status}: Failed to reject leave`);
                } catch (parseErr) {
                    throw new Error(`HTTP ${response.status}: Failed to reject leave`);
                }
            }

            let data;
            try {
                data = await response.json();
            } catch (parseErr) {
                console.warn('Could not parse response as JSON, assuming success');
                // If response is ok but can't parse, assume it worked
                setLeaveDetails((prev) => ({
                    ...prev,
                    status: 'Rejected',
                    approval_date: new Date(),
                    approved_by: adminName,
                    rejection_reason: rejectionReason,
                }));
                setRejectionReason('');
                showSuccessAlert('Success', 'Leave rejected successfully');
                return { success: true, message: 'Leave rejected successfully' };
            }

            console.log('Reject Leave Response Data:', data);

            if (data.success || response.status === 200) {
                setLeaveDetails((prev) => ({
                    ...prev,
                    status: 'Rejected',
                    approval_date: new Date(),
                    approved_by: adminName,
                    rejection_reason: rejectionReason,
                }));
                setRejectionReason('');
                showSuccessAlert('Success', 'Leave rejected successfully');
                return { success: true, message: 'Leave rejected successfully' };
            } else {
                const errorMsg = data.message || 'Failed to reject leave';
                setActionError(errorMsg);
                showErrorAlert('Error', errorMsg);
                return { success: false, message: errorMsg };
            }
        } catch (err) {
            console.error('Error rejecting leave:', err);
            const errorMsg = err.message || 'Failed to reject leave';
            setActionError(errorMsg);
            showErrorAlert('Error', errorMsg);
            return { success: false, message: errorMsg };
        } finally {
            setActionLoading(false);
        }
    };

    const getTasksCount = () => {
        // Count tasks by actual status values from API
        const statusCounts = {};
        
        pendingTasks.forEach((task) => {
            const status = task.status || 'Unknown';
            statusCounts[status] = (statusCounts[status] || 0) + 1;
        });
        
        return statusCounts;
    };

    return {
        leaveDetails,
        pendingTasks,
        loading,
        error,
        actionLoading,
        actionError,
        rejectionReason,
        setRejectionReason,
        approveLeave,
        rejectLeave,
        getTasksCount,
        fetchLeaveDetails,
    };
};

export default ViewLeaveDetailsHooks;