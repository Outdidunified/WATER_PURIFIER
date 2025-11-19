import React, { useState, useEffect } from 'react';
import Header from '../../components/Header';
import Sidebar from '../../components/Sidebar';
import Footer from '../../components/Footer';
import { useNavigate } from 'react-router-dom';
import ReusableButton from '../../../../utils/ReusableButton';
import InputField from '../../../../utils/InputField';
import SelectField from '../../../../utils/SelectField';
import useEditManageUsers from '../../hooks/ManageUser/EditManageUsersHooks';
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
    backManageUser,
  } = useEditManageUsers(userInfo);

  // Dropdown states
  const [countries, setCountries] = useState([]);
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const [districts, setDistricts] = useState([]);

  // Selected dropdown values
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [selectedState, setSelectedState] = useState(null);
  const [selectedDistrict, setSelectedDistrict] = useState(null);
  const [selectedCity, setSelectedCity] = useState(null);

  const normalizeValue = (value) => (value ?? '').toString().trim().toLowerCase();

  // ---------------------------
  // 1️⃣ LOAD ALL COUNTRIES
  // ---------------------------
  useEffect(() => {
    const countryOptions = GeoService.getCountriesForSelect();
    setCountries(countryOptions);
  }, []);

  // ---------------------------
  // 2️⃣ PRELOAD COUNTRY + STATE
  // ---------------------------
  useEffect(() => {
    if (!country || !countries.length) return;

    // match country
    const existingCountry = countries.find(
      (c) =>
        normalizeValue(c.value) === normalizeValue(country) ||
        normalizeValue(c.label) === normalizeValue(country)
    );
    if (!existingCountry) return;

    setSelectedCountry(existingCountry);

    // load states
    const stateOptions = GeoService.getStatesForSelect(existingCountry.isoCode);
    setStates(stateOptions);

    // match state
    const stateMatch = stateOptions.find(
      (s) =>
        normalizeValue(s.value) === normalizeValue(state) ||
        normalizeValue(s.label) === normalizeValue(state)
    );
    setSelectedState(stateMatch || null);
  }, [country, countries]);

  // ---------------------------
  // 3️⃣ PRELOAD DISTRICT + CITY AFTER STATE LOADS
  // ---------------------------
  useEffect(() => {
    if (!selectedCountry || !selectedState) return;

    // Load districts
    const districtOptions = GeoService.getDistrictsForSelect(
      selectedCountry.isoCode,
      selectedState.value
    );
    setDistricts(districtOptions);

    const districtMatch = districtOptions.find(
      (d) =>
        normalizeValue(d.value) === normalizeValue(district) ||
        normalizeValue(d.label) === normalizeValue(district)
    );
    setSelectedDistrict(districtMatch || null);

    // Load cities
    const cityOptions = GeoService.getCitiesForSelect(
      selectedCountry.isoCode,
      selectedState.value
    );
    setCities(cityOptions);

    const cityMatch = cityOptions.find(
      (c) =>
        normalizeValue(c.value) === normalizeValue(city) ||
        normalizeValue(c.label) === normalizeValue(city)
    );
    setSelectedCity(cityMatch || null);
  }, [selectedState]);

  // ---------------------------
  // 4️⃣ DISTRICT → CITY REFRESH
  // ---------------------------
  useEffect(() => {
  if (!selectedCountry || !selectedState || !selectedDistrict) return;

  const cityOptions = GeoService.getCitiesForSelect(
    selectedCountry.isoCode,
    selectedState.value,
    selectedDistrict.value
  );

  setCities(cityOptions);

  const cityMatch = cityOptions.find(
    (c) => normalizeValue(c.value) === normalizeValue(city)
  );

  setSelectedCity(cityMatch || null);
}, [selectedDistrict]);


  // ---------------------------
  // FORM STYLES
  // ---------------------------
  const formFieldStyle = { marginBottom: '15px', display: 'flex', flexDirection: 'column' };
  const labelStyle = { marginBottom: '5px', fontWeight: '500', fontSize: '14px', color: '#495057' };
  const inputStyle = { height: '38px', borderRadius: '8px' };

  return (
    <div className="container-scroller">
      <Header userInfo={userInfo} handleLogout={handleLogout} />
      <div className="container-fluid page-body-wrapper">
        <Sidebar />
        <div className="main-panel">
          <div className="content-wrapper">
            <div className="row mb-3">
              <div className="col-12 col-xl-8 mb-4 mb-xl-0">
                <h3 className="font-weight-bold">Edit User</h3>
              </div>
              <div className="col-12 col-xl-4 d-flex justify-content-end">
                <button type="button" className="btn btn-success" onClick={backManageUser}>
                  Back
                </button>
              </div>
            </div>

            <form className="card p-4" onSubmit={editManageUser} style={{ borderRadius: '10px' }}>
              <div className="d-flex gap-4 flex-wrap">

                {/* LEFT */}
                <div style={{ flex: 1, minWidth: '300px' }}>
                  <div style={formFieldStyle}>
                    <label style={labelStyle}>Name</label>
                    <InputField value={name} readOnly style={inputStyle} />
                  </div>
                  <div style={formFieldStyle}>
                    <label style={labelStyle}>Email</label>
                    <InputField value={email} readOnly style={inputStyle} />
                  </div>
                  <div style={formFieldStyle}>
                    <label style={labelStyle}>Phone Number</label>
                    <InputField
                      value={phone}
                      maxLength={10}
                      onChange={(e) => {
                        let v = e.target.value.replace(/[^0-9]/g, '');
                        if (v.length === 1 && v === '0') return;
                        setPhone(v);
                      }}
                      required
                      style={inputStyle}
                    />
                  </div>
                  <div style={formFieldStyle}>
                    <label style={labelStyle}>Password (4-digit)</label>
                    <InputField
                      value={password}
                      maxLength={4}
                      onChange={(e) => setPassword(e.target.value.replace(/[^0-9]/g, ''))}
                      required
                      style={inputStyle}
                    />
                  </div>
                  <div style={formFieldStyle}>
                    <label style={labelStyle}>Address Line 1</label>
                    <InputField
                      value={addressline1}
                      onChange={(e) => setAddressLine1(e.target.value)}
                      required
                      style={inputStyle}
                    />
                  </div>
                  <div style={formFieldStyle}>
                    <label style={labelStyle}>Address Line 2</label>
                    <InputField
                      value={addressline2}
                      onChange={(e) => setAddressLine2(e.target.value)}
                      style={inputStyle}
                    />
                  </div>
                </div>

                {/* RIGHT */}
                <div style={{ flex: 1, minWidth: '300px' }}>
                  <div style={formFieldStyle}>
                    <label style={labelStyle}>Country</label>
                    <SelectField
                      value={selectedCountry}
                      onChange={(option) => {
                        setSelectedCountry(option);
                        setCountry(option?.value || '');
                        setStates([]);
                        setCities([]);
                        setDistricts([]);
                        setSelectedState(null);
                        setSelectedDistrict(null);
                        setSelectedCity(null);
                        setState('');
                        setDistrict('');
                        setCity('');
                      }}
                      options={countries}
                      placeholder="Select Country"
                      required
                    />
                  </div>

                  <div style={formFieldStyle}>
                    <label style={labelStyle}>State</label>
                    <SelectField
                      value={selectedState}
                      onChange={(option) => {
                        setSelectedState(option);
                        setState(option?.value || '');
                        setCities([]);
                        setDistricts([]);
                        setSelectedCity(null);
                        setSelectedDistrict(null);
                        setDistrict('');
                        setCity('');
                      }}
                      options={states}
                      placeholder="Select State"
                      isDisabled={!selectedCountry}
                      required
                    />
                  </div>

                  <div style={formFieldStyle}>
                    <label style={labelStyle}>District</label>
                    <SelectField
                      value={selectedDistrict}
                      onChange={(option) => {
                        setSelectedDistrict(option);
                        setDistrict(option?.value || '');
                         setSelectedCity(null);
                        setCity('');
                      }}
                      options={districts}
                      placeholder="Select District"
                      isDisabled={!selectedState}
                      required
                    />
                  </div>

                  <div style={formFieldStyle}>
                    <label style={labelStyle}>City</label>
                    <SelectField
                      value={selectedCity}
                      onChange={(option) => {
                        setSelectedCity(option);
                        setCity(option?.value || '');
                      }}
                      options={cities}
                      placeholder="Select City"
                      isDisabled={!selectedDistrict}
                      required
                    />
                  </div>

                  <div style={formFieldStyle}>
                    <label style={labelStyle}>Pincode</label>
                    <InputField
                      value={pincode}
                      maxLength={6}
                      onChange={(e) =>
                        setPincode(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))
                      }
                      required
                      style={inputStyle}
                    />
                  </div>

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

              {errorMessage && (
                <div className="text-danger mb-2">{errorMessage}</div>
              )}

              <div className="d-flex justify-content-end mt-3">
                <ReusableButton type="submit" disabled={loading || !isModified} loading={loading}>
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
