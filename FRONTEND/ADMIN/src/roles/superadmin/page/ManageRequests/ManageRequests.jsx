import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/Header';
import Sidebar from '../../components/Sidebar';
import Footer from '../../components/Footer';
import InputField from '../../../../utils/InputField';
import { showErrorAlert } from '../../../../utils/alert';
import useManageRequests from '../../hooks/ManageRequests/ManageRequestsHooks';
import Pagination from '../../components/Pagination/Pagination';

const ManageRequests = ({ userInfo, handleLogout }) => {
  const navigate = useNavigate();
  const {
    requests,
    technicians,
    devices,
    isLoading,
    error,
    handleSearchChange,
    assignManualRequest,
    reassignManualRequest,
    createManualRequest,
    summary,
    selectedFilter,
    handleFilterSelect,
    currentPage,
    pageSize,
    totalRecords,
    totalPages,
    handlePageChange,
    handlePageSizeChange,
  } = useManageRequests(userInfo);

  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [assignedTechnicianId, setAssignedTechnicianId] = useState('');
  const [assignMode, setAssignMode] = useState('assign');
  const [assignLoading, setAssignLoading] = useState(false);

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [createForm, setCreateForm] = useState({
    deviceId: '',
    technicianId: '',
    requestType: '',
  });
  const [filteredDistrictTechnicians, setFilteredDistrictTechnicians] = useState([]);

  const resolveTechnicianName = (request) => {
    return (
      request?.assignedTechnician?.technician_name ||
      request?.assignedTechnician?.name ||
      request?.assignedTechnician_name ||
      request?.assigned_technician_name ||
      '-'
    );
  };

  const resolveAssignedDate = (request) => {
    const value = request?.assigned_date || request?.task_assigned_date || request?.assignedDate;
    if (!value) return '-';
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? '-' : parsed.toLocaleDateString();
  };

  const resolveStatusBadge = (status) => {
    const lower = (status || '').toLowerCase();
    if (lower === 'pending') return 'badge-warning';
    if (lower === 'completed') return 'badge-success';
    if (lower === 'in progress' || lower === 'in_progress') return 'badge-info';
    if (lower === 'rejected') return 'badge-danger';
    return 'badge-secondary';
  };


  const handleAssignClick = (request, mode = 'assign') => {
    setSelectedRequest(request);
    setAssignedTechnicianId(request?.assigned_technician_id || '');
    setAssignMode(mode);

    const requestDistrict = request?.district || '';
    const filtered = technicians.filter(tech => {
      const techDistrict = (tech?.district || '').toLowerCase();
      return tech.status && techDistrict === requestDistrict.toLowerCase();
    });
    setFilteredDistrictTechnicians(filtered);

    setAssignModalOpen(true);
  };

  const closeAssignModal = () => {
    setAssignModalOpen(false);
    setSelectedRequest(null);
    setAssignedTechnicianId('');
    setAssignLoading(false);
    setFilteredDistrictTechnicians([]);
  };

  const handleAssignSubmit = async (e) => {
    e.preventDefault();
    if (!selectedRequest || !assignedTechnicianId) return;
    setAssignLoading(true);
    try {
      if (assignMode === 'reassign') {
        await reassignManualRequest({
          task_id: selectedRequest.task_id,
          technician_id: assignedTechnicianId,
        });
      } else {
        await assignManualRequest({
          task_id: selectedRequest.task_id,
          technician_id: assignedTechnicianId,
        });
      }
      closeAssignModal();
    } catch (err) {
      setAssignLoading(false);
    }
  };

  const handleViewRequest = (request) => {
    navigate('/superadmin/ViewManageRequests', { state: { request } });
  };

  const openCreateModal = () => {
    setCreateForm({ deviceId: '', technicianId: '', requestType: '' });
    setFilteredDistrictTechnicians([]);
    setCreateModalOpen(true);
  };

  const closeCreateModal = () => {
    setCreateModalOpen(false);
    setCreateLoading(false);
    setFilteredDistrictTechnicians([]);
  };

  const handleCreateChange = (field, value) => {
    setCreateForm((prev) => ({ ...prev, [field]: value }));
    if (field === 'deviceId') {
      const device = devices.find((d) => d.wp_device_id === value);
      const deviceDistrict = device?.district || '';
      const filtered = technicians.filter(tech => {
        const techDistrict = (tech?.district || '').toLowerCase();
        return tech.status && techDistrict === deviceDistrict.toLowerCase();
      });
      setFilteredDistrictTechnicians(filtered);
    }
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!createForm.deviceId || !createForm.technicianId || !createForm.requestType) {
      showErrorAlert('Device, technician, and request are required');
      return;
    }

    const device = devices.find((item) => item.wp_device_id === createForm.deviceId);
    if (!device) {
      showErrorAlert('Selected device not found');
      return;
    }

    // Check if trying to create renewal request for smart model
    if (createForm.requestType === 'renewal' && device.model_type?.toLowerCase() === 'smart') {
      showErrorAlert('Renewal requests are not allowed for smart model devices');
      return;
    }

    const technician = technicians.find((tech) => tech.technician_id === createForm.technicianId);
    if (!technician) {
      showErrorAlert('Selected technician not found');
      return;
    }

    setCreateLoading(true);
    try {
      await createManualRequest({
        wp_device_id: device.wp_device_id,
        customer_user_id: device.user_id,
        assigned_technician_id: technician.technician_id,
        request_source: 'manual',
        request_type: createForm.requestType,
      });
      closeCreateModal();
    } catch (err) {
      setCreateLoading(false);
    }
  };

  return (
    <div className="container-scroller">
      <Header userInfo={userInfo} handleLogout={handleLogout} />
      <div className="container-fluid page-body-wrapper">
        <Sidebar userInfo={userInfo} />
        <div className="main-panel">
          <div className="content-wrapper">
            <div className="row">
              <div className="col-md-12 grid-margin" style={{ marginBottom: '10px' }}>
                <div className="row">
                  <div className="col-12 col-xl-8 mb-4 mb-xl-0">
                    <h3 className="font-weight-bold">Manage Requests</h3>
                  </div>
                  <div className="col-12 col-xl-4 d-flex justify-content-xl-end align-items-start">
                    <button type="button" className="btn btn-success" onClick={openCreateModal}>
                      Create Request
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Summary Cards Grid */}
            <div className="row mb-3">
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
                    <span style={{ fontSize: '11px', letterSpacing: '0.08em', textTransform: 'uppercase', opacity: 0.65, color: '#1b2559', whiteSpace: 'nowrap' }}>All Requests</span>
                    <span style={{ fontSize: '22px', fontWeight: 700, color: '#1b2559' }}>{totalRecords}</span>
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
                    <span style={{ fontSize: '22px', fontWeight: 700, color: '#1b2559' }}>{summary.pending}</span>
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
                    <span style={{ fontSize: '22px', fontWeight: 700, color: '#1b2559' }}>{summary.completed}</span>
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
                    <span style={{ fontSize: '22px', fontWeight: 700, color: '#1b2559' }}>{summary.inProgress}</span>
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
                    <span style={{ fontSize: '22px', fontWeight: 700, color: '#1b2559' }}>{summary.rejected}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="row">
              <div className="col-lg-12 grid-margin stretch-card">
                <div className="card">
                  <div className="card-body">
                    <div className="row">
                      <div className="col-md-12 grid-margin">
                        <div className="row">
                          <div className="col-4 col-xl-8">
                            <h4 className="card-title" style={{ paddingTop: '10px' }}>
                              Manual Requests
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
                                placeholder="Search by Task / Device / Technician"
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
                            <th>Task ID</th>
                            <th>Device ID</th>
                            <th>Customer</th>
                            <th>Technician</th>
                            <th>Assigned Date</th>
                            <th>Status</th>
                            <th>Assign</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody style={{ textAlign: 'center' }}>
                          {isLoading ? (
                            <tr>
                              <td colSpan="9">Loading...</td>
                            </tr>
                          ) : error ? (
                            <tr>
                              <td colSpan="9">Error: {error}</td>
                            </tr>
                          ) : requests.length > 0 ? (
                            requests.map((item, index) => (
                              <tr key={item._id || item.task_id || index}>
                                <td>{index + 1}</td>
                                <td>{item.task_id || '-'}</td>
                                <td>{item.wp_device_id || '-'}</td>
                                <td>
                                  <div className="d-flex flex-column">
                                    <span>{item.customer_name || '-'}</span>
                                    <span style={{ fontSize: '12px', color: '#6c7293' }}>{item.task_created_by_user_email || '-'}</span>
                                  </div>
                                </td>
                                <td>{resolveTechnicianName(item)}</td>
                                <td>{resolveAssignedDate(item)}</td>
                                <td>
                                  <span className={`badge ${resolveStatusBadge(item.task_status)}`}>
                                    {item.task_status || '-'}
                                  </span>
                                </td>
                                <td>
                                  <div className="d-flex justify-content-center" style={{ gap: '8px' }}>
                                    <button
                                      type="button"
                                      className="btn btn-primary"
                                      onClick={() => handleAssignClick(item, 'assign')}
                                      disabled={!!item.assigned_technician_id || item.task_status?.toLowerCase() === 'completed'}
                                    >
                                      Assign
                                    </button>
                                    <button
                                      type="button"
                                      className="btn btn-warning"
                                      onClick={() => handleAssignClick(item, 'reassign')}
                                      disabled={!item.assigned_technician_id || item.task_status?.toLowerCase() === 'completed'}
                                    >
                                      Reassign
                                    </button>
                                  </div>
                                </td>
                                <td>
                                  <button
                                    type="button"
                                    className="btn btn-outline-success"
                                    onClick={() => handleViewRequest(item)}
                                  >
                                    <i className="mdi mdi-eye"></i> View
                                  </button>
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan="9">No manual requests found.</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                    <Pagination
                      currentPage={currentPage}
                      totalPages={totalPages}
                      pageSize={pageSize}
                      onPageChange={handlePageChange}
                      onPageSizeChange={handlePageSizeChange}
                      totalRecords={totalRecords}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
          <Footer />
        </div>
      </div>

      {assignModalOpen && selectedRequest && (
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
              {assignMode === 'reassign' ? 'Reassign Technician' : 'Assign Technician'}
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
                <button
                  type="submit"
                  className={`btn ${assignMode === 'reassign' ? 'btn-warning' : 'btn-success'}`}
                  disabled={assignLoading || !assignedTechnicianId || filteredDistrictTechnicians.length === 0}
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

      {createModalOpen && (
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
          onClick={closeCreateModal}
        >
          <div
            className="modal-content"
            style={{
              backgroundColor: '#fff',
              padding: '14px',
              maxWidth: '560px',
              margin: '80px auto',
              position: 'relative',
              borderRadius: '10px',
              boxShadow: '0 6px 16px rgba(0,0,0,0.2)',
              fontSize: '13px',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h5 className="text-center mb-3" style={{ fontWeight: '600' }}>
              Create Manual Request
            </h5>

            <form onSubmit={handleCreateSubmit}>
              <div className="form-group mb-3">
                <label htmlFor="deviceId" className="mb-1" style={{ fontWeight: '500' }}>
                  Device
                </label>
                <select
                  className="form-control"
                  id="deviceId"
                  value={createForm.deviceId}
                  onChange={(e) => handleCreateChange('deviceId', e.target.value)}
                  required
                >
                  <option value="">Select Device</option>
                  {devices.map((device) => (
                    <option key={device.wp_device_id} value={device.wp_device_id}>
                      {device.wp_device_id} {device.model_type ? `- ${device.model_type}` : ''} {device.customer_name ? `- ${device.customer_name}` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group mb-3">
                <label htmlFor="technicianId" className="mb-1" style={{ fontWeight: '500' }}>
                  Technician
                </label>
                {!createForm.deviceId ? (
                  <div 
                  className="form-control"  style={{padding:'12px'}}      
                  >
                    Select a device first
                  </div>
                ) : filteredDistrictTechnicians.length === 0 ? (
                  <div 
                   className="form-control"
                  >
                    No technician found for this district
                  </div>
                ) : (
                  <select
                    className="form-control"
                    id="technicianId"
                    value={createForm.technicianId}
                    onChange={(e) => handleCreateChange('technicianId', e.target.value)}
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

              <div className="form-group mb-3">
                <label htmlFor="requestType" className="mb-1" style={{ fontWeight: '500' }}>
                  Request
                </label>
                <select
                  className="form-control"
                  id="requestType"
                  value={createForm.requestType}
                  onChange={(e) => handleCreateChange('requestType', e.target.value)}
                  required
                >
                  <option value="">Select Request</option>
                  <option value="return">Return</option>
                  {devices.find((d) => d.wp_device_id === createForm.deviceId)?.model_type?.toLowerCase() !== 'smart' && (
                    <option value="renewal">Renewal</option>
                  )}
                </select>
              </div>

              <div className="d-flex justify-content-end" style={{ gap: '10px', marginTop: '20px' }}>
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={closeCreateModal}
                  disabled={createLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-success"
                  disabled={createLoading || !createForm.deviceId || filteredDistrictTechnicians.length === 0}
                >
                  {createLoading ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageRequests;
