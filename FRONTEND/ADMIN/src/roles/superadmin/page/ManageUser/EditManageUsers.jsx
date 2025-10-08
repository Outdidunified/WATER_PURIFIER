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

  // Dropdown data lists
  const [countries, setCountries] = useState([]);
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const [districts, setDistricts] = useState([]);

  // Selected options
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [selectedState, setSelectedState] = useState(null);
  const [selectedCity, setSelectedCity] = useState(null);
  const [selectedDistrict, setSelectedDistrict] = useState(null);

  const normalizeValue = (value) => (value ?? '').toString().trim().toLowerCase();

  // 🧩 Load all countries on mount
  useEffect(() => {
    const countryOptions = GeoService.getCountriesForSelect();
    setCountries(countryOptions);
  }, []);

  // 🧩 Preload existing values when country/state/city/district already exist (from DB)
  useEffect(() => {
    if (!country || !countries.length) return;

    const existingCountry = countries.find((c) =>
      normalizeValue(c.value) === normalizeValue(country) ||
      normalizeValue(c.label) === normalizeValue(country)
    );

    if (!existingCountry) {
      setSelectedCountry(null);
      return;
    }

    setSelectedCountry(existingCountry);

    let stateOptions = GeoService.getStatesForSelect(existingCountry.isoCode);
    const normalizedState = normalizeValue(state);
    let stateMatch = stateOptions.find((s) =>
      normalizeValue(s.value) === normalizedState ||
      normalizeValue(s.label) === normalizedState
    );

    if (!stateMatch && state) {
      const fallbackState = { value: state, label: state, isoCode: state };
      stateOptions = [...stateOptions, fallbackState];
      stateMatch = fallbackState;
    }

    setStates(stateOptions);
    setSelectedState(stateMatch || null);

    if (!stateMatch) {
      setCities([]);
      setDistricts([]);
      setSelectedCity(null);
      setSelectedDistrict(null);
      return;
    }

    const cityOptions = GeoService.getCitiesForSelect(
      existingCountry.isoCode,
      stateMatch.value
    );
    const normalizedCity = normalizeValue(city);
    let cityMatch = cityOptions.find((c) =>
      normalizeValue(c.value) === normalizedCity ||
      normalizeValue(c.label) === normalizedCity
    );

    let finalCityOptions = cityOptions;
    if (!cityMatch && city) {
      const fallbackCity = { value: city, label: city };
      finalCityOptions = [...cityOptions, fallbackCity];
      cityMatch = fallbackCity;
    }

    setCities(finalCityOptions);
    setSelectedCity(cityMatch || null);

    const districtOptions = GeoService.getDistrictsForSelect(
      existingCountry.isoCode,
      stateMatch.value
    );
    const normalizedDistrict = normalizeValue(district);
    let districtMatch = districtOptions.find((d) =>
      normalizeValue(d.value) === normalizedDistrict ||
      normalizeValue(d.label) === normalizedDistrict
    );

    let finalDistrictOptions = districtOptions;
    if (!districtMatch && district) {
      const fallbackDistrict = { value: district, label: district };
      finalDistrictOptions = [...districtOptions, fallbackDistrict];
      districtMatch = fallbackDistrict;
    }

    setDistricts(finalDistrictOptions);
    setSelectedDistrict(districtMatch || null);
  }, [country, state, city, district, countries]);

  // 🧩 When user selects a country → load states
  useEffect(() => {
    if (!selectedCountry) return;

    const stateOptions = GeoService.getStatesForSelect(selectedCountry.isoCode);
    setStates(stateOptions);
  }, [selectedCountry]);

  // 🧩 When user selects a state → load cities & districts
  useEffect(() => {
    if (!selectedCountry || !selectedState) return;

    const cityOptions = GeoService.getCitiesForSelect(
      selectedCountry.isoCode,
      selectedState.value
    );
    const districtOptions = GeoService.getDistrictsForSelect(
      selectedCountry.isoCode,
      selectedState.value
    );

    setCities(cityOptions);
    setDistricts(districtOptions);
  }, [selectedState]);

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
                {/* LEFT COLUMN */}
                <div style={{ flex: 1, minWidth: '300px' }}>
                  <div style={formFieldStyle}>
                    <label style={labelStyle}>Name</label>
                    <InputField value={name} readOnly maxLength={50} style={inputStyle} />
                  </div>
                  <div style={formFieldStyle}>
                    <label style={labelStyle}>Email</label>
                    <InputField type="email" value={email} readOnly maxLength={50} style={inputStyle} />
                  </div>
                  <div style={formFieldStyle}>
                    <label style={labelStyle}>Phone Number</label>
                    <InputField
                      value={phone}
                      maxLength={10}
                      pattern="[1-9][0-9]{9}"
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
                      type="text"
                      value={password}
                      maxLength={4}
                      pattern="\d{4}"
                      onChange={(e) => setPassword(e.target.value.replace(/[^0-9]/g, ''))}
                      required
                      style={inputStyle}
                    />
                  </div>
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

                {/* RIGHT COLUMN */}
                <div style={{ flex: 1, minWidth: '300px' }}>
                  <div style={formFieldStyle}>
                    <label style={labelStyle}>Country</label>
                    <SelectField
                      value={selectedCountry}
                      onChange={(option) => {
                        setSelectedCountry(option);
                        setCountry(option?.value || '');
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
                      }}
                      options={states}
                      placeholder="Select State"
                      isDisabled={!selectedCountry}
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
                      isDisabled={!selectedState}
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
                      }}
                      options={districts}
                      placeholder="Select District"
                      isDisabled={!selectedState}
                      required
                    />
                  </div>
                  <div style={formFieldStyle}>
                    <label style={labelStyle}>Pincode</label>
                    <InputField
                      value={pincode}
                      maxLength={6}
                      pattern="^\d{6}$"
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

              {errorMessage && <div className="text-danger mb-2">{errorMessage}</div>}

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
