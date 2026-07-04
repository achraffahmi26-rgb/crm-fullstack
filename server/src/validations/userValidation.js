function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function validateCreateUser(data) {
  const errors = {};

  if (!data.role_id) {
    errors.role_id = 'Role ID is required';
  }
  if (!data.first_name || typeof data.first_name !== 'string') {
    errors.first_name = 'First name is required';
  }
  if (!data.last_name || typeof data.last_name !== 'string') {
    errors.last_name = 'Last name is required';
  }
  if (!data.email || typeof data.email !== 'string' || !isValidEmail(data.email)) {
    errors.email = 'A valid email is required';
  }
  if (!data.password || typeof data.password !== 'string' || data.password.length < 6) {
    errors.password = 'Password must be at least 6 characters';
  }
  if (data.phone !== undefined && typeof data.phone !== 'string') {
    errors.phone = 'Phone must be a string';
  }
  if (data.status !== undefined && !['Active', 'Inactive'].includes(data.status)) {
    errors.status = 'Status must be Active or Inactive';
  }

  return {
    errors,
    isValid: Object.keys(errors).length === 0,
  };
}

function validateUpdateUser(data) {
  const errors = {};

  if (data.role_id !== undefined && !data.role_id) {
    errors.role_id = 'Role ID is required';
  }
  if (data.first_name !== undefined && typeof data.first_name !== 'string') {
    errors.first_name = 'First name must be a string';
  }
  if (data.last_name !== undefined && typeof data.last_name !== 'string') {
    errors.last_name = 'Last name must be a string';
  }
  if (data.email !== undefined && (typeof data.email !== 'string' || !isValidEmail(data.email))) {
    errors.email = 'A valid email is required';
  }
  if (data.password !== undefined && data.password !== '' && (typeof data.password !== 'string' || data.password.length < 6)) {
    errors.password = 'Password must be at least 6 characters';
  }
  if (data.phone !== undefined && typeof data.phone !== 'string') {
    errors.phone = 'Phone must be a string';
  }
  if (data.status !== undefined && !['Active', 'Inactive'].includes(data.status)) {
    errors.status = 'Status must be Active or Inactive';
  }

  return {
    errors,
    isValid: Object.keys(errors).length === 0,
  };
}

function validateResetPassword(data) {
  const errors = {};

  if (!data.password || typeof data.password !== 'string' || data.password.length < 6) {
    errors.password = 'Password must be at least 6 characters';
  }
  if (data.confirmPassword !== undefined && data.password !== data.confirmPassword) {
    errors.confirmPassword = 'Passwords do not match';
  }

  return {
    errors,
    isValid: Object.keys(errors).length === 0,
  };
}

module.exports = {
  validateCreateUser,
  validateUpdateUser,
  validateResetPassword,
};
