//ManageContact
import { useState, useEffect, useCallback } from 'react';
import axiosInstance from '../../../../utils/utils';

const useManageContact = (userInfo) => {
  const [contacts, setContacts] = useState([]);
  const [filteredContacts, setFilteredContacts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const fetchContacts = useCallback(async (pageNum = 1, pageLimit = 10) => {
    setLoading(true);
    setError(null);
    try {
      const isSeller = userInfo && Number(userInfo?.role_id) === 4;
      const url = isSeller ? '/api/admin/FetchContact/by-district' : '/api/admin/FetchContact';
      const payload = { page: pageNum, limit: pageLimit, ...(isSeller && { district: userInfo?.district }) };
      const config = isSeller ? { params: { district: userInfo?.district, page: pageNum, limit: pageLimit } } : {};
      const response = isSeller
        ? await axiosInstance.get(url, config)
        : await axiosInstance.post(url, payload);
      if (response.status === 200 && response.data.status === 'Success') {
        const data = response.data.data || [];
        const pagination = response.data.pagination || {};
        setContacts(data);
        setFilteredContacts(data);
        setCurrentPage(pagination.currentPage || pageNum);
        setPageSize(pagination.pageSize || pageLimit);
        setTotalRecords(pagination.totalRecords || 0);
        setTotalPages(pagination.totalPages || 0);
      } else {
        setError('Failed to fetch contacts');
      }
    } catch (err) {
      setError('Error fetching contacts. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [userInfo]);

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    fetchContacts(newPage, pageSize);
  };

  const handlePageSizeChange = (newSize) => {
    setPageSize(newSize);
    setCurrentPage(1);
    fetchContacts(1, newSize);
  };

  useEffect(() => {
    fetchContacts(currentPage, pageSize);
  }, [fetchContacts, currentPage, pageSize]);

  const handleSearchInputChange = (e) => {
    const searchTerm = e.target.value.toLowerCase();
    const filtered = contacts.filter(contact =>
      contact.name?.toLowerCase().includes(searchTerm)
    );
    setFilteredContacts(filtered);
  };

  return {
    contacts: filteredContacts,
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

export default useManageContact;
