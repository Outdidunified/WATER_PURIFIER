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
    modifiedby: '',
    createdDate: '',
    modifiedDate: '',
    createddate: '',
    modifieddate: '',
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
    assigned_device_ids: [],
    subscribed_at: '',
    subscription_expiry_date: '',
    otp: '',
    otpExpires: '',
    otpGeneratedAt: '',
    security_deposit: '',
    security_deposit_added: false,
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
        modifiedby: dataItem.modifiedby || '',
        createdDate: dataItem.createdDate || '',
        modifiedDate: dataItem.modifiedDate || '',
        createddate: dataItem.createddate || '',
        modifieddate: dataItem.modifieddate || '',
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
        assigned_device_ids: dataItem.assigned_device_ids || [],
        subscribed_at: dataItem.subscribed_at || '',
        subscription_expiry_date: dataItem.subscription_expiry_date || '',
        otp: dataItem.otp || '',
        otpExpires: dataItem.otpExpires || '',
        otpGeneratedAt: dataItem.otpGeneratedAt || '',
        security_deposit: dataItem.security_deposit || '',
        security_deposit_added: dataItem.security_deposit_added || false,
      });

      localStorage.setItem('userData', JSON.stringify(dataItem));
    } else {
      const savedData = JSON.parse(localStorage.getItem('userData'));
      if (savedData) {
        setUser({
          _id: savedData._id || '',
          name: savedData.name || '',
          email: savedData.email || '',
          phone: savedData.phone || '',
          password: savedData.password || '',
          city: savedData.city || '',
          createdby: savedData.createdby || '',
          modifiedby: savedData.modifiedby || '',
          createdDate: savedData.createdDate || '',
          modifiedDate: savedData.modifiedDate || '',
          createddate: savedData.createddate || '',
          modifieddate: savedData.modifieddate || '',
          status: savedData.status || false,
          role_id: savedData.role_id || '',
          role_name: savedData.role_name || '',
          user_id: savedData.user_id || '',
          is_subscribed: savedData.is_subscribed || false,
          active_duration_id: savedData.active_duration_id || '',
          active_label: savedData.active_label || '',
          active_order_id: savedData.active_order_id || '',
          active_plan_id: savedData.active_plan_id || '',
          assigned_device_id: savedData.assigned_device_id || '',
          assigned_device_ids: savedData.assigned_device_ids || [],
          subscribed_at: savedData.subscribed_at || '',
          subscription_expiry_date: savedData.subscription_expiry_date || '',
          otp: savedData.otp || '',
          otpExpires: savedData.otpExpires || '',
          otpGeneratedAt: savedData.otpGeneratedAt || '',
          security_deposit: savedData.security_deposit || '',
          security_deposit_added: savedData.security_deposit_added || false,
        });
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
