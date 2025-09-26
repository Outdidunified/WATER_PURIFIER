# GeoService Documentation

The GeoService class provides a centralized way to handle geographical data (countries, states, districts, cities) with India set as the default country.

## Features

- **India as Default**: India is automatically set as the default country and moved to the top of country lists
- **Unified API**: Single interface for both India-specific data (using `india-state-district`) and international data (using `country-state-city`)
- **Smart District Handling**: Intelligent matching for Indian districts with fallback options
- **Select-Ready Data**: Methods that return data formatted for React Select components

## Basic Usage

### Import the Service

```javascript
import { GeoService } from '../services/GeoService';
```

### Get Countries

```javascript
// Get all countries (India will be first)
const countries = GeoService.getAllCountries();

// Get countries formatted for React Select
const countryOptions = GeoService.getCountriesForSelect();
```

### Get States

```javascript
// Get states for India (default)
const indianStates = GeoService.getStates();

// Get states for another country
const usStates = GeoService.getStates('US');

// Get states formatted for React Select
const stateOptions = GeoService.getStatesForSelect('IN');
```

### Get Districts

```javascript
// Get all Indian districts
const allDistricts = GeoService.getDistricts();

// Get districts for a specific Indian state
const maharashtraDistricts = GeoService.getDistricts('IN', 'Maharashtra');

// Get districts formatted for React Select
const districtOptions = GeoService.getDistrictsForSelect('IN', 'Maharashtra');
```

### Get Cities

```javascript
// Get cities for a state
const cities = GeoService.getCities('IN', 'Maharashtra');

// Get cities formatted for React Select
const cityOptions = GeoService.getCitiesForSelect('IN', 'Maharashtra');
```

## Using with React Hook

The `useLocationDropdowns` hook provides a complete solution for managing location dropdowns:

```javascript
import { useLocationDropdowns } from '../hooks/useLocationDropdowns';

const MyComponent = () => {
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
  } = useLocationDropdowns();

  // India will be pre-selected as the default country
  // States will be loaded automatically for India

  return (
    <div>
      <Select
        value={selectedCountry}
        onChange={handleCountryChange}
        options={countries}
        placeholder="Select Country"
      />
      {/* Other dropdowns... */}
    </div>
  );
};
```

## Using the LocationDropdowns Component

For a complete plug-and-play solution:

```javascript
import LocationDropdowns from '../components/LocationDropdowns';

const MyForm = () => {
  const handleLocationChange = (locationData) => {
    console.log('Selected location:', locationData);
    // locationData contains: { country, state, district, city }
  };

  return (
    <form>
      <LocationDropdowns
        initialValues={{
          country: 'India',
          state: 'Maharashtra',
          district: 'Mumbai District',
          city: 'Mumbai'
        }}
        onLocationChange={handleLocationChange}
        showLabels={true}
      />
    </form>
  );
};
```

## Default Behavior

- **Default Country**: India is automatically selected
- **Country List**: India appears first in the country dropdown
- **State Loading**: Indian states are loaded immediately when India is selected
- **District Matching**: Smart matching for Indian districts with multiple fallback strategies
- **City Loading**: All cities in a state are loaded (not filtered by district due to data limitations)

## Error Handling

The service includes comprehensive error handling:

- Fallback district options when exact matches aren't found
- Generic district creation based on cities when no districts are available
- Graceful handling of missing data

## Migration from Direct Library Usage

If you're currently using the libraries directly, you can easily migrate:

### Before (Direct Usage)
```javascript
import { Country, State, City } from 'country-state-city';
import { getDistricts } from 'india-state-district';

const countries = Country.getAllCountries();
const states = State.getStatesOfCountry('IN');
const districts = getDistricts();
```

### After (Using GeoService)
```javascript
import { GeoService } from '../services/GeoService';

const countries = GeoService.getAllCountries(); // India will be first
const states = GeoService.getStates('IN');
const districts = GeoService.getDistricts('IN');
```

## API Reference

### Static Methods

- `getAllCountries()` - Returns all countries with India first
- `getCountriesForSelect()` - Returns countries formatted for React Select
- `getStates(countryCode = "IN")` - Returns states for a country
- `getStatesForSelect(countryCode = "IN")` - Returns states formatted for React Select
- `getDistricts(countryCode = "IN", stateCode = null)` - Returns districts
- `getDistrictsForSelect(countryCode = "IN", stateName = null)` - Returns districts formatted for React Select
- `getCities(countryCode = "IN", stateCode = null, districtName = null)` - Returns cities
- `getCitiesForSelect(countryCode = "IN", stateCode = null, districtName = null)` - Returns cities formatted for React Select
- `getDefaultCountryOption()` - Returns India as default country option
- `getInitialLocationState()` - Returns initial state with India pre-selected