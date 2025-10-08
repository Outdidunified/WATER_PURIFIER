//ManageServices
import { useState, useEffect, useCallback } from 'react';
import axiosInstance from '../../../../utils/utils';
import { showErrorAlert, showSuccessAlert } from '../../../../utils/alert';

const useManageServices = (userInfo) => {
  const [serviceTasks, setServiceTasks] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [displayTasks, setDisplayTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

const fetchTechnicians = async () => {
  const res = await axiosInstance.post('/api/admin/FetchTechniciansByDistrict');
  return res.data?.data || [];
};


  const fetchServiceTasks = async () => {
    const isSeller = Number(userInfo?.role_id) === 4;
    const url = isSeller ? '/api/admin/services/by-district' : '/api/admin/FetchSelectServiceTask';
    const res = isSeller
      ? await axiosInstance.get(url, { params: { district: userInfo?.district } })
      : await axiosInstance.post(url);
    return res.data?.data || [];
  };

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [techs, tasks] = await Promise.all([
        fetchTechnicians(),
        fetchServiceTasks(),
      ]);

      const isSeller = Number(userInfo?.role_id) === 4;
      const sellerDistrict = userInfo?.district?.trim().toLowerCase();

      const filteredTechnicians = isSeller && sellerDistrict
        ? techs.filter((tech) => tech?.district?.trim().toLowerCase() === sellerDistrict)
        : techs;

      setTechnicians(filteredTechnicians);
      setServiceTasks(tasks);

      const enriched = tasks.map(task => {
        const assignedTechnician = filteredTechnicians.find(
          tech => tech.technician_id === task.assigned_technician_id
        );

        const isAssignable = task.task_status?.toLowerCase() !== 'completed';

        return {
          ...task,
          assignedTechnician: assignedTechnician || null,
          isAssignable,
        };
      });

      setDisplayTasks(enriched);
    } catch (err) {
      console.error('Fetch error:', err);
      setError('Failed to fetch service task data');
      showErrorAlert('Failed to fetch service task data');
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

    const filtered = serviceTasks.filter(task =>
      task.task_description?.toLowerCase().includes(value) ||
      task.wp_device_id?.toLowerCase().includes(value) ||
      task.task_id?.toString().includes(value) ||
      task.assigned_technician_id?.toLowerCase().includes(value)
    );

    setDisplayTasks(filtered);
  };

  const assignServiceTask = async ({
    task_id,
    assigned_technician_id,
    task_created_by_user_email,
    district,
  }) => {
    try {
      const payload = {
        task_id,
        assigned_technician_id,
        task_created_by_user_email,
        assigned_by: userInfo?.email || '',
        district: district || userInfo?.district || '',
      };

      await axiosInstance.post('/api/admin/AssignService', payload);
      showSuccessAlert('Service task assigned successfully');
      await fetchData();
    } catch (err) {
      console.log('Assign Error:', err.response);
      const errorMessage = err?.response?.data?.message || 'Assignment failed';
      showErrorAlert(errorMessage);
    }
  };

  const reassignServiceTask = async ({
    task_id,
    technician_id,
  }) => {
    try {
      const payload = {
        task_id,
        technician_id,
        modified_by: userInfo?.email || '',
      };

      await axiosInstance.post('/api/admin/ReAssignService', payload);
      showSuccessAlert('Service task reassigned successfully');
      await fetchData();
    } catch (err) {
      console.error('Reassign Error:', err.response);
      const errorMessage = err?.response?.data?.message || 'Reassignment failed';
      showErrorAlert(errorMessage);
    }
  };

  return {
    serviceTasks: displayTasks,
    technicians,
    isLoading,
    error,
    searchTerm,
    handleSearchChange,
    assignServiceTask,
    reassignServiceTask,
    refetch: fetchData,
  };
};

export default useManageServices;
