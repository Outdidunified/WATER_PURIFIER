import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axiosInstance from '../../../../utils/utils';
import { showErrorAlert, showSuccessAlert } from '../../../../utils/alert';

const useEditManageSellers = (userInfo) => {
  const location = useLocation();
  const navigate = useNavigate();

  // get seller
  const storedData = localStorage.getItem('editSellerData');
  const dataItem = location.state?.seller || (storedData ? JSON.parse(storedData) : null);

  useEffect(() => {
    if (dataItem) {
      localStorage.setItem('editSellerData', JSON.stringify(dataItem));
    }
  }, [dataItem]);

  const [errorMessage, setErrorMessage] = useState('');
  const [isloading, setIsLoading] = useState(false);

  const [name] = useState(dataItem?.name || '');
  const [email] = useState(dataItem?.email || '');
  const [password, setPassword] = useState(dataItem?.password || '');
  const [phone, setPhone] = useState(dataItem?.phone || '');
  const [addressline1, setAddressline1] = useState(dataItem?.addressline1 || '');
  const [addressline2, setAddressline2] = useState(dataItem?.addressline2 || '');
  const [city, setCity] = useState(dataItem?.city || '');
  const [district, setDistrict] = useState(dataItem?.district || '');
  const [state, setStateVal] = useState(dataItem?.state || '');
  const [country, setCountry] = useState(dataItem?.country || '');
  const [pincode, setPincode] = useState(dataItem?.pincode || '');
  const [selectStatus, setSelectedStatus] = useState(dataItem?.status ? 'true' : 'false');

  const [initialValues] = useState({
    password: dataItem?.password || '',
    phone: dataItem?.phone || '',
    addressline1: dataItem?.addressline1 || '',
    addressline2: dataItem?.addressline2 || '',
    city: dataItem?.city || '',
    district: dataItem?.district || '',
    state: dataItem?.state || '',
    country: dataItem?.country || '',
    pincode: dataItem?.pincode || '',
    status: dataItem?.status ? 'true' : 'false',
  });

  const isModified =
    String(password) !== String(initialValues.password) ||
    String(phone) !== String(initialValues.phone) ||
    String(addressline1).trim() !== String(initialValues.addressline1).trim() ||
    String(addressline2).trim() !== String(initialValues.addressline2).trim() ||
    String(city).trim() !== String(initialValues.city).trim() ||
    String(district).trim() !== String(initialValues.district).trim() ||
    String(state).trim() !== String(initialValues.state).trim() ||
    String(country).trim() !== String(initialValues.country).trim() ||
    String(pincode).trim() !== String(initialValues.pincode).trim() ||
    selectStatus !== initialValues.status;

  const handleStatusChange = (e) => {
    setSelectedStatus(e.target.value);
  };

  const backManageSeller = () => {
    navigate('/superadmin/ManageSellers');
  };

  const editManageSeller = async (e) => {
    e.preventDefault();

    // validations
    if (!/^\d{10}$/.test(String(phone))) {
      setErrorMessage('Phone must be a 10-digit number.');
      return;
    }
    if (!/^\d{4}$/.test(String(password))) {
      setErrorMessage('Password must be a 4-digit number.');
      return;
    }

    const required = { addressline1, city, district, state, country, pincode };
    const missing = Object.entries(required).filter(([, v]) => !String(v).trim()).map(([k]) => k);
    if (missing.length) {
      setErrorMessage(`Missing required fields: ${missing.join(', ')}`);
      return;
    }

    try {
      setIsLoading(true);

      const payload = {
        user_id: dataItem.user_id,
        role_id: dataItem.role_id || 4,
        name,
        email,
        password: parseInt(password),
        phone: parseInt(phone),
        addressline1,
        addressline2,
        city,
        district,
        state,
        country,
        pincode,
        modifiedBy: userInfo?.email,
        status: selectStatus === 'true',
      };

      const response = await axiosInstance.post('/api/admin/UpdateUsers', payload);

      if (response.status === 200 && response.data?.status !== 'Failed') {
        showSuccessAlert('Success', 'Seller updated successfully');
        backManageSeller();
      } else {
        showErrorAlert('Error', 'Failed to update seller, ' + (response.data?.message || ''));
      }
    } catch (error) {
      showErrorAlert('Error', 'An error occurred while updating the seller');
    } finally {
      setIsLoading(false);
    }
  };

  const goBack = () => navigate(-1);

  return {
    dataItem,
    errorMessage, setErrorMessage,
    selectStatus, setSelectedStatus,
    name,
    email,
    password, setPassword,
    phone, setPhone,
    addressline1, setAddressline1,
    addressline2, setAddressline2,
    city, setCity,
    district, setDistrict,
    state, setStateVal,
    country, setCountry,
    pincode, setPincode,
    initialValues,
    isModified,
    handleStatusChange,
    backManageSeller,
    editManageSeller,
    goBack,
    isloading,
  };
};

export default useEditManageSellers;