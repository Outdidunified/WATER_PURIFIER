//ViewInstallations
import Header from '../../components/Header';
import Sidebar from '../../components/Sidebar';
import Footer from '../../components/Footer';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import useViewInstallations from '../../hooks/ManageInstallations/useViewInstallationsHooks';

const ViewInstallations = ({ userInfo, handleLogout }) => {
  const navigate = useNavigate();
  const installationTasks = useViewInstallations();
  const [assignmentHistory, setAssignmentHistory] = useState({});
  const [loadingHistory, setLoadingHistory] = useState({});
  const [technicianDetails, setTechnicianDetails] = useState({});
  const [loadingTechnicians, setLoadingTechnicians] = useState({});

  const handleBack = () => {
    navigate('/superadmin/ManageInstallations');
  };

  const fetchAssignmentHistory = async (taskId) => {
    if (!taskId || loadingHistory[taskId]) return;

    setLoadingHistory(prev => ({ ...prev, [taskId]: true }));

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/assignment-history/${taskId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const result = await response.json();
        if (result.status === 'Success') {
          setAssignmentHistory(prev => ({ ...prev, [taskId]: result.data }));
        }
      }
    } catch (error) {
      console.error('Error fetching assignment history:', error);
    } finally {
      setLoadingHistory(prev => ({ ...prev, [taskId]: false }));
    }
  };

  const fetchTechnicianDetails = async (technicianId) => {
    if (!technicianId || loadingTechnicians[technicianId]) return;

    setLoadingTechnicians(prev => ({ ...prev, [technicianId]: true }));

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/technician/${technicianId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const result = await response.json();
        if (result.status === 'Success') {
          setTechnicianDetails(prev => ({ ...prev, [technicianId]: result.data }));
        }
      }
    } catch (error) {
      console.error('Error fetching technician details:', error);
    } finally {
      setLoadingTechnicians(prev => ({ ...prev, [technicianId]: false }));
    }
  };

  // Fetch assignment history and technician details for all tasks when they load
  useEffect(() => {
    if (installationTasks && installationTasks.length > 0) {
      installationTasks.forEach(task => {
        if (task.task_id && !assignmentHistory[task.task_id] && !loadingHistory[task.task_id]) {
          fetchAssignmentHistory(task.task_id);
        }

        // Extract technician ID and fetch details
        const technicianId = task.technician_id ||
                           task.assigned_technician_id ||
                           (task.service_records && task.service_records.length > 0 && task.service_records[0].assigned_technician_id) ||
                           task.technicianId;

        if (technicianId && !technicianDetails[technicianId] && !loadingTechnicians[technicianId]) {
          fetchTechnicianDetails(technicianId);
        }
      });
    }
  }, [installationTasks]);

  const extractDateValue = (value) => {
    if (!value) return null;
    if (value instanceof Date) return value.toISOString();
    if (typeof value === 'object' && value !== null) {
      if ('$date' in value) {
        const nested = value.$date;
        if (typeof nested === 'object' && nested !== null) {
          if ('$numberLong' in nested) return Number(nested.$numberLong);
          if ('$numberInt' in nested) return Number(nested.$numberInt);
          return extractDateValue(nested);
        }
        return nested;
      }
      if ('$numberLong' in value) return Number(value.$numberLong);
      if ('$numberInt' in value) return Number(value.$numberInt);
    }
    return value;
  };

  const formatDate = (value) => {
    const dateValue = extractDateValue(value);
    return dateValue ? new Date(dateValue).toLocaleDateString() : '-';
  };
  const formatDateTime = (value) => {
    const dateValue = extractDateValue(value);
    return dateValue ? new Date(dateValue).toLocaleString() : '-';
  };

  const resolveTechnicianId = (record) => {
    if (!record) return '-';

    const toPlainString = (value) => {
      if (value === null || value === undefined) return '';
      if (typeof value === 'string') return value.trim();
      if (typeof value === 'number' || typeof value === 'bigint') return value.toString();
      if (typeof value === 'object') {
        if ('$date' in value) return toPlainString(value.$date);
        if ('$oid' in value) return toPlainString(value.$oid);
        if ('$numberInt' in value) return toPlainString(value.$numberInt);
        if ('$numberLong' in value) return toPlainString(value.$numberLong);
        if ('technician_id' in value) return toPlainString(value.technician_id);
        if ('assigned_technician_id' in value) return toPlainString(value.assigned_technician_id);
        if ('id' in value) return toPlainString(value.id);
        if (Array.isArray(value)) {
          for (const item of value) {
            const result = toPlainString(item);
            if (result) return result;
          }
          return '';
        }
        const stringValue = value.toString();
        return stringValue && stringValue !== '[object Object]' ? stringValue : '';
      }
      return '';
    };

    const values = [
      record.technician_id,
      record.assigned_technician_id,
      record.technicianId,
      record.assignedTechnicianId,
      record.technician_code,
      record.technicianCode,
      record.technicianID,
      record.technician_device_map_id,
      record.technician?.technician_id,
      record.technicianDetails?.technician_id,
      record.assignedTechnician?.technician_id,
      record.technician,
      record.technicianDetails,
      record.assignedTechnician,
    ];

    for (const value of values) {
      const resolved = toPlainString(value);
      if (resolved) return resolved;
    }

    return '-';
  };

  const normalizeHistoryEntries = (input) => {
    if (!input) return [];
    if (Array.isArray(input)) return input.filter(Boolean).map((entry) => ({ ...entry }));
    if (typeof input === 'object') return Object.values(input).filter(Boolean).map((entry) => ({ ...entry }));
    return [];
  };

  const collectAssignmentHistoryEntries = (task) => {
    const combined = [];
    const append = (value) => {
      const normalized = normalizeHistoryEntries(value);
      if (normalized.length > 0) combined.push(...normalized);
    };
    append(task.assignment_history);
    append(task.assignmentHistory);
    append(task.assignment_history_map);
    append(task.assignmentHistoryMap);
    append(task.assignmentHistoryList);
    append(task.order_snapshot?.assignment_history);
    append(task.order_snapshot?.assignmentHistory);
    append(task.order_snapshot?.assignment_history_map);
    append(task.order_snapshot?.assignmentHistoryMap);
    return combined;
  };

  const mapHistoryEntry = (entry) => {
    if (!entry) return null;
    const technicianIdValue =
      resolveTechnicianId(entry) ||
      entry.technician_id ||
      entry.assigned_technician_id ||
      entry.technicianId ||
      entry.assignedTechnicianId ||
      entry.technician_device_map_id ||
      '';
    const technicianNameValue =
      entry.technician_name ||
      entry.technicianName ||
      entry.name ||
      entry.technician?.technician_name ||
      entry.technician?.name ||
      entry.technicianDetails?.technician_name ||
      entry.technicianDetails?.name ||
      entry.assignedTechnician?.technician_name ||
      entry.assignedTechnician?.name ||
      '';
    const technicianLabel =
      [technicianIdValue, technicianNameValue].filter(Boolean).join(' - ') ||
      technicianIdValue ||
      technicianNameValue ||
      '-';
    const assignedByValue = entry.assigned_by || entry.assignedBy || '-';
    const assignedDateValue =
      entry.assigned_date ||
      entry.assignedDate ||
      entry.recorded_at ||
      entry.recordedAt ||
      null;
    const pendingReasonValue =
      entry.unassigned_reason ||
      entry.unassignedReason ||
      entry.pending_reason ||
      entry.pendingReason ||
      entry.pending_reason_text ||
      entry.pendingReasonText ||
      entry.reassigned_reason ||
      entry.reassignedReason ||
      '-';

    return {
      technicianLabel,
      technicianId: technicianIdValue || technicianNameValue || '-',
      assignedBy: assignedByValue,
      assignedDate: assignedDateValue,
      pendingReason: pendingReasonValue,
    };
  };

  const toValidTimestamp = (value) => {
    const resolved = extractDateValue(value);
    if (!resolved) return 0;
    const timestamp = new Date(resolved).getTime();
    return Number.isNaN(timestamp) ? 0 : timestamp;
  };

  return (
    <div className="container-scroller">
      <Header userInfo={userInfo} handleLogout={handleLogout} />
      <div className="container-fluid page-body-wrapper">
        <Sidebar />
        <div className="main-panel">
          <div className="content-wrapper">
            <div className="row">
              <div className="col-md-12 grid-margin">
                <div className="row">
                  <div className="col-12 col-xl-8 mb-4 mb-xl-0">
                    <h3 className="font-weight-bold">Installation Tasks Details</h3>
                  </div>
                  <div className="col-12 col-xl-4">
                    <div className="justify-content-end d-flex">
                      <button type="button" className="btn btn-success" onClick={handleBack}>
                        Back
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {installationTasks.length === 0 ? (
              <p>No installation tasks found.</p>
            ) : (
              installationTasks.map((task, index) => {
                const technician = task.technicianDetails || task.assignedTechnician || {};
                const serviceRecord =
                  task?.service_records && task.service_records.length > 0
                    ? task.service_records[0]
                    : {};
                const delivery = task.deliveryAddress || {};
                const deviceInfo = task.deviceDetails || task.device || {};
                const paymentDetails = task.paymentDetails || {};
                const planInfo = task.selectedPlan || serviceRecord?.plan_details || {};
                const durationInfo = task.selectedDuration || serviceRecord?.duration_details || {};

                const assignedDate =
                  task.task_assigned_date ||
                  serviceRecord.assigned_date ||
                  serviceRecord.assignedDate;
                const releasedDate =
                  task.task_released_date ||
                  serviceRecord.released_date ||
                  serviceRecord.releasedDate;
                const completedDate =
                  task.task_completed_date ||
                  serviceRecord.completed_date ||
                  serviceRecord.completedAt;
                const subscriptionExpiry =
                  task.subscriptionExpiryDate ||
                  task.subscription_expiry_date ||
                  serviceRecord.subscriptionExpiryDate ||
                  serviceRecord.subscription_expiry_date;
                const technicianId =
                  technician.technician_id ||
                  serviceRecord.assigned_technician_id ||
                  task.assigned_technician_id ||
                  task.technician_id ||
                  task.technicianId;

                // Get technician details from fetched data
                const fetchedTechnician = technicianDetails[technicianId] || {};

                const technicianName =
                  fetchedTechnician.technician_name ||
                  fetchedTechnician.name ||
                  fetchedTechnician.full_name ||
                  technician.technician_name ||
                  technician.name ||
                  task.assignedTechnician?.name ||
                  serviceRecord.technician_name ||
                  task.technician_name ||
                  task.name ||
                  task.technician_full_name ||
                  task.technicianName ||
                  technicianId; // fallback to ID if no name available

                const technicianPhone =
                  fetchedTechnician.technician_phone ||
                  fetchedTechnician.phone ||
                  fetchedTechnician.mobile ||
                  fetchedTechnician.contact_number ||
                  fetchedTechnician.contactNumber ||
                  technician.technician_phone ||
                  technician.phone ||
                  technician.mobile ||
                  technician.contact_number ||
                  technician.contactNumber ||
                  task.assignedTechnician?.phone ||
                  serviceRecord.phone ||
                  task.technician_phone ||
                  task.phone ||
                  task.technician_phone_number ||
                  task.technician_mobile;

                const technicianEmail =
                  fetchedTechnician.technician_email ||
                  fetchedTechnician.email ||
                  fetchedTechnician.contact_email ||
                  fetchedTechnician.contactEmail ||
                  technician.technician_email ||
                  technician.email ||
                  technician.contactEmail ||
                  task.assignedTechnician?.email ||
                  serviceRecord.technician_email ||
                  task.technician_email ||
                  task.email ||
                  task.technician_email_address;
                const completionNotes =
                  task.task_completion_notes ||
                  serviceRecord.remarks ||
                  serviceRecord.completion_notes ||
                  serviceRecord.completionNotes;
                const releaseNotes =
                  serviceRecord.release_notes ||
                  serviceRecord.releaseNotes ||
                  serviceRecord.release_reason ||
                  serviceRecord.releaseReason;
                const taskStatus =
                  task.task_status ||
                  serviceRecord.task_status ||
                  serviceRecord.status ||
                  task.orderStatus;
                const assignedBy =
                  task.task_assigned_by || serviceRecord.assigned_by || serviceRecord.assignedBy;
                const releasedBy =
                  task.task_released_by || serviceRecord.released_by || serviceRecord.releasedBy;
                const grandTotal =
                  task.grandTotal ?? paymentDetails.grandTotal ?? paymentDetails.totalAmount;
                const totalLitre =
                  task.totalLitre ?? paymentDetails.totalLitre ?? deviceInfo.totalLitre;
                const durationLabel =
                  durationInfo?.duration_time_limit ||
                  durationInfo?.label ||
                  serviceRecord.duration ||
                  serviceRecord.duration_label;
                const planLabel =
                  planInfo?.label ||
                  planInfo?.name ||
                  serviceRecord.plan_name ||
                  serviceRecord.plan;
                const planCapacity =
                  planInfo?.capacity || serviceRecord.plan_capacity || serviceRecord.capacity;
                const deviceSerial =
                  task.serial_number ||
                  task.deviceSerial ||
                  deviceInfo.serial_number ||
                  deviceInfo.serialNumber;
                const customerEmail =
                  task.email || delivery.email || task.customerEmail || task.order_user_email;
                const customerPhone =
                  delivery.phone ||
                  delivery.mobile ||
                  delivery.contactNumber ||
                  task.phone ||
                  task.contactNumber;
                const addressLine1 =
                  delivery.addressLine1 || delivery.address1 || delivery.address || '';
                const addressLine2 =
                  delivery.addressLine2 || delivery.address2 || delivery.landmark || '';
                const fullAddress = [addressLine1, addressLine2].filter(Boolean).join(' ')|| delivery.street;
                const city = delivery.city || delivery.town || delivery.city_town || '';
                const district =
                  delivery.district || delivery.state_district || task.district || '';
                const state = delivery.state || delivery.province || task.state || '';
                const country = delivery.country || task.country || '';
                const pincode =
                  delivery.pincode || delivery.zipcode || delivery.postalCode || '';
                const razorpayOrderId =
                  task.razorpayOrderId ||
                  paymentDetails.razorpayOrderId ||
                  paymentDetails.orderId;
                const razorpayPaymentId =
                  task.razorpayPaymentId ||
                  paymentDetails.razorpayPaymentId ||
                  paymentDetails.paymentId;
                const createdAt =
                  task.createdAt ||
                  task.created_at ||
                  serviceRecord.created_at ||
                  serviceRecord.createdAt;
                const imageAfterService = task.image_after_service || serviceRecord.image_after_service || [];
                // Use fetched assignment history data, fallback to task data
                const fetchedHistory = assignmentHistory[task.task_id] || [];
                const historySourceEntries = fetchedHistory.length > 0
                  ? fetchedHistory
                  : collectAssignmentHistoryEntries(task);
                const fallbackServiceEntries = Array.isArray(task.service_records)
                  ? task.service_records
                  : [];
                const prioritizedEntries =
                  historySourceEntries.length > 0 ? historySourceEntries : fallbackServiceEntries;
                const historyRows = prioritizedEntries
                  .map((entry) => mapHistoryEntry(entry))
                  .filter(Boolean)
                  .sort(
                    (a, b) => toValidTimestamp(b.assignedDate) - toValidTimestamp(a.assignedDate),
                  );

                return (
                  <div
                    className="row"
                    key={task._id || task.task_id || task.wp_device_id || index}
                  >
                    <div className="col-lg-12 grid-margin stretch-card">
                      <div className="card">
                        <div className="card-body">
                          <h4 className="card-title text-center pb-3" style={{ color: '#007bff' }}>
                            Order ID: {task.customOrderId}
                          </h4>
                          <hr />

                          <div className="row viewDataCss">
                            <div className="col-md-4 view-data-item">
                              <span className="view-data-label">Model Name</span><span className="view-data-value">{task.modelName || '-'}</span>
                            </div>
                            <div className="col-md-4 view-data-item">
                              <span className="view-data-label">Device ID</span><span className="view-data-value">{task.wp_device_id || '-'}</span>
                            </div>
                            <div className="col-md-4 view-data-item">
                              <span className="view-data-label">Plan</span><span className="view-data-value">{planLabel || '-'}
                              {planCapacity ? ` (${planCapacity})` : ''}</span>
                            </div>

                          </div>

                          <div className="row viewDataCss mt-2">
                            
                            <div className="col-md-4 view-data-item">
                              <span className="view-data-label">Duration</span><span className="view-data-value">{durationLabel || '-'}</span>
                            </div>
                            <div className="col-md-4 view-data-item">
                              <span className="view-data-label">Total Litre</span><span className="view-data-value">{totalLitre ?? '-'}</span>
                            </div>
                            <div className="col-md-4 view-data-item">
                              <span className="view-data-label">Grand Total</span><span className="view-data-value">
                              {grandTotal !== undefined && grandTotal !== null
                                ? `₹${Number(grandTotal).toLocaleString()}`
                                : '-'}</span>
                            </div>
                          </div>

                          <div className="row viewDataCss mt-2">
                            
                            <div className="col-md-4 view-data-item">
                                 <span className="view-data-label">Created At</span><span className="view-data-value">{formatDateTime(createdAt)}</span>
                            </div>
                             <div className="col-md-4 view-data-item">
                              <span className="view-data-label">Order User ID</span><span className="view-data-value">{task.order_user_id || task.user_id || '-'}</span>
                            </div>
                            <div className="col-md-4 view-data-item">
                              <span className="view-data-label">Payment Status</span><span className="view-data-value">
                              {task.paymentStatus || paymentDetails.status || '-'}</span>
                            </div>
                          </div>
                          <div className="row viewDataCss mt-2">                           
                            <div className="col-md-4 view-data-item">
                              <span className="view-data-label">Order Status</span><span className="view-data-value">{task.orderStatus || '-'}</span>
                            </div>
                            <div className="col-md-4 view-data-item">
                              <span className="view-data-label">Razorpay Order ID</span><span className="view-data-value">{razorpayOrderId || '-'}</span>
                            </div>
                            <div className="col-md-4 view-data-item">
                              <span className="view-data-label">Razorpay Payment ID</span><span className="view-data-value">{razorpayPaymentId || '-'}</span>
                            </div>
                          </div>
                          <div className="row viewDataCss mt-4">
                            <div className="col-12">
                              <h5 className="font-weight-bold" style={{ color: '#007bff' }}>
                                Customer Details
                              </h5>
                              <hr />
                            </div>
                            <div className="col-md-4 view-data-item">
                              <span className="view-data-label">Name</span><span className="view-data-value">{delivery.name || '-'}</span>
                            </div>
                            <div className="col-md-4 view-data-item">
                              <span className="view-data-label">Customer Email</span><span className="view-data-value">{customerEmail || '-'}</span>
                            </div>
                            <div className="col-md-4 view-data-item">
                              <span className="view-data-label">Phone</span><span className="view-data-value">{customerPhone || '-'}</span>
                            </div>
                          </div>

                          <div className="row viewDataCss mt-2">
                            <div className="col-md-4 view-data-item">
                              <span className="view-data-label">Street</span><span className="view-data-value">{delivery.street || '-'}</span>
                            </div>
                            <div className="col-md-4 view-data-item">
                              <span className="view-data-label">Landmark</span><span className="view-data-value">{delivery.landmark || '-'}</span>
                            </div>
                            <div className="col-md-4 view-data-item">
                              <span className="view-data-label">City</span><span className="view-data-value">{city || '-'}</span>
                            </div>
                          </div>

                          <div className="row viewDataCss mt-2">
                            <div className="col-md-4 view-data-item">
                              <span className="view-data-label">District</span><span className="view-data-value">{district || '-'}</span>
                            </div>
                            <div className="col-md-4 view-data-item">
                              <span className="view-data-label">State</span><span className="view-data-value">{state || '-'}</span>
                            </div>
                            <div className="col-md-4 view-data-item">
                              <span className="view-data-label">Pincode</span><span className="view-data-value">{pincode || '-'}</span>
                            </div>
                          </div>

                          {/* <div className="row viewDataCss mt-4">
                            <div className="col-12">
                              <h5 className="font-weight-bold" style={{ color: '#007bff' }}>
                                Order & Payment Details
                              </h5>
                              <hr />
                            </div>
                            <div className="col-md-4">
                              <strong>Payment Status</strong>{' '}
                              {task.paymentStatus || paymentDetails.status || '-'}
                            </div>
                            <div className="col-md-4">
                              <strong>Order Status</strong> {task.orderStatus || '-'}
                            </div>
                            <div className="col-md-4">
                              <strong>Grand Total</strong>{' '}
                              {grandTotal !== undefined && grandTotal !== null
                                ? `₹${Number(grandTotal).toLocaleString()}`
                                : '-'}
                            </div>
                          </div>

                          <div className="row viewDataCss mt-2">
                            <div className="col-md-4">
                              <strong>Razorpay Order ID</strong> {razorpayOrderId || '-'}
                            </div>
                            <div className="col-md-4">
                              <strong>Razorpay Payment ID</strong> {razorpayPaymentId || '-'}
                            </div>
                            <div className="col-md-4">
                              <strong>Subscription Expiry</strong>{' '}
                              {formatDate(subscriptionExpiry)}
                            </div>
                          </div> */}
                                                    <div className="row viewDataCss mt-4">
                            <div className="col-12">
                              <h5 className="font-weight-bold" style={{ color: '#007bff' }}>
                                Technician Details
                              </h5>
                              <hr />
                            </div>
                            <div className="col-md-4 view-data-item">
                              <span className="view-data-label">Name</span><span className="view-data-value">{technicianName || '-'}</span>
                            </div>
                            <div className="col-md-4 view-data-item">
                              <span className="view-data-label">Technician ID</span><span className="view-data-value">{technicianId || '-'}</span>
                            </div>
                            <div className="col-md-4 view-data-item">
                              <span className="view-data-label">Technician Email</span><span className="view-data-value">{technicianEmail || '-'}</span>
                            </div>
                          </div>

                          <div className="row viewDataCss mt-2">
                            <div className="col-md-4 view-data-item">
                              <span className="view-data-label">Phone</span><span className="view-data-value">{technicianPhone || '-'}</span>
                            </div>
                            <div className="col-md-4 view-data-item">
                              <span className="view-data-label">Assigned Date</span><span className="view-data-value">{formatDateTime(assignedDate)}</span>
                            </div>
                            <div className="col-md-4 view-data-item">
                              <span className="view-data-label">Assigned By</span><span className="view-data-value">{assignedBy || '-'}</span>
                            </div>
                          </div>

                          {/* <div className="row viewDataCss mt-2">
                            <div className="col-md-4 view-data-item">
                              <span className="view-data-label">Released Date</span><span className="view-data-value">{formatDateTime(releasedDate)}</span>
                            </div>
                            <div className="col-md-4 view-data-item">
                              <span className="view-data-label">Released By</span><span className="view-data-value">{releasedBy || '-'}</span>
                            </div>
                            <div className="col-md-4 view-data-item">
                              <span className="view-data-label">Release Notes</span><span className="view-data-value">{releaseNotes || '-'}</span>
                            </div>
                          </div> */}

                          <div className="row viewDataCss mt-2">
                            <div className="col-md-4 view-data-item">
                              <span className="view-data-label">Completion Date</span><span className="view-data-value">{formatDateTime(completedDate)}</span>
                            </div>
                            {/* <div className="col-md-4 view-data-item">
                              <span className="view-data-label">Completion Notes</span><span className="view-data-value">{completionNotes || '-'}</span>
                            </div> */}
                            <div className="col-md-4 view-data-item">
                              <span className="view-data-label">Task Status</span><span className="view-data-value">{taskStatus || '-'}</span>
                            </div>
                          </div>
{/*
                          <div className="row viewDataCss mt-2">
                            <div className="col-md-4">
                              <strong>Subscription Expiry</strong>{' '}
                              {formatDate(subscriptionExpiry)}
                            </div>
                          </div> */}

                          {/* Image After Service */}
                          {imageAfterService?.length > 0 && (
                            <div className="row viewDataCss mt-3">
                              <div className="col-md-12">
                                <strong>After Service Images</strong>
                                <div className="row mt-2">
                                  {imageAfterService.map((img, idx) => (
                                    <div className="col-md-3 mb-2" key={idx}>
                                      <img
                                        src={`${img}`}
                                        alt={`After ${idx}`}
                                        className="img-fluid rounded"
                                        style={{ border: '1px solid #ccc', padding: '5px', maxHeight: '150px' }}
                                      />
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          )}

                          {historyRows.length > 0 && (
                            <div className="row viewDataCss mt-4">
                              <div className="col-12">
                                <h5 className="font-weight-bold" style={{ color: '#007bff' }}>
                                  Assignment History
                                </h5>
                                <hr />
                                <div className="table-responsive">
                                  <table className="table table-striped">
                                    <thead>
                                      <tr>
                                        <th>S.No</th>
                                        <th>Technician</th>
                                        <th>Assigned By</th>
                              
                                        <th>Reason</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {historyRows.map((record, recordIndex) => (
                                        <tr key={`${record.technicianLabel || record.technicianId || 'row'}-${recordIndex}`}>
                                          <td>{recordIndex + 1}</td>
                                          <td>{record.technicianLabel || record.technicianId || '-'}</td>
                                          <td>{record.assigned_by || '-'}</td>                                    
                                          <td>{record.reason || '-'}</td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            </div>
                          )}

                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
          <Footer />
        </div>
      </div>
    </div>
  );
};

export default ViewInstallations;