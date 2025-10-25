// ManageLeaves - Manage Leave Requests
import React, { useState } from 'react';
import Header from '../../components/Header';
import Sidebar from '../../components/Sidebar';
import Footer from '../../components/Footer';
import { useNavigate } from 'react-router-dom';
import InputField from '../../../../utils/InputField';
import ManageLeaveHooks from '../../hooks/ManageLeaves/ManageLeaveHooks';
import { showErrorAlert, showSuccessAlert } from '../../../../utils/alert';

const ManageLeaves = ({ userInfo, handleLogout }) => {
  const navigate = useNavigate();
  const [dismissError, setDismissError] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [selectedLeaveId, setSelectedLeaveId] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const {
    filteredLeaves,
    loading,
    error,
    selectedStatus,
    setSelectedStatus,
    searchTerm,
    setSearchTerm,
    getStatusBadgeClass,
    fetchLeaveRequests,
  } = ManageLeaveHooks();

  const adminName = sessionStorage.getItem('superAdminName') || 'Admin';

  const handleApproveLeave = async (leaveId) => {
    try {
      setActionLoading(true);
      const token = sessionStorage.getItem('superAdminToken');
      const response = await fetch(`/api/api/admin/leave-requests/${leaveId}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
        body: JSON.stringify({ approvedBy: adminName }),
      });

      if (!response.ok) {
        const data = await response.json();
        showErrorAlert('Error', data.message || `HTTP ${response.status}: Failed to approve leave`);
        return;
      }

      const data = await response.json();

      if (data.success) {
        showSuccessAlert('Success', 'Leave approved successfully');
        fetchLeaveRequests();
      } else {
        showErrorAlert('Error', data.message || 'Failed to approve leave');
      }
    } catch (err) {
      console.error('Error approving leave:', err);
      showErrorAlert('Error', err.message || 'Failed to approve leave');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectClick = (leaveId) => {
    setSelectedLeaveId(leaveId);
    setRejectionReason('');
    setShowRejectModal(true);
  };

  const handleSubmitReject = async () => {
    if (!rejectionReason.trim()) {
      showErrorAlert('Error', 'Please provide a rejection reason');
      return;
    }

    try {
      setActionLoading(true);
      const token = sessionStorage.getItem('superAdminToken');
      const response = await fetch(`/api/api/admin/leave-requests/${selectedLeaveId}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
        body: JSON.stringify({
          rejectionReason: rejectionReason,
          approvedBy: adminName,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        showErrorAlert('Error', data.message || `HTTP ${response.status}: Failed to reject leave`);
        return;
      }

      const data = await response.json();

      if (data.success) {
        showSuccessAlert('Success', 'Leave rejected successfully');
        setShowRejectModal(false);
        setRejectionReason('');
        setSelectedLeaveId(null);
        fetchLeaveRequests();
      } else {
        showErrorAlert('Error', data.message || 'Failed to reject leave');
      }
    } catch (err) {
      console.error('Error rejecting leave:', err);
      showErrorAlert('Error', err.message || 'Failed to reject leave');
    } finally {
      setActionLoading(false);
    }
  };

  const handleViewLeave = (leave) => {
    navigate(`/superadmin/ViewLeaveDetails`, {
      state: {
        dataItem: [leave],
      },
    });
  };

  const isLeaveProcessed = (status) => {
    return status !== 'Requested';
  };

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

  const calculateDays = (fromDate, toDate) => {
    if (!fromDate || !toDate) return '-';
    try {
      const from = new Date(fromDate);
      const to = new Date(toDate);
      const diffTime = Math.abs(to - from);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      return `${diffDays} days`;
    } catch {
      return '-';
    }
  };

  return (
    <div className="container-scroller">
      <Header userInfo={userInfo} handleLogout={handleLogout} />
      <div className="container-fluid page-body-wrapper">
        <Sidebar userInfo={userInfo} />
        <div className="main-panel">
          <div className="content-wrapper">
            {/* Page Title */}
            <div className="row">
              <div className="col-md-12 grid-margin">
                <div className="row">
                  <div className="col-12 col-xl-8 mb-4 mb-xl-0">
                    <h3 className="font-weight-bold">Manage Leave Requests</h3>
                  </div>
                </div>
              </div>
            </div>

            {/* Main Card */}
            <div className="row">
              <div className="col-lg-12 grid-margin stretch-card">
                <div className="card">
                  <div className="card-body">
                    {/* Search and Filter Row */}
                    <div className="row">
                      <div className="col-md-12 grid-margin">
                        <div className="row align-items-center">
                          {/* Title */}
                          <div className="col-4 col-xl-8">
                            <h4 className="card-title" style={{ paddingTop: '10px' }}>
                              Leave Requests
                            </h4>
                          </div>

                          {/* Search Input */}
                          <div className="col-8 col-xl-4">
                            <div className="input-group">
                              <div className="input-group-prepend hover-cursor" id="navbar-search-icon">
                                <span className="input-group-text" id="search">
                                  <i className="icon-search"></i>
                                </span>
                              </div>
                              <InputField
                                placeholder="Search by Name / ID / Email"
                                ariaLabel="search"
                                ariadescribedby="search"
                                autoComplete="off"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Status Filter */}
                    <div className="row mb-3">
                      <div className="col-md-12">
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                          <label style={{ fontWeight: '500', marginBottom: '0' }}>Filter by Status:</label>
                          <select
                            value={selectedStatus}
                            onChange={(e) => setSelectedStatus(e.target.value)}
                            className="form-control"
                            style={{ maxWidth: '200px' }}
                          >
                            <option value="all">All Requests</option>
                            <option value="Requested">Pending</option>
                            <option value="Approved">Approved</option>
                            <option value="Rejected">Rejected</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Error Message */}
                    {error && !dismissError && (
                      <div className="alert alert-danger alert-dismissible fade show" role="alert">
                        <strong>Error:</strong> {error}
                        <button
                          type="button"
                          className="close"
                          onClick={() => setDismissError(true)}
                        >
                          <span aria-hidden="true">&times;</span>
                        </button>
                      </div>
                    )}

                    {/* Table */}
                    <div className="table-responsive" style={{ maxHeight: '600px', overflowY: 'auto' }}>
                      <table className="table table-striped">
                        <thead style={{ textAlign: 'center', position: 'sticky', top: 0, zIndex: 1, backgroundColor: '#fff' }}>
                          <tr>
                            <th>Sl.No</th>
                            <th>Technician Name</th>
                            <th>Technician ID</th>
                            <th>Email</th>
                            <th>From Date</th>
                            <th>To Date</th>
                            <th>Duration</th>
                            <th>Reason</th>
                            <th>Status</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        

                        <tbody style={{ textAlign: 'center' }}>
                          {loading ? (
                            <tr>
                              <td colSpan="10">
                                <div className="spinner-border" role="status">
                                  <span className="sr-only">Loading...</span>
                                </div>
                              </td>
                            </tr>
                          ) : filteredLeaves.length > 0 ? (
                            filteredLeaves.map((leave, index) => (
                              <tr key={leave._id || index}>
                                <td>{index + 1}</td>
                                <td>
                                  <strong>{leave.technician_name || '-'}</strong>
                                </td>
                                <td>{leave.technician_id || '-'}</td>
                                <td>{leave.technician_email || '-'}</td>
                                <td>{formatDate(leave.from_date)}</td>
                                <td>{formatDate(leave.to_date)}</td>
                                <td>
                                  <span className="badge badge-info">
                                    {calculateDays(leave.from_date, leave.to_date)}
                                  </span>
                                </td>
                                <td>
                                  <span title={leave.reason} style={{ maxWidth: '150px', display: 'inline-block', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                                    {leave.reason || '-'}
                                  </span>
                                </td>
                                <td>
                                  <span className={`badge ${getStatusBadgeClass(leave.status)}`}>
                                    {leave.status || 'Pending'}
                                  </span>
                                </td>
                                <td>
                                  {isLeaveProcessed(leave.status) ? (
                                    <button
                                      type="button"
                                      className="btn btn-outline-info btn-sm"
                                      onClick={() => handleViewLeave(leave)}
                                      title="View details"
                                    >
                                      <i className="mdi mdi-eye"></i> View
                                    </button>
                                  ) : (
                                    <div style={{ display: 'flex', gap: '5px', justifyContent: 'center' }}>
                                      <button
                                        type="button"
                                        className="btn btn-success btn-sm"
                                        onClick={() => handleApproveLeave(leave._id)}
                                        disabled={actionLoading}
                                        title="Approve this leave request"
                                      >
                                        <i className="mdi mdi-check"></i> Approve
                                      </button>
                                      <button
                                        type="button"
                                        className="btn btn-danger btn-sm"
                                        onClick={() => handleRejectClick(leave._id)}
                                        disabled={actionLoading}
                                        title="Reject this leave request"
                                      >
                                        <i className="mdi mdi-close"></i> Reject
                                      </button>
                                    </div>
                                  )}
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan="10">
                                <div style={{ padding: '20px', color: '#999' }}>
                                  No leave requests found.
                                </div>
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>


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
          onClick={() => {
            if (!actionLoading) {
              setShowRejectModal(false);
              setRejectionReason('');
            }
          }}
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
              Provide a reason for rejecting this leave request. This will be sent to the technician via email:
            </p>

            <form onSubmit={(e) => { e.preventDefault(); handleSubmitReject(); }}>
              <div className="form-group">
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Enter rejection reason..."
                  rows="4"
                  className="form-control"
                  required
                  disabled={actionLoading}
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

export default ManageLeaves;