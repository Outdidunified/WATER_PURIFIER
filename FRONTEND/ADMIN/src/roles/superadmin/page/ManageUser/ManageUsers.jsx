// ManageUsers.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/Header';
import Sidebar from '../../components/Sidebar';
import Footer from '../../components/Footer';
import ReusableButton from '../../../../utils/ReusableButton';
import InputField from '../../../../utils/InputField';
import useManageUsers from '../../hooks/ManageUser/ManageUsersHooks';

import { Country, State, City } from 'country-state-city';
import { getDistricts } from 'india-state-district';
import SelectField from '../../../../utils/SelectField';
import { GeoService } from '../../../../services/GeoService';

const ManageUsers = ({ userInfo, handleLogout }) => {
  const navigate = useNavigate();

  // Location dropdown states for add user
  const [countries, setCountries] = useState([]);
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [selectedState, setSelectedState] = useState(null);
  const [selectedCity, setSelectedCity] = useState(null);
  const [selectedDistrict, setSelectedDistrict] = useState(null);

  // Location dropdown states for assign seller
  const [assignCountries, setAssignCountries] = useState([]);
  const [assignStates, setAssignStates] = useState([]);
  const [assignDistricts, setAssignDistricts] = useState([]);
  const [assignSelectedCountry, setAssignSelectedCountry] = useState(null);
  const [assignSelectedState, setAssignSelectedState] = useState(null);
  const [assignSelectedDistrict, setAssignSelectedDistrict] = useState(null);

  useEffect(() => {
    // Load countries for add user using GeoService (India will be first)
    const countryOptions = GeoService.getCountriesForSelect();
    setCountries(countryOptions);
    setAssignCountries(countryOptions);
    
    // Set India as default country
    const defaultCountry = GeoService.getDefaultCountryOption();
    setSelectedCountry(defaultCountry);
    setAssignSelectedCountry(defaultCountry);
    setCountry(defaultCountry.value);
    
    // Test districts library
    try {
      const testDistricts = getDistricts();
      console.log('Districts library loaded:', testDistricts.length, 'districts available');
    } catch (error) {
      console.error('Districts library error:', error);
    }
  }, []);

  useEffect(() => {
    if (selectedCountry) {
      // Load states for add user using GeoService
      const stateOptions = GeoService.getStatesForSelect(selectedCountry.isoCode);
      setStates(stateOptions);
      setSelectedState(null);
    } else {
      setStates([]);
      setSelectedState(null);
    }
    // Reset city and district
    setCities([]);
    setSelectedCity(null);
    setDistricts([]);
    setSelectedDistrict(null);
  }, [selectedCountry]);

  useEffect(() => {
    if (selectedState && selectedCountry) {
      console.log('Loading districts for:', selectedState.value, 'in', selectedCountry.value);
      
      // Load districts using GeoService
      const districtOptions = GeoService.getDistrictsForSelect(
        selectedCountry.isoCode, 
        selectedState.value
      );
      
      console.log('Districts loaded:', districtOptions.length, 'options');
      setDistricts(districtOptions);
      setSelectedDistrict(null);
    } else {
      setDistricts([]);
      setSelectedDistrict(null);
    }
    // Reset cities when state changes
    setCities([]);
    setSelectedCity(null);
  }, [selectedState, selectedCountry]);

  // New useEffect for cities based on district selection
  useEffect(() => {
    if (selectedDistrict && selectedState && selectedCountry) {
      console.log('Loading ALL cities for district:', selectedDistrict.value);
      
      // Load cities using GeoService
      const cityOptions = GeoService.getCitiesForSelect(
        selectedCountry.isoCode,
        selectedState.value,
        selectedDistrict.value
      );
      
      console.log(`All cities loaded:`, cityOptions.length, 'cities');
      setCities(cityOptions);
      setSelectedCity(null);
    } else {
      setCities([]);
      setSelectedCity(null);
    }
  }, [selectedDistrict, selectedState, selectedCountry]);

  useEffect(() => {
    if (assignSelectedCountry) {
      // Load states for assign seller using GeoService
      const stateOptions = GeoService.getStatesForSelect(assignSelectedCountry.isoCode);
      setAssignStates(stateOptions);
      setAssignSelectedState(null);
    } else {
      setAssignStates([]);
      setAssignSelectedState(null);
    }
    // Reset district
    setAssignDistricts([]);
    setAssignSelectedDistrict(null);
  }, [assignSelectedCountry]);

  useEffect(() => {
    if (assignSelectedState && assignSelectedCountry) {
      // Load districts for assign seller using GeoService
      const districtOptions = GeoService.getDistrictsForSelect(
        assignSelectedCountry.isoCode,
        assignSelectedState.value
      );
      setAssignDistricts(districtOptions);
      setAssignSelectedDistrict(null);
    } else {
      setAssignDistricts([]);
      setAssignSelectedDistrict(null);
    }
  }, [assignSelectedState, assignSelectedCountry]);

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
    handleEditUser,
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

  console.log(assignModalOpen,'new assign')
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
        width: '1100px',
        minWidth: '1000px',
        padding: '20px',
        borderRadius: '10px',
        backgroundColor: '#fff',
      }}
    >
      <span
        onClick={closeAddModal}
        style={{ float: 'right', cursor: 'pointer', fontSize: '30px', fontWeight: 'bold' }}
      >
        &times;
      </span>

      <form
        className="card"
        onSubmit={handleAddUserSubmit}
        style={{
          border: 'none',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          padding: '20px',
        }}
      >
        <div className="card-body">
          <h4 className="card-title text-center mb-4" style={{ color: '#495057', fontWeight: '600' }}>
            Add User
          </h4>

          <style jsx>{`
            .form-field {
              background-color: #fafafa;
              padding: 15px;
              border-radius: 8px;
              margin-bottom: 15px;
              border: 1px solid #e9ecef;
            }
            .form-field:hover {
              background-color: #f5f5f5;
              transition: background-color 0.2s ease;
            }
            label {
              display: block;
              margin-bottom: 5px;
              font-weight: 500;
              font-size: 14px;
              color: #495057;
            }
            .column-container {
              display: flex;
              gap: 30px;
            }
            .column {
              flex: 1;
            }
          `}</style>

          <div className="column-container">
            {/* Left Column */}
            <div className="column">
              {/* Role */}
              <div className="form-field">
                <label>Role</label>
                <SelectField
                  value={
                    roles.find((r) => r.role_id === role)
                      ? { value: role, label: roles.find((r) => r.role_id === role).role_name }
                      : null
                  }
                  onChange={(option) => setRole(option ? option.value : '')}
                  options={userInfo?.role_id === 4 ? roles.filter(r => r.role_id === 2 || r.role_id === 3).map((r) => ({ value: r.role_id, label: r.role_name })) : roles.map((r) => ({ value: r.role_id, label: r.role_name }))}
                  placeholder="Select Role"
                  required
    dropdownWidth="350px" // fixed dropdown width
                />
              </div>

              {/* Email */}
              <div className="form-field">
                <label>Email</label>
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
              <div className="form-field">
                <label>Password</label>
                <InputField
                  type="text"
                  placeholder="4-digit Password"
                  value={password}
                  maxLength={4}
                  pattern="^[1-9][0-9]{3}$"
                  title="Password must be exactly 4 digits and not start with 0"
                  onChange={(e) => setPassword(e.target.value.replace(/[^0-9]/g, ''))}
                  required
                />
              </div>

              {/* Address Line2 */}
              <div className="form-field">
                <label>Address Line2</label>
                <InputField
                  placeholder="Address Line2"
                  value={addressline2}
                  onChange={(e) => setAddressline2(e.target.value)}
                />
              </div>

              {/* State */}
              <div className="form-field">
                <label>State</label>
                <SelectField
                  value={selectedState}
                  onChange={(option) => {
                    setSelectedState(option);
                    setStateField(option ? option.value : '');
                  }}
                  options={states}
                  placeholder="Select State"
                  isDisabled={!selectedCountry}
    dropdownWidth="350px" // fixed dropdown width
                />
              </div>

              {/* City */}
              <div className="form-field">
                <label>City</label>
                <SelectField
                  value={selectedCity}
                  onChange={(option) => {
                    setSelectedCity(option);
                    setCity(option ? option.value : '');
                  }}
                  options={cities}
                  placeholder={`Select City${cities.length > 0 ? ` (${cities.length} available)` : ''}`}
                  isDisabled={!selectedDistrict}
    dropdownWidth="350px" // fixed dropdown width
                />
              </div>
            </div>

            {/* Right Column */}
            <div className="column">
              {/* Name */}
              <div className="form-field">
                <label>Name</label>
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

              {/* Phone */}
              <div className="form-field">
                <label>Phone</label>
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

              {/* Address Line1 */}
              <div className="form-field">
                <label>Address Line1</label>
                <InputField
                  placeholder="Address Line1"
                  value={addressline1}
                  onChange={(e) => setAddressline1(e.target.value)}
                />
              </div>

              {/* Country */}
              <div className="form-field">
                <label>Country</label>
                <SelectField
                  value={selectedCountry}
                  onChange={(option) => {
                    setSelectedCountry(option);
                    setCountry(option ? option.value : '');
                  }}
                  options={countries}
                  placeholder="Select Country"
    dropdownWidth="350px" // fixed dropdown width
                />
              </div>

              {/* District */}
              <div className="form-field">
                <label>District</label>
                <SelectField
                  value={selectedDistrict}
                  onChange={(option) => {
                    setSelectedDistrict(option);
                    setDistrict(option ? option.value : '');
                  }}
                  options={districts}
                  placeholder={`Select District${districts.length > 0 ? ` (${districts.length} available)` : ''}`}
                  isDisabled={!selectedState}
    dropdownWidth="350px" // fixed dropdown width
                />
              </div>

              {/* Pincode */}
              <div className="form-field">
                <label>Pincode</label>
                <InputField
                  placeholder="Pincode"
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value)}
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
                            {userInfo?.role_id !== 4 && <th>Assign</th>}
                            <th>Option</th>
                          </tr>
                        </thead>
                        <tbody style={{ textAlign: 'center' }}>
                          {isLoading ? (
                            <tr><td colSpan={userInfo?.role_id === 4 ? 6 : 7}>Loading...</td></tr>
                          ) : error ? (
                            <tr><td colSpan={userInfo?.role_id === 4 ? 6 : 7}>Error: {error}</td></tr>
                          ) : posts.length > 0 ? (
                            posts.map((dataItem, index) => (
                              <tr key={index}>
                                <td>{index + 1}</td>
                                <td>{dataItem.role_name || '-'}</td>
                                <td>{dataItem.name || '-'}</td>
                                <td>{dataItem.email || '-'}</td>
                                <td>{dataItem.status ? <span className="text-success">Active</span> : <span className="text-danger">DeActive</span>}</td>
                                {userInfo?.role_id !== 4 && <td>
                                  {dataItem.role_id === 4 && (
                                    <div className="d-flex justify-content-center" style={{ gap: '8px' }}>
                                      {dataItem.assigned_status ? (
                                        <button
                                          type="button"
                                          className="btn btn-warning"
                                          onClick={() => openAssignSellerModal(dataItem, 'reassign')}
                                        >
                                          Reassign
                                        </button>
                                      ) : (
                                        <button
                                          type="button"
                                          className="btn btn-primary"
                                          onClick={() => openAssignSellerModal(dataItem, 'assign')}
                                        >
                                          Assign
                                        </button>
                                      )}
                                    </div>
                                  )}
                                </td>}
                                <td>
                                  <div className="d-flex justify-content-center" style={{ gap: '8px' }}>
                                    <button
                                      type="button"
                                      className="btn btn-outline-success btn-icon-text"
                                      onClick={() => handleViewUser(dataItem)}
                                    >
                                      <i className="mdi mdi-eye"></i>View
                                    </button>
                                  
                                  </div>
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr><td colSpan={userInfo?.role_id === 4 ? 6 : 7}>No users found</td></tr>
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
              <div className="modalStyle" style={modalAddStyle} onClick={closeAssignSellerModal}>
                <div
                  className="modalContentStyle p-3"
                  style={{ maxWidth: '520px', width: '95%' }}
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
                      <SelectField
                        value={assignSelectedState}
                        onChange={(option) => {
                          setAssignSelectedState(option);
                          setAssignState(option ? option.value : '');
                        }}
                        options={assignStates}
                        placeholder="Select State"
                        isDisabled={!assignSelectedCountry}
                        required={assignMode === 'assign'}
                        dropdownWidth="350px"
                      />
                    </div>

                    {/* District */}
                    <div className="form-group mb-3">
                      <label className="mb-1" style={{ fontWeight: '500' }}>District</label>
                      <SelectField
                        value={assignSelectedDistrict}
                        onChange={(option) => {
                          setAssignSelectedDistrict(option);
                          setAssignDistrict(option ? option.value : '');
                        }}
                        options={assignDistricts}
                        placeholder="Select District"
                        isDisabled={!assignSelectedState}
                        required={assignMode === 'assign'}
                        dropdownWidth="350px"
                      />
                    </div>

                    {/* Status */}
                    <div className="form-group mb-3">
                      <label className="mb-1" style={{ fontWeight: '500' }}>Assigned Status</label>
                      <SelectField
                        value={assignStatus ? { value: 'true', label: 'Active' } : { value: 'false', label: 'Inactive' }}
                        onChange={(option) => setAssignStatus(option ? option.value === 'true' : false)}
                        options={[
                          { value: 'true', label: 'Active' },
                          { value: 'false', label: 'Inactive' }
                        ]}
                        placeholder="Select Status"
                        dropdownWidth="350px"
                      />
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
