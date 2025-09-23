//ManageCallRequest
import { useState, useEffect, useCallback } from 'react';
import axiosInstance from '../../../../utils/utils';

const useManageCallRequests = () => {
  const [posts, setPosts] = useState([]);
  const [filteredPosts, setFilteredPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch call requests
  const fetchCallRequests = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axiosInstance.post('/api/admin/FetchCallRequest');
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
  }, []);

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
