import { useState, useEffect, useCallback } from 'react';
import axiosInstance from '../../../../utils/utils';
import { showErrorAlert, showSuccessAlert } from '../../../../utils/alert';

const useManageInstallation = (userInfo) => {
  const [installationTasks, setInstallationTasks] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [orders, setOrders] = useState([]);
  const [displayTasks, setDisplayTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch API calls
  const fetchTechnicians = async () => {
    const res = await axiosInstance.post('/api/admin/FetchTechniciansByDistrict');
    return res.data?.data || [];
  };

  const fetchOrders = async () => {
    const isSeller = Number(userInfo?.role_id) === 4;
    const url = isSeller ? '/api/admin/installations/by-district' : '/api/admin/FetchSelectUserOrders';
    const res = isSeller
      ? await axiosInstance.get(url, { params: { district: userInfo?.district } })
      : await axiosInstance.post(url);
    return res.data?.data || [];
  };

  const fetchInstallationTasks = async () => {
    const isSeller = Number(userInfo?.role_id) === 4;
    const url = isSeller ? '/api/admin/installations/by-district' : '/api/admin/FetchSelectInstallationTask';
    const res = isSeller
      ? await axiosInstance.get(url, { params: { district: userInfo?.district } })
      : await axiosInstance.post(url);
    return res.data?.data || [];
  };

  // Main fetchData function
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const isSeller = Number(userInfo?.role_id) === 4;
      const sellerDistrict = isSeller ? userInfo?.district || '' : '';

      const [techs, ords, tasks] = await Promise.all([
        fetchTechnicians(),
        fetchOrders(),
        fetchInstallationTasks(),
      ]);

      const filteredTechnicians = sellerDistrict
        ? techs.filter((tech) => {
            const techDistrict = (tech?.district || tech?.assigned_district || '').toLowerCase();
            return techDistrict ? techDistrict === sellerDistrict.toLowerCase() : false;
          })
        : techs;

      setTechnicians(filteredTechnicians);
      setOrders(ords);
      setInstallationTasks(tasks); // ✅ Fixed: set installationTasks from tasks

      const technicianMap = filteredTechnicians.reduce((acc, tech) => {
        if (tech.service_records && tech.service_records.length > 0) {
          tech.service_records.forEach((record) => {
            if (record.technician_device_map_id) {
              acc[record.technician_device_map_id] = {
                technician_name: tech.name,
                technician_email: tech.email,
                technician_id: tech.technician_id,
                technician_user_id: tech.user_id,
                technician_role_id: tech.role_id,
              };
            }
          });
        }
        return acc;
      }, {});

      const enrichedTasks = ords.map(order => {
        const technicianDetails = order.service_records?.length > 0
          ? technicianMap[order.service_records[0]?.technician_device_map_id]
          : null;

        const matchingTask = tasks.find(
          task => task.wp_device_id === order.wp_device_id
        );

        return {
          ...order,
          task_id: matchingTask?.service_records?.[0]?.task_id || null, // ✅ Add task_id for reassignment
          assignedTechnician: technicianDetails,
          assigned_technician_id: order.service_records?.[0]?.assigned_technician_id || null,
          order_user_id: order.user_id || '',
          customOrderId: order.customOrderId || '',
        };
      });

      setDisplayTasks(enrichedTasks);
    } catch (err) {
      showErrorAlert('Failed to fetch installation data');
      setError('Failed to fetch installation data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Search functionality
  const handleSearchChange = (e) => {
    const value = e.target.value.toLowerCase();
    setSearchTerm(value);

    const filteredEnriched = orders.filter(order =>
      order.wp_device_id?.toLowerCase().includes(value) ||
      order.customOrderId?.toLowerCase().includes(value) ||
      order.user_id?.toString().includes(value) ||
      order.deliveryAddress?.name?.toLowerCase().includes(value)
    );

    setDisplayTasks(filteredEnriched);
  };

  // Assign new technician
  const assignInstallation = async ({
    technician_role_id,
    technician_user_id,
    technician_id,
    order_user_id,
    customOrderId,
    wp_device_id,
    assigned_by,
  }) => {
    try {
      const payload = {
        technician_role_id,
        technician_user_id,
        technician_id,
        order_user_id,
        customOrderId,
        wp_device_id,
        assigned_by,
      };

      await axiosInstance.post('/api/admin/AssignInstallation', payload);
      showSuccessAlert('Installation successfully assigned');
      await fetchData();
    } catch (err) {
      console.log('Error response:', err.response);
      const errorMessage = err?.response?.data?.message || 'Something went wrong during assignment';
      showErrorAlert(errorMessage);
    }
  };

  // Reassign existing installation task
  const reassignInstallation = async ({ task_id, technician_id }) => {
    try {
      const payload = {
        task_id,
        technician_id,
        modified_by: userInfo?.email || '',
      };

      await axiosInstance.post('/api/admin/ReAssignInstallation', payload);
      showSuccessAlert('Installation successfully re-assigned');
      await fetchData();
    } catch (err) {
      console.log('Reassign Error:', err.response);
      const errorMessage = err?.response?.data?.message || 'Failed to re-assign installation';
      showErrorAlert(errorMessage);
    }
  };

  return {
    installationTasks: displayTasks,
    technicians,
    isLoading,
    error,
    searchTerm,
    handleSearchChange,
    assignInstallation,
    reassignInstallation,
    refetch: fetchData,
  };
};

export default useManageInstallation;
