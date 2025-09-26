import { Country, State, City } from "country-state-city";
import { getDistricts, getAllStates, getAllStatesWithDistricts } from "india-state-district";

export class GeoService {
  // State code mapping from country-state-city to india-state-district
  static indiaStateCodeMapping = {
    'AP': 'AP', // Andhra Pradesh
    'AR': 'AR', // Arunachal Pradesh  
    'AS': 'AS', // Assam
    'BR': 'BR', // Bihar
    'CG': 'CG', // Chhattisgarh
    'GA': 'GA', // Goa
    'GJ': 'GJ', // Gujarat
    'HR': 'HR', // Haryana
    'HP': 'HP', // Himachal Pradesh
    'JK': 'JK', // Jammu and Kashmir
    'JH': 'JH', // Jharkhand
    'KA': 'KA', // Karnataka
    'KL': 'KL', // Kerala
    'MP': 'MP', // Madhya Pradesh
    'MH': 'MH', // Maharashtra
    'MN': 'MN', // Manipur
    'ML': 'ML', // Meghalaya
    'MZ': 'MZ', // Mizoram
    'NL': 'NL', // Nagaland
    'OR': 'OR', // Odisha
    'PB': 'PB', // Punjab
    'RJ': 'RJ', // Rajasthan
    'SK': 'SK', // Sikkim
    'TN': 'TN', // Tamil Nadu
    'TS': 'TS', // Telangana
    'TR': 'TR', // Tripura
    'UP': 'UP', // Uttar Pradesh
    'UK': 'UK', // Uttarakhand
    'WB': 'WB', // West Bengal
    'AN': 'AN', // Andaman and Nicobar Islands
    'CH': 'CH', // Chandigarh
    'DN': 'DN', // Dadra and Nagar Haveli
    'DD': 'DD', // Daman and Diu
    'DL': 'DL', // Delhi
    'LD': 'LD', // Lakshadweep
    'PY': 'PY'  // Puducherry
  };

  // Get all countries formatted for select dropdown
  static getCountriesForSelect() {
    return Country.getAllCountries().map(country => ({
      value: country.isoCode,
      label: country.name,
      isoCode: country.isoCode,
      name: country.name
    }));
  }

  // Get states for a specific country formatted for select dropdown
  static getStatesForSelect(countryCode) {
    if (!countryCode) return [];
    
    if (countryCode === 'IN') {
      // For India, use both modules - country-state-city for consistency but also get india-state-district data
      const countryStateCityStates = State.getStatesOfCountry(countryCode);
      const indiaStates = getAllStates();
      
      // Merge data from both sources
      return countryStateCityStates.map(state => {
        const indiaState = indiaStates.find(is => is.code === state.isoCode);
        return {
          value: state.isoCode,
          label: state.name,
          isoCode: state.isoCode,
          name: state.name,
          indiaCode: indiaState?.code || state.isoCode
        };
      });
    }
    
    return State.getStatesOfCountry(countryCode).map(state => ({
      value: state.isoCode,
      label: state.name,
      isoCode: state.isoCode,
      name: state.name
    }));
  }

  // Get districts for a specific state (mainly for India)
  static getDistrictsForSelect(countryCode, stateCode) {
    if (!stateCode) return [];
    
    try {
      // For India, use the india-state-district package
      if (countryCode === 'IN') {
        // Use the state code directly as it should match
        const indiaStateCode = this.indiaStateCodeMapping[stateCode] || stateCode;
        const districts = getDistricts(indiaStateCode);
        
        console.log(`Getting districts for India state: ${stateCode} (mapped to: ${indiaStateCode})`);
        console.log(`Found ${districts.length} districts:`, districts.slice(0, 3));
        
        return districts.map(district => ({
          value: district,
          label: district,
          name: district
        }));
      }
      
      // For other countries, return empty array as districts are not commonly available
      return [];
    } catch (error) {
      console.warn('Error getting districts:', error);
      return [];
    }
  }

  // Get cities for a specific state
  static getCitiesForSelect(countryCode, stateCode, districtCode = null) {
    if (!countryCode || !stateCode) return [];
    
    try {
      if (countryCode === 'IN') {
        // For India, get cities from country-state-city
        // Note: country-state-city doesn't have district-level city filtering
        // So we return all cities for the state regardless of district selection
        const cities = City.getCitiesOfState(countryCode, stateCode);
        
        console.log(`Getting cities for India state: ${stateCode}, district: ${districtCode || 'all'}`);
        console.log(`Found ${cities.length} cities from country-state-city (district filtering not available)`);
        
        return cities.map(city => ({
          value: city.name,
          label: city.name,
          name: city.name,
          stateCode: city.stateCode,
          countryCode: city.countryCode
        }));
      }
      
      // For other countries, use country-state-city
      const cities = City.getCitiesOfState(countryCode, stateCode);
      return cities.map(city => ({
        value: city.name,
        label: city.name,
        name: city.name
      }));
    } catch (error) {
      console.warn('Error getting cities:', error);
      return [];
    }
  }

  // Get all available data for India using both modules
  static getIndiaLocationData() {
    try {
      const countryStateCityStates = State.getStatesOfCountry('IN');
      const indiaStatesWithDistricts = getAllStatesWithDistricts();
      
      return {
        country: { isoCode: 'IN', name: 'India' },
        states: countryStateCityStates.map(state => {
          const indiaState = indiaStatesWithDistricts.find(is => is.code === state.isoCode);
          return {
            value: state.isoCode,
            label: state.name,
            isoCode: state.isoCode,
            name: state.name,
            districts: indiaState?.districts || []
          };
        })
      };
    } catch (error) {
      console.warn('Error getting India location data:', error);
      return null;
    }
  }

  // Get initial state with India as default
  static getInitialLocationState() {
    const countries = this.getCountriesForSelect();
    const indiaCountry = countries.find(c => c.isoCode === 'IN');
    const states = indiaCountry ? this.getStatesForSelect('IN') : [];
    
    return {
      countries,
      states,
      cities: [],
      districts: [],
      selectedCountry: indiaCountry || countries[0] || null
    };
  }

  // Helper method to get country by ISO code
  static getCountryByCode(isoCode) {
    const countries = this.getCountriesForSelect();
    return countries.find(c => c.isoCode === isoCode) || null;
  }

  // Helper method to get state by code
  static getStateByCode(countryCode, stateCode) {
    const states = this.getStatesForSelect(countryCode);
    return states.find(s => s.value === stateCode) || null;
  }

  // Get default country option (India)
  static getDefaultCountryOption() {
    const countries = this.getCountriesForSelect();
    return countries.find(c => c.isoCode === 'IN') || countries[0] || null;
  }
}