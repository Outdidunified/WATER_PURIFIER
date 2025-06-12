//ManageUsers
import React from 'react';
import Header from '../../components/Header';
import Sidebar from '../../components/Sidebar';
import Footer from '../../components/Footer';
import { useNavigate } from 'react-router-dom';
import useManageUsers from '../../hooks/ManageUser/ManageUsersHooks';
import ReusableButton from '../../../../utils/ReusableButton';
import InputField from '../../../../utils/InputField';

const ManageUsers = ({ userInfo, handleLogout }) => {
  const navigate = useNavigate();

  const {
    handleSearchInputChange,
    loading,role,formError,formLoading,
    modalAddStyle,
    error,
    roleId,setRole,
    name,
    email,
    password,
    phone,
    city,
    createdBy,
    posts,
    isLoading,
    errorMessage,
    setRoleId,
    setName,
    setEmail,
    setPassword,
    setPhone,
    setCity,
    setCreatedBy,
    openAddModal,
    closeAddModal,
    addManageUser, handleAddUserSubmit,
    handleViewUser, isAddModalOpen,

  } = useManageUsers(userInfo);

  return (
    <div className='container-scroller'>
      {/* Header */}
      <Header userInfo={userInfo} handleLogout={handleLogout} />
      <div className="container-fluid page-body-wrapper">
        {/* Sidebar */}
        <Sidebar />
        <div className="main-panel">
          <div className="content-wrapper">
            <div className="row">
              <div className="col-md-12 grid-margin">
                <div className="row">
                  <div className="col-12 col-xl-8 mb-4 mb-xl-0">
                    <h3 className="font-weight-bold">Manage Users</h3>
                  </div>
                  <div className="col-12 col-xl-4">
                    <div className="justify-content-end d-flex">
                      <button type="button" className="btn btn-success" onClick={openAddModal}>
                        Add User
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

                            <form className="card" onSubmit={handleAddUserSubmit}>
  <div className="card-body">
    <div style={{ textAlign: 'center' }}>
      <h4 className="card-title">Add User</h4>
    </div>

    <div className="table-responsive pt-3">
      {/* Role Dropdown */}
      <div className="input-group mb-3">
        <div className="input-group-prepend">
          <span className="input-group-text" style={{ color: 'black', width: '125px' }}>Role</span>
        </div>
        <select
          className="form-control"
          value={role}
          onChange={(e) => setRole(Number(e.target.value))}
          required
        >
          <option value={1}>Admin</option>
          <option value={2}>Technician</option>
          <option value={3}>End User</option>
        </select>
      </div>

      {/* Name */}
      <div className="input-group mb-3">
        <div className="input-group-prepend">
          <span className="input-group-text" style={{ color: 'black', width: '125px' }}>Name</span>
        </div>
        <InputField
          placeholder="Name"
          value={name}
          maxLength={50}
          pattern="^[a-zA-Z ]*$"
          title="Only letters and spaces are allowed"
          onChange={(e) => setName(e.target.value.replace(/[^a-zA-Z ]/g, ''))}
          required
        />
      </div>

      {/* Email */}
      <div className="input-group mb-3">
        <div className="input-group-prepend">
          <span className="input-group-text" style={{ color: 'black', width: '125px' }}>Email</span>
        </div>
        <InputField
          type="email"
          placeholder="Email"
          value={email}
          maxLength={50}
          onChange={(e) => setEmail(e.target.value.toLowerCase())}
          required
        />
      </div>

      {/* Password */}
      <div className="input-group mb-3">
        <div className="input-group-prepend">
          <span className="input-group-text" style={{ color: 'black', width: '125px' }}>Password</span>
        </div>
        <InputField
          type="text"
          placeholder="4-digit Password"
          value={password}
          maxLength={4}
          pattern="^[1-9][0-9]{3}$"
          title="Password must be exactly 4 digits and not start with 0"
          onChange={(e) => {
            const value = e.target.value.replace(/[^0-9]/g, '');
            setPassword(value);
          }}
          required
        />
      </div>

      {/* Phone */}
      <div className="input-group mb-3">
        <div className="input-group-prepend">
          <span className="input-group-text" style={{ color: 'black', width: '125px' }}>Phone</span>
        </div>
        <InputField
          type="tel"
          placeholder="Phone"
          maxLength={10}
          pattern="^[1-9][0-9]{9}$"
          title="Phone must be 10 digits and should not start with 0"
          value={phone}
          onChange={(e) => {
            const val = e.target.value.replace(/[^0-9]/g, '');
            if (val.length === 1 && val === '0') return;
            setPhone(val);
          }}
          required
        />
      </div>

      {/* City */}
      <div className="input-group mb-3">
        <div className="input-group-prepend">
          <span className="input-group-text" style={{ color: 'black', width: '125px' }}>City</span>
        </div>
        <InputField
          placeholder="City"
          value={city}
          maxLength={50}
          pattern="^[a-zA-Z ]{2,}$"
          title="City must be at least 2 letters and only alphabets"
          onChange={(e) => setCity(e.target.value.replace(/[^a-zA-Z ]/g, ''))}
          required
        />
      </div>
    </div>

    {formError && <div className="text-danger">{formError}</div>}
    <br />
    <ReusableButton type="submit" loading={formLoading} disabled={formLoading}>
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

            {/* Users Table */}
            <div className="row">
              <div className="col-lg-12 grid-margin stretch-card">
                <div className="card">
                  <div className="card-body">
                    <div className="row">
                      <div className="col-md-12 grid-margin">
                        <div className="row">
                          <div className="col-4 col-xl-8">
                            <h4 className="card-title" style={{ paddingTop: '10px' }}>List Of Users</h4>
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
                            <th>Role Name</th>
                            <th>User Name</th>
                            <th>Email ID</th>
                            <th>Status</th>
                            <th>Option</th>
                          </tr>
                        </thead>
                        <tbody style={{ textAlign: 'center' }}>
                          {isLoading ? (
                            <tr>
                              <td colSpan="6" style={{ marginTop: '50px', textAlign: 'center' }}>Loading...</td>
                            </tr>
                          ) : error ? (
                            <tr>
                              <td colSpan="6" style={{ marginTop: '50px', textAlign: 'center' }}>Error: {tableError}</td>
                            </tr>
                          ) : (
                            Array.isArray(posts) && posts.length > 0 ? (
                              posts.map((dataItem, index) => (
                                <tr key={index}>
                                  <td>{index + 1}</td>
                                  <td>{dataItem.role_name || '-'}</td>
                                  <td>{dataItem.name || '-'}</td>
                                  <td>{dataItem.email || '-'}</td>
                                  <td>{dataItem.status ? <span className="text-success">Active</span> : <span className="text-danger">DeActive</span>}</td>
                                  <td>
                                    <button
                                      type="button"
                                      className="btn btn-outline-success btn-icon-text"
                                      onClick={() => handleViewUser(dataItem)}
                                      style={{ marginBottom: '10px', marginRight: '10px' }}
                                    >
                                      <i className="mdi mdi-eye"></i>View
                                    </button>
                                  </td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td colSpan="6" style={{ marginTop: '50px', textAlign: 'center' }}>No users found</td>
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

export default ManageUsers;
