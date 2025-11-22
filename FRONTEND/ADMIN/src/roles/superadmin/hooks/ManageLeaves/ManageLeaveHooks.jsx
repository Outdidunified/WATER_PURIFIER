import { useState, useEffect, useCallback } from 'react';
import { showErrorAlert } from '../../../../utils/alert';
import axiosInstance from '../../../../utils/utils';

const ManageLeaveHooks = (userInfo) => {
    const [leaveRequests, setLeaveRequests] = useState([]);
    const [filteredLeaves, setFilteredLeaves] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedFilter, setSelectedFilter] = useState('');
    const [leaveCounts, setLeaveCounts] = useState({
        totalLeaves: 0,
        pending: 0,
        approved: 0,
        rejected: 0
    });
    const [summary, setSummary] = useState({
        total: 0,
        requested: 0,
        approved: 0,
        rejected: 0,
    });
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [totalRecords, setTotalRecords] = useState(0);
    const [totalPages, setTotalPages] = useState(0);

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

    const fetchLeaveCounts = useCallback(async () => {
        try {
            const isSeller = Number(userInfo?.role_id) === 4;
            const params = isSeller ? { district: userInfo?.district } : {};
            const res = await axiosInstance.get('/api/admin/leave-requests/counts', { params });
            if (res.data.status === 'Success') {
                setLeaveCounts(res.data.data);
            }
        } catch (err) {
            console.error('Error fetching leave counts:', err);
        }
    }, [userInfo]);

    const fetchLeaveRequests = useCallback(async (pageNum = 1, pageLimit = 10) => {
        try {
            setLoading(true);
            setError(null);

            const isSeller = Number(userInfo?.role_id) === 4;
            const endpoint = isSeller ? '/api/admin/leave-requests-by-district' : '/api/admin/leave-requests';
            const response = await axiosInstance.get(endpoint, { params: { page: pageNum, limit: pageLimit } });

            if (response.data.status === 'Success' || response.data.success !== false) {
                const leaves = response.data.data || [];
                const pagination = response.data.pagination || {};

                setLeaveRequests(leaves);
                setFilteredLeaves(leaves);
                setSummary(calculateLeaveSummary(leaves));
                setCurrentPage(pagination.currentPage || pageNum);
                setPageSize(pagination.pageSize || pageLimit);
                setTotalRecords(pagination.totalRecords || 0);
                setTotalPages(pagination.totalPages || 0);
                await fetchLeaveCounts();
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
    }, [userInfo, fetchLeaveCounts]);

    const handlePageChange = (newPage) => {
        setCurrentPage(newPage);
        fetchLeaveRequests(newPage, pageSize);
    };

    const handlePageSizeChange = (newSize) => {
        setPageSize(newSize);
        setCurrentPage(1);
        fetchLeaveRequests(1, newSize);
    };

    useEffect(() => {
        fetchLeaveRequests(currentPage, pageSize);
    }, [fetchLeaveRequests, currentPage, pageSize]);

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
        leaveCounts,
        summary,
        fetchLeaveRequests,
        handleFilterSelect,
        getStatusBadgeColor,
        getStatusBadgeClass,
        currentPage,
        pageSize,
        totalRecords,
        totalPages,
        handlePageChange,
        handlePageSizeChange,
    };
};

export default ManageLeaveHooks;
