import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axiosInstance from '../../../../utils/utils';

const useViewManageUser = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [user, setUser] = useState({});
  const [orders, setOrders] = useState([]);
  const [endUserDevices, setEndUserDevices] = useState([]);
  const [subscriptionDetails, setSubscriptionDetails] = useState(null);
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
    setOrders([]);
    setEndUserDevices([]);
    setSubscriptionDetails(null);
    setTechnicianTasks([]);

    try {
      if (userData.role_id === 3) {
        // ===== End User =====
        const [ordersResponse, devicesResponse, subscriptionResponse] = await Promise.all([
          axiosInstance.post('/api/admin/FetchOrdersByUserId', { user_id: userData.user_id }),
          axiosInstance.post('/api/admin/FetchEndUserDevices', { user_id: userData.user_id }),
          axiosInstance.post('/api/app/enduserhome/getActiveSubscriptionDetails', {
            user_id: userData.user_id,
            email: userData.email,
            role_id: userData.role_id,
          }),
        ]);

        // Orders
        if (ordersResponse.status === 200 && ordersResponse.data.status === 'Success') {
          const normalizedOrders = (ordersResponse.data.data || []).map((order) => ({
            ...order,
            planStartDate: order.planStartDate || order.createdAt || null,
          }));
          setOrders(normalizedOrders);
        } else {
          console.warn('No orders found:', ordersResponse.data.message);
        }

        // Devices
        if (devicesResponse.status === 200 && devicesResponse.data.status === 'Success') {
          setEndUserDevices(devicesResponse.data.data || []);
        } else {
          console.warn('No devices found:', devicesResponse.data.message);
        }

        // Subscription
        if (subscriptionResponse.status === 200 && !subscriptionResponse.data.error) {
          setSubscriptionDetails(subscriptionResponse.data.data?.subscription || null);
        } else {
          console.warn('No active subscription:', subscriptionResponse.data.message);
        }

      } else if (userData.role_id === 2) {
        // ===== Technician =====
        try {
          const tasksResponse = await axiosInstance.post('/api/admin/FetchTechnicianTasksByUserId', {
            user_id: userData.user_id,
            email: userData.email,
          });

          if (tasksResponse.status === 200) {
            if (tasksResponse.data.status === 'Success') {
              const technicianPayload = tasksResponse.data.data;
              const normalizedTasks = Array.isArray(technicianPayload)
                ? technicianPayload
                : Array.isArray(technicianPayload?.tasks)
                  ? technicianPayload.tasks
                  : Array.isArray(technicianPayload?.data)
                    ? technicianPayload.data
                    : [];
              setTechnicianTasks(normalizedTasks);
              setError(null);
            } else {
              setError(tasksResponse.data.message || 'Unexpected response from server');
              setTechnicianTasks([]);
            }
          } else {
            setError('Failed to fetch technician tasks (server error)');
          }
        } catch (err) {
          setError(err.response?.data?.message || 'Failed to fetch technician tasks');
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

  const handleDeviceNavigate = (device) => {
    if (!device) return;
    navigate('/superadmin/ViewManageDevice', { state: { dataItem: device } });
  };

  const handleOrderNavigate = (order) => {
    if (!order) return;
    navigate('/superadmin/ViewOrders', { state: { dataItem: order } });
  };

  return {
    user,
    setUser,
    orders,
    endUserDevices,
    subscriptionDetails,
    technicianTasks,
    loading,
    error,
    handleBack,
    handleEditUser,
    handleDeviceNavigate,
    handleOrderNavigate,
  };
};

export default useViewManageUser;
