//ManageProduct
import { useState, useEffect, useRef } from 'react';
import axiosInstance from '../../../../utils/utils';

const useManageProducts = (userInfo) => {
  const [data, setData] = useState([]);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedModel, setSelectedModel] = useState('');
  const fetchDataCalled = useRef(false);

  // Fetch product model data
  useEffect(() => {
    if (!fetchDataCalled.current) {
      const isSeller = userInfo && Number(userInfo?.role_id) === 4;
      const url = isSeller ? 'api/admin/FetchProductModels/by-district' : 'api/admin/FetchProductModels';
      const config = isSeller ? { params: { district: userInfo?.district } } : {};
      
      const fetchMethod = isSeller ? 'get' : 'Post';
      axiosInstance({
        method: fetchMethod,
        url: url,
        ...(isSeller && { params: config.params })
      })
        .then((res) => {
          const responseData = Array.isArray(res.data.data) ? [...res.data.data].reverse() : [];
          setData(responseData);
          setPosts(responseData);
          setLoading(false);
        })
        .catch((err) => {
          console.error('Error fetching product models:', err);
          setError('Error fetching product models. Please try again.');
          setLoading(false);
        });
      fetchDataCalled.current = true;
    }
  }, [userInfo]);

  // Update posts if data, search term, or selected model changes
  useEffect(() => {
    if (Array.isArray(data)) {
      const normalizedSearch = searchTerm.trim().toUpperCase();
      const filtered = data.filter((item) => {
        const name = (item.model_name || '').trim().toUpperCase();
        const type = (item.model_type || '').trim().toUpperCase();
        const matchesSearch = normalizedSearch.length === 0 || name.includes(normalizedSearch) || type.includes(normalizedSearch);
        const matchesModel = !selectedModel || name === selectedModel.trim().toUpperCase();
        return matchesSearch && matchesModel;
      });
      setPosts(filtered);
    } else {
      setPosts([]);
    }
  }, [data, searchTerm, selectedModel]);

  const handleSearchInputChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleModelSelect = (value) => {
    setSelectedModel(value);
  };

  const resetModelFilter = () => {
    setSelectedModel('');
  };

  const totalModels = Array.isArray(data) ? data.length : 0;

  const modelOptions = Array.isArray(data)
    ? Array.from(new Set(data.map((item) => item.model_name?.trim()).filter((name) => name))).sort((a, b) => a.localeCompare(b))
    : [];

  const selectedModelInfo = (() => {
    if (!selectedModel || !Array.isArray(data)) {
      return { quantity: 0, entries: 0 };
    }
    const matchingItems = data.filter((item) => ((item.model_name || '').trim().toUpperCase()) === selectedModel.trim().toUpperCase());
    const totalQuantity = matchingItems.reduce((sum, item) => sum + (Number(item.wp_device_quantity) || 0), 0);
    return { quantity: totalQuantity, entries: matchingItems.length };
  })();

  return {
    data,
    posts,
    loading,
    error,
    handleSearchInputChange,
    handleModelSelect,
    resetModelFilter,
    modelOptions,
    selectedModel,
    selectedModelInfo,
    totalModels,
    fetchDataCalled,
  };
};

export default useManageProducts;
