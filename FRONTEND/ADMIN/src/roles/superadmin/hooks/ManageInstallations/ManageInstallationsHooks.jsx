//ManageInstallations
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

  const fetchTechnicians = async () => {
    const res = await axiosInstance.post('/api/admin/FetchInstallationService');
    return res.data?.data || [];
  };

  const fetchOrders = async () => {
    const res = await axiosInstance.post('/api/admin/FetchSelectUserOrders');
    return res.data?.data || [];
  };

  const fetchInstallationTasks = async () => {
    const res = await axiosInstance.post('/api/admin/FetchSelectInstallationTask');
    return res.data?.data || [];
  };

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [techs, ords, tasks] = await Promise.all([
        fetchTechnicians(),
        fetchOrders(),
        fetchInstallationTasks(),
      ]);

      setTechnicians(techs);
      setOrders(ords);
      setInstallationTasks(tasks);

      const allServiceRecords = techs.flatMap(tech =>
        tech.service_records.map(record => ({
          ...record,
          technician_name: tech.name,
          technician_id: tech.technician_id,
          technician_user_id: tech.user_id,
          technician_role_id: tech.role_id,
        }))
      );

      const enrichedTasks = tasks.map(task => {
        const assignedTechnician = allServiceRecords.find(
          rec => rec.wp_device_id === task.wp_device_id
        ) || null;

        const orderInfo = ords.find(order => order.wp_device_id === task.wp_device_id) || {};

        return {
          ...task,
          assignedTechnician,
          order_user_id: orderInfo.user_id || '',
          customOrderId: orderInfo.customOrderId || '',
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

  const handleSearchChange = (e) => {
    const value = e.target.value.toLowerCase();
    setSearchTerm(value);

    const filteredEnriched = installationTasks.filter(task =>
      task.wp_device_id?.toLowerCase().includes(value) ||
      task.task_description?.toLowerCase().includes(value) ||
      task.task_id?.toString().includes(value) ||
      task.assignedTechnician?.technician_id?.toLowerCase().includes(value)
    );

    setDisplayTasks(filteredEnriched);
  };

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
