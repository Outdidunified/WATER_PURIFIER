//ViewServices
import Header from '../../components/Header';
import Sidebar from '../../components/Sidebar';
import Footer from '../../components/Footer';
import { useNavigate } from 'react-router-dom';
import useViewServices from '../../hooks/ManageServices/ViewServicesHooks';
const ViewServices = ({ userInfo, handleLogout }) => {
  const navigate = useNavigate();
  const installationTasks = useViewServices();

  const resolveTechnicianName = (task) => {
    return (
      task.assignedTechnician?.technician_name ||
      task.assignedTechnician?.name ||
      task.assigned_technician_name ||
      '-'
    );
  };

  const resolveTechnicianId = (task) => {
    return task.assignedTechnician?.technician_id || task.assigned_technician_id || '-';
  };

  const resolvePendingReason = (task) => {
    return task.pending_reason || task.pendingReason || '-';
  };

  const resolveAssignedDate = (task) => {
    const dateValue = task.assigned_date || task.task_assigned_date || task.assignedDate;
    if (!dateValue) return '-';
    const parsedDate = new Date(dateValue);
    return Number.isNaN(parsedDate.getTime()) ? '-' : parsedDate.toLocaleString();
  };

  const resolveDeviceId = (task) => {
    return task.device_id || task.wp_device_id || '-';
  };

  const resolveCreatedDate = (task) => {
    const dateValue = task.created_date || task.createdDate;
    if (!dateValue) return '-';
    const parsedDate = new Date(dateValue);
    return Number.isNaN(parsedDate.getTime()) ? '-' : parsedDate.toLocaleString();
  };

  const resolveModifiedDate = (task) => {
    const dateValue = task.modified_date || task.modifiedDate;
    if (!dateValue) return '-';
    const parsedDate = new Date(dateValue);
    return Number.isNaN(parsedDate.getTime()) ? '-' : parsedDate.toLocaleString();
  };

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
                        <div className="col-md-4">
                          <strong>Status:</strong> <span>{task.task_status || '-'}</span>
                        </div>
                        <div className="col-md-4">
                          <strong>Type:</strong>{' '}
                          <span>
                            {{
                              1: 'Installation',
                              2: 'Services',
                              3: 'Repair',
                            }[task.task_type] || '-'}
                          </span>
                        </div>
                        <div className="col-md-4">
                        </div>
                      </div>

                      <div className="row viewDataCss mt-2">
                        <div className="col-md-4">
                          <strong>Technician Name:</strong>{' '}
                          <span>{resolveTechnicianName(task)}</span>
                        </div>
                        <div className="col-md-4">
                          <strong>Technician ID:</strong>{' '}
                          <span>{resolveTechnicianId(task)}</span>
                        </div>
                        <div className="col-md-4">
                          <strong>Pending Reason:</strong>{' '}
                          <span>{resolvePendingReason(task)}</span>
                        </div>
                      </div>

                      <div className="row viewDataCss mt-2">
                        <div className="col-md-4">
                          <strong>Assigned Date:</strong>{' '}
                          <span>{resolveAssignedDate(task)}</span>
                        </div>
                        <div className="col-md-4">
                          <strong>Created By:</strong>{' '}
                          <span>{task.task_created_by_user_email || '-'}</span>
                        </div>
                        <div className="col-md-4">
                          <strong>Device ID:</strong> <span>{resolveDeviceId(task)}</span>
                        </div>
                      </div>

                      <div className="row viewDataCss mt-2">
                        <div className="col-md-4">
                          <strong>OTP:</strong> <span>{task.otp || '-'}</span>
                        </div>
                        <div className="col-md-4">
                          <strong>Created Date:</strong>{' '}
                          <span>{resolveCreatedDate(task)}</span>
                        </div>
                        <div className="col-md-4">
                          <strong>Modified Date:</strong>{' '}
                          <span>{resolveModifiedDate(task)}</span>
                        </div>
                      </div>

                      <div className="row viewDataCss mt-2">
                        <div className="col-md-4">
                          <strong>Modified By:</strong> <span>{task.modified_by || '-'}</span>
                        </div>
                      </div>

                      

                      {/* Image Before Service */}
                      {task.image_before_service?.length > 0 && (
                        <div className="row viewDataCss mt-3">
                          <div className="col-md-12">
                            <strong>Before Service Images:</strong>
                            <div className="row mt-2">
                              {task.image_before_service.map((img, idx) => (
                                <div className="col-md-3 mb-2" key={idx}>
                                  <img
                                    src={`/upload${img}`}
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
                            <strong>After Service Images:</strong>
                            <div className="row mt-2">
                              {task.image_after_service.map((img, idx) => (
                                <div className="col-md-3 mb-2" key={idx}>
                                  <img
                                    src={`/upload${img}`}
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
