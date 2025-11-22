import React, { useState } from 'react';
import Header from '../../components/Header';
import Sidebar from '../../components/Sidebar';
import Footer from '../../components/Footer';
import { useNavigate } from 'react-router-dom';
import ReusableButton from '../../../../utils/ReusableButton';
import InputField from '../../../../utils/InputField';
import useManageRoles from '../../hooks/ManageRoles/ManageRolesHooks';
import axiosInstance from '../../../../utils/utils';
import { showSuccessAlert, showErrorAlert } from '../../../../utils/alert';
import Pagination from '../../components/Pagination/Pagination';

const ManageRoles = ({ userInfo, handleLogout }) => {
  const navigate = useNavigate();
  const {
    handleSearchInputChange,
    roles,
    tableError,
    formError,
    formLoading,
    isLoading,
    isAddDisabled,
    setRoleName,
    closeAddModal,
    handleAddRoleSubmit,
    isDuplicateRole,
    isAddModalOpen,
    roleName,
    currentPage,
    pageSize,
    totalRecords,
    totalPages,
    handlePageChange,
    handlePageSizeChange,
  } = useManageRoles(userInfo);

  // State for Grant Access Modal
  const [grantModalOpen, setGrantModalOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);
  const [permissions, setPermissions] = useState([]);
  const [originalPermissions, setOriginalPermissions] = useState([]);
  const [permissionsLoading, setPermissionsLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const summaryCardStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    background: 'linear-gradient(135deg, #4c5bfd 0%, #7c8bff 100%)',
    color: '#ffffff',
    borderRadius: '18px',
    padding: '9px 16px',
    boxShadow: '0 10px 22px rgba(76, 91, 253, 0.25)',
    cursor: 'pointer',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
    width: 'auto',
    minHeight: '44px',
    minWidth: '160px',
    border: 'none',
    outline: 'none',
  };

  const summaryCardContentStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    gap: '12px',
  };

  const summaryTextStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    lineHeight: 1.1,
  };

  const summaryLabelStyle = {
    fontSize: '12px',
    fontWeight: 600,
    letterSpacing: '0.02em',
    textTransform: 'none',
    opacity: 0.9,
    whiteSpace: 'nowrap',
  };

  const summaryValueStyle = {
    fontSize: '20px',
    fontWeight: 700,
    lineHeight: 1,
  };

  const summaryCaretStyle = {
    fontSize: '18px',
    opacity: 0.85,
  };

  const tableStyle = {
    '--bs-table-cell-padding-y': '0.45rem',
    '--bs-table-cell-padding-x': '0.6rem',
  };

  const nameCellStyle = {
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
    maxWidth: '240px',
  };

  const tableCellStyle = {
    verticalAlign: 'middle',
  };

  // Fetch permissions + all modules
  const openGrantAccessModal = async (role) => {
    setSelectedRole(role);
    setGrantModalOpen(true);
    setPermissionsLoading(true);

    try {
      // 1. Fetch assigned permissions
      const permRes = await axiosInstance.get(`/api/admin/by-role?ids=${role.role_id}`);

      // 2. Fetch all modules
      const modulesRes = await axiosInstance.get('/api/admin/modules');

      if (
        permRes.status === 200 &&
        permRes.data.status === 'Success' &&
        modulesRes.status === 200 &&
        modulesRes.data.status === 'Success'
      ) {
        const assigned = permRes.data.data; // permissions from DB
        const allModules = modulesRes.data.data; // modules list

        // Merge modules with existing permissions
        const merged = allModules.map((m) => {
          const found = assigned.find((p) => p.module === m.module);
          return {
            module: m.module,
            can_create: found ? found.can_create : false,
            can_view: found ? found.can_view : false,
            can_update: found ? found.can_update : false,
            can_delete: found ? found.can_delete : false,
          };
        });

        setPermissions(merged);
        setOriginalPermissions(JSON.parse(JSON.stringify(merged)));
        setHasChanges(false);
      } else {
        showErrorAlert('Error', 'Failed to fetch permissions/modules');
      }
    } catch (err) {
      const message = err.response?.data?.message || err.message || 'An error occurred while fetching permissions/modules';
      showErrorAlert('Error', message);
    } finally {
      setPermissionsLoading(false);
    }
  };

  const handlePermissionChange = (index, field, value) => {
    const updated = [...permissions];
    updated[index][field] = value;
    setPermissions(updated);

    const isChanged = JSON.stringify(updated) !== JSON.stringify(originalPermissions);
    setHasChanges(isChanged);
  };

  const handleSavePermissions = async () => {
    try {
      const payload = {
        role_id: selectedRole.role_id,
        permissions,
      };
      const response = await axiosInstance.post('/api/admin/assign', payload);
      if (response.status === 200 && response.data.status === 'Success') {
        showSuccessAlert('Success', 'Permissions updated successfully');
        setHasChanges(false);
        setGrantModalOpen(false);
      } else {
        showErrorAlert('Error', response.data.message || 'Failed to update permissions');
      }
    } catch (error) {
      showErrorAlert('Error', 'An error occurred while updating permissions');
    }
  };

  const handleViewRoles = (dataItem) => {
    navigate('/superadmin/ViewRoles', { state: { dataItem } });
  };

  return (
    <div className="container-scroller">
      <Header userInfo={userInfo} handleLogout={handleLogout} />
      <div className="container-fluid page-body-wrapper">
        <Sidebar />
        <div className="main-panel">
          <div className="content-wrapper">
            {/* Title, Count & Filter */}
            <div className="row">
              <div className="col-md-12 grid-margin" style={{ marginBottom: '10px' }}>
                <div className="row align-items-center gx-3 gy-2 flex-wrap">
                  <div className="col-auto">
                    <h3 className="font-weight-bold mb-0" style={{ fontSize: '22px' }}>Manage Roles</h3>
                  </div>
                  <div className="col-auto">
                    <div
                      style={summaryCardStyle}
                    >
                      <div style={summaryCardContentStyle}>
                        <div style={summaryTextStyle}>
                          <span style={summaryLabelStyle}>Total Roles</span>
                          <span style={summaryValueStyle}>{totalRecords}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="col ms-auto d-flex justify-content-end">
                    {/* <button type="button" className="btn btn-success" onClick={openAddModal}>
                      Add Role
                    </button> */}

                    {/* Add Role Modal */}
                    {isAddModalOpen && (
                      <div
                        className="modalStyle"
                        style={{
                          position: 'fixed',
                          top: 0,
                          left: 0,
                          width: '100%',
                          height: '100%',
                          backgroundColor: 'rgba(0,0,0,0.5)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          zIndex: 9999,
                        }}
                      >
                        <div
                          className="modalContentStyle"
                          style={{
                            background: '#fff',
                            padding: '20px',
                            borderRadius: '8px',
                            maxWidth: '600px',
                            width: '100%',
                            maxHeight: '680px',
                            overflowY: 'auto',
                          }}
                        >
                          <span
                            onClick={closeAddModal}
                            style={{
                              float: 'right',
                              cursor: 'pointer',
                              fontSize: '30px',
                            }}
                          >
                            &times;
                          </span>

                          <form className="card" onSubmit={handleAddRoleSubmit}>
                            <div className="card-body">
                              <div style={{ textAlign: 'center' }}>
                                <h4 className="card-title">Add Role</h4>
                              </div>

                              <div className="table-responsive pt-3">
                                <div className="input-group mb-3">
                                  <div className="input-group-prepend">
                                    <span
                                      className="input-group-text"
                                      style={{ width: '125px' }}
                                    >
                                      Role Name
                                    </span>
                                  </div>
                                  <input
                                    type="text"
                                    className="form-control"
                                    placeholder="Enter role name"
                                    value={roleName}
                                    onChange={(e) => setRoleName(e.target.value)}
                                    required
                                  />
                                </div>
                              </div>

                              {formError && <div className="text-danger">{formError}</div>}
                              {isDuplicateRole && (
                                <div className="text-danger">This role already exists.</div>
                              )}
                              <br />

                              <ReusableButton
                                type="submit"
                                loading={formLoading}
                                disabled={isAddDisabled}
                              >
                                Add
                              </ReusableButton>
                            </div>
                          </form>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Roles Table */}
            <div className="row">
              <div className="col-lg-12 grid-margin stretch-card">
                <div className="card">
                  <div className="card-body">
                    <div className="row">
                      <div className="col-md-12 grid-margin">
                        <div className="row">
                          <div className="col-4 col-xl-8">
                            <h4 className="card-title" style={{ paddingTop: '10px' }}>
                              List Of Roles
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
                                placeholder="Search now"
                                ariaLabel="search"
                                ariadescribedby="search"
                                autoComplete="off"
                                onChange={handleSearchInputChange}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                       <div className="table-responsive dynamic-table">
                      <table className="table table-striped text-center" style={tableStyle}>
                        <thead
                          style={{
                            textAlign: 'center',
                            position: 'sticky',
                            tableLayout: 'fixed',
                            top: 0,
                            backgroundColor: 'white',
                            zIndex: 1,
                          }}
                        >
                          <tr>
                            <th>Sl.No</th>
                            <th>Role ID</th>
                            <th>Role Name</th>
                            <th>Created By</th>
                            <th>Created Date</th>
                            <th>Status</th>
                            <th>Option</th>
                            <th>Grant Access</th>
                          </tr>
                        </thead>
                        <tbody style={{ textAlign: 'center', lineHeight: '1.2' }}>
                          {isLoading ? (
                            <tr>
                              <td colSpan="8" style={tableCellStyle}>Loading...</td>
                            </tr>
                          ) : tableError ? (
                            <tr>
                              <td colSpan="8" style={tableCellStyle}>Error: {tableError}</td>
                            </tr>
                          ) : Array.isArray(roles) && roles.length > 0 ? (
                            roles.map((dataItem, index) => (
                              <tr key={dataItem._id || index}>
                                <td style={tableCellStyle}>{index + 1}</td>
                                <td style={tableCellStyle}>{dataItem.role_id || '-'}</td>
                                <td style={{ ...tableCellStyle, ...nameCellStyle }}>{dataItem.role_name || '-'}</td>
                                <td style={tableCellStyle}>{dataItem.created_by || '-'}</td>
                                <td style={tableCellStyle}>
                                  {dataItem.created_date
                                    ? new Date(dataItem.created_date).toLocaleDateString()
                                    : '-'}
                                </td>
                                <td style={tableCellStyle}>
                                  {dataItem.status ? (
                                    <span className="text-success">Active</span>
                                  ) : (
                                    <span className="text-danger">DeActive</span>
                                  )}
                                </td>
                                <td style={tableCellStyle}>
                                  <button
                                    type="button"
                                    className="btn btn-outline-success btn-icon-text"
                                    onClick={() => handleViewRoles(dataItem)}
                                    style={{ marginBottom: '6px', marginRight: '6px' }}
                                  >
                                    <i className="mdi mdi-eye"></i>View
                                  </button>
                                </td>
                                <td style={tableCellStyle}>
                                  {Number(dataItem.role_id) === 1 || Number(dataItem.role_id) === 4 ? (
                                    <button
                                      type="button"
                                      className="btn btn-outline-primary btn-icon-text"
                                      onClick={() => openGrantAccessModal(dataItem)}
                                    >
                                      Grant Access
                                    </button>
                                  ) : (
                                    <span>-</span>
                                  )}
                                </td>

                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan="8" style={tableCellStyle}>No roles found</td>
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

            {/* Grant Access Modal */}
            {grantModalOpen && (
              <div
                className="modalStyle"
                style={{
                  position: 'fixed',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  backgroundColor: 'rgba(0,0,0,0.5)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 9999,
                }}
              >
                <div
                  className="modalContentStyle"
                  style={{
                    background: '#fff',
                    padding: '20px',
                    borderRadius: '8px',
                    maxWidth: '800px',
                    width: '100%',
                    maxHeight: '680px',
                    overflowY: 'auto',
                  }}
                >
                  <span
                    onClick={() => {
                      setGrantModalOpen(false);
                      setHasChanges(false);
                    }}
                    style={{
                      float: 'right',
                      cursor: 'pointer',
                      fontSize: '30px',
                    }}
                  >
                    &times;
                  </span>

                  <h4 style={{ textAlign: 'center' }}>Grant Access - {selectedRole?.role_name}</h4>
                  {permissionsLoading ? (
                    <p>Loading permissions...</p>
                  ) : (
                    <table className="table table-bordered mt-3">
                      <thead>
                        <tr>
                          <th>Module</th>
                          <th>Create</th>
                          <th>View</th>
                          <th>Update</th>
                          <th>Delete</th>
                        </tr>
                      </thead>
                      <tbody>
                        {permissions.map((perm, index) => (
                          <tr key={index}>
                            <td>{perm.module}</td>
                            <td>
                              <input
                                type="checkbox"
                                checked={perm.can_create}
                                onChange={(e) =>
                                  handlePermissionChange(index, 'can_create', e.target.checked)
                                }
                              />
                            </td>
                            <td>
                              <input
                                type="checkbox"
                                checked={perm.can_view}
                                onChange={(e) =>
                                  handlePermissionChange(index, 'can_view', e.target.checked)
                                }
                              />
                            </td>
                            <td>
                              <input
                                type="checkbox"
                                checked={perm.can_update}
                                onChange={(e) =>
                                  handlePermissionChange(index, 'can_update', e.target.checked)
                                }
                              />
                            </td>
                            <td>
                              <input
                                type="checkbox"
                                checked={perm.can_delete}
                                onChange={(e) =>
                                  handlePermissionChange(index, 'can_delete', e.target.checked)
                                }
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}

                  <div style={{ textAlign: 'center', marginTop: '20px' }}>
                    <ReusableButton onClick={handleSavePermissions} disabled={!hasChanges}>Save Permissions</ReusableButton>
                  </div>
                </div>
              </div>
            )}
          </div>
          <Footer />
        </div>
      </div>
    </div>
  );
};

export default ManageRoles;
