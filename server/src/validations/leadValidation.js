const VALID_STATUSES = ['New', 'Contacted', 'Qualified', 'Proposal', 'Won', 'Lost'];

function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function validateCreateLead(data) {
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
  if (data.phone !== undefined && typeof data.phone !== 'string') {
    errors.phone = 'Phone must be a string';
  }
  if (data.source !== undefined && typeof data.source !== 'string') {
    errors.source = 'Source must be a string';
  }
  if (data.status !== undefined && !VALID_STATUSES.includes(data.status)) {
    errors.status = `Status must be one of: ${VALID_STATUSES.join(', ')}`;
  }
  if (data.estimated_value !== undefined && data.estimated_value !== null) {
    if (typeof data.estimated_value !== 'number' || data.estimated_value < 0) {
      errors.estimated_value = 'Estimated value must be a non-negative number';
    }
  }
  if (data.assigned_to !== undefined && !Number.isInteger(data.assigned_to)) {
    errors.assigned_to = 'assigned_to must be a user id';
  }

  return {
    errors,
    isValid: Object.keys(errors).length === 0,
  };
}

function validateUpdateLead(data) {
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
  if (data.phone !== undefined && typeof data.phone !== 'string') {
    errors.phone = 'Phone must be a string';
  }
  if (data.source !== undefined && typeof data.source !== 'string') {
    errors.source = 'Source must be a string';
  }
  if (data.status !== undefined && !VALID_STATUSES.includes(data.status)) {
    errors.status = `Status must be one of: ${VALID_STATUSES.join(', ')}`;
  }
  if (data.estimated_value !== undefined && data.estimated_value !== null) {
    if (typeof data.estimated_value !== 'number' || data.estimated_value < 0) {
      errors.estimated_value = 'Estimated value must be a non-negative number';
    }
  }
  if (data.assigned_to !== undefined && !Number.isInteger(data.assigned_to)) {
    errors.assigned_to = 'assigned_to must be a user id';
  }

  return {
    errors,
    isValid: Object.keys(errors).length === 0,
  };
}

module.exports = {
  validateCreateLead,
  validateUpdateLead,
  VALID_STATUSES,
};
