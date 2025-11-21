//ManageProduct
import { useState, useEffect, useRef } from 'react';
import ProductSearchService from '../../../../services/ProductSearchService';

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
  const debouncedSearchRef = useRef(null);

  const performSearch = async (term, page = 1, limit = 10) => {
    setLoading(true);
    try {
      const result = await ProductSearchService.performSearch(term, page, limit);
      setData(result.data);
      setPosts(result.data);
      setCurrentPage(result.pagination.currentPage);
      setPageSize(result.pagination.pageSize);
      setTotalRecords(result.totalCount);
      setError(null);
    } catch (err) {
      console.error('Error performing search:', err);
      setError('Error fetching data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!fetchDataCalled.current) {
      performSearch('', 1, 10);
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
    const value = e.target.value;
    setSearchTerm(value);
    setCurrentPage(1);
    
    if (!debouncedSearchRef.current) {
      debouncedSearchRef.current = ProductSearchService.debounceSearch(performSearch, 300);
    }
    
    debouncedSearchRef.current(value, 1, pageSize);
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
      performSearch(searchTerm, newPage, pageSize);
    }
  };

  const handlePageSizeChange = (newSize) => {
    setPageSize(newSize);
    performSearch(searchTerm, 1, newSize);
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
