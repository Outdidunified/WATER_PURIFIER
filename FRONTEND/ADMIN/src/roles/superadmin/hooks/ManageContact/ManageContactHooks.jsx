//ManageContact
import { useState, useEffect, useCallback } from 'react';
import axiosInstance from '../../../../utils/utils';

const useManageContact = () => {
  const [contacts, setContacts] = useState([]);
  const [filteredContacts, setFilteredContacts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchContacts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axiosInstance.post('/api/admin/FetchContact');
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
  }, []);

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
