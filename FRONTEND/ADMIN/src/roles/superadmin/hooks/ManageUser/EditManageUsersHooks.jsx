import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axiosInstance from '../../../../utils/utils';
import { showSuccessAlert, showErrorAlert } from '../../../../utils/alert';

const useEditManageUsers = (userInfo) => {
  const location = useLocation();
  const navigate = useNavigate();

  const storedData = localStorage.getItem('editUserData');
  const dataItem = location.state?.user || location.state?.dataItem || (storedData ? JSON.parse(storedData) : null);

  useEffect(() => {
    if (dataItem) localStorage.setItem('editUserData', JSON.stringify(dataItem));
  }, [dataItem]);

  const [errorMessage, setErrorMessage] = useState('');
  const [selectStatus, setSelectedStatus] = useState(dataItem?.status ? 'true' : 'false');
  const [isloading, setIsLoading] = useState(false);

  const [name, setName] = useState(dataItem?.name || '');
  const [email, setEmail] = useState(dataItem?.email || '');
  const [password, setPassword] = useState(dataItem?.password || '');
  const [phone, setPhone] = useState(dataItem?.phone || '');
  const [city, setCity] = useState(dataItem?.city || '');
  const [addressline1, setAddressLine1] = useState(dataItem?.addressline1 || '');
  const [addressline2, setAddressLine2] = useState(dataItem?.addressline2 || '');
  const [district, setDistrict] = useState(dataItem?.district || '');
  const [state, setState] = useState(dataItem?.state || '');
  const [country, setCountry] = useState(dataItem?.country || '');
  const [pincode, setPincode] = useState(dataItem?.pincode || '');

  const [initialValues] = useState({
    password: dataItem?.password || '',
    phone: dataItem?.phone || '',
    status: dataItem?.status ? 'true' : 'false',
    city: dataItem?.city || '',
    addressline1: dataItem?.addressline1 || '',
    addressline2: dataItem?.addressline2 || '',
    district: dataItem?.district || '',
    state: dataItem?.state || '',
    country: dataItem?.country || '',
    pincode: dataItem?.pincode || ''
  });

  const isModified =
    String(password) !== String(initialValues.password) ||
    String(phone) !== String(initialValues.phone) ||
    selectStatus !== initialValues.status ||
    String(city).trim() !== String(initialValues.city).trim() ||
    String(addressline1).trim() !== String(initialValues.addressline1).trim() ||
    String(addressline2).trim() !== String(initialValues.addressline2).trim() ||
    String(district).trim() !== String(initialValues.district).trim() ||
    String(state).trim() !== String(initialValues.state).trim() ||
    String(country).trim() !== String(initialValues.country).trim() ||
    String(pincode).trim() !== String(initialValues.pincode).trim();

  const handleStatusChange = (e) => setSelectedStatus(e.target.value);

  const backManageUser = () => navigate('/superadmin/ManageUsers');

  const editManageUser = async (e) => {
    e.preventDefault();

    if (!phone || !/^\d{10}$/.test(phone)) return setErrorMessage('Phone must be 10 digits');
    if (!password || !/^\d{4}$/.test(password)) return setErrorMessage('Password must be 4 digits');
    if (!pincode || !/^\d{6}$/.test(pincode)) return setErrorMessage('Pincode must be 6 digits');

    try {
      setIsLoading(true);
      const updatedUser = {
        user_id: dataItem.user_id,
        role_id: dataItem.role_id,
        name,
        email,
        password: parseInt(password),
        phone: parseInt(phone),
        city,
        addressline1,
        addressline2,
        district,
        state,
        country,
        pincode,
        modifiedBy: userInfo.email,
        status: selectStatus === 'true'
      };

      const response = await axiosInstance.post('/api/admin/UpdateUsers', updatedUser);

      if (response.status === 200) {
        // Update the localStorage data with the new modifiedby
        const updatedDataItem = { ...dataItem, modifiedby: userInfo.email };
        localStorage.setItem('editUserData', JSON.stringify(updatedDataItem));
        showSuccessAlert('User updated successfully');
        backManageUser();
      } else {
        showErrorAlert('Error', response.data?.message || 'Failed to update user');
      }
    } catch (error) {
      showErrorAlert('Error', 'An error occurred while updating the user');
    } finally {
      setIsLoading(false);
    }
  };

  return {
    dataItem,
    errorMessage, setErrorMessage,
    selectStatus, setSelectedStatus,
    name, setName,
    email, setEmail,
    password, setPassword,
    phone, setPhone,
    city, setCity,
    addressline1, setAddressLine1,
    addressline2, setAddressLine2,
    district, setDistrict,
    state, setState,
    country, setCountry,
    pincode, setPincode,
    initialValues,
    isModified,
    handleStatusChange,
    backManageUser,
    editManageUser,
    isloading
  };
};

export default useEditManageUsers;
