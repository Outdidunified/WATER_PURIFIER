import { useState, useEffect } from 'react';
import { showErrorAlert } from '../../../../utils/alert';
import axiosInstance from '../../../../utils/utils';

const ManageLeaveHooks = () => {
    const [leaveRequests, setLeaveRequests] = useState([]);
    const [filteredLeaves, setFilteredLeaves] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedFilter, setSelectedFilter] = useState('');
    const [summary, setSummary] = useState({
        total: 0,
        requested: 0,
        approved: 0,
        rejected: 0,
    });

    const calculateLeaveSummary = (leaves) => {
        const counts = {
            total: leaves.length,
            requested: 0,
            approved: 0,
            rejected: 0,
        };

        leaves.forEach((leave) => {
            const status = (leave.status || '').toLowerCase().trim();
            if (status === 'requested') counts.requested += 1;
            else if (status === 'approved') counts.approved += 1;
            else if (status === 'rejected') counts.rejected += 1;
        });

        return counts;
    };

    const fetchLeaveRequests = async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await axiosInstance.get('/api/admin/leave-requests');

            if (response.data.success) {
                const leaves = response.data.data;
                setLeaveRequests(leaves);
                setFilteredLeaves(leaves);
                setSummary(calculateLeaveSummary(leaves));
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

    // Fetch all leave requests
    useEffect(() => {
        fetchLeaveRequests();
    }, []);

    const applyFilters = (filterType, search) => {
        let filtered = leaveRequests;

        if (filterType === 'requested') {
            filtered = filtered.filter(
                (leave) => (leave.status || '').toLowerCase() === 'requested'
            );
        } else if (filterType === 'approved') {
            filtered = filtered.filter(
                (leave) => (leave.status || '').toLowerCase() === 'approved'
            );
        } else if (filterType === 'rejected') {
            filtered = filtered.filter(
                (leave) => (leave.status || '').toLowerCase() === 'rejected'
            );
        }

        if (search.trim()) {
            const searchLower = search.toLowerCase();
            filtered = filtered.filter((leave) =>
                (leave.technician_name && leave.technician_name.toLowerCase().includes(searchLower)) ||
                (leave.technician_id && leave.technician_id.toLowerCase().includes(searchLower)) ||
                (leave.technician_email && leave.technician_email.toLowerCase().includes(searchLower))
            );
        }

        setFilteredLeaves(filtered);
    };

    // Filter leaves by search term and status
    useEffect(() => {
        applyFilters(selectedFilter, searchTerm);
    }, [searchTerm, leaveRequests, selectedFilter]);

    const handleFilterSelect = (filterType) => {
        if (selectedFilter === filterType) {
            setSelectedFilter('');
            applyFilters('', searchTerm);
        } else {
            setSelectedFilter(filterType);
            applyFilters(filterType, searchTerm);
        }
    };

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
        selectedFilter,
        summary,
        fetchLeaveRequests,
        handleFilterSelect,
        getStatusBadgeColor,
        getStatusBadgeClass,
    };
};

export default ManageLeaveHooks;