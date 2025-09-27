import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axiosInstance from '../../../../utils/utils';

const useViewManageUser = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [user, setUser] = useState({});
  const [orders, setOrders] = useState([]);
  const [technicianTasks, setTechnicianTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const { dataItem } = location.state || {};
    if (dataItem) {
      setUser(dataItem);
      localStorage.setItem('userData', JSON.stringify(dataItem));
      fetchAdditionalData(dataItem);
    } else {
      const savedData = JSON.parse(localStorage.getItem('userData'));
      if (savedData) {
        setUser(savedData);
        fetchAdditionalData(savedData);
      }
    }
  }, [location]);

  const fetchAdditionalData = async (userData) => {
    if (!userData?.user_id) return;

    setLoading(true);
    setError(null);

    try {
      if (userData.role_id === 3) { // EndUser
        // Fetch orders for enduser
        const ordersResponse = await axiosInstance.post('/api/admin/FetchOrdersByUserId', {
          user_id: userData.user_id
        });

        if (ordersResponse.status === 200 && ordersResponse.data.status === 'Success') {
          setOrders(ordersResponse.data.data || []);
        } else {
          console.error('Failed to fetch orders:', ordersResponse.data.message);
          setOrders([]);
        }
      } else if (userData.role_id === 2) { // Technician
        // Fetch technician tasks/devices
        const tasksResponse = await axiosInstance.post('/api/admin/FetchTechnicianTasksByUserId', {
          user_id: userData.user_id,
          email: userData.email
        });

        if (tasksResponse.status === 200 && tasksResponse.data.status === 'Success') {
          setTechnicianTasks(tasksResponse.data.data || []);
        } else {
          console.error('Failed to fetch technician tasks:', tasksResponse.data.message);
          setTechnicianTasks([]);
        }
      }
    } catch (err) {
      console.error('Error fetching additional data:', err);
      setError('Failed to load additional data');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate('/superadmin/ManageUsers');
  };

  const handleEditUser = (user) => {
    navigate('/superadmin/EditManageUsers', { state: { user } });
  };

  return {
    user,
    setUser,
    orders,
    technicianTasks,
    loading,
    error,
    handleBack,
    handleEditUser,
  };
};

export default useViewManageUser;
