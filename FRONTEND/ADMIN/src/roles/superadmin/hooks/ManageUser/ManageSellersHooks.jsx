import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../../../utils/utils';
import { showErrorAlert, showSuccessAlert } from '../../../../utils/alert';

// Hook to manage Sellers list, search, add, and navigation
const useManageSellers = (userInfo) => {
  const fetchCalled = useRef(false);
  const navigate = useNavigate();

  // Table state
  const [data, setData] = useState([]);
  const [posts, setPosts] = useState([]);
  const [tableLoading, setTableLoading] = useState(false);
  const [tableError, setTableError] = useState(null);

  // Add Seller modal + form state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const openAddModal = () => setIsAddModalOpen(true);
  const closeAddModal = () => {
    resetForm();
    setIsAddModalOpen(false);
  };

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState(''); // 4-digit
  const [phone, setPhone] = useState('');
  const [addressline1, setAddressline1] = useState('');
  const [addressline2, setAddressline2] = useState('');
  const [city, setCity] = useState('');
  const [district, setDistrict] = useState('');
  const [state, setStateVal] = useState('');
  const [country, setCountry] = useState('');
  const [pincode, setPincode] = useState('');

  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState(null);

  const fetchSellers = useCallback(async () => {
    try {
      setTableLoading(true);
      setTableError(null);
      const res = await axiosInstance.post('/api/admin/FetchSellers', {});
      if (res?.status === 200 && res?.data?.status === 'Success') {
        const rows = Array.isArray(res.data.data) ? res.data.data : [];
        setData(rows);
        setPosts(rows);
      } else {
        const msg = res?.data?.message || 'Failed to fetch sellers';
        setTableError(msg);
        setData([]);
        setPosts([]);
      }
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Error fetching sellers';
      setTableError(msg);
      setData([]);
      setPosts([]);
    } finally {
      setTableLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!fetchCalled.current) {
      fetchSellers();
      fetchCalled.current = true;
    }
  }, [fetchSellers]);

  const handleSearchInputChange = (e) => {
    const term = e.target.value.toUpperCase();
    const filtered = data.filter((item) =>
      item.name?.toUpperCase().includes(term) ||
      item.email?.toUpperCase().includes(term) ||
      String(item.phone || '').includes(term) ||
      item.city?.toUpperCase().includes(term) ||
      item.district?.toUpperCase().includes(term)
    );
    setPosts(filtered);
  };

  const handleViewSeller = (dataItem) => {
    navigate('/superadmin/ViewManageSeller', { state: { dataItem } });
  };

  const handleAddSellerSubmit = async (e) => {
    e.preventDefault();

    // Basic client validations
    if (!/^\d{4}$/.test(password)) {
      setFormError('Password must be exactly 4 digits');
      return;
    }
    if (!/^[1-9][0-9]{9}$/.test(String(phone))) {
      setFormError('Phone must be 10 digits and not start with 0');
      return;
    }

    try {
      setFormLoading(true);
      setFormError(null);

      const payload = {
        role_id: 4, // Seller
        name,
        email: String(email).toLowerCase(),
        password,
        phone,
        addressline1,
        addressline2,
        city,
        district,
        state: state,
        country,
        pincode,
        createdby: userInfo?.email || 'system',
      };

      const res = await axiosInstance.post('/api/admin/AddUsers', payload);
      if (res?.status === 200 && res?.data?.status === 'Success') {
        await fetchSellers();
        closeAddModal();
        resetForm();
        showSuccessAlert('Success', 'Seller added successfully');
        return { success: true };
      } else {
        const msg = res?.data?.message || 'Failed to add seller';
        setFormError(msg);
        showErrorAlert('Error', msg);
      }
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Error adding seller';
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
    setAddressline1('');
    setAddressline2('');
    setCity('');
    setDistrict('');
    setStateVal('');
    setCountry('');
    setPincode('');
  };

  return {
    // table
    posts,
    tableLoading,
    tableError,
    handleSearchInputChange,

    // add
    isAddModalOpen,
    openAddModal,
    closeAddModal,
    handleAddSellerSubmit,
    formLoading,
    formError,

    // view
    handleViewSeller,

    // fields
    name, setName,
    email, setEmail,
    password, setPassword,
    phone, setPhone,
    addressline1, setAddressline1,
    addressline2, setAddressline2,
    city, setCity,
    district, setDistrict,
    state, setStateVal,
    country, setCountry,
    pincode, setPincode,
  };
};

export default useManageSellers;