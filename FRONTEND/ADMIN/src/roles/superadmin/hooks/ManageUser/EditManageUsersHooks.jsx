// useEditManageUsers.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axiosInstance from '../../../../utils/utils';
import { showSuccessAlert, showErrorAlert } from '../../../../utils/alert';

const useEditManageUsers = (userInfo) => {
  const location = useLocation();
  const navigate = useNavigate();

  // Get user data from location state or localStorage
  const storedData = localStorage.getItem('editDeviceData');
  const dataItem = location.state?.user || (storedData ? JSON.parse(storedData) : null);

  useEffect(() => {
    if (dataItem) {
      localStorage.setItem('editDeviceData', JSON.stringify(dataItem));
    }
  }, [dataItem]);

  const [errorMessage, setErrorMessage] = useState('');
  const [selectStatus, setSelectedStatus] = useState(dataItem?.status ? 'true' : 'false');
  const [isloading, setIsLoading] = useState(false);

  const [name, setName] = useState(dataItem?.name || '');
  const [email, setEmail] = useState(dataItem?.email || '');
  const [password, setPassword] = useState(dataItem?.password || '');
  const [phone, setPhone] = useState(dataItem?.phone || '');
  const [city, setCity] = useState(dataItem?.city || '');

  const [initialValues] = useState({
    password: dataItem?.password || '',
    phone: dataItem?.phone || '',
    status: dataItem?.status ? 'true' : 'false',
    city: dataItem?.city || ''
  });

  const isModified =
    String(password) !== String(initialValues.password) ||
    String(phone) !== String(initialValues.phone) ||
    selectStatus !== initialValues.status ||
    String(city).trim() !== String(initialValues.city).trim();

  const handleStatusChange = (e) => {
    setSelectedStatus(e.target.value);
  };

  const backManageUser = () => {
    navigate('/superadmin/ManageUsers');
  };

  const editManageUser = async (e) => {
    e.preventDefault();

    const phoneRegex = /^\d{10}$/;
    if (!phone) {
      setErrorMessage("Phone can't be empty.");
      return;
    }
    if (!phoneRegex.test(phone)) {
      setErrorMessage('Oops! Phone must be a 10-digit number.');
      return;
    }

    const passwordRegex = /^\d{4}$/;
    if (!password) {
      setErrorMessage("Password can't be empty.");
      return;
    }
    if (!passwordRegex.test(password)) {
      setErrorMessage('Oops! Password must be a 4-digit number.');
      return;
    }

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
        modifiedby: userInfo.email,
        status: selectStatus === 'true',
      };

      const response = await axiosInstance.post('/api/admin/UpdateUsers', updatedUser);

      if (response.status === 200) {
        showSuccessAlert('User updated successfully');
        backManageUser();
      } else {
        showErrorAlert('Error', 'Failed to update user, ' + response.data.message);
      }
    } catch (error) {
      showErrorAlert('Error', 'An error occurred while updating the user');
    } finally {
      setIsLoading(false);
    }
  };

  const goBack = () => {
    navigate(-1);
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
    initialValues,
    isModified,
    handleStatusChange,
    backManageUser,
    editManageUser,
    goBack,
    isloading
  };
};

export default useEditManageUsers;
