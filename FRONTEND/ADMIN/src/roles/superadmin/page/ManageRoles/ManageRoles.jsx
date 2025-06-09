//ManageRoles
import React from 'react';
import Header from '../../components/Header';
import Sidebar from '../../components/Sidebar';
import Footer from '../../components/Footer';
import { useNavigate } from 'react-router-dom';
import ReusableButton from '../../../../utils/ReusableButton';
import InputField from '../../../../utils/InputField';
import useManageRoles from '../../hooks/ManageRoles/ManageRolesHooks';

const ManageRoles = ({ userInfo, handleLogout }) => {
  const navigate = useNavigate();

  const {
    handleSearchInputChange,
    loading,
    modalAddStyle,
    error,
    roleId, roles, tableError,
    createdBy, formError, formLoading,
    posts,
    isLoading, isAddDisabled,
    errorMessage,
    setRoleId,
    setCreatedBy,
    openAddModal,
    closeAddModal,
    addManageUser, handleAddRoleSubmit, isDuplicateRole,
    isAddModalOpen, roleName, setRoleName,
  } = useManageRoles(userInfo);

  const handleViewRoles = (dataItem) => {
    navigate('/superadmin/ViewRoles', { state: { dataItem } });
  };

  return (
    <div className='container-scroller'>
      {/* Header */}
      <Header userInfo={userInfo} handleLogout={handleLogout} />
      <div className="container-fluid page-body-wrapper">
        {/* Sidebar */}
        <Sidebar />
        <div className="main-panel">
          <div className="content-wrapper">

            {/* Title & Add Button */}
            <div className="row">
              <div className="col-md-12 grid-margin">
                <div className="row">
                  <div className="col-12 col-xl-8 mb-4 mb-xl-0">
                    <h3 className="font-weight-bold">Manage Roles</h3>
                  </div>
                  <div className="col-12 col-xl-4">
                    <div className="justify-content-end d-flex">
                      <button type="button" className="btn btn-success" onClick={openAddModal}>
                        Add Role
                      </button>

                      {isAddModalOpen && (
                        <div className="modalStyle" style={modalAddStyle}>
                          <div className="modalContentStyle" style={{ maxHeight: '680px', overflowY: 'auto' }}>
                            <span
                              onClick={closeAddModal}
                              style={{ float: 'right', cursor: 'pointer', fontSize: '30px' }}
                            >
                              &times;
                            </span>

                            <form className="card" onSubmit={handleAddRoleSubmit}>
                              <div className="card-body">
                                <div style={{ textAlign: 'center' }}>
                                  <h4 className="card-title" style={{ alignItems: 'center' }}>Add Role</h4>
                                </div>

                                <div className="table-responsive pt-3">
                                  <div className="input-group mb-3">
                                    <div className="input-group-prepend">
                                      <span className="input-group-text custom-input-group-text" style={{ width: '125px' }}>
                                        Role
                                      </span>
                                    </div>
                                    <select
                                      className="form-control custom-select-rounded"
                                      value={roleId}
                                      onChange={(e) => {
                                        const selectedRoleId = e.target.value;
                                        const selectedRoleName = e.target.options[e.target.selectedIndex].text;
                                        setRoleId(selectedRoleId);
                                        setRoleName(selectedRoleName);
                                      }}
                                      required
                                    >
                                      <option value="">Select Role</option>
                                      <option value="1">Admin</option>
                                      <option value="2">Technician</option>
                                      <option value="3">End User</option>
                                    </select>
                                  </div>
                                </div>

                                {/* Show error messages */}
                                {formError && <div className="text-danger">{formError}</div>}
                                {isDuplicateRole && <div className="text-danger">This role already exists.</div>}
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
                            <h4 className="card-title" style={{ paddingTop: '10px' }}>List Of Roles</h4>
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

                    <div className="table-responsive" style={{ maxHeight: '500px', overflowY: 'auto' }}>
                      <table className="table table-striped">
                        <thead style={{ textAlign: 'center', position: 'sticky', tableLayout: 'fixed', top: 0, backgroundColor: 'white' }}>
                          <tr>
                            <th>Sl.No</th>
                            <th>Role ID</th>
                            <th>Role Name</th>
                            <th>Created By</th>
                            <th>Created Date</th>
                            <th>Status</th>
                            <th>Option</th>
                          </tr>
                        </thead>
                        <tbody style={{ textAlign: 'center' }}>
                          {isLoading ? (
                            <tr>
                              <td colSpan="7" style={{ marginTop: '50px', textAlign: 'center' }}>Loading...</td>
                            </tr>
                          ) : tableError ? (
                            <tr>
                              <td colSpan="7" style={{ marginTop: '50px', textAlign: 'center' }}>Error: {tableError}</td>
                            </tr>
                          ) : (
                            Array.isArray(roles) && roles.length > 0 ? (
                              roles.map((dataItem, index) => (
                                <tr key={dataItem._id || index}>
                                  <td>{index + 1}</td>
                                  <td>{dataItem.role_id || '-'}</td>
                                  <td>{dataItem.role_name || '-'}</td>
                                  <td>{dataItem.created_by || '-'}</td>
                                  <td>{new Date(dataItem.created_date).toLocaleDateString() || '-'}</td>
                                  <td>{dataItem.status ? <span className="text-success">Active</span> : <span className="text-danger">DeActive</span>}</td>
                                  <td>
                                    <button
                                      type="button"
                                      className="btn btn-outline-success btn-icon-text"
                                      onClick={() => handleViewRoles(dataItem)}
                                      style={{ marginBottom: '10px', marginRight: '10px' }}
                                    >
                                      <i className="mdi mdi-eye"></i>View
                                    </button>
                                  </td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td colSpan="7" style={{ marginTop: '50px', textAlign: 'center' }}>No roles found</td>
                              </tr>
                            )
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Footer */}
          <Footer />
        </div>
      </div>
    </div>
  );
};

export default ManageRoles;
