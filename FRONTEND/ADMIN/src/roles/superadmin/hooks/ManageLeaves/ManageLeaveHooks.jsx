import { useState, useEffect } from 'react';
import { showErrorAlert, showSuccessAlert } from '../../../../utils/alert';
import axiosInstance from '../../../../utils/utils';

const ManageLeaveHooks = () => {
    const [leaveRequests, setLeaveRequests] = useState([]);
    const [filteredLeaves, setFilteredLeaves] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    // Fetch all leave requests
    useEffect(() => {
        fetchLeaveRequests();
    }, []);

    const fetchLeaveRequests = async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await axiosInstance.get('/api/admin/leave-requests');

            if (response.data.success) {
                setLeaveRequests(response.data.data);
                setFilteredLeaves(response.data.data);
            } else {
                showErrorAlert('Error', response.data.message || 'Failed to fetch leave requests');
            }
        } catch (err) {
            console.error('Error fetching leave requests:', err);
            const errorMsg = err.response?.data?.message || err.message || 'Failed to fetch leave requests';
            setError(errorMsg);
            showErrorAlert('Error', errorMsg);
        } finally {
            setLoading(false);
        }
    };

    // Filter leaves by search term
    useEffect(() => {
        const filtered = leaveRequests.filter(
            (leave) =>
                (leave.technician_name && leave.technician_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (leave.technician_id && leave.technician_id.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (leave.technician_email && leave.technician_email.toLowerCase().includes(searchTerm.toLowerCase()))
        );
        setFilteredLeaves(filtered);
    }, [searchTerm, leaveRequests]);

    const getStatusBadgeColor = (status) => {
        switch (status) {
            case 'Requested':
                return 'bg-yellow-100 text-yellow-800';
            case 'Approved':
                return 'bg-green-100 text-green-800';
            case 'Rejected':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    // Bootstrap badge classes for consistency with other manage pages
    const getStatusBadgeClass = (status) => {
        const normalizedStatus = status?.toLowerCase();
        if (normalizedStatus === 'requested') return 'badge-warning';
        if (normalizedStatus === 'approved') return 'badge-success';
        if (normalizedStatus === 'rejected') return 'badge-danger';
        return 'badge-secondary';
    };

    return {
        leaveRequests,
        filteredLeaves,
        loading,
        error,
        searchTerm,
        setSearchTerm,
        fetchLeaveRequests,
        getStatusBadgeColor,
        getStatusBadgeClass,
    };
};

export default ManageLeaveHooks;