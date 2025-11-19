//ManageContact
import { useState, useEffect, useCallback } from 'react';
import axiosInstance from '../../../../utils/utils';

const useManageContact = (userInfo) => {
  const [contacts, setContacts] = useState([]);
  const [filteredContacts, setFilteredContacts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchContacts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const isSeller = userInfo && Number(userInfo?.role_id) === 4;
      const url = isSeller ? '/api/admin/FetchContact/by-district' : '/api/admin/FetchContact';
      const config = isSeller ? { params: { district: userInfo?.district } } : {};
      const response = isSeller
        ? await axiosInstance.get(url, config)
        : await axiosInstance.post(url);
      if (response.status === 200 && response.data.status === 'Success') {
        const data = response.data.data || [];
        setContacts(data);
        setFilteredContacts(data);
      } else {
        setError('Failed to fetch contacts');
      }
    } catch (err) {
      setError('Error fetching contacts. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [userInfo]);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

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
  };
};

export default useManageContact;
