import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../../../utils/utils';
import {
  showConfirmationAlert,
  showErrorAlert,
  showSuccessAlert
} from '../../../../utils/alert';

const useManageUsers = (userInfo) => {
  const navigate = useNavigate();
  const fetchUsersCalled = useRef(false);

  // Table data and state
  const [data, setData] = useState([]);
  const [posts, setPosts] = useState([]);
  const [tableLoading, setTableLoading] = useState(false);
  const [tableError, setTableError] = useState(null);

  // Add User modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const openAddModal = () => setIsAddModalOpen(true);
  const closeAddModal = () => {
    resetForm();
    setIsAddModalOpen(false);
  };

  // Add User form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState(3); // Default to EndUser
  const [address, setAddress] = useState('');
  const [addressline1, setAddressline1] = useState('');
  const [addressline2, setAddressline2] = useState('');
  const [city, setCity] = useState('');
  const [district, setDistrict] = useState('');
  const [stateField, setStateField] = useState('');
  const [pincode, setPincode] = useState('');
  const [country, setCountry] = useState(''); // <-- Added country

  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState(null);

  // Roles
  const [roles, setRoles] = useState([]);

  const fetchRoles = useCallback(async () => {
    try {
      const response = await axiosInstance.post('/api/admin/FetchUserRoles');
      if (response.status === 200 && response.data.status === 'Success') {
        const activeRoles = (response.data.data || []).filter(r => r.status === true);
        setRoles(activeRoles);
      } else {
        showErrorAlert('Error', 'Failed to fetch roles');
      }
    } catch (error) {
      console.error('Error fetching roles:', error);
      showErrorAlert('Error', 'Failed to fetch roles');
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    try {
      setTableLoading(true);
      setTableError(null);

      const response = await axiosInstance.post('api/admin/FetchUsers');

      if (response.status === 200 && response.data.status === 'Success') {
        const fetchedData = response.data.data || [];
        setData(fetchedData);
        setPosts(fetchedData);
      } else {
        setTableError('Failed to fetch users');
        setData([]);
        setPosts([]);
      }
    } catch (err) {
      console.error('Error fetching users:', err);
      setTableError('Error fetching users. Please try again.');
      setData([]);
      setPosts([]);
    } finally {
      setTableLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!fetchUsersCalled.current) {
      fetchUsers();
      fetchRoles(); // fetch roles once
      fetchUsersCalled.current = true;
    }
  }, [fetchUsers, fetchRoles]);

  const handleSearchInputChange = (e) => {
    const searchTerm = e.target.value.toUpperCase();
    const filtered = data.filter((item) =>
      item.name?.toUpperCase().includes(searchTerm) ||
      item.email?.toUpperCase().includes(searchTerm) ||
      item.phone?.toString().includes(searchTerm) ||
      item.city?.toUpperCase().includes(searchTerm) ||
      item.country?.toUpperCase().includes(searchTerm) // <-- include country in search
    );
    setPosts(filtered);
  };

  const handleViewUser = (dataItem) => {
    navigate('/superadmin/ViewManageUser', { state: { dataItem } });
  };

  const handleAddUserSubmit = async (e) => {
    e.preventDefault();

    try {
      setFormLoading(true);
      setFormError(null);

      const payload = {
        role_id: role,
        name,
        email,
        password,
        phone,
        createdby: userInfo.email,
        address,
        addressline1,
        addressline2,
        city,
        district,
        state: stateField,
        pincode,
        country // <-- added country here
      };

      const response = await axiosInstance.post('api/admin/AddUsers', payload);

      if (response.status === 200 && response.data.status === 'Success') {
        await fetchUsers();
        closeAddModal();
        resetForm();
        showSuccessAlert('Success', 'User added successfully');
        return { success: true };
      } else {
        const msg = response.data.message || 'Failed to add user';
        setFormError(msg);
        showErrorAlert('Error', msg);
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Error adding user. Please try again.';
      setFormError(msg);
      showErrorAlert('Error', msg);
    } finally {
      setFormLoading(false);
    }
  };

  const resetForm = () => {
    setName('');
    setEmail('');
    setPassword('');
    setPhone('');
    setRole(3);
    setAddress('');
    setAddressline1('');
    setAddressline2('');
    setCity('');
    setDistrict('');
    setStateField('');
    setPincode('');
    setCountry(''); // <-- reset country
  };

  return {
    posts,
    tableLoading,
    tableError,
    formLoading,
    formError,
    handleSearchInputChange,
    handleViewUser,
    openAddModal,
    closeAddModal,
    isAddModalOpen,
    name, setName,
    email, setEmail,
    password, setPassword,
    phone, setPhone,
    role, setRole,
    address, setAddress,
    addressline1, setAddressline1,
    addressline2, setAddressline2,
    city, setCity,
    district, setDistrict,
    stateField, setStateField,
    pincode, setPincode,
    country, setCountry, // <-- expose country
    handleAddUserSubmit,
    roles
  };
};

export default useManageUsers;
