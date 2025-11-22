//ViewServices
import Header from '../../components/Header';
import Sidebar from '../../components/Sidebar';
import Footer from '../../components/Footer';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import useViewServices from '../../hooks/ManageServices/ViewServicesHooks';
const ViewServices = ({ userInfo, handleLogout }) => {
  const navigate = useNavigate();
  const installationTasks = useViewServices();
  const [assignmentHistory, setAssignmentHistory] = useState({});
  const [loadingHistory, setLoadingHistory] = useState({});

  const formatDateTime = (value) => {
    if (!value) return '-';
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? '-' : parsed.toLocaleString();
  };

  const resolveTechnicianName = (task) => (
    task.assignedTechnician?.technician_name ||
    task.assignedTechnician?.name ||
    task.assigned_technician_name ||
    task.technician_name ||
    '-'
  );

  const resolveTechnicianId = (task) => (
    task.assignedTechnician?.technician_id ||
    task.assigned_technician_id ||
    task.technician_id ||
    '-'
  );

  const resolveTechnicianEmail = (task) => (
    task.assignedTechnician?.technician_email ||
    task.assignedTechnician?.email ||
    task.assigned_technician_email ||
    task.technician_email ||
    '-'
  );

  const resolveTechnicianPhone = (task) => (
    task.assignedTechnician?.technician_phone ||
    task.assignedTechnician?.phone ||
    task.assignedTechnician?.mobile ||
    task.assignedTechnician?.contact_number ||
    task.assignedTechnician?.contactNumber ||
    task.technician_phone ||
    task.technician_mobile ||
    '-'
  );

  const resolveAssignedBy = (task) => (
    task.task_assigned_by ||
    task.assigned_by ||
    task.assignedTechnician?.assigned_by ||
    '-'
  );

  const resolvePendingReason = (task) => (
    task.pending_reason ||
    task.pendingReason ||
    task.pending_reason_text ||
    task.pendingReasonText ||
    '-'
  );

  const resolveAssignedDate = (task) =>
    formatDateTime(task.assigned_date || task.task_assigned_date || task.assignedDate);

  const resolveDeviceId = (task) => task.device_id || task.wp_device_id || '-';

  const resolveCreatedDate = (task) =>
    formatDateTime(task.created_date || task.createdDate || task.created_at || task.createdAt);

  const resolveModifiedDate = (task) =>
    formatDateTime(task.modified_date || task.modifiedDate || task.modified_at || task.modifiedAt);

  const resolveTaskDescription = (task) => {
    let description = task.task_description || '-';
    if (description !== '-') {
      // Remove "Device ID: ..." pattern from the description
      description = description.replace(/Device ID:\s*[^\s]+/gi, '').trim();
    }
    return description;
  };

  const resolveCustomerName = (task) => (
    task.customer_name ||
    task.deliveryAddress?.name ||
    task.task_created_by_user_name ||
    '-'
  );

  const resolveCustomerEmail = (task) => (
    task.customer_email ||
    task.deliveryAddress?.email ||
    task.task_created_by_user_email ||
    '-'
  );

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

  const mapHistoryEntry = (entry) => {
    if (!entry) return null;
    const technicianIdValue =
      entry.technician_id ||
      entry.assigned_technician_id ||
      entry.technicianId ||
      '';
    const technicianNameValue =
      entry.technician_name ||
      entry.name ||
      entry.technician?.technician_name ||
      entry.technician?.name ||
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
      entry.created_at ||
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
      entry.reason ||
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

  const handleBack = () => {
    navigate('/superadmin/ManageServices');
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

  // Fetch assignment history for all tasks when they load
  useEffect(() => {
    if (installationTasks && installationTasks.length > 0) {
      installationTasks.forEach(task => {
        if (task.task_id && !assignmentHistory[task.task_id] && !loadingHistory[task.task_id]) {
          fetchAssignmentHistory(task.task_id);
        }
      });
    }
  }, [installationTasks]);

 
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
                  <h3 className="font-weight-bold">Services Tasks Details</h3>
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
            installationTasks.map((task) => (
              <div className="row" key={task._id}>
                <div className="col-lg-12 grid-margin stretch-card">
                  <div className="card">
                    <div className="card-body">
                      <hr />
                      <div className="row viewDataCss">
                        <div className="col-md-4 view-data-item">
                          <span className="view-data-label">Status</span> <span className="view-data-value">{task.task_status || '-'}</span>
                        </div>
                        <div className="col-md-4 view-data-item">
                          <span className="view-data-label">Type</span>
                          <span className="view-data-value">
                            {{
                              1: 'Installation',
                              2: 'Services',
                              3: 'Repair',
                            }[task.task_type] || '-'}
                          </span>
                        </div>
                        <div className="col-md-4 view-data-item">
                          <span className="view-data-label">Pending Reason</span>
                          <span className="view-data-value">{resolvePendingReason(task)}</span>
                        </div>
                      </div>

                      <div className="row viewDataCss mt-4">
                        <div className="col-12">
                          <h5 className="font-weight-bold" style={{ color: '#007bff' }}>
                            Technician Details
                          </h5>
                          <hr />
                        </div>
                        <div className="col-md-4 view-data-item">
                          <span className="view-data-label">Name</span> <span className="view-data-value">{resolveTechnicianName(task)}</span>
                        </div>
                        <div className="col-md-4 view-data-item">
                          <span className="view-data-label">Technician ID</span> <span className="view-data-value">{resolveTechnicianId(task)}</span>
                        </div>
                        <div className="col-md-4 view-data-item">
                          <span className="view-data-label">Email</span>
                          <span className="view-data-value">{resolveTechnicianEmail(task)}</span>
                        </div>
                      </div>

                      <div className="row viewDataCss mt-2">
                        <div className="col-md-4 view-data-item">
                          <span className="view-data-label">Phone</span>
                          <span className="view-data-value">{resolveTechnicianPhone(task)}</span>
                        </div>
                        <div className="col-md-4 view-data-item">
                          <span className="view-data-label">Assigned Date</span>
                          <span className="view-data-value">{resolveAssignedDate(task)}</span>
                        </div>
                        <div className="col-md-4 view-data-item">
                          <span className="view-data-label">Assigned By</span>
                          <span className="view-data-value">{resolveAssignedBy(task)}</span>
                        </div>
                      </div>

                      <div className="row viewDataCss mt-4">
                        <div className="col-12">
                          <h5 className="font-weight-bold" style={{ color: '#007bff' }}>
                            Task Details
                          </h5>
                          <hr />
                        </div>
                                            <div className="col-md-4 view-data-item">
                          <span className="view-data-label">Device ID</span> <span className="view-data-value">{resolveDeviceId(task)}</span>
                        </div>
                        <div className="col-md-4 view-data-item">
                          <span className="view-data-label">Created By</span>
                          <span className="view-data-value">{task.task_created_by_user_email || '-'}</span>
                        </div>
                        <div className="col-md-4 view-data-item">
                          <span className="view-data-label">OTP</span> <span className="view-data-value">{task.otp || '-'}</span>
                        </div>
                      </div>

                      <div className="row viewDataCss mt-2">
                        <div className="col-md-4 view-data-item">
                          <span className="view-data-label">Created Date</span>
                          <span className="view-data-value">{resolveCreatedDate(task)}</span>
                        </div>
                        <div className="col-md-4 view-data-item">
                          <span className="view-data-label">Modified Date</span>
                          <span className="view-data-value">{resolveModifiedDate(task)}</span>
                        </div>
                        <div className="col-md-4 view-data-item">
                          <span className="view-data-label">Modified By</span> <span className="view-data-value">{task.modified_by || '-'}</span>
                        </div>
                      </div>
                      <div className="row viewDataCss mt-2">
                         <div className="col-md-4 view-data-item">
                          <span className="view-data-label">City</span>
                          <span className="view-data-value">{task.city || '-'}</span>
                        </div>
                        <div className="col-md-4 view-data-item">
                          <span className="view-data-label">District</span>
                          <span className="view-data-value">{task.district || '-'}</span>
                        </div>
                        <div className="col-md-4 view-data-item">
                          <span className="view-data-label">State</span>
                          <span className="view-data-value">{task.state || '-'}</span>
                        </div>

                      </div>

                      <div className="row viewDataCss mt-2">
                        <div className="col-md-4 view-data-item">
                          <span className="view-data-label">Pincode</span>
                          <span className="view-data-value">{task.pincode || '-'}</span>
                        </div>
                        <div className="col-md-4 view-data-item">
                          <span className="view-data-label">Modified Date</span>
                          <span className="view-data-value">{resolveModifiedDate(task)}</span>
                        </div>
                        <div className="col-md-4 view-data-item">
                          <span className="view-data-label">Modified By</span> <span className="view-data-value">{task.modified_by || '-'}</span>
                        </div>
                         <div className="col-md-12 view-data-item mb-3">
                          <span className="view-data-label">Task Description</span>
                          <span className="view-data-value" style={{ whiteSpace: 'pre-line' }}>{resolveTaskDescription(task)}</span>
                        </div>
                      </div>
                      

                      {/* Assignment History */}
                      {(() => {
                        const fetchedHistory = assignmentHistory[task.task_id] || [];
                        const historyRows = fetchedHistory
                          .map((entry) => mapHistoryEntry(entry))
                          .filter(Boolean)
                          .sort(
                            (a, b) => toValidTimestamp(b.assignedDate) - toValidTimestamp(a.assignedDate),
                          );

                        return historyRows.length > 0 ? (
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
                                      <th>#</th>
                                      <th>Technician</th>
                                      <th>Assigned By</th>
                                      <th>Assigned Date</th>
                                      <th>Reason</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {historyRows.map((record, recordIndex) => (
                                      <tr key={`${record.technicianLabel || record.technicianId || 'row'}-${recordIndex}`}>
                                        <td>{recordIndex + 1}</td>
                                        <td>{record.technicianLabel || record.technicianId || '-'}</td>
                                        <td>{record.assignedBy || '-'}</td>
                                        <td>{formatDateTime(record.assignedDate)}</td>
                                        <td>{record.pendingReason || '-'}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          </div>
                        ) : null;
                      })()}

                      {/* Image Before Service */}
                      {task.image_before_service?.length > 0 && (
                        <div className="row viewDataCss mt-3">
                          <div className="col-md-12">
                            <strong>Before Service Images</strong>
                            <div className="row mt-2">
                              {task.image_before_service.map((img, idx) => (
                                <div className="col-md-3 mb-2" key={idx}>
                                  <img
                                    src={`${img}`}
                                    alt={`Before ${idx}`}
                                    className="img-fluid rounded"
                                    style={{ border: '1px solid #ccc', padding: '5px', maxHeight: '150px' }}
                                  />
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Image After Service */}
                      {task.image_after_service?.length > 0 && (
                        <div className="row viewDataCss mt-3">
                          <div className="col-md-12">
                            <strong>After Service Images</strong>
                            <div className="row mt-2">
                              {task.image_after_service.map((img, idx) => (
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
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
        <Footer />
      </div>
    </div>
  </div>
);

};

export default ViewServices;
