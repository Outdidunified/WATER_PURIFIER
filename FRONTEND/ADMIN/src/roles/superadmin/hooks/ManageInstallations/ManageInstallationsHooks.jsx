import { useState, useEffect, useCallback } from 'react';
import axiosInstance from '../../../../utils/utils';
import { showErrorAlert, showSuccessAlert } from '../../../../utils/alert';

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

      const orderMap = ords.reduce((acc, order) => {
        if (order?.wp_device_id) {
          acc[order.wp_device_id] = order;
        }
        return acc;
      }, {});

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

      const mergeServiceRecords = (taskItem, relatedOrder) => {
        const records = [];
        if (Array.isArray(taskItem?.service_records)) {
          records.push(...taskItem.service_records.filter(Boolean));
        }
        if (Array.isArray(relatedOrder?.service_records)) {
          records.push(...relatedOrder.service_records.filter(Boolean));
        }
        if (records.length <= 1) {
          return records;
        }
        return records.sort((a, b) => recordTimestamp(b) - recordTimestamp(a));
      };

      const computeTaskTimestamp = (latestRecord, taskItem, relatedOrder) => {
        return Math.max(
          recordTimestamp(latestRecord),
          toValidTimestamp(taskItem?.task_assigned_date),
          toValidTimestamp(taskItem?.createdAt),
          toValidTimestamp(taskItem?.updatedAt),
          toValidTimestamp(taskItem?.createddate),
          toValidTimestamp(relatedOrder?.task_assigned_date),
          toValidTimestamp(relatedOrder?.createdAt),
          toValidTimestamp(relatedOrder?.updatedAt),
          toValidTimestamp(relatedOrder?.createddate)
        );
      };

      const enrichedTasksWithTimestamp = tasks.map((task) => {
        const relatedOrder = orderMap[task?.wp_device_id] || null;
        const serviceRecords = mergeServiceRecords(task, relatedOrder);
        const primaryRecord =
          serviceRecords[0] ||
          (Array.isArray(task?.service_records) && task.service_records[0]) ||
          (Array.isArray(relatedOrder?.service_records) && relatedOrder.service_records[0]) ||
          null;
        const technicianFromMap = primaryRecord?.technician_device_map_id
          ? technicianMap[primaryRecord.technician_device_map_id]
          : null;

        const fallbackTechnician =
          !technicianFromMap && primaryRecord?.assigned_technician_id
            ? filteredTechnicians.find(
                (tech) => tech.technician_id === primaryRecord.assigned_technician_id
              )
            : null;

        const existingTechnician =
          task?.assignedTechnician ||
          task?.technicianDetails ||
          relatedOrder?.assignedTechnician ||
          null;

        const normalizedTechnician =
          technicianFromMap ||
          fallbackTechnician ||
          (existingTechnician
            ? {
                technician_name:
                  existingTechnician.technician_name ||
                  existingTechnician.name ||
                  existingTechnician.technicianName ||
                  '',
                technician_email: existingTechnician.technician_email || existingTechnician.email || '',
                technician_id: existingTechnician.technician_id || existingTechnician.technicianId || '',
                technician_user_id:
                  existingTechnician.technician_user_id || existingTechnician.user_id || '',
                technician_role_id: existingTechnician.technician_role_id || existingTechnician.role_id || '',
                technician_phone:
                  existingTechnician.technician_phone ||
                  existingTechnician.phone ||
                  existingTechnician.mobile ||
                  '',
              }
            : null);

        const taskAssignmentHistory = dedupeHistoryEntries(collectAssignmentHistory(task));
        const orderAssignmentHistory = dedupeHistoryEntries(collectAssignmentHistory(relatedOrder));
        const mergedAssignmentHistory = dedupeHistoryEntries([
          ...taskAssignmentHistory,
          ...orderAssignmentHistory,
        ]);

        const assignmentTimestamp = (entry) => {
          const assignedValue =
            extractAssignedDateValue(entry?.assigned_date) ||
            extractAssignedDateValue(entry?.assignedDate);
          if (assignedValue) {
            return toValidTimestamp(assignedValue);
          }
          return 0;
        };

        const assignmentHistory = mergedAssignmentHistory.length > 0
          ? mergedAssignmentHistory
              .map((entry, index) => ({ ...entry, _historyIndex: index }))
              .sort((a, b) => assignmentTimestamp(b) - assignmentTimestamp(a))
              .map(({ _historyIndex, ...rest }) => rest)
          : taskAssignmentHistory.length > 0
          ? taskAssignmentHistory
          : orderAssignmentHistory;

        const statusValue = (
          task?.task_status ||
          primaryRecord?.task_status ||
          relatedOrder?.task_status ||
          ''
        ).toString();
        const statusLower = statusValue.toLowerCase();
        const isAssignable = statusLower ? statusLower !== 'completed' : true;

        const timestamp = computeTaskTimestamp(primaryRecord, task, relatedOrder);

        return {
          ...(relatedOrder || {}),
          ...task,
          task_status: statusValue,
          pending_reason:
            task?.pending_reason ||
            primaryRecord?.pending_reason ||
            primaryRecord?.pending_reason_text ||
            '',
          service_records: serviceRecords,
          assignment_history: assignmentHistory,
          task_id: primaryRecord?.task_id || task?.task_id || null,
          task_assigned_date: primaryRecord?.assigned_date || task?.task_assigned_date || null,
          task_released_date: primaryRecord?.released_date || task?.task_released_date || null,
          task_assigned_by: primaryRecord?.assigned_by || task?.task_assigned_by || '',
          task_released_by: primaryRecord?.released_by || task?.task_released_by || '',
          task_completed_date: primaryRecord?.completed_at || task?.task_completed_date || null,
          task_completion_notes: primaryRecord?.remarks || task?.task_completion_notes || '',
          assignedTechnician: normalizedTechnician,
          assigned_technician_id:
            primaryRecord?.assigned_technician_id ||
            task?.assigned_technician_id ||
            normalizedTechnician?.technician_id ||
            null,
          order_user_id: relatedOrder?.user_id || task?.order_user_id || '',
          customOrderId: relatedOrder?.customOrderId || task?.customOrderId || '',
          deliveryAddress: relatedOrder?.deliveryAddress || task?.deliveryAddress || {},
          modelName: relatedOrder?.modelName || task?.modelName || '',
          email: relatedOrder?.email || task?.email || '',
          isAssignable,
          _timestamp: timestamp,
        };
      });

      const enrichedTasks = enrichedTasksWithTimestamp
        .sort((a, b) => (b._timestamp || 0) - (a._timestamp || 0))
        .map(({ _timestamp, ...rest }) => rest);

      const dedupedEnrichedList = dedupeTasksByIdentity(enrichedTasks);

      setEnrichedTaskList(dedupedEnrichedList);
      setDisplayTasks(dedupedEnrichedList);
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

    if (!value) {
      setDisplayTasks(enrichedTaskList);
      return;
    }

    const filteredEnriched = enrichedTaskList.filter((task) => {
      const deviceId = task.wp_device_id?.toLowerCase() || '';
      const orderId = task.customOrderId?.toLowerCase() || '';
      const userId = task.user_id?.toString() || task.order_user_id?.toString() || '';
      const technicianName =
        task.assignedTechnician?.technician_name?.toLowerCase() ||
        task.assignedTechnician?.name?.toLowerCase() ||
        '';
      const technicianId =
        task.assignedTechnician?.technician_id?.toLowerCase() ||
        task.assigned_technician_id?.toLowerCase() ||
        '';
      const customerName = task.deliveryAddress?.name?.toLowerCase() || '';
      const taskStatus = task.task_status?.toLowerCase() || '';
      const pendingReason = task.pending_reason?.toLowerCase() || '';

      return (
        deviceId.includes(value) ||
        orderId.includes(value) ||
        userId.includes(value) ||
        technicianName.includes(value) ||
        technicianId.includes(value) ||
        customerName.includes(value) ||
        taskStatus.includes(value) ||
        pendingReason.includes(value)
      );
    });

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
