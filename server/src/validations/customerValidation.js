function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function validateCreateCustomer(data) {
  const errors = {};

  if (!data.company_id) {
    errors.company_id = 'company_id is required';
  }
  if (!data.first_name || typeof data.first_name !== 'string' || data.first_name.trim() === '') {
    errors.first_name = 'First name is required';
  }
  if (!data.last_name || typeof data.last_name !== 'string' || data.last_name.trim() === '') {
    errors.last_name = 'Last name is required';
  }
  if (data.email !== undefined && data.email !== null && data.email !== '' && !isValidEmail(data.email)) {
    errors.email = 'A valid email is required';
  }
  if (data.status !== undefined && !['Active', 'Inactive', 'Blocked'].includes(data.status)) {
    errors.status = 'Status must be Active, Inactive, or Blocked';
  }
  if (data.phone !== undefined && typeof data.phone !== 'string') {
    errors.phone = 'Phone must be a string';
  }
  if (data.address !== undefined && typeof data.address !== 'string') {
    errors.address = 'Address must be a string';
  }
  if (data.notes !== undefined && typeof data.notes !== 'string') {
    errors.notes = 'Notes must be a string';
  }

  return {
    errors,
    isValid: Object.keys(errors).length === 0,
  };
}

function validateUpdateCustomer(data) {
  const errors = {};

  if (data.company_id !== undefined && !data.company_id) {
    errors.company_id = 'company_id is required';
  }
  if (data.first_name !== undefined && (typeof data.first_name !== 'string' || data.first_name.trim() === '')) {
    errors.first_name = 'First name cannot be empty';
  }
  if (data.last_name !== undefined && (typeof data.last_name !== 'string' || data.last_name.trim() === '')) {
    errors.last_name = 'Last name cannot be empty';
  }
  if (data.email !== undefined && data.email !== null && data.email !== '' && !isValidEmail(data.email)) {
    errors.email = 'A valid email is required';
  }
  if (data.status !== undefined && !['Active', 'Inactive', 'Blocked'].includes(data.status)) {
    errors.status = 'Status must be Active, Inactive, or Blocked';
  }
  if (data.phone !== undefined && typeof data.phone !== 'string') {
    errors.phone = 'Phone must be a string';
  }
  if (data.address !== undefined && typeof data.address !== 'string') {
    errors.address = 'Address must be a string';
  }
  if (data.notes !== undefined && typeof data.notes !== 'string') {
    errors.notes = 'Notes must be a string';
  }

  return {
    errors,
    isValid: Object.keys(errors).length === 0,
  };
}

module.exports = {
  validateCreateCustomer,
  validateUpdateCustomer,
};
