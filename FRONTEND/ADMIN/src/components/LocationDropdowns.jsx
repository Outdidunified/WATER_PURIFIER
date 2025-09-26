import React from 'react';
import Select from 'react-select';
import { useLocationDropdowns } from '../hooks/useLocationDropdowns';

const LocationDropdowns = ({ 
  initialValues = {}, 
  onLocationChange = () => {},
  disabled = false,
  showLabels = true 
}) => {
  const {
    countries,
    states,
    cities,
    districts,
    selectedCountry,
    selectedState,
    selectedCity,
    selectedDistrict,
    handleCountryChange,
    handleStateChange,
    handleDistrictChange,
    handleCityChange,
    getFormValues
  } = useLocationDropdowns(initialValues);

  // Notify parent component of changes
  React.useEffect(() => {
    onLocationChange(getFormValues());
  }, [selectedCountry, selectedState, selectedDistrict, selectedCity]);

  const selectStyles = {
    control: (provided, state) => ({
      ...provided,
      borderColor: state.isFocused ? '#80bdff' : '#ced4da',
      boxShadow: state.isFocused ? '0 0 0 0.2rem rgba(0, 123, 255, 0.25)' : 'none',
      '&:hover': {
        borderColor: '#80bdff'
      }
    })
  };

  return (
    <div className="location-dropdowns">
      {/* Country Dropdown */}
      <div className="form-group mb-3">
        {showLabels && <label className="form-label">Country *</label>}
        <Select
          value={selectedCountry}
          onChange={handleCountryChange}
          options={countries}
          placeholder="Select Country"
          isDisabled={disabled}
          styles={selectStyles}
          className="react-select-container"
          classNamePrefix="react-select"
        />
      </div>

      {/* State Dropdown */}
      <div className="form-group mb-3">
        {showLabels && <label className="form-label">State *</label>}
        <Select
          value={selectedState}
          onChange={handleStateChange}
          options={states}
          placeholder="Select State"
          isDisabled={disabled || !selectedCountry}
          styles={selectStyles}
          className="react-select-container"
          classNamePrefix="react-select"
        />
      </div>

      {/* District Dropdown */}
      <div className="form-group mb-3">
        {showLabels && <label className="form-label">District *</label>}
        <Select
          value={selectedDistrict}
          onChange={handleDistrictChange}
          options={districts}
          placeholder="Select District"
          isDisabled={disabled || !selectedState}
          styles={selectStyles}
          className="react-select-container"
          classNamePrefix="react-select"
        />
      </div>

      {/* City Dropdown */}
      <div className="form-group mb-3">
        {showLabels && <label className="form-label">City *</label>}
        <Select
          value={selectedCity}
          onChange={handleCityChange}
          options={cities}
          placeholder="Select City"
          isDisabled={disabled || !selectedDistrict}
          styles={selectStyles}
          className="react-select-container"
          classNamePrefix="react-select"
        />
      </div>
    </div>
  );
};

export default LocationDropdowns;