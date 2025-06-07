//ManageServices
import React, { useState } from 'react';
import Header from '../../components/Header';
import Sidebar from '../../components/Sidebar';
import Footer from '../../components/Footer';
import { useNavigate } from 'react-router-dom';
import InputField from '../../../../utils/InputField';
import useManageServices from '../../hooks/ManageServices/ManageServicesHooks';
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
  } = useManageServices(userInfo);

  // Modal state
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedInstallation, setSelectedInstallation] = useState(null);
  const [assignedTechnicianId, setAssignedTechnicianId] = useState('');
  const [assignLoading, setAssignLoading] = useState(false);
  const [assignMode, setAssignMode] = useState('assign'); // 'assign' | 'reassign'


  const handleViewInstallation = (installation) => {
    navigate('/superadmin/viewServices', { state: { dataItem: [installation] } });
  };

  const handleAssignClick = (installation, mode = 'assign') => {
    setSelectedInstallation(installation);
    setAssignedTechnicianId(installation.assigned_technician_id || '');
    setAssignMode(mode);
    setAssignModalOpen(true);
  };


  const closeAssignModal = () => {
    setAssignModalOpen(false);
    setSelectedInstallation(null);
    setAssignedTechnicianId('');
    setAssignLoading(false);
  };

  const handleAssignSubmit = async (e) => {
    e.preventDefault();
    if (!assignedTechnicianId || !selectedInstallation) return;

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
              <div className="col-md-12 grid-margin">
                <div className="row">
                  <div className="col-12 col-xl-8 mb-4 mb-xl-0">
                    <h3 className="font-weight-bold">Manage Services</h3>
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
                    <div className="table-responsive" style={{ maxHeight: '500px', overflowY: 'auto' }}>
                      <table className="table table-striped">
                        <thead style={{ textAlign: 'center', position: 'sticky', top: 0, zIndex: 1, backgroundColor: '#fff' }}>
                          <tr>
                            <th>Sl.No</th>
                            <th>Status</th>
                            <th>Task Type</th>
                            <th>Description</th>
                            <th>Device ID</th>
                            <th>Technician ID</th>
                            <th>Assigned Date</th>
                            <th>Assign</th>
                            <th>Actions</th>
                          </tr>
                        </thead>

                        <tbody style={{ textAlign: 'center' }}>
                          {isLoading ? (
                            <tr>
                              <td colSpan="15">Loading...</td>
                            </tr>
                          ) : error ? (
                            <tr>
                              <td colSpan="15">Error: {error}</td>
                            </tr>
                          ) : serviceTasks.length > 0 ? (
                            serviceTasks.map((item, index) => (
                              <tr key={item._id || index}>
                                <td>{index + 1}</td>
                                <td>{item.task_status || '-'}</td>
                                <td>
                                  {{
                                    1: 'Installation',
                                    2: 'Services',
                                    3: 'Repair',
                                  }[item.task_type] || 'Other'}
                                </td>
                                <td>{item.task_description || '-'}</td>
                                <td>{item.wp_device_id || '-'}</td>
                                <td>{item.assigned_technician_id || '-'}</td>
                                <td>{item.assigned_date ? new Date(item.assigned_date).toLocaleDateString() : '-'}</td>
                                <td>
                                  <div className="d-flex justify-content-center" style={{ gap: '8px' }}>
                                    <button
                                      type="button"
                                      className="btn btn-primary"
                                      onClick={() => handleAssignClick(item, 'assign')}
                                      disabled={!!item.assigned_technician_id}
                                    >
                                      Assign
                                    </button>
                                    <button
                                      type="button"
                                      className="btn btn-warning"
                                      onClick={() => handleAssignClick(item, 'reassign')}
                                      disabled={!item.assigned_technician_id}
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
                              <td colSpan="15">No installation records found.</td>
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
                <select
                  className="form-control"
                  id="technicianId"
                  value={assignedTechnicianId}
                  onChange={(e) => setAssignedTechnicianId(e.target.value)}
                  required
                >
                  <option value="">Select Technician</option>
                  {technicians.map((tech) => (
                    <option key={tech.technician_id} value={tech.technician_id}>
                      {tech.technician_id} - {tech.name}
                    </option>
                  ))}
                </select>
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
