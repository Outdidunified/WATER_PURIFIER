// DeliveryAddress model and validation utilities (no Mongoose)
// Provides: validateDeliveryAddress(address), normalizeDeliveryAddress(address)

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

/**
 * Normalize address by trimming fields
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
    district: trimVal(address.district || ''),
    state: trimVal(address.state || ''),
    pincode: trimVal(address.pincode || ''),
    email: trimVal(address.email || ''),
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
};