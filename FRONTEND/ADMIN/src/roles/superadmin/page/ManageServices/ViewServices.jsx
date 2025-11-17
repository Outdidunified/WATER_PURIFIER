//ViewServices
import Header from '../../components/Header';
import Sidebar from '../../components/Sidebar';
import Footer from '../../components/Footer';
import { useNavigate } from 'react-router-dom';
import useViewServices from '../../hooks/ManageServices/ViewServicesHooks';
const ViewServices = ({ userInfo, handleLogout }) => {
  const navigate = useNavigate();
  const installationTasks = useViewServices();

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

  const handleBack = () => {
    navigate('/superadmin/ManageServices');
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
                      </div>

                      

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
