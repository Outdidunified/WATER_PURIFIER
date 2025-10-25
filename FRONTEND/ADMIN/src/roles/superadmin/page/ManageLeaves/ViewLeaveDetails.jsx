// ViewLeaveDetails - View and manage individual leave request
import React, { useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import Header from '../../components/Header';
import Sidebar from '../../components/Sidebar';
import Footer from '../../components/Footer';
import ViewLeaveDetailsHooks from '../../hooks/ManageLeaves/ViewLeaveDetailsHooks';

const ViewLeaveDetails = ({ userInfo, handleLogout }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { leaveRequestId } = useParams();
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Get leave data from location state
  const leaveFromState = location.state?.dataItem?.[0];

  const {
    leaveDetails,
    pendingTasks,
    loading,
    error,
    actionLoading,
    actionError,
    rejectionReason,
    setRejectionReason,
    approveLeave,
    rejectLeave,
    getTasksCount,
  } = ViewLeaveDetailsHooks(leaveRequestId, leaveFromState);

  const handleApprove = async () => {
    const result = await approveLeave();
    if (result.success) {
      setSuccessMessage(result.message);
      setTimeout(() => {
        navigate('/superadmin/ManageLeaves');
      }, 2000);
    }
  };

  const handleReject = async () => {
    const result = await rejectLeave();
    if (result.success) {
      setSuccessMessage(result.message);
      setShowRejectModal(false);
      setTimeout(() => {
        navigate('/superadmin/ManageLeaves');
      }, 2000);
    }
  };

  if (loading) {
    return (
      <div className="container-scroller">
        <Header userInfo={userInfo} handleLogout={handleLogout} />
        <div className="container-fluid page-body-wrapper">
          <Sidebar userInfo={userInfo} />
          <div className="main-panel">
            <div className="content-wrapper" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
              <div className="spinner-border" role="status">
                <span className="sr-only">Loading...</span>
              </div>
            </div>
            <Footer />
          </div>
        </div>
      </div>
    );
  }

  if (error || !leaveDetails) {
    return (
      <div className="container-scroller">
        <Header userInfo={userInfo} handleLogout={handleLogout} />
        <div className="container-fluid page-body-wrapper">
          <Sidebar userInfo={userInfo} />
          <div className="main-panel">
            <div className="content-wrapper">
              <div className="row">
                <div className="col-md-12">
                  <div className="card">
                    <div className="card-body text-center" style={{ padding: '40px' }}>
                      <h4 className="text-danger mb-3">Error Loading Leave Request</h4>
                      <p className="text-muted mb-4">{error || 'Leave request not found'}</p>
                      <button
                        onClick={() => navigate('/superadmin/ManageLeaves')}
                        className="btn btn-primary"
                      >
                        ← Back to Leave Requests
                      </button>
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
  }

  const tasksCount = getTasksCount();
  const isProcessed = leaveDetails.status !== 'Requested';

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return '-';
    }
  };

  const getStatusBadgeClass = (status) => {
    const normalizedStatus = status?.toLowerCase();
    if (normalizedStatus === 'requested') return 'badge-warning';
    if (normalizedStatus === 'approved') return 'badge-success';
    if (normalizedStatus === 'rejected') return 'badge-danger';
    return 'badge-secondary';
  };

  const getTaskStatusBadgeClass = (status) => {
    const normalizedStatus = status?.toLowerCase().replace(/\s+/g, '_');
    if (normalizedStatus === 'pending') return 'warning';
    if (normalizedStatus === 'accepted') return 'info';
    if (normalizedStatus === 'in_progress') return 'primary';
    if (normalizedStatus === 'completed') return 'success';
    if (normalizedStatus === 'cancelled') return 'danger';
    return 'secondary';
  };

  return (
    <div className="container-scroller">
      <Header userInfo={userInfo} handleLogout={handleLogout} />
      <div className="container-fluid page-body-wrapper">
        <Sidebar userInfo={userInfo} />
        <div className="main-panel">
          <div className="content-wrapper">
            {/* Back Button */}
            <div className="row mb-3">
              <div className="col-md-12">
                <button
                  onClick={() => navigate('/superadmin/ManageLeaves')}
                  className="btn btn-outline-secondary btn-sm"
                  style={{ marginBottom: '15px' }}
                >
                  ← Back to Leave Requests
                </button>
              </div>
            </div>

            {/* Success Message */}
            {successMessage && (
              <div className="row mb-3">
                <div className="col-md-12">
                  <div className="alert alert-success alert-dismissible fade show" role="alert">
                    <strong>✓ Success!</strong> {successMessage}
                    <button type="button" className="close" onClick={() => setSuccessMessage('')}>
                      <span aria-hidden="true">&times;</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Action Error Message */}
            {actionError && (
              <div className="row mb-3">
                <div className="col-md-12">
                  <div className="alert alert-danger alert-dismissible fade show" role="alert">
                    <strong>✗ Error!</strong> {actionError}
                    <button type="button" className="close" onClick={() => { }}>
                      <span aria-hidden="true">&times;</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Page Title */}
            <div className="row">
              <div className="col-md-12 grid-margin">
                <div className="row align-items-center">
                  <div className="col-8">
                    <h3 className="font-weight-bold">Leave Request Details</h3>
                  </div>
                  <div className="col-4 text-right">
                    <span className={`badge ${getStatusBadgeClass(leaveDetails.status)}`} style={{ fontSize: '14px', padding: '6px 12px' }}>
                      {leaveDetails.status}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Main Content */}
            <div className="row">
              {/* Left Column - Details */}
              <div className="col-12 grid-margin stretch-card">
                <div className="card">
                  <div className="card-body">
                    {/* Technician Info */}
                    <div className="row mb-3">
                      <div className="col-md-6 mb-3">
                        <p className="text-muted small">Technician Name</p>
                        <h5 className="font-weight-bold">{leaveDetails.technician_name || '-'}</h5>
                      </div>
                      <div className="col-md-6 mb-3">
                        <p className="text-muted small">Technician ID</p>
                        <h5 className="font-weight-bold">{leaveDetails.technician_id || '-'}</h5>
                      </div>
                      <div className="col-md-6 mb-3">
                        <p className="text-muted small">Email</p>
                        <h5 className="font-weight-bold">{leaveDetails.technician_email || '-'}</h5>
                      </div>
                      <div className="col-md-6 mb-3">
                        <p className="text-muted small">Requested Date</p>
                        <h5 className="font-weight-bold">{formatDate(leaveDetails.requested_date)}</h5>
                      </div>
                    </div>

                    <hr />

                    {/* Leave Period */}
                    <div className="mb-3">
                      <h5 className="font-weight-bold mb-3">Leave Period</h5>
                      <div className="row">
                        <div className="col-md-4">
                          <div className="alert alert-info mb-0" role="alert" style={{ padding: '12px' }}>
                            <small className="text-muted">From Date</small>
                            <h6 className="font-weight-bold mb-0">{formatDate(leaveDetails.from_date)}</h6>
                          </div>
                        </div>
                        <div className="col-md-4">
                          <div className="alert alert-info mb-0" role="alert" style={{ padding: '12px' }}>
                            <small className="text-muted">To Date</small>
                            <h6 className="font-weight-bold mb-0">{formatDate(leaveDetails.to_date)}</h6>
                          </div>
                        </div>
                        <div className="col-md-4">
                          <div className="alert alert-info mb-0" role="alert" style={{ padding: '12px' }}>
                            <small className="text-muted">Number of Days</small>
                            <h6 className="font-weight-bold mb-0">{leaveDetails.number_of_days || 0} days</h6>
                          </div>
                        </div>
                      </div>
                    </div>

                    <hr />

                    {/* Reason */}
                    <div className="mb-3">
                      <p className="text-muted small">Leave Reason</p>
                      <div className="alert alert-light" role="alert">
                        <p className="mb-0">{leaveDetails.reason || '-'}</p>
                      </div>
                    </div>

                    {/* Approval Info (if processed) */}
                    {isProcessed && (
                      <>
                        <hr />
                        <div className="row">
                          <div className="col-md-6 mb-3">
                            <p className="text-muted small">Approval Date</p>
                            <h5 className="font-weight-bold">
                              {leaveDetails.approval_date ? formatDate(leaveDetails.approval_date) : 'N/A'}
                            </h5>
                          </div>
                          <div className="col-md-6 mb-3">
                            <p className="text-muted small">Approved By</p>
                            <h5 className="font-weight-bold">{leaveDetails.approved_by || 'N/A'}</h5>
                          </div>
                        </div>

                        {leaveDetails.status === 'Rejected' && (
                          <>
                            <hr />
                            <div>
                              <p className="text-muted small">Rejection Reason</p>
                              <div className="alert alert-danger" role="alert">
                                <p className="mb-0">{leaveDetails.rejection_reason || 'No reason provided'}</p>
                              </div>
                            </div>
                          </>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column - Sidebar */}
              <div className="col-12 grid-margin stretch-card">
                {/* All Tasks Summary */}
                <div className="card mb-3">
                  <div className="card-body">
                    <h5 className="card-title font-weight-bold mb-3">Task Status Summary (All)</h5>
                    
                    {Object.entries(tasksCount).length > 0 ? (
                      <>
                        {Object.entries(tasksCount).map(([status, count], index) => {
                          const getAlertClass = (s) => {
                            const lower = s?.toLowerCase();
                            if (lower === 'pending' || lower === 'perding') return 'alert-warning';
                            if (lower === 'completed' || lower === 'complted') return 'alert-success';
                            if (lower === 'in_progress') return 'alert-primary';
                            if (lower === 'accepted') return 'alert-info';
                            if (lower === 'waiting') return 'alert-warning';
                            if (lower === 'rejected') return 'alert-danger';
                            return 'alert-secondary';
                          };
                          
                          return (
                            <div className="row mb-2" key={status}>
                              <div className="col-12">
                                <div className={`${getAlertClass(status)} mb-2`} role="alert" style={{ padding: '10px' }}>
                                  <small className="text-muted d-block">{status}</small>
                                  <h6 className="font-weight-bold mb-0">{count}</h6>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                        <div className="row mt-3">
                          <div className="col-12">
                            <div className="alert alert-secondary mb-0" role="alert" style={{ padding: '10px' }}>
                              <small className="text-muted d-block font-weight-bold">Total Tasks</small>
                              <h6 className="font-weight-bold mb-0">{pendingTasks.length}</h6>
                            </div>
                          </div>
                        </div>
                      </>
                    ) : (
                      <p className="text-muted text-center mb-0">No tasks assigned to this technician</p>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                {!isProcessed && (
                  <div className="card mb-3">
                    <div className="card-body">
                      <button
                        onClick={handleApprove}
                        disabled={actionLoading}
                        className="btn btn-success btn-block mb-2"
                        style={{ fontWeight: '500' }}
                      >
                        <i className="mdi mdi-check"></i> Approve Leave
                      </button>
                      <button
                        onClick={() => setShowRejectModal(true)}
                        disabled={actionLoading}
                        className="btn btn-danger btn-block"
                        style={{ fontWeight: '500' }}
                      >
                        <i className="mdi mdi-close"></i> Reject Leave
                      </button>
                    </div>
                  </div>
                )}

                {/* Active Tasks List */}
                <div className="card">
                  <div className="card-body">
                    <h5 className="card-title font-weight-bold mb-3">Working Devices & Task History</h5>
                    {pendingTasks.length > 0 ? (
                      <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                        <div className="table-responsive">
                          <table className="table table-sm table-bordered mb-0">
                            <thead style={{ backgroundColor: '#f8f9fa', fontSize: '12px' }}>
                              <tr>
                                <th>Task ID</th>
                                <th>Task Status</th>
                                <th>Due Date</th>
                              </tr>
                            </thead>
                            <tbody style={{ fontSize: '12px' }}>
                              {pendingTasks.map((task, index) => (
                                <tr key={task._id || index}>
                                  <td>
                                    <small className="font-weight-bold">{task._id?.substring(0, 8) || `Task-${index + 1}`}</small>
                                  </td>
                                  <td>
                                    <span className={`badge badge-${getTaskStatusBadgeClass(task.status)}`}>
                                      {task.status || 'Pending'}
                                    </span>
                                  </td>
                                  <td>
                                    <small>{formatDate(task.due_date) || '-'}</small>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ) : (
                      <p className="text-muted text-center mb-0">No tasks assigned to this technician</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
          <Footer />
        </div>
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div
          className="modal"
          style={{
            display: 'block',
            backgroundColor: 'rgba(0,0,0,0.5)',
            pointerEvents: 'auto',
            position: 'fixed',
            top: 0,
            left: 0,
            height: '100vh',
            width: '100vw',
            zIndex: 1050,
          }}
          onClick={() => setShowRejectModal(false)}
        >
          <div
            className="modal-content"
            style={{
              backgroundColor: '#fff',
              padding: '20px',
              maxWidth: '520px',
              margin: '100px auto',
              position: 'relative',
              borderRadius: '6px',
              boxShadow: '0 6px 16px rgba(0,0,0,0.2)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h5 className="text-center mb-3 font-weight-bold">Reject Leave Request</h5>

            <p className="text-muted text-center mb-3">
              Provide a reason for rejecting this leave request:
            </p>

            <form onSubmit={(e) => { e.preventDefault(); handleReject(); }}>
              <div className="form-group">
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Enter rejection reason..."
                  rows="4"
                  className="form-control"
                  required
                />
                <small className="form-text text-muted">Provide a clear reason for rejection</small>
              </div>

              <div className="d-flex justify-content-end" style={{ gap: '10px', marginTop: '20px' }}>
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() => {
                    setShowRejectModal(false);
                    setRejectionReason('');
                  }}
                  disabled={actionLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-danger"
                  disabled={actionLoading || !rejectionReason.trim()}
                >
                  {actionLoading ? (
                    <>
                      <span className="spinner-border spinner-border-sm mr-2" role="status" aria-hidden="true"></span>
                      Processing...
                    </>
                  ) : (
                    'Reject Request'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ViewLeaveDetails;