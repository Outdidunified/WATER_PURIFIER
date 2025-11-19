//ManageCallRequest
import { useState, useEffect, useCallback } from 'react';
import axiosInstance from '../../../../utils/utils';

const useManageCallRequests = (userInfo) => {
  const [posts, setPosts] = useState([]);
  const [filteredPosts, setFilteredPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch call requests
  const fetchCallRequests = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const isSeller = userInfo && Number(userInfo?.role_id) === 4;
      const url = isSeller ? '/api/admin/FetchCallRequest/by-district' : '/api/admin/FetchCallRequest';
      const config = isSeller ? { params: { district: userInfo?.district } } : {};
      const response = isSeller
        ? await axiosInstance.get(url, config)
        : await axiosInstance.post(url);
      if (response.status === 200 && response.data.status === 'Success') {
        const data = response.data.data || [];
        setPosts(data);
        setFilteredPosts(data);
      } else {
        setError('Failed to fetch call requests');
      }
    } catch (err) {
      setError('Error fetching call requests. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [userInfo]);

  useEffect(() => {
    fetchCallRequests();
  }, [fetchCallRequests]);

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
  };
};

export default useManageCallRequests;
