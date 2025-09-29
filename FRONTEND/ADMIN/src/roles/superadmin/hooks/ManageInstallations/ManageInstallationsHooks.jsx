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

      const enrichedTasks = ords.map((order) => {
        const matchingTask = tasks.find(
          (task) => task.wp_device_id === order.wp_device_id
        );

        const serviceRecords =
          matchingTask?.service_records?.length
            ? matchingTask.service_records
            : order.service_records || [];

        const primaryRecord = serviceRecords?.[0];

        const technicianFromMap = primaryRecord?.technician_device_map_id
          ? technicianMap[primaryRecord.technician_device_map_id]
          : null;

        const fallbackTechnician =
          !technicianFromMap && primaryRecord?.assigned_technician_id
            ? filteredTechnicians.find(
                (tech) => tech.technician_id === primaryRecord.assigned_technician_id
              )
            : null;

        const normalizedTechnician =
          technicianFromMap ||
          (fallbackTechnician
            ? {
                technician_name: fallbackTechnician.name,
                technician_email: fallbackTechnician.email,
                technician_id: fallbackTechnician.technician_id,
                technician_user_id: fallbackTechnician.user_id,
                technician_role_id: fallbackTechnician.role_id,
                technician_phone:
                  fallbackTechnician.phone || fallbackTechnician.mobile || '',
              }
            : null);

        return {
          ...order,
          task_status: matchingTask?.task_status || order.task_status || '',
          service_records: serviceRecords,
          task_id: primaryRecord?.task_id || null,
          task_assigned_date: primaryRecord?.assigned_date || null,
          task_released_date: primaryRecord?.released_date || null,
          task_assigned_by: primaryRecord?.assigned_by || '',
          task_released_by: primaryRecord?.released_by || '',
          task_completed_date: primaryRecord?.completed_at || null,
          task_completion_notes: primaryRecord?.remarks || '',
          assignedTechnician: normalizedTechnician,
          assigned_technician_id: primaryRecord?.assigned_technician_id || null,
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
