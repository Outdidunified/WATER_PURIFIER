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
    const [assignmentHistoryMap, setAssignmentHistoryMap] = useState({});
    const [historyLoading, setHistoryLoading] = useState(false);
    const [historyError, setHistoryError] = useState(null);
    const adminName = sessionStorage.getItem('superAdminName') || 'Admin';

    const getTaskIdentifier = (task) => {
        if (!task || typeof task !== 'object') {
            return null;
        }
        if (task.task_id !== undefined && task.task_id !== null) {
            return String(task.task_id);
        }
        if (task.wp_device_id) {
            return String(task.wp_device_id);
        }
        if (task.device_id) {
            return String(task.device_id);
        }
        return null;
    };

    const buildHistoryParams = (task) => {
        if (!task || typeof task !== 'object') {
            return null;
        }
        if (task.task_id !== undefined && task.task_id !== null && !Number.isNaN(Number(task.task_id))) {
            return { task_id: task.task_id };
        }
        if (task.wp_device_id) {
            return { wp_device_id: task.wp_device_id };
        }
        if (task.device_id) {
            return { device_id: task.device_id };
        }
        return null;
    };

    const normalizePendingTaskPayload = (payload) => {
        if (!payload) {
            return { tasks: [], history: null };
        }
        if (Array.isArray(payload)) {
            return { tasks: payload, history: null };
        }
        if (typeof payload === 'object') {
            if (Array.isArray(payload.tasks)) {
                let history = null;
                if (payload.assignmentHistory && typeof payload.assignmentHistory === 'object' && payload.assignmentHistory !== null) {
                    history = payload.assignmentHistory;
                } else if (payload.assignment_history && typeof payload.assignment_history === 'object' && payload.assignment_history !== null) {
                    history = payload.assignment_history;
                } else if (payload.assignmentHistoryMap && typeof payload.assignmentHistoryMap === 'object' && payload.assignmentHistoryMap !== null) {
                    history = payload.assignmentHistoryMap;
                } else if (payload.assignment_history_map && typeof payload.assignment_history_map === 'object' && payload.assignment_history_map !== null) {
                    history = payload.assignment_history_map;
                }
                if (!history) {
                    const map = {};
                    payload.tasks.forEach((task) => {
                        const key = getTaskIdentifier(task);
                        if (!key) {
                            return;
                        }
                        const entries = Array.isArray(task.assignment_history) ? task.assignment_history : [];
                        if (!entries.length && !task.status && !task.pending_reason && !task.wp_device_id && !task.device_id) {
                            return;
                        }
                        map[key] = {
                            assignment_history: entries,
                            total_assignments: entries.length,
                            task_status: task.status,
                            pending_reason: task.pending_reason,
                            wp_device_id: task.wp_device_id,
                            device_id: task.device_id,
                        };
                    });
                    history = Object.keys(map).length ? map : null;
                }
                return { tasks: payload.tasks, history };
            }
            if (Array.isArray(payload.data)) {
                return { tasks: payload.data, history: null };
            }
            if (Array.isArray(payload.items)) {
                return { tasks: payload.items, history: null };
            }
        }
        return { tasks: [], history: null };
    };

    const fetchAssignmentHistory = async (params) => {
        if (!params) {
            return null;
        }
        try {
            const response = await axiosInstance.get('/api/admin/GetServiceAssignmentHistory', {
                params,
            });
            if (response.status === 200 && response.data?.status === 'Success') {
                return response.data.data;
            }
            return null;
        } catch (err) {
            return null;
        }
    };

    const loadAssignmentHistory = async (tasks) => {
        if (!Array.isArray(tasks) || tasks.length === 0) {
            setAssignmentHistoryMap({});
            setHistoryError(null);
            setHistoryLoading(false);
            return;
        }
        setHistoryLoading(true);
        setHistoryError(null);
        try {
            const results = await Promise.allSettled(tasks.map(async (task) => {
                const params = buildHistoryParams(task);
                const data = await fetchAssignmentHistory(params);
                return { key: getTaskIdentifier(task), data };
            }));
            const map = {};
            let hasRejection = false;
            for (const result of results) {
                if (result.status === 'fulfilled') {
                    const key = result.value?.key;
                    if (key) {
                        map[key] = result.value?.data || null;
                    }
                } else {
                    hasRejection = true;
                }
            }
            setAssignmentHistoryMap(map);
            if (hasRejection) {
                setHistoryError('Failed to fetch assignment history for some tasks');
            }
        } catch (err) {
            setAssignmentHistoryMap({});
            setHistoryError('Failed to fetch assignment history');
        } finally {
            setHistoryLoading(false);
        }
    };

    const applyTaskData = async (payload) => {
        const { tasks, history } = normalizePendingTaskPayload(payload);
        setPendingTasks(tasks);
        if (history) {
            setHistoryLoading(false);
            setHistoryError(null);
            setAssignmentHistoryMap(history);
            return;
        }
        await loadAssignmentHistory(tasks);
    };

    // Fetch leave request details
    useEffect(() => {
        // If data is passed from state, use it directly
        if (leaveFromState) {
            setLeaveDetails(leaveFromState);
            setLoading(false);

            if (leaveFromState?.pendingTasks) {
                applyTaskData(leaveFromState.pendingTasks);
            } else if (leaveFromState?.pending_tasks) {
                applyTaskData(leaveFromState.pending_tasks);
            } else if (leaveFromState?.tasks) {
                applyTaskData({
                    tasks: leaveFromState.tasks,
                    assignmentHistory: leaveFromState.assignmentHistory || leaveFromState.assignment_history || null,
                });
            } else if (leaveFromState?.technician_id || leaveFromState?.technician_email || leaveFromState?.user_id) {
                fetchTasksFromAPI({
                    technicianId: leaveFromState.technician_id,
                    technicianEmail: leaveFromState?.technician_email,
                    technicianUserId: leaveFromState?.technician_user_id || leaveFromState?.user_id,
                });
            } else {
                setPendingTasks([]);
                setAssignmentHistoryMap({});
                setHistoryLoading(false);
                setHistoryError(null);
            }
        } else if (leaveRequestId) {
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
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/leave-requests/${leaveRequestId}`, {
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
                const leaveRequest = data.data.leaveRequest;
                setLeaveDetails(leaveRequest);
                
                if (data.data.pendingTasks) {
                    await applyTaskData(data.data.pendingTasks);
                } else if (data.data.pending_tasks) {
                    await applyTaskData(data.data.pending_tasks);
                } else if (data.data.tasks) {
                    await applyTaskData({
                        tasks: data.data.tasks,
                        assignmentHistory: data.data.assignmentHistory || data.data.assignment_history || null,
                    });
                } else if (leaveRequest?.technician_id || leaveRequest?.technician_email || leaveRequest?.user_id) {
                    await fetchTasksFromAPI({
                        technicianId: leaveRequest.technician_id,
                        technicianEmail: leaveRequest?.technician_email,
                        technicianUserId: leaveRequest?.technician_user_id || leaveRequest?.user_id,
                    });
                } else {
                    setPendingTasks([]);
                    setAssignmentHistoryMap({});
                    setHistoryLoading(false);
                    setHistoryError(null);
                }
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
    // Uses same API endpoint as ViewManageUsersHooks for consistency
    const fetchTasksFromAPI = async ({ technicianId, technicianEmail, technicianUserId }) => {
        try {
            if (!technicianId && !technicianEmail && !technicianUserId) {
                console.warn('Technician identifiers not provided');
                return;
            }

            const payload = {
                email: technicianEmail || '',
                technician_id: technicianId || '',
            };

            if (technicianUserId) {
                payload.user_id = technicianUserId;
            }

            const tasksResponse = await axiosInstance.post('/api/admin/FetchTechnicianTasksByUserId', payload);

            if (tasksResponse.status === 200) {
                if (tasksResponse.data.status === 'Success') {
                    await applyTaskData(tasksResponse.data.data);
                } else {
                    setPendingTasks([]);
                    setAssignmentHistoryMap({});
                    setHistoryLoading(false);
                    setHistoryError(null);
                }
            } else {
                setPendingTasks([]);
                setAssignmentHistoryMap({});
                setHistoryLoading(false);
                setHistoryError(null);
            }
        } catch (err) {
            setPendingTasks([]);
            setAssignmentHistoryMap({});
            setHistoryLoading(false);
            setHistoryError(null);
        }
    };

    const approveLeave = async () => {
        try {
            setActionLoading(true);
            setActionError(null);

            const token = sessionStorage.getItem('superAdminToken');
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/leave-requests/${leaveRequestId}/approve`, {
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
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/leave-requests/${leaveRequestId}/reject`, {
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
        assignmentHistoryMap,
        historyLoading,
        historyError,
    };
};

export default ViewLeaveDetailsHooks;