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
  const [selectedFilter, setSelectedFilter] = useState('');
  const [searchText, setSearchText] = useState('');
  const [summary, setSummary] = useState({
    total: 0,
    pending: 0,
    inProgress: 0,
    completed: 0,
    unassigned: 0,
  });

  const calculateServiceSummary = (tasks) => {
    const counts = {
      total: tasks.length,
      pending: 0,
      inProgress: 0,
      completed: 0,
      unassigned: 0,
    };

    tasks.forEach((task) => {
      const status = (task.task_status || '').toLowerCase();
      if (status === 'pending') counts.pending += 1;
      else if (status === 'in progress' || status === 'in_progress') counts.inProgress += 1;
      else if (status === 'completed') counts.completed += 1;
      
      if (!task.assigned_technician_id) counts.unassigned += 1;
    });

    return counts;
  };

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

      const toValidTimestamp = (value) => {
        if (!value) return 0;
        const date = new Date(value);
        return Number.isNaN(date.getTime()) ? 0 : date.getTime();
      };

      const recordTimestamp = (record) => {
        if (!record) return 0;
        return Math.max(
          0,
          toValidTimestamp(record.createdAt),
          toValidTimestamp(record.created_at),
          toValidTimestamp(record.assigned_date),
          toValidTimestamp(record.assignedDate),
          toValidTimestamp(record.updatedAt),
          toValidTimestamp(record.updated_at),
          toValidTimestamp(record.completed_at),
          toValidTimestamp(record.completedAt),
          toValidTimestamp(record.createddate),
          toValidTimestamp(record.created_date)
        );
      };

      const sortServiceRecords = (taskItem) => {
        if (!Array.isArray(taskItem?.service_records)) {
          return [];
        }
        const records = taskItem.service_records.filter(Boolean);
        if (records.length <= 1) {
          return records;
        }
        return records.sort((a, b) => recordTimestamp(b) - recordTimestamp(a));
      };

      const computeTaskTimestamp = (latestRecord, taskItem) => {
        return Math.max(
          recordTimestamp(latestRecord),
          toValidTimestamp(taskItem?.task_assigned_date),
          toValidTimestamp(taskItem?.assigned_date),
          toValidTimestamp(taskItem?.createdAt),
          toValidTimestamp(taskItem?.updatedAt),
          toValidTimestamp(taskItem?.completed_at),
          toValidTimestamp(taskItem?.createddate)
        );
      };

      const enrichedWithTimestamp = tasks.map((task) => {
        const serviceRecords = sortServiceRecords(task);
        const primaryRecord = serviceRecords[0] || null;
        const assignedTechnician = filteredTechnicians.find(
          (tech) => tech.technician_id === (primaryRecord?.assigned_technician_id || task.assigned_technician_id)
        );

        const statusValue = (
          task?.task_status ||
          primaryRecord?.task_status ||
          ''
        ).toString();
        const statusLower = statusValue.toLowerCase();
        const isAssignable = statusLower ? statusLower !== 'completed' : true;
        const timestamp = computeTaskTimestamp(primaryRecord, task);

        return {
          ...task,
          assignedTechnician: assignedTechnician || null,
          service_records: serviceRecords,
          task_status: statusValue,
          pending_reason:
            task?.pending_reason ||
            primaryRecord?.pending_reason ||
            primaryRecord?.pending_reason_text ||
            '',
          task_id: primaryRecord?.task_id || task?.task_id || null,
          task_assigned_date: primaryRecord?.assigned_date || task?.task_assigned_date || null,
          assigned_technician_id:
            primaryRecord?.assigned_technician_id ||
            task?.assigned_technician_id ||
            null,
          isAssignable,
          _timestamp: timestamp,
        };
      });

      const enriched = enrichedWithTimestamp
        .sort((a, b) => (b._timestamp || 0) - (a._timestamp || 0))
        .map(({ _timestamp, ...rest }) => rest);

      setTechnicians(filteredTechnicians);
      setServiceTasks(enriched);
      setDisplayTasks(enriched);
      setSummary(calculateServiceSummary(enriched));
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

  const applyFilters = (filterType, search) => {
    let filtered = serviceTasks;

    if (filterType === 'pending') {
      filtered = filtered.filter(
        (task) => (task.task_status || '').toLowerCase() === 'pending'
      );
    } else if (filterType === 'inProgress') {
      filtered = filtered.filter((task) => {
        const status = (task.task_status || '').toLowerCase();
        return status === 'in progress' || status === 'in_progress';
      });
    } else if (filterType === 'completed') {
      filtered = filtered.filter(
        (task) => (task.task_status || '').toLowerCase() === 'completed'
      );
    } else if (filterType === 'unassigned') {
      filtered = filtered.filter(
        (task) => !task.assigned_technician_id
      );
    }

    if (search.trim()) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(
        (task) =>
          task.task_description?.toLowerCase().includes(searchLower) ||
          task.wp_device_id?.toLowerCase().includes(searchLower) ||
          task.task_id?.toString().includes(searchLower) ||
          task.assigned_technician_id?.toLowerCase().includes(searchLower)
      );
    }

    setDisplayTasks(filtered);
  };

  const handleFilterSelect = (filterType) => {
    const newFilter = selectedFilter === filterType ? '' : filterType;
    setSelectedFilter(newFilter);
    applyFilters(newFilter, searchText);
  };

  const handleSearchChange = (e) => {
    const value = e.target.value.toLowerCase();
    setSearchText(value);
    applyFilters(selectedFilter, value);
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
    summary,
    selectedFilter,
    handleFilterSelect,
  };
};

export default useManageServices;
