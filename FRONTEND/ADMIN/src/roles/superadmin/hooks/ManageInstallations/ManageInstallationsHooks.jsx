import { useState, useEffect, useCallback, useRef } from 'react';
import axiosInstance from '../../../../utils/utils';
import { showErrorAlert, showSuccessAlert } from '../../../../utils/alert';
import InstallationSearchService from '../../../../services/InstallationSearchService';

const normalizeHistoryEntries = (input) => {
  if (!input) return [];
  if (Array.isArray(input)) return input.filter(Boolean).map((entry) => ({ ...entry }));
  if (typeof input === 'object') return Object.values(input).filter(Boolean).map((entry) => ({ ...entry }));
  return [];
};

const collectAssignmentHistory = (source) => {
  if (!source) return [];
  const combined = [];
  const append = (value) => {
    const normalized = normalizeHistoryEntries(value);
    if (normalized.length > 0) combined.push(...normalized);
  };
  append(source.assignment_history);
  append(source.assignmentHistory);
  append(source.assignment_history_map);
  append(source.assignmentHistoryMap);
  append(source.assignmentHistoryList);
  return combined;
};

const extractAssignedDateValue = (value) => {
  if (!value) return null;
  if (typeof value === 'object') {
    if ('$date' in value) return value.$date;
    if ('$numberLong' in value) {
      const millis = Number(value.$numberLong);
      return Number.isNaN(millis) ? null : new Date(millis).toISOString();
    }
    return null;
  }
  return value;
};

const createHistoryEntryKey = (entry) => {
  const technician =
    entry?.technician_id ||
    entry?.assigned_technician_id ||
    entry?.technicianId ||
    entry?.assignedTechnicianId ||
    entry?.technician_device_map_id ||
    '';
  const assignedBy = entry?.assigned_by || entry?.assignedBy || '';
  const assignedDate =
    extractAssignedDateValue(entry?.assigned_date) ||
    extractAssignedDateValue(entry?.assignedDate) ||
    '';
  const reason =
    entry?.unassigned_reason ||
    entry?.unassignedReason ||
    entry?.pending_reason ||
    entry?.pendingReason ||
    entry?.pending_reason_text ||
    entry?.pendingReasonText ||
    entry?.reassigned_reason ||
    entry?.reassignedReason ||
    '';
  return [technician, assignedBy, assignedDate, reason].join('|');
};

const dedupeHistoryEntries = (entries) => {
  const seen = new Map();
  return entries.filter((entry) => {
    const key = createHistoryEntryKey(entry) || JSON.stringify(entry ?? {});
    if (!key) return true;
    if (seen.has(key)) {
      const existing = seen.get(key);
      const existingDate = extractAssignedDateValue(existing?.assigned_date) || extractAssignedDateValue(existing?.assignedDate);
      const currentDate = extractAssignedDateValue(entry?.assigned_date) || extractAssignedDateValue(entry?.assignedDate);
      if (existingDate && currentDate && new Date(currentDate).getTime() > new Date(existingDate).getTime()) {
        seen.set(key, entry);
        return true;
      }
      return false;
    }
    seen.set(key, entry);
    return true;
  });
};

const dedupeTasksByIdentity = (items) => {
  const seen = new Map();
  return items.filter((item) => {
    const keyParts = [
      item?.task_id,
      item?.wp_device_id,
      item?.customOrderId,
      item?.order_user_id || item?.user_id,
      extractAssignedDateValue(item?.task_assigned_date),
    ].filter(Boolean);
    if (keyParts.length === 0) {
      return true;
    }
    const key = keyParts.join('|');
    if (seen.has(key)) {
      const existing = seen.get(key);
      const existingTimestamp = existing?._timestamp || 0;
      const currentTimestamp = item?._timestamp || 0;
      if (currentTimestamp > existingTimestamp) {
        seen.set(key, item);
        return true;
      }
      return false;
    }
    seen.set(key, item);
    return true;
  });
};

