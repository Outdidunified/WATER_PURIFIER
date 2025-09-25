// ManageUsers.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/Header';
import Sidebar from '../../components/Sidebar';
import Footer from '../../components/Footer';
import ReusableButton from '../../../../utils/ReusableButton';
import InputField from '../../../../utils/InputField';
import useManageUsers from '../../hooks/ManageUser/ManageUsersHooks';

const ManageUsers = ({ userInfo, handleLogout }) => {
  const navigate = useNavigate();

  const {
    posts,
    isLoading,
    error,
    handleSearchInputChange,
    roles,
    role, setRole,
    name, setName,
    email, setEmail,
    password, setPassword,
    phone, setPhone,
    city, setCity,
    country, setCountry,
    address, setAddress,
    addressline1, setAddressline1,
    addressline2, setAddressline2,
    district, setDistrict,
    stateField, setStateField,
    pincode, setPincode,
    formError,
    formLoading,
    isAddModalOpen,
    openAddModal,
    closeAddModal,
    handleAddUserSubmit,
    handleViewUser,
    // seller assignment
    assignModalOpen,
    assignMode,
    selectedSeller,
    assignState, setAssignState,
    assignDistrict, setAssignDistrict,
    assignStatus, setAssignStatus,
    assignLoading,
    openAssignSellerModal,
    closeAssignSellerModal,
    handleSellerAssignSubmit,
    // styles
    modalAddStyle,
  } = useManageUsers(userInfo);

  return (
    <div className='container-scroller'>
      <Header userInfo={userInfo} handleLogout={handleLogout} />
      <div className="container-fluid page-body-wrapper">
        <Sidebar />
        <div className="main-panel">
          <div className="content-wrapper">

            {/* Page Header */}
            <div className="row mb-3 align-items-center">
              <div className="col">
                <h3 className="fw-bold">Manage Users</h3>
              </div>
              <div className="col-auto">
                <button className="btn btn-success" onClick={openAddModal}>
                  Add User
                </button>
              </div>
            </div>

            {/* Add User Modal */}
            {isAddModalOpen && (
              <div className="modalStyle" style={modalAddStyle}>
                <div
                  className="modalContentStyle"
                  style={{
                    maxHeight: '750px',
                    overflowY: 'auto',
                    width: '850px',
                    minWidth: '800px',
                    padding: '20px',
                  }}
                >
                  <span
                    onClick={closeAddModal}
                    style={{ float: 'right', cursor: 'pointer', fontSize: '30px' }}
                  >
                    &times;
                  </span>

                  <form className="card" onSubmit={handleAddUserSubmit}>
                    <div className="card-body">
                      <h4 className="card-title text-center">Add User</h4>
                      <div className="table-responsive pt-3">

                        {/* Row 1: Role + Name */}
                        <div className="d-flex mb-3" style={{ gap: '20px' }}>
                          <div className="input-group flex-fill">
                            <div className="input-group-prepend">
                              <span className="input-group-text" style={{ width: '125px' }}>Role</span>
                            </div>
                            <select
                              className="form-control"
                              value={role}
                              onChange={(e) => setRole(Number(e.target.value))}
                              required
                            >
                              <option value="">Select Role</option>
                              {roles.map(r => (
                                <option key={r.role_id} value={r.role_id}>{r.role_name}</option>
                              ))}
                            </select>
                          </div>
                          <div className="input-group flex-fill">
                            <div className="input-group-prepend">
                              <span className="input-group-text" style={{ width: '125px' }}>Name</span>
                            </div>
                            <InputField
                              placeholder="Name"
                              value={name}
                              maxLength={50}
                              pattern="^[a-zA-Z ]*$"
                              title="Only letters and spaces are allowed"
                              onChange={e => setName(e.target.value.replace(/[^a-zA-Z ]/g, ''))}
                              required
                            />
                          </div>
                        </div>

                        {/* Row 2: Email + Phone */}
                        <div className="d-flex mb-3" style={{ gap: '20px' }}>
                          <div className="input-group flex-fill">
                            <div className="input-group-prepend">
                              <span className="input-group-text" style={{ width: '125px' }}>Email</span>
                            </div>
                            <InputField
                              type="email"
                              placeholder="Email"
                              value={email}
                              maxLength={50}
                              onChange={e => setEmail(e.target.value.toLowerCase())}
                              required
                            />
                          </div>
                          <div className="input-group flex-fill">
                            <div className="input-group-prepend">
                              <span className="input-group-text" style={{ width: '125px' }}>Phone</span>
                            </div>
                            <InputField
                              type="tel"
                              placeholder="Phone"
                              maxLength={10}
                              pattern="^[1-9][0-9]{9}$"
                              title="Phone must be 10 digits and should not start with 0"
                              value={phone}
                              onChange={e => {
                                const val = e.target.value.replace(/[^0-9]/g, '');
                                if (val.length === 1 && val === '0') return;
                                setPhone(val);
                              }}
                              required
                            />
                          </div>
                        </div>

                        {/* Row 3: Password + Pincode */}
                        <div className="d-flex mb-3" style={{ gap: '20px' }}>
                          <div className="input-group flex-fill">
                            <div className="input-group-prepend">
                              <span className="input-group-text" style={{ width: '125px' }}>Password</span>
                            </div>
                            <InputField
                              type="text"
                              placeholder="4-digit Password"
                              value={password}
                              maxLength={4}
                              pattern="^[1-9][0-9]{3}$"
                              title="Password must be exactly 4 digits and not start with 0"
                              onChange={e => setPassword(e.target.value.replace(/[^0-9]/g, ''))}
                              required
                            />
                          </div>
                          <div className="input-group flex-fill">
                            <div className="input-group-prepend">
                              <span className="input-group-text" style={{ width: '125px' }}>Pincode</span>
                            </div>
                            <InputField
                              placeholder="Pincode"
                              value={pincode}
                              onChange={e => setPincode(e.target.value)}
                            />
                          </div>
                        </div>

                        {/* Row 4: Address Line1 + Address Line2 */}
                        <div className="d-flex mb-3" style={{ gap: '20px' }}>
                          <div className="input-group flex-fill">
                            <div className="input-group-prepend">
                              <span className="input-group-text" style={{ width: '125px' }}>Address Line1</span>
                            </div>
                            <InputField
                              placeholder="Address Line1"
                              value={addressline1}
                              onChange={e => setAddressline1(e.target.value)}
                            />
                          </div>
                          <div className="input-group flex-fill">
                            <div className="input-group-prepend">
                              <span className="input-group-text" style={{ width: '125px' }}>Address Line2</span>
                            </div>
                            <InputField
                              placeholder="Address Line2"
                              value={addressline2}
                              onChange={e => setAddressline2(e.target.value)}
                            />
                          </div>
                        </div>

                        {/* Row 5: City + Country */}
                        <div className="d-flex mb-3" style={{ gap: '20px' }}>
                          <div className="input-group flex-fill">
                            <div className="input-group-prepend">
                              <span className="input-group-text" style={{ width: '125px' }}>City</span>
                            </div>
                            <InputField
                              placeholder="City"
                              value={city}
                              onChange={e => setCity(e.target.value)}
                            />
                          </div>
                          <div className="input-group flex-fill">
                            <div className="input-group-prepend">
                              <span className="input-group-text" style={{ width: '125px' }}>Country</span>
                            </div>
                            <InputField
                              placeholder="Country"
                              value={country}
                              onChange={e => setCountry(e.target.value)}
                            />
                          </div>
                        </div>

                        {/* Row 6: District + State */}
                        <div className="d-flex mb-3" style={{ gap: '20px' }}>
                          <div className="input-group flex-fill">
                            <div className="input-group-prepend">
                              <span className="input-group-text" style={{ width: '125px' }}>District</span>
                            </div>
                            <InputField
                              placeholder="District"
                              value={district}
                              onChange={e => setDistrict(e.target.value)}
                            />
                          </div>
                          <div className="input-group flex-fill">
                            <div className="input-group-prepend">
                              <span className="input-group-text" style={{ width: '125px' }}>State</span>
                            </div>
                            <InputField
                              placeholder="State"
                              value={stateField}
                              onChange={e => setStateField(e.target.value)}
                            />
                          </div>
                        </div>

                      </div>

                      {formError && <div className="text-danger">{formError}</div>}
                      <br />
                      <div className="d-flex justify-content-end">
                        <ReusableButton type="submit" loading={formLoading} disabled={formLoading}>
                          Add
                        </ReusableButton>
                      </div>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Users Table */}
            <div className="row">
              <div className="col-lg-12 grid-margin stretch-card">
                <div className="card">
                  <div className="card-body">
                    <div className="row mb-3">
                      <div className="col-8">
                        <h4 className="card-title">List Of Users</h4>
                      </div>
                      <div className="col-4">
                        <InputField placeholder="Search now" onChange={handleSearchInputChange} />
                      </div>
                    </div>

                    <div className="table-responsive" style={{ maxHeight: '500px', overflowY: 'auto' }}>
                      <table className="table table-striped">
                        <thead style={{ textAlign: 'center', position: 'sticky', top: 0, backgroundColor: 'white' }}>
                          <tr>
                            <th>Sl.No</th>
                            <th>Role Name</th>
                            <th>User Name</th>
                            <th>Email ID</th>
                            <th>Status</th>
                            <th>Assign</th>
                            <th>Option</th>
                          </tr>
                        </thead>
                        <tbody style={{ textAlign: 'center' }}>
                          {isLoading ? (
                            <tr><td colSpan={7}>Loading...</td></tr>
                          ) : error ? (
                            <tr><td colSpan={7}>Error: {error}</td></tr>
                          ) : posts.length > 0 ? (
                            posts.map((dataItem, index) => (
                              <tr key={index}>
                                <td>{index + 1}</td>
                                <td>{dataItem.role_name || '-'}</td>
                                <td>{dataItem.name || '-'}</td>
                                <td>{dataItem.email || '-'}</td>
                                <td>{dataItem.status ? <span className="text-success">Active</span> : <span className="text-danger">DeActive</span>}</td>
                                <td>
                                  {dataItem.role_id === 4 && (
                                    <div className="d-flex justify-content-center" style={{ gap: '8px' }}>
                                      <button
                                        type="button"
                                        className="btn btn-primary"
                                        onClick={() => openAssignSellerModal(dataItem, 'assign')}
                                        disabled={!!dataItem.assigned_status}
                                      >
                                        Assign
                                      </button>
                                      <button
                                        type="button"
                                        className="btn btn-warning"
                                        onClick={() => openAssignSellerModal(dataItem, 'reassign')}
                                        disabled={!dataItem.assigned_status}
                                      >
                                        Reassign
                                      </button>
                                    </div>
                                  )}
                                </td>
                                <td>
                                  <button
                                    type="button"
                                    className="btn btn-outline-success btn-icon-text"
                                    onClick={() => handleViewUser(dataItem)}
                                  >
                                    <i className="mdi mdi-eye"></i>View
                                  </button>
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr><td colSpan={7}>No users found</td></tr>
                          )}
                        </tbody>
                      </table>
                    </div>

                  </div>
                </div>
              </div>
            </div>

            {/* Assign/Reassign Modal for Sellers */}
            {assignModalOpen && selectedSeller && (
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
                onClick={closeAssignSellerModal}
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
                    {assignMode === 'reassign' ? 'Reassign Seller' : 'Assign Seller'}
                  </h5>

                  <form onSubmit={handleSellerAssignSubmit}>
                    <div className="form-group mb-3">
                      <label className="mb-1" style={{ fontWeight: '500' }}>Seller</label>
                      <div>{selectedSeller?.user_id} - {selectedSeller?.name}</div>
                    </div>

                    {/* State */}
                    <div className="form-group mb-3">
                      <label className="mb-1" style={{ fontWeight: '500' }}>State</label>
                      <input
                        className="form-control"
                        placeholder="State"
                        value={assignState}
                        onChange={(e) => setAssignState(e.target.value)}
                        required={assignMode === 'assign'}
                      />
                    </div>

                    {/* District */}
                    <div className="form-group mb-3">
                      <label className="mb-1" style={{ fontWeight: '500' }}>District</label>
                      <input
                        className="form-control"
                        placeholder="District"
                        value={assignDistrict}
                        onChange={(e) => setAssignDistrict(e.target.value)}
                        required={assignMode === 'assign'}
                      />
                    </div>

                    {/* Status */}
                    <div className="form-group mb-3">
                      <label className="mb-1" style={{ fontWeight: '500' }}>Assigned Status</label>
                      <select
                        className="form-control"
                        value={assignStatus ? 'true' : 'false'}
                        onChange={(e) => setAssignStatus(e.target.value === 'true')}
                      >
                        <option value="true">Active</option>
                        <option value="false">Inactive</option>
                      </select>
                    </div>

                    <div className="d-flex justify-content-end" style={{ gap: '10px', marginTop: '20px' }}>
                      <button
                        type="button"
                        className="btn btn-outline-secondary"
                        onClick={closeAssignSellerModal}
                        disabled={assignLoading}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className={`btn ${assignMode === 'reassign' ? 'btn-warning' : 'btn-success'}`}
                        disabled={assignLoading}
                      >
                        {assignLoading
                          ? assignMode === 'reassign' ? 'Reassigning...' : 'Assigning...'
                          : assignMode === 'reassign' ? 'Reassign' : 'Assign'}
                      </button>
                    </div>
                  </form>
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

export default ManageUsers;
