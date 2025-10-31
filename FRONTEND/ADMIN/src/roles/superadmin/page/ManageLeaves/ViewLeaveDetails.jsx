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
    assignmentHistoryMap,
    historyLoading,
    historyError,
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
  const isRejected = leaveDetails.status === 'Rejected';
  const decisionDateLabel = isRejected ? 'Rejected Date' : 'Approval Date';
  const decisionByLabel = isRejected ? 'Rejected By' : 'Approved By';
  const decisionColor = isRejected ? '#dc3545' : '#28a745';
  const decisionBackground = isRejected ? '#f8d7da' : '#d4edda';
  const decisionBorder = isRejected ? '#f5c6cb' : '#b1dfbb';

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

  const getTaskIdentifier = (task) => {
    if (!task || typeof task !== 'object') {
      return null;
    }
    if (task.task_id !== undefined && task.task_id !== null) {
      return String(task.task_id);
    }
    if (task.wp_device_id) {
      return String(task.wp_device_id);
    }
    if (task.device_id) {
      return String(task.device_id);
    }
    return null;
  };

  const formatDateTime = (value) => {
    if (!value) return '-';
    try {
      const date = new Date(value);
      if (Number.isNaN(date.getTime())) return '-';
      return date.toLocaleString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '-';
    }
  };

  const getHistoryNotes = (entry) => {
    return entry?.unassigned_reason || entry?.reassigned_reason || entry?.pending_reason || entry?.notes || '-';
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
                          <div className="alert alert-info mb-0" role="alert" style={{ padding: '12px', borderLeft: '4px solid #17a2b8' }}>
                            <small className="text-muted d-block mb-1">From Date</small>
                            <h6 className="font-weight-bold mb-0" style={{ color: '#17a2b8' }}>{formatDate(leaveDetails.from_date)}</h6>
                          </div>
                        </div>
                        <div className="col-md-4">
                          <div className="alert alert-info mb-0" role="alert" style={{ padding: '12px', borderLeft: '4px solid #17a2b8' }}>
                            <small className="text-muted d-block mb-1">To Date</small>
                            <h6 className="font-weight-bold mb-0" style={{ color: '#17a2b8' }}>{formatDate(leaveDetails.to_date)}</h6>
                          </div>
                        </div>
                        <div className="col-md-4">
                          <div className="alert alert-info mb-0" role="alert" style={{ padding: '12px', borderLeft: '4px solid #17a2b8' }}>
                            <small className="text-muted d-block mb-1">Number of Days</small>
                            <h6 className="font-weight-bold mb-0" style={{ color: '#17a2b8' }}>{leaveDetails.number_of_days || 0} days</h6>
                          </div>
                        </div>
                      </div>
                    </div>

                    <hr />

                    {/* Reason */}
                    <div className="mb-3">
                      <p className="text-muted small font-weight-bold">Leave Reason</p>
                      <div style={{ 
                        padding: '12px 15px',
                        backgroundColor: '#f0f8ff',
                        border: '1px solid #b3d9ff',
                        borderRadius: '4px',
                        borderLeft: '4px solid #0d6efd'
                      }}>
                        <p className="mb-0" style={{ color: '#333', fontSize: '14px' }}>{leaveDetails.reason || '-'}</p>
                      </div>
                    </div>

                    {/* Approval Info (if processed) */}
                    {isProcessed && (
                      <>
                        <hr />
                        <div className="row">
                          <div className="col-md-6 mb-3">
                            <div style={{ 
                              padding: '12px',
                              backgroundColor: decisionBackground,
                              border: `1px solid ${decisionBorder}`,
                              borderRadius: '4px',
                              borderLeft: `4px solid ${decisionColor}`
                            }}>
                              <small className="text-muted d-block mb-1 font-weight-bold">{decisionDateLabel}</small>
                              <h6 className="font-weight-bold mb-0" style={{ color: decisionColor }}>
                                {leaveDetails.approval_date ? formatDate(leaveDetails.approval_date) : 'N/A'}
                              </h6>
                            </div>
                          </div>
                          <div className="col-md-6 mb-3">
                            <div style={{ 
                              padding: '12px',
                              backgroundColor: decisionBackground,
                              border: `1px solid ${decisionBorder}`,
                              borderRadius: '4px',
                              borderLeft: `4px solid ${decisionColor}`
                            }}>
                              <small className="text-muted d-block mb-1 font-weight-bold">{decisionByLabel}</small>
                              <h6 className="font-weight-bold mb-0" style={{ color: decisionColor }}>{leaveDetails.approved_by || leaveDetails.rejected_by || 'N/A'}</h6>
                            </div>
                          </div>
                        </div>

                        {isRejected && (
                          <>
                            <hr />
                            <div>
                              <p className="text-muted small font-weight-bold">Rejection Reason</p>
                              <div style={{ 
                                padding: '12px 15px',
                                backgroundColor: '#ffe6e6',
                                border: '1px solid #ffb3b3',
                                borderRadius: '4px',
                                borderLeft: '4px solid #dc3545'
                              }}>
                                <p className="mb-0" style={{ color: '#333', fontSize: '14px' }}>{leaveDetails.rejection_reason || 'No reason provided'}</p>
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


                {/* <div className="card mb-3">
                  <div className="card-body">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <h5 className="card-title font-weight-bold mb-0">Assignment History</h5>
                      {pendingTasks.length > 0 && (
                        <span className="badge badge-outline-primary" style={{ border: '1px solid #0078d4', color: '#0078d4', padding: '6px 10px' }}>
                          Tasks {pendingTasks.length}
                        </span>
                      )}
                    </div>
                    {historyLoading ? (
                      <div className="d-flex justify-content-center py-4">
                        <div className="spinner-border" role="status">
                          <span className="sr-only">Loading...</span>
                        </div>
                      </div>
                    ) : pendingTasks.length > 0 ? (
                      pendingTasks.map((task) => {
                        const taskKey = getTaskIdentifier(task);
                        const historyData = assignmentHistoryMap?.[taskKey];
                        const historyEntries = historyData?.assignment_history || [];
                        const totalAssignments = historyData?.total_assignments ?? historyEntries.length;
                        const status = historyData?.task_status || task.status;
                        const pendingReason = historyData?.pending_reason || task.pending_reason;
                        const device = historyData?.wp_device_id || historyData?.device_id || task.wp_device_id || task.device_id || '-';
                        return (
                          <div key={taskKey || Math.random()} className="mb-3" style={{ border: '1px solid #e0e0e0', borderRadius: '6px' }}>
                            <div style={{ padding: '12px 16px', borderBottom: historyEntries.length > 0 ? '1px solid #e0e0e0' : 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
                              <div>
                                <h6 className="font-weight-bold mb-1">Task {task.task_id || taskKey || '-'}</h6>
                                <div className="text-muted small">Device {device}</div>
                                <div className="text-muted small">Assignments {totalAssignments}</div>
                              </div>
                              <div>
                                <span className={`badge badge-${getTaskStatusBadgeClass(status)}`}>{status || 'Unknown'}</span>
                              </div>
                            </div>
                            <div style={{ padding: '12px 16px' }}>
                              {pendingReason && (
                                <div className="alert alert-warning p-2 mb-3">
                                  <small className="text-muted d-block">Pending Reason</small>
                                  <span className="font-weight-bold">{pendingReason}</span>
                                </div>
                              )}
                              {historyEntries.length > 0 ? (
                                <div className="table-responsive">
                                  <table className="table table-bordered table-sm">
                                    <thead className="thead-light">
                                      <tr>
                                        <th>Technician</th>
                                        <th>Assigned Date</th>
                                        <th>Unassigned Date</th>
                                        <th>Duration (hrs)</th>
                                        <th>&gt; 3 hrs</th>
                                        <th>Assigned By</th>
                                        <th>Notes</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {historyEntries.map((entry, idx) => (
                                        <tr key={`${taskKey || idx}-${idx}`}>
                                          <td>{entry?.technician_id || '-'}</td>
                                          <td>{formatDateTime(entry?.assigned_date)}</td>
                                          <td>{formatDateTime(entry?.unassigned_date)}</td>
                                          <td>{entry?.duration_hours !== null && entry?.duration_hours !== undefined ? entry.duration_hours : '-'}</td>
                                          <td>{entry?.exceeded_three_hours === true ? 'Yes' : entry?.exceeded_three_hours === false ? 'No' : '-'}</td>
                                          <td>{entry?.assigned_by || '-'}</td>
                                          <td>{getHistoryNotes(entry)}</td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              ) : (
                                <div className="text-muted" style={{ fontSize: '13px' }}>Assignment history not available.</div>
                              )}
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div style={{
                        padding: '20px',
                        textAlign: 'center',
                        backgroundColor: '#f8f9fa',
                        borderRadius: '4px',
                        border: '1px solid #dee2e6'
                      }}>
                        <p className="text-muted mb-0" style={{ fontSize: '13px' }}>No tasks found for this technician.</p>
                      </div>
                    )}
                    {historyError && (
                      <div className="alert alert-warning mt-3 mb-0" role="alert">
                        {historyError}
                      </div>
                    )}
                  </div>
                </div> */}

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

                {/* Active Tasks List
                <div className="card">
                  <div className="card-body">
                    <h5 className="card-title font-weight-bold mb-3">Working Devices & Task History</h5>
                    {pendingTasks.length > 0 ? (
                      <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                        <div className="table-responsive">
                          <table className="table table-sm table-hover table-bordered mb-0">
                            <thead style={{ backgroundColor: '#f8f9fa', fontSize: '12px', fontWeight: '600' }}>
                              <tr>
                                <th style={{ borderBottom: '2px solid #dee2e6' }}>Task ID</th>
                                <th style={{ borderBottom: '2px solid #dee2e6' }}>Task Status</th>
                                <th style={{ borderBottom: '2px solid #dee2e6' }}>Due Date</th>
                              </tr>
                            </thead>
                            <tbody style={{ fontSize: '12px' }}>
                              {pendingTasks.map((task, index) => (
                                <tr key={task._id || index} style={{ verticalAlign: 'middle' }}>
                                  <td>
                                    <small className="font-weight-bold text-primary">{task._id?.substring(0, 8) || `Task-${index + 1}`}</small>
                                  </td>
                                  <td>
                                    <span className={`badge badge-${getTaskStatusBadgeClass(task.status)}`}>
                                      {task.status || 'Pending'}
                                    </span>
                                  </td>
                                  <td>
                                    <small className="text-secondary">{formatDate(task.due_date) || '-'}</small>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ) : (
                      <div style={{
                        padding: '40px 20px',
                        textAlign: 'center',
                        backgroundColor: '#f8f9fa',
                        borderRadius: '4px',
                        border: '1px solid #dee2e6'
                      }}>
                        <div style={{ fontSize: '32px', marginBottom: '12px', color: '#ccc' }}>
                          📋
                        </div>
                        <p className="text-muted mb-1" style={{ fontSize: '14px' }}>No tasks assigned to this technician</p>
                        <small className="text-muted">All tasks will appear here once assigned</small>
                      </div>
                    )}
                  </div>
                </div> */}
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