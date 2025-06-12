//ViewManageUsers
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const useViewManageUser = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [user, setUser] = useState({
    _id: '',
    name: '',
    email: '',
    phone: '',
    password: '',
    city: '',
    createdby: '',
    createdDate: '',
    status: false,
    role_id: '',
    role_name: '',
    user_id: '',
    is_subscribed: false,
    active_duration_id: '',
    active_label: '',
    active_order_id: '',
    active_plan_id: '',
    assigned_device_id: '',
    subscribed_at: '',
    subscription_expiry_date: '',
    otpExpires: '',
  });

  useEffect(() => {
    const { dataItem } = location.state || {};
    if (dataItem) {
      setUser({
        _id: dataItem._id || '',
        name: dataItem.name || '',
        email: dataItem.email || '',
        phone: dataItem.phone || '',
        password: dataItem.password || '',
        city: dataItem.city || '',
        createdby: dataItem.createdby || '',
        createdDate: dataItem.createdDate || '',
        status: dataItem.status || false,
        role_id: dataItem.role_id || '',
        role_name: dataItem.role_name || '',
        user_id: dataItem.user_id || '',
        is_subscribed: dataItem.is_subscribed || false,
        active_duration_id: dataItem.active_duration_id || '',
        active_label: dataItem.active_label || '',
        active_order_id: dataItem.active_order_id || '',
        active_plan_id: dataItem.active_plan_id || '',
        assigned_device_id: dataItem.assigned_device_id || '',
        subscribed_at: dataItem.subscribed_at || '',
        subscription_expiry_date: dataItem.subscription_expiry_date || '',
        otpExpires: dataItem.otpExpires || '',
      });

      localStorage.setItem('userData', JSON.stringify(dataItem));
    } else {
      const savedData = JSON.parse(localStorage.getItem('userData'));
      if (savedData) {
        setUser(savedData);
      }
    }
  }, [location]);

  const handleBack = () => {
    navigate('/superadmin/ManageUsers');
  };

  const handleEditUser = (user) => {
    navigate('/superadmin/EditManageUsers', { state: { user } });
  };

  return {
    user,
    setUser,
    handleBack,
    handleEditUser,
  };
};

export default useViewManageUser;
