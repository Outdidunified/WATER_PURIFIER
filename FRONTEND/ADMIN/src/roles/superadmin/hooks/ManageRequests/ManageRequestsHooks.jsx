import { useState, useEffect, useCallback } from 'react';
import axiosInstance from '../../../../utils/utils';
import { showErrorAlert, showSuccessAlert } from '../../../../utils/alert';

const useManageRequests = (userInfo) => {
  const [requests, setRequests] = useState([]);
  const [displayRequests, setDisplayRequests] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [devices, setDevices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('');
  const [searchText, setSearchText] = useState('');
  const [requestCounts, setRequestCounts] = useState({
    totalRequests: 0,
    pending: 0,
    assigned: 0,
    completed: 0,
    rejected: 0
  });
  const [summary, setSummary] = useState({
    total: 0,
    pending: 0,
    completed: 0,
    inProgress: 0,
    rejected: 0,
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const calculateRequestSummary = useCallback((reqs) => {
    const counts = {
      total: reqs.length,
      pending: 0,
      completed: 0,
      inProgress: 0,
      rejected: 0,
    };

    reqs.forEach((request) => {
      const status = (request.task_status || '').toLowerCase();
      if (status === 'pending') counts.pending += 1;
      else if (status === 'completed') counts.completed += 1;
      else if (status === 'in progress' || status === 'in_progress') counts.inProgress += 1;
      else if (status === 'rejected') counts.rejected += 1;
    });

    return counts;
  }, []);

  const isSeller = Number(userInfo?.role_id) === 4;
  const sellerDistrict = userInfo?.district || '';

  const fetchTechnicians = useCallback(async () => {
    const res = await axiosInstance.post('/api/admin/FetchTechniciansByDistrict');
    return res.data?.data || [];
  }, []);

  const fetchRequests = useCallback(async (pageNum = 1, pageLimit = 10) => {
    const endpoint = isSeller ? '/api/admin/FetchManualRequestsBySellerDistrict' : '/api/admin/FetchManualRequests';
    const payload = { page: pageNum, limit: pageLimit };
    const res = await axiosInstance.post(endpoint, payload);
    return { data: res.data?.data || [], pagination: res.data?.pagination || {} };
  }, [isSeller]);

  const fetchDevices = useCallback(async () => {
    const payload = isSeller ? { district: sellerDistrict } : {};
    const res = await axiosInstance.post('/api/admin/FetchInstalledDevicesForRequests', payload);
    return res.data?.data || [];
  }, [isSeller, sellerDistrict]);

  const fetchRequestCounts = useCallback(async () => {
    try {
      const params = isSeller ? { district: sellerDistrict } : {};
      const res = await axiosInstance.get('/api/admin/manual-requests/counts', { params });
      if (res.data.status === 'Success') {
        setRequestCounts(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching request counts:', err);
    }
  }, [isSeller, sellerDistrict]);

  const enrichRequests = useCallback((rawRequests, techs) => {
    const technicianMap = new Map();
    techs.forEach((tech) => {
      if (tech?.technician_id) {
        technicianMap.set(tech.technician_id, tech);
      }
    });

    return rawRequests.map((request) => {
      const assigned = request?.assigned_technician_id ? technicianMap.get(request.assigned_technician_id) : null;
      const modelName = request?.model_name || request?.modelName || null;
      const modelType = request?.model_type || request?.modelType || null;
      const currentPlan = request?.current_plan || request?.currentPlan || null;
      const currentPlanEndDate = request?.current_plan_end_date || request?.currentPlanEndDate || null;
      const currentDuration = request?.current_duration || request?.currentDuration || null;
      const macId = request?.mac_id || request?.macId || null;
      const deviceDetailId = request?.device_detail_id || request?.deviceDetailId || null;

      return {
        ...request,
        assignedTechnician: request?.assignedTechnician || assigned || null,
        model_name: request?.model_name ?? request?.modelName ?? null,
        modelName,
        model_type: request?.model_type ?? request?.modelType ?? null,
        modelType,
        current_plan: request?.current_plan ?? request?.currentPlan ?? null,
        currentPlan,
        current_plan_end_date: request?.current_plan_end_date ?? request?.currentPlanEndDate ?? null,
        currentPlanEndDate,
        mac_id: request?.mac_id ?? request?.macId ?? null,
        macId,
        device_detail_id: deviceDetailId,
        deviceDetailId,
      };
    });
  }, []);

  const fetchData = useCallback(async (pageNum = 1, pageLimit = 10) => {
    setIsLoading(true);
    try {
      const reqsResult = await fetchRequests(pageNum, pageLimit);
      const reqs = reqsResult?.data || [];
      const pagination = reqsResult?.pagination || {};

      const filtered = reqs.filter((request) => request.task_id && String(request.task_id).trim() !== '' && request.task_id !== '-');
      const sorted = filtered.sort((a, b) => {
        const aTime = new Date(a?.created_date || a?.createdAt || 0).getTime();
        const bTime = new Date(b?.created_date || b?.createdAt || 0).getTime();
        return bTime - aTime;
      });

      setRequests(sorted);
      setDisplayRequests(sorted);
      setSummary(calculateRequestSummary(sorted));
      setCurrentPage(pagination.currentPage || pageNum);
      setPageSize(pagination.pageSize || pageLimit);
      setTotalRecords(pagination.totalRecords || 0);
      setTotalPages(pagination.totalPages || 0);
      setError('');
      setIsLoading(false);

      Promise.all([
        fetchTechnicians(),
        fetchDevices(),
        fetchRequestCounts(),
      ]).then(([techs, devs]) => {
        const filteredTechnicians = isSeller && sellerDistrict
          ? techs.filter((tech) => {
              const district = (tech?.district || tech?.assigned_district || '').trim().toLowerCase();
              return district ? district === sellerDistrict.trim().toLowerCase() : false;
            })
          : techs;

        const normalizeDeviceKey = (value) => (value ? String(value).trim().toLowerCase() : '');

        const normalizedDevices = (devs || []).map((device) => {
          const modelName = device?.model_name || device?.modelName || null;
          const modelType = device?.model_type || device?.modelType || null;
          const currentPlan = device?.current_plan || device?.currentPlan || null;
          const currentPlanEndDate = device?.current_plan_end_date || device?.currentPlanEndDate || null;
          const macId = device?.mac_id || device?.macId || null;
          const detailId = device?.device_detail_id || device?.deviceDetailId || null;

          return {
            ...device,
            model_name: device?.model_name ?? device?.modelName ?? null,
            modelName,
            model_type: device?.model_type ?? device?.modelType ?? null,
            modelType,
            current_plan: device?.current_plan ?? device?.currentPlan ?? null,
            currentPlan,
            current_plan_end_date: device?.current_plan_end_date ?? device?.currentPlanEndDate ?? null,
            currentPlanEndDate,
            mac_id: device?.mac_id ?? device?.macId ?? null,
            macId,
            device_detail_id: detailId,
            deviceDetailId: detailId,
          };
        });

        const enriched = enrichRequests(sorted, filteredTechnicians);

        const blockedDeviceIds = new Set(
          enriched
            .filter((request) => {
              const status = String(request?.task_status || '').trim().toLowerCase();
              return status !== 'completed';
            })
            .map((request) => normalizeDeviceKey(request?.wp_device_id || request?.device_id))
            .filter(Boolean)
        );

        const availableDevices = normalizedDevices.filter((device) => {
          const key = normalizeDeviceKey(device?.wp_device_id || device?.device_id);
          if (!key) {
            return true;
          }
          return !blockedDeviceIds.has(key);
        });

        setTechnicians(filteredTechnicians);
        setDevices(availableDevices);
        setRequests(enriched);
        setDisplayRequests(enriched);
      }).catch((err) => {
        console.error('Error loading technicians and devices:', err);
      });
    } catch (err) {
      setError('Failed to fetch manual requests');
      showErrorAlert('Failed to fetch manual requests');
      setIsLoading(false);
    }
  }, [enrichRequests, fetchDevices, fetchRequests, fetchTechnicians, fetchRequestCounts, isSeller, sellerDistrict, calculateRequestSummary]);

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    fetchData(newPage, pageSize);
  };

  const handlePageSizeChange = (newSize) => {
    setPageSize(newSize);
    setCurrentPage(1);
    fetchData(1, newSize);
  };

  useEffect(() => {
    fetchData(currentPage, pageSize);
  }, [currentPage, pageSize, fetchData]);

  const applyFilters = (filterType, search) => {
    let filtered = requests;

    if (filterType === 'pending') {
      filtered = filtered.filter(
        (request) => (request.task_status || '').toLowerCase() === 'pending'
      );
    } else if (filterType === 'completed') {
      filtered = filtered.filter(
        (request) => (request.task_status || '').toLowerCase() === 'completed'
      );
    } else if (filterType === 'inProgress') {
      filtered = filtered.filter((request) => {
        const status = (request.task_status || '').toLowerCase();
        return status === 'in progress' || status === 'in_progress';
      });
    } else if (filterType === 'rejected') {
      filtered = filtered.filter(
        (request) => (request.task_status || '').toLowerCase() === 'rejected'
      );
    }

    if (search.trim()) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter((request) => {
        const idMatch = request?.task_id?.toString().toLowerCase().includes(searchLower);
        const deviceMatch = (request?.wp_device_id || '').toLowerCase().includes(searchLower);
        const emailMatch = (request?.task_created_by_user_email || '').toLowerCase().includes(searchLower);
        const technicianMatch = (request?.assignedTechnician?.name || request?.assignedTechnician?.technician_name || '').toLowerCase().includes(searchLower);
        return idMatch || deviceMatch || emailMatch || technicianMatch;
      });
    }

    setDisplayRequests(filtered);
  };

  const handleFilterSelect = (filterType) => {
    const sanitized = filterType || '';
    const newFilter = selectedFilter === sanitized ? '' : sanitized;
    setSelectedFilter(newFilter);
    applyFilters(newFilter, searchText);
  };

  const handleSearchChange = (e) => {
    const value = e.target.value || '';
    setSearchText(value);
    applyFilters(selectedFilter, value);
  };

  const assignManualRequest = async ({ task_id, technician_id }) => {
    try {
      await axiosInstance.post('/api/admin/AssignManualRequest', { task_id, technician_id });
      showSuccessAlert('Manual request assigned successfully');
      await fetchData();
    } catch (err) {
      const message = err?.response?.data?.message || 'Assignment failed';
      showErrorAlert(message);
      throw err;
    }
  };

  const reassignManualRequest = async ({ task_id, technician_id }) => {
    try {
      await axiosInstance.post('/api/admin/ReAssignManualRequest', { task_id, technician_id });
      showSuccessAlert('Manual request reassigned successfully');
      await fetchData();
    } catch (err) {
      const message = err?.response?.data?.message || 'Reassignment failed';
      showErrorAlert(message);
      throw err;
    }
  };

  const createManualRequest = async ({
    wp_device_id,
    customer_user_id,
    assigned_technician_id,
    request_source,
    request_type,
  }) => {
    try {
      await axiosInstance.post('/api/admin/CreateManualRequest', {
        wp_device_id,
        customer_user_id,
        assigned_technician_id,
        technician_id: assigned_technician_id,
        request_source,
        request_type,
      });
      showSuccessAlert('Manual request created successfully');
      await fetchData();
    } catch (err) {
      const message = err?.response?.data?.message || 'Creation failed';
      showErrorAlert(message);
      throw err;
    }
  };

  return {
    requests: displayRequests,
    technicians,
    devices,
    isLoading,
    error,
    searchTerm,
    handleSearchChange,
    assignManualRequest,
    reassignManualRequest,
    createManualRequest,
    refetch: fetchData,
    requestCounts,
    summary,
    selectedFilter,
    handleFilterSelect,
    currentPage,
    pageSize,
    totalRecords,
    totalPages,
    handlePageChange,
    handlePageSizeChange,
  };
};

export default useManageRequests;
