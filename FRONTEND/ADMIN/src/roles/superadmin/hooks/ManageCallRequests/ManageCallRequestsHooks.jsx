//ManageCallRequest
import { useState, useEffect, useCallback } from 'react';
import axiosInstance from '../../../../utils/utils';

const useManageCallRequests = (userInfo) => {
  const [posts, setPosts] = useState([]);
  const [filteredPosts, setFilteredPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Fetch call requests
  const fetchCallRequests = useCallback(async (pageNum = 1, pageLimit = 10) => {
    setLoading(true);
    setError(null);
    try {
      const isSeller = userInfo && Number(userInfo?.role_id) === 4;
      const url = isSeller ? '/api/admin/FetchCallRequest/by-district' : '/api/admin/FetchCallRequest';
      const payload = { page: pageNum, limit: pageLimit, ...(isSeller && { district: userInfo?.district }) };
      const config = isSeller ? { params: { district: userInfo?.district, page: pageNum, limit: pageLimit } } : {};
      const response = isSeller
        ? await axiosInstance.get(url, config)
        : await axiosInstance.post(url, payload);
      if (response.status === 200 && response.data.status === 'Success') {
        const data = response.data.data || [];
        const pagination = response.data.pagination || {};
        setPosts(data);
        setFilteredPosts(data);
        setCurrentPage(pagination.currentPage || pageNum);
        setPageSize(pagination.pageSize || pageLimit);
        setTotalRecords(pagination.totalRecords || 0);
        setTotalPages(pagination.totalPages || 0);
      } else {
        setError('Failed to fetch call requests');
      }
    } catch (err) {
      setError('Error fetching call requests. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [userInfo]);

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    fetchCallRequests(newPage, pageSize);
  };

  const handlePageSizeChange = (newSize) => {
    setPageSize(newSize);
    setCurrentPage(1);
    fetchCallRequests(1, newSize);
  };

  useEffect(() => {
    fetchCallRequests(currentPage, pageSize);
  }, [fetchCallRequests, currentPage, pageSize]);

  const handleSearchInputChange = (e) => {
    const searchTerm = e.target.value.toLowerCase();
    const filtered = posts.filter(post =>
      post.name?.toLowerCase().includes(searchTerm) ||
      post.phone?.includes(searchTerm) ||
      post.city?.toLowerCase().includes(searchTerm)
    );
    setFilteredPosts(filtered);
  };

  return {
    posts: filteredPosts,
    loading,
    error,
    handleSearchInputChange,
    currentPage,
    pageSize,
    totalRecords,
    totalPages,
    handlePageChange,
    handlePageSizeChange,
  };
};

export default useManageCallRequests;
