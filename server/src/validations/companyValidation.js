function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function validateCreateCompany(data) {
  const errors = {};

  if (!data.name || typeof data.name !== 'string' || data.name.trim() === '') {
    errors.name = 'Company name is required';
  }
  if (data.email !== undefined && data.email !== null && data.email !== '' && !isValidEmail(data.email)) {
    errors.email = 'A valid email is required';
  }
  if (data.phone !== undefined && typeof data.phone !== 'string') {
    errors.phone = 'Phone must be a string';
  }
  if (data.website !== undefined && typeof data.website !== 'string') {
    errors.website = 'Website must be a string';
  }
  if (data.address !== undefined && typeof data.address !== 'string') {
    errors.address = 'Address must be a string';
  }
  if (data.city !== undefined && typeof data.city !== 'string') {
    errors.city = 'City must be a string';
  }
  if (data.country !== undefined && typeof data.country !== 'string') {
    errors.country = 'Country must be a string';
  }

  return {
    errors,
    isValid: Object.keys(errors).length === 0,
  };
}

function validateUpdateCompany(data) {
  const errors = {};

  if (data.name !== undefined && (typeof data.name !== 'string' || data.name.trim() === '')) {
    errors.name = 'Company name cannot be empty';
  }
  if (data.email !== undefined && data.email !== null && data.email !== '' && !isValidEmail(data.email)) {
    errors.email = 'A valid email is required';
  }
  if (data.phone !== undefined && typeof data.phone !== 'string') {
    errors.phone = 'Phone must be a string';
  }
  if (data.website !== undefined && typeof data.website !== 'string') {
    errors.website = 'Website must be a string';
  }
  if (data.address !== undefined && typeof data.address !== 'string') {
    errors.address = 'Address must be a string';
  }
  if (data.city !== undefined && typeof data.city !== 'string') {
    errors.city = 'City must be a string';
  }
  if (data.country !== undefined && typeof data.country !== 'string') {
    errors.country = 'Country must be a string';
  }

  return {
    errors,
    isValid: Object.keys(errors).length === 0,
  };
}

module.exports = {
  validateCreateCompany,
  validateUpdateCompany,
};
