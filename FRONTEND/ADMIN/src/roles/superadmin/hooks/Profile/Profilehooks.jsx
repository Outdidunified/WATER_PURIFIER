//ProfileHooks
import { useState, useEffect, useRef, useCallback } from 'react';
import axiosInstance from '../../../../utils/utils';
import { showErrorAlert, showSuccessAlert } from '../../../../utils/alert';

const useProfile = (userInfo) => {
  const [data, setData] = useState({});
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [initialUserData, setInitialUserData] = useState({});
  const [userModified, setUserModified] = useState(false);
  const [loading, setLoading] = useState(false);
  const fetchProfileCalled = useRef(false);

  const fetchProfile = useCallback(async () => {
    try {
      const response = await axiosInstance({
        method: 'post',
        url: 'api/admin/FetchAdminProfile',
        data: {
          user_id: userInfo.user_id,
        },
      });

      if (response.status === 200 && response.data.status === "Success") {
        const profileData = response.data.data;
        setData(profileData);
        setInitialUserData(profileData);
      } else {
        setErrorMessage('Failed to fetch profile');
        console.error('Failed to fetch profile:', response.statusText);
      }
    } catch (error) {
      setErrorMessage('An error occurred while fetching the profile');
      console.error('Error:', error);
    }
  }, [userInfo]);

  useEffect(() => {
    if (!fetchProfileCalled.current && userInfo?.user_id) {
      fetchProfile();
      fetchProfileCalled.current = true;
    }
  }, [fetchProfile, userInfo]);

 useEffect(() => {
  if (data) {
    setName(data.name || '');
    setEmail(data.email || '');
    setPhone(data.phone ? String(data.phone) : '');
    setPassword(data.password ? String(data.password) : ''); 
  }
}, [data]);


  useEffect(() => {
  const isNameChanged = name !== (initialUserData.name || '');
  const isPhoneChanged = phone !== (initialUserData.phone ? String(initialUserData.phone) : '');
  const isPasswordChanged = password !== (initialUserData.password ? String(initialUserData.password) : '');

  setUserModified(isNameChanged || isPhoneChanged || isPasswordChanged);
}, [name, phone, password, initialUserData]);


  useEffect(() => {
    if (errorMessage) {
      const timeout = setTimeout(() => setErrorMessage(''), 5000);
      return () => clearTimeout(timeout);
    }
  }, [errorMessage]);

  const ProfileUpdate = async (e) => {
    e.preventDefault();

    const phoneRegex = /^\d{10}$/;
    if (!phone) return setErrorMessage("Phone can't be empty.");
    if (!phoneRegex.test(phone)) return setErrorMessage('Phone must be a 10-digit number.');

    const passwordRegex = /^\d{4}$/;
    if (!password) return setErrorMessage("Password can't be empty.");
    if (!passwordRegex.test(password)) return setErrorMessage('Password must be a 4-digit number.');

    try {
      setLoading(true);

      const response = await axiosInstance({
        method: 'post',
        url: 'api/admin/UpdateAdminProfile',
        data: {
          user_id: userInfo.user_id,
          name,
          phone: parseInt(phone),
          password: parseInt(password),
          status: true,
          modified_by: userInfo.email,
        },
      });

      if (response.status === 200) {
        showSuccessAlert("Profile updated successfully");
        fetchProfile();
      } else {
        showErrorAlert("Error", "Failed to update profile");
      }
    } catch (error) {
      const message = error.response?.data?.message || "An error occurred while updating the profile";
      showErrorAlert("Error", message);
    } finally {
      setLoading(false);
    }
  };

  return {
    name,
    setName,
    email,
    phone,
    setPhone,
    password,
    setPassword,
    errorMessage,
    userModified,
    ProfileUpdate,
    loading,
  };
};

export default useProfile;
