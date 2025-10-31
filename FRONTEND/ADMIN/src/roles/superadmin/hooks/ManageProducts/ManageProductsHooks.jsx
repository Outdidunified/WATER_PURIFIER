//ManageProduct
import { useState, useEffect, useRef } from 'react';
import { showErrorAlert, showSuccessAlert } from '../../../../utils/alert';
import axiosInstance from '../../../../utils/utils';

const useManageProducts = () => {
  const [data, setData] = useState([]);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const fetchDataCalled = useRef(false);

  // Fetch product model data
  useEffect(() => {
    if (!fetchDataCalled.current) {
      axiosInstance({
        method: 'Post',
        url: 'api/admin/FetchProductModels'
      })
        .then((res) => {
          setData(res.data.data);      // store full dataset
          setPosts(res.data.data);     // store display dataset
          setLoading(false);
        })
        .catch((err) => {
          console.error('Error fetching product models:', err);
          setError('Error fetching product models. Please try again.');
          setLoading(false);
        });
      fetchDataCalled.current = true;
    }
  }, []);

  // Update posts if data changes
  useEffect(() => {
    setPosts(data);
  }, [data]);

  // Search functionality by product model name
  const handleSearchInputChange = (e) => {
    const inputValue = e.target.value.toUpperCase();
    if (Array.isArray(data)) {
      const filtered = data.filter((item) => {
        const name = item.model_name?.toUpperCase() || '';
        const type = item.model_type?.toUpperCase() || '';
        return name.includes(inputValue) || type.includes(inputValue);
      });
      setPosts(filtered);
    }
  };

  return {
    data,
    posts,
    loading,
    error,
    handleSearchInputChange,
    fetchDataCalled,
  };
};

export default useManageProducts;
