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
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalRecords, setTotalRecords] = useState(0);
  const fetchDataCalled = useRef(false);

  const fetchProductModels = (pageNum = 1, pageLimit = 10) => {
    const isSeller = userInfo && Number(userInfo?.role_id) === 4;
    const url = isSeller ? '/api/admin/FetchProductModels/by-district' : '/api/admin/FetchProductModels';
    
    setLoading(true);
    const fetchMethod = isSeller ? 'get' : 'post';
    axiosInstance({
      method: fetchMethod,
      url: url,
      ...(isSeller ? { params: { district: userInfo?.district, page: pageNum, limit: pageLimit } } : { data: { page: pageNum, limit: pageLimit } })
    })
      .then((res) => {
        const responseData = Array.isArray(res.data.data) ? [...res.data.data]: [];
        setData(responseData);
        setPosts(responseData);
        
        if (res.data.pagination) {
          setCurrentPage(res.data.pagination.currentPage);
          setPageSize(res.data.pagination.pageSize);
          setTotalRecords(res.data.pagination.totalRecords);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching product models:', err);
        setError('Error fetching product models. Please try again.');
        setLoading(false);
      });
  };

  useEffect(() => {
    if (!fetchDataCalled.current) {
      fetchProductModels();
      fetchDataCalled.current = true;
    }
  }, [userInfo]);

  useEffect(() => {
    if (Array.isArray(data)) {
      setPosts(data);
    } else {
      setPosts([]);
    }
  }, [data]);

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
    ? Array.from(new Set(data.map((item) => item.model_name?.trim()).filter((name) => name)))
    : [];

  const selectedModelInfo = (() => {
    if (!selectedModel || !Array.isArray(data)) {
      return { quantity: 0, entries: 0 };
    }
    const matchingItems = data.filter((item) => ((item.model_name || '').trim().toUpperCase()) === selectedModel.trim().toUpperCase());
    const totalQuantity = matchingItems.reduce((sum, item) => sum + (Number(item.wp_device_quantity) || 0), 0);
    return { quantity: totalQuantity, entries: matchingItems.length };
  })();

  const getPaginatedData = () => {
    return posts;
  };

  const getTotalPages = () => {
    return Math.ceil(totalRecords / pageSize) || 1;
  };

  const handlePageChange = (newPage) => {
    const maxPages = Math.ceil(totalRecords / pageSize) || 1;
    if (newPage >= 1 && newPage <= maxPages) {
      fetchProductModels(newPage, pageSize);
    }
  };

  const handlePageSizeChange = (newSize) => {
    setPageSize(newSize);
    fetchProductModels(1, newSize);
  };

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
    currentPage,
    pageSize,
    totalRecords,
    getPaginatedData,
    getTotalPages,
    handlePageChange,
    handlePageSizeChange,
  };
};

export default useManageProducts;
