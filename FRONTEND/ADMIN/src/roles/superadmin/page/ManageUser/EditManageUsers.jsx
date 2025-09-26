import React, { useState, useEffect } from 'react';
import Header from '../../components/Header';
import Sidebar from '../../components/Sidebar';
import Footer from '../../components/Footer';
import { useNavigate } from 'react-router-dom';
import ReusableButton from '../../../../utils/ReusableButton';
import InputField from '../../../../utils/InputField';
import useEditManageUsers from '../../hooks/ManageUser/EditManageUsersHooks';
import SelectField from '../../../../utils/SelectField';
import { GeoService } from '../../../../services/GeoService';

const EditManageUsers = ({ userInfo, handleLogout }) => {
  const navigate = useNavigate();

  const {
    editManageUser,
    setPhone,
    setPassword,
    setCity,
    setName,
    setEmail,
    setAddressLine1,
    setAddressLine2,
    setDistrict,
    setState,
    setCountry,
    setPincode,
    handleStatusChange,
    isModified,
    name,
    email,
    password,
    phone,
    city,
    addressline1,
    addressline2,
    district,
    state,
    country,
    pincode,
    selectStatus,
    errorMessage,
    isloading: loading,
    backManageUser
  } = useEditManageUsers(userInfo);

  // Location dropdown states
  const [countries, setCountries] = useState([]);
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [selectedState, setSelectedState] = useState(null);
  const [selectedCity, setSelectedCity] = useState(null);
  const [selectedDistrict, setSelectedDistrict] = useState(null);

  useEffect(() => {
    const countryOptions = GeoService.getCountriesForSelect();
    setCountries(countryOptions);

    if (country) {
      const initialCountry = countryOptions.find(c => c.value === country);
      setSelectedCountry(initialCountry);
    } else {
      const defaultCountry = GeoService.getDefaultCountryOption();
      setSelectedCountry(defaultCountry);
      setCountry(defaultCountry.value);
    }
  }, [country]);

  useEffect(() => {
    if (selectedCountry) {
      const stateOptions = GeoService.getStatesForSelect(selectedCountry.isoCode);
      setStates(stateOptions);

      if (state && stateOptions.find(s => s.value === state)) {
        setSelectedState(stateOptions.find(s => s.value === state));
      } else {
        setSelectedState(null);
        setState('');
      }
    } else {
      setStates([]);
      setSelectedState(null);
      setState('');
    }

    // Reset city and district when country changes
    setCities([]);
    setSelectedCity(null);
    setCity('');
    setDistricts([]);
    setSelectedDistrict(null);
    setDistrict('');
  }, [selectedCountry, state, setState, setCity, setDistrict]);

  useEffect(() => {
    if (selectedState && selectedCountry) {
      const cityOptions = GeoService.getCitiesForSelect(
        selectedCountry.isoCode, 
        selectedState.value
      );
      setCities(cityOptions);

      if (city && cityOptions.find(c => c.value === city)) {
        setSelectedCity(cityOptions.find(c => c.value === city));
      } else {
        setSelectedCity(null);
        setCity('');
      }

      const districtOptions = GeoService.getDistrictsForSelect(
        selectedCountry.isoCode,
        selectedState.value
      );
      setDistricts(districtOptions);

      if (district && districtOptions.find(d => d.value === district)) {
        setSelectedDistrict(districtOptions.find(d => d.value === district));
      } else {
        setSelectedDistrict(null);
        setDistrict('');
      }
    } else {
      setCities([]);
      setSelectedCity(null);
      setCity('');
      setDistricts([]);
      setSelectedDistrict(null);
      setDistrict('');
    }
  }, [selectedState, city, district, setCity, setDistrict, selectedCountry]);

  // Styles for form fields
  const formFieldStyle = {
    marginBottom: '15px',
    display: 'flex',
    flexDirection: 'column'
  };

  const labelStyle = {
    marginBottom: '5px',
    fontWeight: '500',
    fontSize: '14px',
    color: '#495057'
  };

  const inputStyle = {
    height: '38px',
    borderRadius: '8px'
  };

  return (
    <div className='container-scroller'>
      <Header userInfo={userInfo} handleLogout={handleLogout} />
      <div className="container-fluid page-body-wrapper">
        <Sidebar />
        <div className="main-panel">
          <div className="content-wrapper">
            <div className="row mb-3">
              <div className="col-12 col-xl-8 mb-4 mb-xl-0">
                <h3 className="font-weight-bold">Edit User List</h3>
              </div>
              <div className="col-12 col-xl-4 d-flex justify-content-end">
                <button type="button" className="btn btn-success" onClick={backManageUser}>Back</button>
              </div>
            </div>

            <form className="card p-4" onSubmit={editManageUser} style={{ borderRadius: '10px' }}>
              <div className="d-flex gap-4 flex-wrap">
                {/* Left Column */}
                <div style={{ flex: 1, minWidth: '300px' }}>
                  {/* Name */}
                  <div style={formFieldStyle}>
                    <label style={labelStyle}>Name</label>
                    <InputField value={name} readOnly maxLength={50} style={inputStyle} />
                  </div>

                  {/* Email */}
                  <div style={formFieldStyle}>
                    <label style={labelStyle}>Email</label>
                    <InputField type="email" value={email} readOnly maxLength={50} style={inputStyle} />
                  </div>

                  {/* Phone */}
                  <div style={formFieldStyle}>
                    <label style={labelStyle}>Phone Number</label>
                    <InputField
                      value={phone}
                      maxLength={10}
                      pattern="[1-9][0-9]{9}"
                      title="Phone must be 10 digits and cannot start with 0"
                      onChange={(e) => {
                        let value = e.target.value.replace(/[^0-9]/g, '');
                        if (value.length === 1 && value === '0') return;
                        setPhone(value);
                      }}
                      required
                      style={inputStyle}
                    />
                  </div>

                  {/* Password */}
                  <div style={formFieldStyle}>
                    <label style={labelStyle}>Password (4-digit)</label>
                    <InputField
                      type="text"
                      value={password}
                      maxLength={4}
                      pattern="\d{4}"
                      title="Password must be exactly 4 digits"
                      onChange={(e) => setPassword(e.target.value.replace(/[^0-9]/g, ''))}
                      required
                      style={inputStyle}
                    />
                  </div>

                  {/* Address Line 1 */}
                  <div style={formFieldStyle}>
                    <label style={labelStyle}>Address Line 1</label>
                    <InputField
                      value={addressline1}
                      maxLength={100}
                      onChange={(e) => setAddressLine1(e.target.value)}
                      required
                      style={inputStyle}
                    />
                  </div>

                  {/* Address Line 2 */}
                  <div style={formFieldStyle}>
                    <label style={labelStyle}>Address Line 2</label>
                    <InputField
                      value={addressline2}
                      maxLength={100}
                      onChange={(e) => setAddressLine2(e.target.value)}
                      style={inputStyle}
                    />
                  </div>
                </div>

                {/* Right Column */}
                <div style={{ flex: 1, minWidth: '300px' }}>
                  {/* Country */}
                  <div style={formFieldStyle}>
                    <label style={labelStyle}>Country</label>
                    <SelectField
                      value={selectedCountry}
                      onChange={(option) => {
                        setSelectedCountry(option);
                        setCountry(option ? option.value : '');
                      }}
                      options={countries}
                      placeholder="Select Country"
                      required
                      dropdownWidth="350px"
                    />
                  </div>

                  {/* State */}
                  <div style={formFieldStyle}>
                    <label style={labelStyle}>State</label>
                    <SelectField
                      value={selectedState}
                      onChange={(option) => {
                        setSelectedState(option);
                        setState(option ? option.value : '');
                      }}
                      options={states}
                      placeholder="Select State"
                      isDisabled={!selectedCountry}
                      required
                      dropdownWidth="350px"
                    />
                  </div>

                  {/* City */}
                  <div style={formFieldStyle}>
                    <label style={labelStyle}>City</label>
                    <SelectField
                      value={selectedCity}
                      onChange={(option) => {
                        setSelectedCity(option);
                        setCity(option ? option.value : '');
                      }}
                      options={cities}
                      placeholder="Select City"
                      isDisabled={!selectedState}
                      required
                      dropdownWidth="350px"
                    />
                  </div>

                  {/* District */}
                  <div style={formFieldStyle}>
                    <label style={labelStyle}>District</label>
                    <SelectField
                      value={selectedDistrict}
                      onChange={(option) => {
                        setSelectedDistrict(option);
                        setDistrict(option ? option.value : '');
                      }}
                      options={districts}
                      placeholder="Select District"
                      isDisabled={!selectedState}
                      required
                      dropdownWidth="350px"
                    />
                  </div>

                  {/* Pincode */}
                  <div style={formFieldStyle}>
                    <label style={labelStyle}>Pincode</label>
                    <InputField
                      value={pincode}
                      maxLength={6}
                      pattern="\d{6}"
                      title="Pincode must be exactly 6 digits"
                      onChange={(e) => setPincode(e.target.value.replace(/[^0-9]/g, ''))}
                      required
                      style={inputStyle}
                    />
                  </div>

                  {/* Status */}
                  <div style={formFieldStyle}>
                    <label style={labelStyle}>Status</label>
                    <select
                      className="form-control"
                      value={selectStatus}
                      onChange={handleStatusChange}
                      required
                      style={{ ...inputStyle, padding: '0 12px' }}
                    >
                      <option value="true">Active</option>
                      <option value="false">Inactive</option>
                    </select>
                  </div>
                </div>
              </div>

              {errorMessage && <div className="text-danger mb-2">{errorMessage}</div>}

              <div className="d-flex justify-content-end mt-3">
                <ReusableButton
                  type="submit"
                  disabled={loading || !isModified}
                  loading={loading}
                >
                  Update
                </ReusableButton>
              </div>
            </form>
          </div>
          <Footer />
        </div>
      </div>
    </div>
  );
};

export default EditManageUsers;
