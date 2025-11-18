import React from 'react';
import Header from '../../components/Header';
import Sidebar from '../../components/Sidebar';
import Footer from '../../components/Footer';
import { useLocation, useNavigate } from 'react-router-dom';

const ViewManageRequests = ({ userInfo, handleLogout }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const request = location.state?.request || null;

  const goBack = () => {
    navigate(-1);
  };

  const renderAddress = (address) => {
    if (!address || typeof address !== 'object') return '-';
    const parts = [
      address.addressLine1,
      address.addressLine2,
      address.city,
      address.district,
      address.state,
      address.pincode,
    ].filter(Boolean);
    if (parts.length === 0) {
      return '-';
    }
    return parts.join(', ');
  };

  const formatDateTime = (value) => {
    if (!value) return '-';
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? '-' : parsed.toLocaleString();
  };

  const renderAssignmentHistory = (history) => {
    if (!Array.isArray(history) || history.length === 0) {
      return (
        <tr>
          <td colSpan="4" style={{ textAlign: 'center' }}>
            No assignment history available.
          </td>
        </tr>
      );
    }

    return history.map((entry, index) => {
      const assignedDate = entry.assigned_date || entry.assignedDate;
      const formattedDate = assignedDate ? new Date(assignedDate).toLocaleString() : '-';
      const historyStatus = entry.status || entry.task_status || '-';

      return (
        <tr key={index}>
          <td>{entry.technician_id || entry.assigned_technician_id || '-'}</td>
          <td>{entry.assigned_by || '-'}</td>
          <td>{formattedDate}</td>
          <td>{historyStatus}</td>
        </tr>
      );
    });
  };

  const assignedDateValue =
    request?.assigned_date || request?.task_assigned_date || request?.assignedDate;
  const createdDateValue =
    request?.created_at || request?.task_created_at || request?.createdAt || request?.created_date || request?.taskCreatedAt;
  const completionDateValue =
    request?.completed_date || request?.completion_date || request?.task_completion_date || request?.completionDate;
  const addressDetails =
    request && typeof (request.address || request.deliveryAddress) === 'object'
      ? request.address || request.deliveryAddress
      : null;
  const assignedTechnician = request?.assignedTechnician || null;
  const technicianName =
    assignedTechnician?.name || assignedTechnician?.technician_name || '-';
  const technicianEmail = assignedTechnician?.email || '-';
  const technicianPhone = assignedTechnician?.phone || assignedTechnician?.mobile || '-';

  return (
    <div className="container-scroller">
      <Header userInfo={userInfo} handleLogout={handleLogout} />
      <div className="container-fluid page-body-wrapper">
        <Sidebar userInfo={userInfo} />
        <div className="main-panel">
          <div className="content-wrapper">
            <div className="row">
              <div className="col-md-12 grid-margin">
                <div className="row">
                  <div className="col-12 col-xl-8 mb-4 mb-xl-0">
                    <h3 className="font-weight-bold">View  Request</h3>
                  </div>
                  <div className="col-12 col-xl-4 d-flex justify-content-xl-end align-items-start">
                    <button type="button" className="btn btn-outline-secondary" onClick={goBack}>
                      Back
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="row">
              <div className="col-lg-12 grid-margin stretch-card">
                <div className="card">
                  <div className="card-body">
                    {request ? (
                      <div className="detail-card">
                        <div className="detail-header" style={{ color: '#007bff' }}>
                          Request ID: {request.task_id || '-'}
                        </div>

                        <div className="detail-section">
                          <div className="detail-section-title" style={{ color: '#007bff' }}>Request Details</div>
                          <div className="detail-grid">
                            <div className="detail-item">
                              <span className="detail-label">Task ID</span>
                              <span className="detail-value">{request.task_id || '-'}</span>
                            </div>
                            <div className="detail-item">
                              <span className="detail-label">Device ID</span>
                              <span className="detail-value">{request.wp_device_id || '-'}</span>
                            </div>
                            <div className="detail-item">
                              <span className="detail-label">Status</span>
                              <span className="detail-value">{request.task_status || '-'}</span>
                            </div>

                            <div className="detail-item">
                              <span className="detail-label">Request Source</span>
                              <span className="detail-value">{request.request_source || '-'}</span>
                            </div>
                            <div className="detail-item">
                              <span className="detail-label">Created At</span>
                              <span className="detail-value">{formatDateTime(createdDateValue)}</span>
                            </div>
                            <div className="detail-item">
                              <span className="detail-label">Assigned Date</span>
                              <span className="detail-value">{formatDateTime(assignedDateValue)}</span>
                            </div>
                            <div className="detail-item">
                              <span className="detail-label">Created By</span>
                              <span className="detail-value">{request.task_created_by_user_email || '-'}</span>
                            </div>
                          </div>
                        </div>

                        <div className="detail-section">
                          <div className="detail-section-title" style={{ color: '#007bff' }}>Customer Details</div>
                          <div className="detail-grid">
                            <div className="detail-item">
                              <span className="detail-label">Name</span>
                              <span className="detail-value">{request.customer_name
                                || addressDetails?.name || request.task_created_by_user_name    ||  '-'}</span>
                            </div>
                            <div className="detail-item">
                              <span className="detail-label">Email</span>
                              <span className="detail-value">{request.customer_email || request.task_created_by_user_email || '-'}</span>
                            </div>
                            <div className="detail-item">
                              <span className="detail-label">Phone</span>
                              <span className="detail-value">{request.customer_phone || addressDetails?.phone || '-'}</span>
                            </div>
                            <div className="detail-item">
                              <span className="detail-label">Street</span>
                              <span className="detail-value">{addressDetails?.street || '-'}</span>
                            </div>
                            <div className="detail-item">
                              <span className="detail-label">City</span>
                              <span className="detail-value">{addressDetails?.city || '-'}</span>
                            </div>
                            <div className="detail-item">
                              <span className="detail-label">District</span>
                              <span className="detail-value">{addressDetails?.district || '-'}</span>
                            </div>
                            <div className="detail-item">
                              <span className="detail-label">State</span>
                              <span className="detail-value">{addressDetails?.state || '-'}</span>
                            </div>
                            <div className="detail-item">
                              <span className="detail-label">Pincode</span>
                              <span className="detail-value">{addressDetails?.pincode || '-'}</span>
                            </div>
                          </div>
                        </div>

                        <div className="detail-section">
                          <div className="detail-section-title" style={{ color: '#007bff' }}>Technician Details</div>
                          <div className="detail-grid">
                            <div className="detail-item">
                              <span className="detail-label">Technician ID</span>
                              <span className="detail-value">{request.assigned_technician_id || '-'}</span>
                            </div>
                            <div className="detail-item">
                              <span className="detail-label">Technician Name</span>
                              <span className="detail-value">{technicianName}</span>
                            </div>
                            <div className="detail-item">
                              <span className="detail-label">Technician Email</span>
                              <span className="detail-value">{technicianEmail}</span>
                            </div>
                            <div className="detail-item">
                              <span className="detail-label">Technician Phone</span>
                              <span className="detail-value">{technicianPhone}</span>
                            </div>
                            <div className="detail-item">
                              <span className="detail-label">Assigned Date</span>
                              <span className="detail-value">{formatDateTime(assignedDateValue)}</span>
                            </div>
                            <div className="detail-item">
                              <span className="detail-label">Assigned By</span>
                              <span className="detail-value">{request.assigned_by || request.task_assigned_by || '-'}</span>
                            </div>
                            <div className="detail-item">
                              <span className="detail-label">Completion Date</span>
                              <span className="detail-value">{formatDateTime(completionDateValue)}</span>
                            </div>
                            <div className="detail-item">
                              <span className="detail-label">Task Status</span>
                              <span className="detail-value">{request.task_status || '-'}</span>
                            </div>
                          </div>
                        </div>

                        {/* <div className="detail-section">
                          <div className="detail-section-title" style={{ color: '#007bff' }}>Assignment History</div>
                          <div className="detail-table">
                            <table>
                              <thead>
                                <tr>
                                  <th>Technician ID</th>
                                  <th>Assigned By</th>
                                  <th>Assigned Date</th>
                                  <th>Status</th>
                                </tr>
                              </thead>
                              <tbody>
                                {renderAssignmentHistory(
                                  request.assignment_history || request.assignmentHistory || []
                                )}
                              </tbody>
                            </table>
                          </div>
                        </div> */}
                      </div>
                    ) : (
                      <div className="alert alert-warning" role="alert">
                        No request data available. Please return to the Manage Requests page.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
          <Footer />
        </div>
      </div>
    </div>
  );
};

export default ViewManageRequests;
