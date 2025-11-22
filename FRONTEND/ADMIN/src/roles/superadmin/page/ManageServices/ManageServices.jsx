//ManageServices
import React, { useState } from 'react';
import Header from '../../components/Header';
import Sidebar from '../../components/Sidebar';
import Footer from '../../components/Footer';
import { useNavigate } from 'react-router-dom';
import InputField from '../../../../utils/InputField';
import { showErrorAlert } from '../../../../utils/alert';
import useManageServices from '../../hooks/ManageServices/ManageServicesHooks';
import Pagination from '../../components/Pagination/Pagination';
const ManageServices = ({ userInfo, handleLogout }) => {
  const navigate = useNavigate();

  const {
    isLoading,
    error,
    technicians,
    serviceTasks,
    reassignServiceTask,
    handleSearchChange,
    assignServiceTask,
    serviceCounts,
    summary,
    selectedFilter,
    handleFilterSelect,
    currentPage,
    pageSize,
    totalRecords,
    getPaginatedData,
    totalPages,
    handlePageChange,
    handlePageSizeChange,
  } = useManageServices(userInfo);

  const resolveTechnicianName = (task) => {
    return (
      task.assignedTechnician?.name ||
      task.assigned_technician_name ||
      technicians.find((tech) => tech.technician_id === task.assigned_technician_id)?.name ||
      '-'
    );
  };

  const resolveTechnicianId = (task) => {
    return (
      task.assignedTechnician?.technician_id ||
      task.assigned_technician_id ||
      '-'
    );
  };

  const resolvePendingReason = (task) => {
    return (
      task.pending_reason ||
      task.pendingReason ||
      task.pendingReasonText ||
      task.pending_reason_text ||
      '-'
    );
  };

  const resolveAssignedDate = (task) => {
    const dateValue = task.assigned_date || task.task_assigned_date || task.assignedDate;
    if (!dateValue) return '-';
    const parsedDate = new Date(dateValue);
    return Number.isNaN(parsedDate.getTime()) ? '-' : parsedDate.toLocaleDateString();
  };

  // Modal state
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedInstallation, setSelectedInstallation] = useState(null);
  const [assignedTechnicianId, setAssignedTechnicianId] = useState('');
  const [assignLoading, setAssignLoading] = useState(false);
  const [assignMode, setAssignMode] = useState('assign'); // 'assign' | 'reassign'
  const [filteredDistrictTechnicians, setFilteredDistrictTechnicians] = useState([]);


  const handleViewInstallation = (installation) => {
    const technicianDetails =
      installation.assignedTechnician ||
      technicians.find((tech) => tech.technician_id === installation.assigned_technician_id) ||
      null;

    navigate('/superadmin/viewServices', {
      state: {
        dataItem: [
          {
            ...installation,
            assignedTechnician: technicianDetails,
          },
        ],
      },
    });
  };

  const handleViewTechnician = (technicianId) => {
    // Find the technician data from the technicians array
    const technician = technicians.find(tech => tech.technician_id === technicianId);
    if (technician) {
      navigate('/superadmin/ViewManageUser', { state: { dataItem: technician } });
    }
  };

  const handleAssignClick = (installation, mode = 'assign') => {
    setSelectedInstallation(installation);
    setAssignedTechnicianId(installation.assigned_technician_id || '');
    setAssignMode(mode);
    
    // Filter technicians by service's district
    const serviceDistrict = installation?.deliveryAddress?.district || installation?.district || '';
    const filtered = technicians.filter(tech => {
      const techDistrict = (tech?.district || '').toLowerCase();
      return tech.status && techDistrict === serviceDistrict.toLowerCase();
    });
    setFilteredDistrictTechnicians(filtered);
    
    setAssignModalOpen(true);
  };


  const closeAssignModal = () => {
    setAssignModalOpen(false);
    setSelectedInstallation(null);
    setAssignedTechnicianId('');
    setAssignLoading(false);
    setFilteredDistrictTechnicians([]);
  };

  const getStatusBadgeClass = (status) => {
    const lowerStatus = status?.toLowerCase();
    if (lowerStatus === 'pending') return 'badge-danger';
    if (lowerStatus === 'in progress' || lowerStatus === 'in_progress') return 'badge-warning';
    if (lowerStatus === 'completed') return 'badge-success';
    if (lowerStatus === 'rejected') return 'badge-dark';
    return 'badge-secondary'; // default
  };

  const handleAssignSubmit = async (e) => {
    e.preventDefault();
    if (!assignedTechnicianId || !selectedInstallation) return;

    const sellerDistrict = userInfo?.district?.trim().toLowerCase();
    const chosenTechnician = technicians.find(
      (tech) => tech.technician_id === assignedTechnicianId
    );
    const technicianDistrict = chosenTechnician?.district?.trim().toLowerCase();
    const installationDistrict = selectedInstallation?.district?.trim().toLowerCase();

    if (sellerDistrict && technicianDistrict && sellerDistrict !== technicianDistrict) {
      showErrorAlert('You can only assign technicians from your district.');
      return;
    }

    // Only check district match for sellers (role_id === 4)
    if (userInfo?.role_id === 4 && installationDistrict && technicianDistrict && installationDistrict !== technicianDistrict) {
      showErrorAlert('Technician district must match the service district.');
      return;
    }

    setAssignLoading(true);

    if (assignMode === 'reassign') {
      await reassignServiceTask({
        task_id: selectedInstallation.task_id,
        technician_id: assignedTechnicianId,
      });
    } else {
      await assignServiceTask({
        task_id: selectedInstallation.task_id,
        assigned_technician_id: assignedTechnicianId,
        task_created_by_user_email: selectedInstallation.task_created_by_user_email || '',
        district: installationDistrict || sellerDistrict || '',
      });
    }

    closeAssignModal();
  };




  return (
    <div className="container-scroller">
      <Header userInfo={userInfo} handleLogout={handleLogout} />
      <div className="container-fluid page-body-wrapper">
        <Sidebar />
        <div className="main-panel">
          <div className="content-wrapper">
            <div className="row">
              <div className="col-md-12 grid-margin" style={{ marginBottom: '10px' }}>
                <div className="row">
                  <div className="col-12 col-xl-8 mb-4 mb-xl-0">
                    <h3 className="font-weight-bold">Manage Services</h3>
                  </div>
                </div>
              </div>
            </div>

            {/* Summary Cards Grid */}
            <div className="row mb-1">
              <div className="col-12">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '8px', width: '100%' }}>
                  <div
                    style={{
                      border: 'none',
                      outline: 'none',
                      borderRadius: '12px',
                      padding: '12px 14px',
                      display: 'flex',
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '10px',
                      cursor: 'default',
                      boxShadow: '0 4px 12px rgba(27, 37, 89, 0.12)',
                      background: '#f6f7ff',
                      color: '#1b2559',
                      textAlign: 'left',
                      width: '100%'
                    }}
                  >
                    <span style={{ fontSize: '11px', letterSpacing: '0.08em', textTransform: 'uppercase', opacity: 0.65, color: '#1b2559', whiteSpace: 'nowrap' }}>All Tasks</span>
                    <span style={{ fontSize: '22px', fontWeight: 700, color: '#1b2559' }}>{serviceCounts.totalServices}</span>
                  </div>
                  <div
                    style={{
                      border: 'none',
                      outline: 'none',
                      borderRadius: '12px',
                      padding: '12px 14px',
                      display: 'flex',
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '10px',
                      cursor: 'default',
                      boxShadow: '0 4px 12px rgba(27, 37, 89, 0.12)',
                      background: '#f6f7ff',
                      color: '#1b2559',
                      textAlign: 'left',
                      width: '100%'
                    }}
                  >
                    <span style={{ fontSize: '11px', letterSpacing: '0.08em', textTransform: 'uppercase', opacity: 0.65, color: '#1b2559', whiteSpace: 'nowrap' }}>Pending</span>
                    <span style={{ fontSize: '22px', fontWeight: 700, color: '#1b2559' }}>{serviceCounts.pending}</span>
                  </div>
                  <div
                    style={{
                      border: 'none',
                      outline: 'none',
                      borderRadius: '12px',
                      padding: '12px 14px',
                      display: 'flex',
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '10px',
                      cursor: 'default',
                      boxShadow: '0 4px 12px rgba(27, 37, 89, 0.12)',
                      background: '#f6f7ff',
                      color: '#1b2559',
                      textAlign: 'left',
                      width: '100%'
                    }}
                  >
                    <span style={{ fontSize: '11px', letterSpacing: '0.08em', textTransform: 'uppercase', opacity: 0.65, color: '#1b2559', whiteSpace: 'nowrap' }}>In Progress</span>
                    <span style={{ fontSize: '22px', fontWeight: 700, color: '#1b2559' }}>{serviceCounts.onHold}</span>
                  </div>
                  <div
                    style={{
                      border: 'none',
                      outline: 'none',
                      borderRadius: '12px',
                      padding: '12px 14px',
                      display: 'flex',
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '10px',
                      cursor: 'default',
                      boxShadow: '0 4px 12px rgba(27, 37, 89, 0.12)',
                      background: '#f6f7ff',
                      color: '#1b2559',
                      textAlign: 'left',
                      width: '100%'
                    }}
                  >
                    <span style={{ fontSize: '11px', letterSpacing: '0.08em', textTransform: 'uppercase', opacity: 0.65, color: '#1b2559', whiteSpace: 'nowrap' }}>Completed</span>
                    <span style={{ fontSize: '22px', fontWeight: 700, color: '#1b2559' }}>{serviceCounts.completed}</span>
                  </div>
                  <div
                    style={{
                      border: 'none',
                      outline: 'none',
                      borderRadius: '12px',
                      padding: '12px 14px',
                      display: 'flex',
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '10px',
                      cursor: 'default',
                      boxShadow: '0 4px 12px rgba(27, 37, 89, 0.12)',
                      background: '#f6f7ff',
                      color: '#1b2559',
                      textAlign: 'left',
                      width: '100%'
                    }}
                  >
                    <span style={{ fontSize: '11px', letterSpacing: '0.08em', textTransform: 'uppercase', opacity: 0.65, color: '#1b2559', whiteSpace: 'nowrap' }}>Unassigned</span>
                    <span style={{ fontSize: '22px', fontWeight: 700, color: '#1b2559' }}>{serviceCounts.totalServices - serviceCounts.assigned}</span>
                  </div>
                  <div
                    style={{
                      border: 'none',
                      outline: 'none',
                      borderRadius: '12px',
                      padding: '12px 14px',
                      display: 'flex',
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '10px',
                      cursor: 'default',
                      boxShadow: '0 4px 12px rgba(27, 37, 89, 0.12)',
                      background: '#f6f7ff',
                      color: '#1b2559',
                      textAlign: 'left',
                      width: '100%'
                    }}
                  >
                    <span style={{ fontSize: '11px', letterSpacing: '0.08em', textTransform: 'uppercase', opacity: 0.65, color: '#1b2559', whiteSpace: 'nowrap' }}>Rejected</span>
                    <span style={{ fontSize: '22px', fontWeight: 700, color: '#1b2559' }}>{summary.rejected || 0}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="row">
              <div className="col-lg-12 grid-margin stretch-card">
                <div className="card">
                  <div className="card-body">
                    <div className="row mb-2">
                      <div className="col-md-12 grid-margin">
                        <div className="row">
                          <div className="col-4 col-xl-8">
                            <h4 className="card-title" style={{ paddingTop: '6px', marginBottom: 0 }}>
                              Services Tasks
                            </h4>
                          </div>
                          <div className="col-8 col-xl-4">
                            <div className="input-group">
                              <div className="input-group-prepend hover-cursor" id="navbar-search-icon">
                                <span className="input-group-text" id="search">
                                  <i className="icon-search"></i>
                                </span>
                              </div>
                              <InputField
                                placeholder="Search by Task ID / Technician"
                                ariaLabel="search"
                                ariadescribedby="search"
                                autoComplete="off"
                                onChange={handleSearchChange}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                       <div className="table-responsive dynamic-table">
                      <table className="table table-striped">
                        <thead style={{ textAlign: 'center', position: 'sticky', top: 0, zIndex: 1, backgroundColor: '#fff' }}>
                          <tr>
                            <th>Sl.No</th>
                            <th>Task Type</th>
                            <th>Customer Email</th>
                            <th>Technician Name</th>
                            <th>Technician ID</th>
                            <th>Device ID</th>
                            <th>Assigned Date</th>
                            <th>Status</th>
                            <th>Pending Reason</th>
                            <th>Assign</th>
                            <th>Actions</th>
                          </tr>
                        </thead>

                        <tbody style={{ textAlign: 'center', verticalAlign: 'middle', lineHeight: '1.0' }}>
                          {isLoading ? (
                            <tr style={{ height: '36px' }}>
                              <td colSpan="11">Loading...</td>
                            </tr>
                          ) : error ? (
                            <tr style={{ height: '36px' }}>
                              <td colSpan="11">Error: {error}</td>
                            </tr>
                          ) : serviceTasks.length > 0 ? (
                            getPaginatedData().map((item, index) => (
                              <tr key={item._id || index} style={{ height: '36px' }}>
                                <td>{(currentPage - 1) * pageSize + index + 1}</td>
                                <td>
                                  {{
                                    1: 'Installation',
                                    2: 'Services',
                                    3: 'Repair',
                                  }[item.task_type] || 'Other'}
                                </td>
                                <td  style={{ padding: '4px 2px', maxWidth: '200px', wordWrap: 'break-word', wordBreak: 'break-word' }}>{item.task_created_by_user_email || '-'}</td>
                                <td style={{ padding: '4px 2px', maxWidth: '70px', wordWrap: 'break-word', wordBreak: 'break-word' }}>{resolveTechnicianName(item)}</td>
                                <td>
                                  {resolveTechnicianId(item) !== '-' ? (
                                    <span
                                      style={{
                                        color: '#007bff',
                                        cursor: 'pointer',
                                      
                                      }}
                                      title="View technician details"
                                      onClick={() => handleViewTechnician(resolveTechnicianId(item))}
                                    >
                                      {resolveTechnicianId(item)}
                                    </span>
                                  ) : (
                                    '-'
                                  )}
                                </td>
                                <td>{item.device_id || item.wp_device_id || '-'}</td>
                                <td>{resolveAssignedDate(item)}</td>
                                <td>
                                  <span className={`badge ${getStatusBadgeClass(item.task_status)}`}>
                                    {item.task_status || '-'}
                                  </span>
                                </td>
                                <td>{resolvePendingReason(item)}</td>
                                <td>
                                  <div className="d-flex justify-content-center" style={{ gap: '8px' }}>
                                    <button
                                      type="button"
                                      className="btn btn-primary"
                                      onClick={() => handleAssignClick(item, 'assign')}
                                      disabled={!!item.assigned_technician_id || !item.isAssignable}
                                    >
                                      Assign
                                    </button>
                                    <button
                                      type="button"
                                      className="btn btn-warning"
                                      onClick={() => handleAssignClick(item, 'reassign')}
                                      disabled={!item.assigned_technician_id || !item.isAssignable}
                                    >
                                      Reassign
                                    </button>
                                  </div>
                                </td>

                                <td>
                                  <button
                                    type="button"
                                    className="btn btn-outline-success"
                                    onClick={() => handleViewInstallation(item)}
                                  >
                                    <i className="mdi mdi-eye"></i> View
                                  </button>
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan="11">No service records found.</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>

                    {totalRecords > 0 && (
                      <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        pageSize={pageSize}
                        onPageChange={handlePageChange}
                        onPageSizeChange={handlePageSizeChange}
                        totalRecords={totalRecords}
                      />
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
          <Footer />
        </div>
      </div>

      {/* Assign Modal */}
      {assignModalOpen && selectedInstallation && (
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
          }}
          onClick={closeAssignModal}
        >
          <div
            className="modal-content"
            style={{
              backgroundColor: '#fff',
              padding: '14px',
              maxWidth: '520px',
              margin: '100px auto',
              position: 'relative',
              borderRadius: '10px',
              boxShadow: '0 6px 16px rgba(0,0,0,0.2)',
              fontSize: '13px',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h5 className="text-center mb-3" style={{ fontWeight: '600' }}>
              Assign Technician
            </h5>

            <form onSubmit={handleAssignSubmit}>
              <div className="form-group mb-3">
                <label htmlFor="technicianId" className="mb-1" style={{ fontWeight: '500' }}>
                  Technician ID
                </label>
                {filteredDistrictTechnicians.length === 0 ? (
                  <div 
                    style={{
                      padding: '12px',
                      backgroundColor: '#f8f9fa',
                      border: '1px solid #dee2e6',
                      borderRadius: '4px',
                      textAlign: 'center',
                      color: '#dc3545',
                      fontWeight: '500'
                    }}
                  >
                    No technician found for this district
                  </div>
                ) : (
                  <select
                    className="form-control"
                    id="technicianId"
                    value={assignedTechnicianId}
                    onChange={(e) => setAssignedTechnicianId(e.target.value)}
                    required
                  >
                    <option value="">Select Technician</option>
                    {filteredDistrictTechnicians.map((tech) => (
                      <option key={tech.technician_id} value={tech.technician_id}>
                        {tech.technician_id} - {tech.name}
                      </option>
                    ))}
                  </select>
                )}

              </div>

              <div className="d-flex justify-content-end" style={{ gap: '10px', marginTop: '20px' }}>
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={closeAssignModal}
                  disabled={assignLoading}
                >
                  Cancel
                </button>
                {/* <button
            type="submit"
            className="btn btn-success"
            disabled={assignLoading || !assignedTechnicianId}
          >
            {assignLoading ? 'Assigning...' : 'Assign'}
          </button> */}
                <button
                  type="submit"
                  className={`btn ${assignMode === 'reassign' ? 'btn-warning' : 'btn-success'}`}
                  disabled={
                    assignLoading ||
                    !assignedTechnicianId ||
                    filteredDistrictTechnicians.length === 0 ||
                    assignedTechnicianId === selectedInstallation?.assignedTechnician?.technician_id
                  }
                >
                  {assignLoading
                    ? assignMode === 'reassign'
                      ? 'Reassigning...'
                      : 'Assigning...'
                    : assignMode === 'reassign'
                      ? 'Reassign'
                      : 'Assign'}
                </button>


              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default ManageServices;
