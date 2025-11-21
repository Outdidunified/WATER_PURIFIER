//ManageCallRequest
import { useState, useEffect, useCallback, useRef } from 'react';
import CallRequestSearchService from '../../../../services/CallRequestSearchService';

const useManageCallRequests = (userInfo) => {
  const [posts, setPosts] = useState([]);
  const [filteredPosts, setFilteredPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const debouncedSearchRef = useRef(null);

  // Perform server-side search
  const performSearch = useCallback(async (term, page = 1, limit = 10) => {
    setLoading(true);
    setError(null);
    try {
      const result = await CallRequestSearchService.performSearch(term, page, limit);
      setPosts(result.data);
      setFilteredPosts(result.data);
      setCurrentPage(result.pagination.currentPage);
      setPageSize(result.pagination.pageSize);
      setTotalRecords(result.totalCount);
      setTotalPages(Math.ceil(result.totalCount / limit) || 1);
    } catch (err) {
      setError('Error fetching call requests. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    performSearch(searchTerm, newPage, pageSize);
  };

  const handlePageSizeChange = (newSize) => {
    setPageSize(newSize);
    setCurrentPage(1);
    performSearch(searchTerm, 1, newSize);
  };

  useEffect(() => {
    performSearch(searchTerm, currentPage, pageSize);
  }, []);

  const handleSearchInputChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    setCurrentPage(1);
    
    if (!debouncedSearchRef.current) {
      debouncedSearchRef.current = CallRequestSearchService.debounceSearch(performSearch, 300);
    }
    
    debouncedSearchRef.current(value, 1, pageSize);
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