const useManageInstallation = (userInfo) => {
  const [installationTasks, setInstallationTasks] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [orders, setOrders] = useState([]);
  const [enrichedTaskList, setEnrichedTaskList] = useState([]);
  const [displayTasks, setDisplayTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('');
  const [searchText, setSearchText] = useState('');
  const [pageNum, setPageNum] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [summary, setSummary] = useState({
    total: 0,
    pending: 0,
    inProgress: 0,
    completed: 0,
    unassigned: 0,
    rejected: 0,
  });

  const debouncedSearchRef = useRef(null);

  const calculateInstallationSummary = (tasks) => {
    const counts = {
      total: tasks.length,
      pending: 0,
      inProgress: 0,
      completed: 0,
      unassigned: 0,
      rejected: 0,
    };

    tasks.forEach((task) => {
      const status = (task.task_status || '').toLowerCase().trim();
      if (status === 'pending') counts.pending += 1;
      else if (status === 'in progress' || status === 'in_progress' || status === 'in progess') counts.inProgress += 1;
      else if (status === 'completed') counts.completed += 1;
      else if (status === 'rejected') counts.rejected += 1;

      if (!task.assigned_technician_id) counts.unassigned += 1;
    });

    return counts;
  };

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

  const flattenServiceRecordsData = (items) => {
    return items.map((item) => {
      const serviceRecord = item.service_records && item.service_records.length > 0 ? item.service_records[0] : {};
      return {
        ...item,
        task_id: serviceRecord.task_id || item.task_id || '-',
        task_status: serviceRecord.task_status || serviceRecord.status || item.task_status || 'Pending',
        assigned_technician_id: serviceRecord.assigned_technician_id || item.assigned_technician_id || '',
        task_assigned_date: serviceRecord.task_assigned_date || serviceRecord.assigned_date || item.task_assigned_date,
        pending_reason: serviceRecord.pending_reason || serviceRecord.unassigned_reason || item.pending_reason || '',
        assignedTechnician: serviceRecord.assignedTechnician || item.assignedTechnician || null,
      };
    });
  };

  const fetchInstallationTasks = async (pageNum = 1, pageLimit = 10) => {
    const isSeller = Number(userInfo?.role_id) === 4;
    try {
      let res;
      if (isSeller) {
        res = await axiosInstance.get('/api/admin/installations/by-district', {
          params: { district: userInfo?.district, page: pageNum, limit: pageLimit }
        });
      } else {
        res = await axiosInstance.post('/api/admin/FetchSelectInstallationTask', {
          page: pageNum,
          limit: pageLimit
        });
      }
      
      let data = res.data?.data || [];
      data = flattenServiceRecordsData(data);
      
      if (res.data?.pagination && res.data.pagination.totalPages) {
        setTotalRecords(res.data.pagination.totalRecords);
        setTotalPages(res.data.pagination.totalPages);
      } else {
        setTotalRecords(data.length);
        setTotalPages(Math.ceil(data.length / pageLimit) || 1);
      }
      return data;
    } catch (error) {
      console.error('Error fetching installation tasks:', error);
      return [];
    }
  };

  const [installationCounts, setInstallationCounts] = useState({
    totalInstallations: 0,
    pending: 0,
    assigned: 0,
    completed: 0,
    onHold: 0
  });

  const fetchInstallationCounts = async () => {
    try {
      const isSeller = Number(userInfo?.role_id) === 4;
      const params = isSeller ? { district: userInfo?.district } : {};
      const res = await axiosInstance.get('/api/admin/installations/counts', { params });
      if (res.data.status === 'Success') {
        setInstallationCounts(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching installation counts:', err);
    }
  };

  // Main fetchData function
  const fetchData = useCallback(async (page = pageNum, size = pageSize, filterStatus = selectedFilter, searchTerm = searchText) => {
    setIsLoading(true);
    try {
      const isSeller = Number(userInfo?.role_id) === 4;
      const sellerDistrict = isSeller ? userInfo?.district || '' : '';

      const [techs, ords, tasks] = await Promise.all([
        fetchTechnicians(),
        fetchOrders(),
        fetchInstallationTasks(page, size, filterStatus, searchTerm),
      ]);

      const filteredTechnicians = sellerDistrict
        ? techs.filter((tech) => {
            const techDistrict = (tech?.district || tech?.assigned_district || '').toLowerCase();
            return techDistrict ? techDistrict === sellerDistrict.toLowerCase() : false;
          })
        : techs;

      setTechnicians(filteredTechnicians);
      setOrders(ords);
      setInstallationTasks(tasks);
      setSummary(calculateInstallationSummary(tasks));
      await fetchInstallationCounts();
    } catch (err) {
      showErrorAlert('Failed to fetch installation data');
      setError('Failed to fetch installation data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    setPageNum(1);
    fetchData(1, pageSize, selectedFilter, searchText);
  }, [selectedFilter, searchText]);

  useEffect(() => {
    fetchData(pageNum, pageSize, selectedFilter, searchText);
  }, [pageNum, pageSize]);

  useEffect(() => {
    setSummary(calculateInstallationSummary(installationTasks));
  }, [installationTasks]);

  const handleFilterSelect = (filterType) => {
    const newFilter = selectedFilter === filterType ? '' : filterType;
    setSelectedFilter(newFilter);
    setPageNum(1);
  };

  const performSearch = async (term, page = 1, limit = 10) => {
    try {
      setIsLoading(true);
      const result = await InstallationSearchService.performSearch(term, page, limit);
      setInstallationTasks(result.data);
      setPageNum(result.pagination.currentPage);
      setPageSize(result.pagination.pageSize);
      setTotalRecords(result.totalCount);
      setTotalPages(Math.ceil(result.totalCount / limit) || 1);
    } catch (err) {
      console.error('Error performing search:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchText(value);
    setPageNum(1);
    
    if (!debouncedSearchRef.current) {
      debouncedSearchRef.current = InstallationSearchService.debounceSearch(performSearch, 300);
    }
    
    debouncedSearchRef.current(value, 1, pageSize);
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
      await fetchData(pageNum, pageSize);
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
      await fetchData(pageNum, pageSize);
    } catch (err) {
      console.log('Reassign Error:', err.response);
      const errorMessage = err?.response?.data?.message || 'Failed to re-assign installation';
      showErrorAlert(errorMessage);
    }
  };

  const handlePageChange = (newPage) => {
    setPageNum(newPage);
  };

  const handlePageSizeChange = (newPageSize) => {
    setPageSize(newPageSize);
    setPageNum(1);
  };

  return {
    installationTasks,
    technicians,
    isLoading,
    error,
    searchTerm,
    handleSearchChange,
    assignInstallation,
    reassignInstallation,
    refetch: fetchData,
    summary,
    installationCounts,
    selectedFilter,
    handleFilterSelect,
    pageNum,
    pageSize,
    totalRecords,
    totalPages,
    handlePageChange,
    handlePageSizeChange,
  };
};

export default useManageInstallation;
