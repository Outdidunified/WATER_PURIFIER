import { useState, useEffect } from 'react';
import { GeoService } from '../services/GeoService';

export const useLocationDropdowns = (initialValues = {}) => {
  // Initialize with India as default
  const initialState = GeoService.getInitialLocationState();
  
  const [countries] = useState(initialState.countries);
  const [states, setStates] = useState(initialState.states);
  const [cities, setCities] = useState(initialState.cities);
  const [districts, setDistricts] = useState(initialState.districts);
  
  const [selectedCountry, setSelectedCountry] = useState(
    initialValues.country ? 
      countries.find(c => c.value === initialValues.country) || initialState.selectedCountry :
      initialState.selectedCountry
  );
  const [selectedState, setSelectedState] = useState(null);
  const [selectedCity, setSelectedCity] = useState(null);
  const [selectedDistrict, setSelectedDistrict] = useState(null);

  // Load states when country changes
  useEffect(() => {
    if (selectedCountry) {
      const stateOptions = GeoService.getStatesForSelect(selectedCountry.isoCode);
      setStates(stateOptions);
      
      // Set initial selected state if provided
      if (initialValues.state && stateOptions.find(s => s.value === initialValues.state)) {
        setSelectedState(stateOptions.find(s => s.value === initialValues.state));
      } else {
        setSelectedState(null);
      }
    } else {
      setStates([]);
      setSelectedState(null);
    }
    
    // Reset dependent dropdowns
    setCities([]);
    setSelectedCity(null);
    setDistricts([]);
    setSelectedDistrict(null);
  }, [selectedCountry]);

  // Load districts when state changes
  useEffect(() => {
    if (selectedState && selectedCountry) {
      const districtOptions = GeoService.getDistrictsForSelect(
        selectedCountry.isoCode, 
        selectedState.value
      );
      setDistricts(districtOptions);
      
      // Set initial selected district if provided
      if (initialValues.district && districtOptions.find(d => d.value === initialValues.district)) {
        setSelectedDistrict(districtOptions.find(d => d.value === initialValues.district));
      } else {
        setSelectedDistrict(null);
      }
    } else {
      setDistricts([]);
      setSelectedDistrict(null);
    }
    
    // Reset cities
    setCities([]);
    setSelectedCity(null);
  }, [selectedState, selectedCountry]);

  // Load cities when district changes (or when state changes for India)
  useEffect(() => {
    if (selectedState && selectedCountry) {
      // For India, load all cities in the state regardless of district
      // For other countries, also load all cities in the state
      const cityOptions = GeoService.getCitiesForSelect(
        selectedCountry.isoCode,
        selectedState.value,
        selectedDistrict?.value
      );
      setCities(cityOptions);
      
      // Set initial selected city if provided
      if (initialValues.city && cityOptions.find(c => c.value === initialValues.city)) {
        setSelectedCity(cityOptions.find(c => c.value === initialValues.city));
      } else {
        setSelectedCity(null);
      }
    } else {
      setCities([]);
      setSelectedCity(null);
    }
  }, [selectedDistrict, selectedState, selectedCountry]);

  const handleCountryChange = (country) => {
    setSelectedCountry(country);
  };

  const handleStateChange = (state) => {
    setSelectedState(state);
  };

  const handleDistrictChange = (district) => {
    setSelectedDistrict(district);
  };

  const handleCityChange = (city) => {
    setSelectedCity(city);
  };

  const resetToDefault = () => {
    const defaultState = GeoService.getInitialLocationState();
    setSelectedCountry(defaultState.selectedCountry);
    setSelectedState(null);
    setSelectedCity(null);
    setSelectedDistrict(null);
    setStates(defaultState.states);
    setCities([]);
    setDistricts([]);
  };

  return {
    // Options for dropdowns
    countries,
    states,
    cities,
    districts,
    
    // Selected values
    selectedCountry,
    selectedState,
    selectedCity,
    selectedDistrict,
    
    // Handlers
    handleCountryChange,
    handleStateChange,
    handleDistrictChange,
    handleCityChange,
    
    // Utility
    resetToDefault,
    
    // For form integration
    getFormValues: () => ({
      country: selectedCountry?.value || '',
      state: selectedState?.value || '',
      district: selectedDistrict?.value || '',
      city: selectedCity?.value || ''
    })
  };
};