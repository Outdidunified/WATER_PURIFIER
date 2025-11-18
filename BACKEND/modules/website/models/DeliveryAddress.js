// DeliveryAddress model and validation utilities (no Mongoose)
// Provides: validateDeliveryAddress(address), normalizeDeliveryAddress(address), normalizeState(state)

/**
 * @typedef {Object} DeliveryAddress
 * @property {string} name
 * @property {string} phone        // 10 digits
 * @property {string} street       // address line
 * @property {string} [landmark]   // optional
 * @property {string} city
 * @property {string} district
 * @property {string} state
 * @property {string} pincode      // 6 digits (India)
 * @property {string} email
 */

/** Trim string fields safely */
function trimVal(v) {
  return typeof v === 'string' ? v.trim() : v;
}

/** Normalize state name to full form */
const stateCorrections = {
  'ka': 'Karnataka',
  'karanataka': 'Karnataka', // typo correction
  'karnatka': 'Karnataka',   // another typo
  'tn': 'Tamil Nadu',
  'mh': 'Maharashtra',
  'gj': 'Gujarat',
  'rj': 'Rajasthan',
  'up': 'Uttar Pradesh',
  'mp': 'Madhya Pradesh',
  'wb': 'West Bengal',
  'ap': 'Andhra Pradesh',
  'ts': 'Telangana',
  'kl': 'Kerala',
  'or': 'Odisha',
  'pb': 'Punjab',
  'hr': 'Haryana',
  'jk': 'Jammu and Kashmir',
  'uk': 'Uttarakhand',
  'hp': 'Himachal Pradesh',
  'ch': 'Chandigarh',
  'dl': 'Delhi',
  'goa': 'Goa',
  'dd': 'Daman and Diu',
  'dn': 'Dadra and Nagar Haveli',
  'py': 'Puducherry',
  'la': 'Lakshadweep',
  'ld': 'Lakshadweep',
  'an': 'Andaman and Nicobar Islands',
  'sk': 'Sikkim',
  'ar': 'Arunachal Pradesh',
  'ml': 'Meghalaya',
  'nl': 'Nagaland',
  'tr': 'Tripura',
  'mz': 'Mizoram',
  'mn': 'Manipur',
  'as': 'Assam',
  'br': 'Bihar',
  'jh': 'Jharkhand',
  'cg': 'Chhattisgarh',
  // Add more as needed
};

function normalizeState(state) {
  if (!state || typeof state !== 'string') return '';
  const normalizedKey = state.toLowerCase().trim();
  return stateCorrections[normalizedKey] || state.trim();
}

/** Normalize country code to full name */
const countryCorrections = {
  'in': 'India',
  'us': 'United States',
  'uk': 'United Kingdom',
  // Add more as needed
};

function normalizeCountry(country) {
  if (!country || typeof country !== 'string') return '';
  const normalizedKey = country.toLowerCase().trim();
  return countryCorrections[normalizedKey] || country.trim();
}

const districtCorrections = {
  'parvathipuram manyam': 'Parvathipuram Manyam',
  'parvathipuram manyam district': 'Parvathipuram Manyam',
  'south west delhi': 'South West Delhi',
  'southwest delhi': 'South West Delhi',
  'south-west delhi': 'South West Delhi',
  'lakshadweep': 'Lakshadweep',
  'kargil': 'Kargil',
};

function normalizeDistrict(district) {
  if (!district || typeof district !== 'string') return '';
  const cleaned = district
    .toLowerCase()
    .replace(/\bdistrict\b/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  const corrected = districtCorrections[cleaned] || cleaned;

  return corrected
    .split(' ')
    .filter(Boolean)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Normalize address by trimming fields and standardizing state
 * @param {Partial<DeliveryAddress>} address
 * @returns {DeliveryAddress}
 */
function normalizeDeliveryAddress(address = {}) {
  return {
    name: trimVal(address.name || ''),
    phone: trimVal(address.phone || ''),
    street: trimVal(address.street || ''),
    landmark: trimVal(address.landmark || ''),
    city: trimVal(address.city || ''),
    district: normalizeDistrict(address.district),
    state: trimVal(normalizeState(address.state) || ''),
    pincode: trimVal(address.pincode || ''),
    email: trimVal(address.email || ''),
    country: normalizeCountry(address.country) || 'India',
  };
}

/**
 * Validate delivery address required fields and formats
 * @param {any} address
 * @returns {{ valid: boolean, message?: string }}
 */
function validateDeliveryAddress(address) {
  if (!address || typeof address !== 'object') {
    return { valid: false, message: 'deliveryAddress must be an object' };
  }

  const required = ['name', 'phone', 'street', 'city', 'district', 'state', 'pincode', 'email'];
  for (const field of required) {
    if (!address[field] || String(address[field]).trim() === '') {
      return { valid: false, message: `deliveryAddress.${field} is required` };
    }
  }

  const phone = String(address.phone).replace(/\D/g, '');
  if (phone.length !== 10) {
    return { valid: false, message: 'deliveryAddress.phone must be a 10-digit number' };
  }

  const pin = String(address.pincode).replace(/\D/g, '');
  if (!/^\d{6}$/.test(pin)) {
    return { valid: false, message: 'deliveryAddress.pincode must be a 6-digit number' };
  }

  const email = String(address.email || '').trim();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { valid: false, message: 'deliveryAddress.email must be a valid email address' };
  }

  return { valid: true };
}

module.exports = {
  validateDeliveryAddress,
  normalizeDeliveryAddress,
  normalizeState,
  normalizeCountry,
};