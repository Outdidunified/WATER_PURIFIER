import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const useViewManageUser = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [user, setUser] = useState({});

  useEffect(() => {
    const { dataItem } = location.state || {};
    if (dataItem) {
      setUser(dataItem);  // Set all fields dynamically
      localStorage.setItem('userData', JSON.stringify(dataItem));
    } else {
      const savedData = JSON.parse(localStorage.getItem('userData'));
      if (savedData) setUser(savedData);
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
