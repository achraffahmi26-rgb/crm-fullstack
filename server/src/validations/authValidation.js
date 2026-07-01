function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function validateRegister(data) {
  const errors = {};
  const { first_name, last_name, email, password, phone } = data;

  if (!first_name || typeof first_name !== 'string' || !first_name.trim()) {
    errors.first_name = 'First name is required';
  }
  if (!last_name || typeof last_name !== 'string' || !last_name.trim()) {
    errors.last_name = 'Last name is required';
  }
  if (!email || typeof email !== 'string' || !isValidEmail(email.trim())) {
    errors.email = 'A valid email is required';
  }
  if (!password || typeof password !== 'string' || password.length < 6) {
    errors.password = 'Password must be at least 6 characters';
  }
  if (phone !== undefined && phone !== null && typeof phone !== 'string') {
    errors.phone = 'Phone must be a string';
  }

  return {
    errors,
    isValid: Object.keys(errors).length === 0,
  };
}

function validateLogin(data) {
  const errors = {};
  const { email, password } = data;

  if (!email || typeof email !== 'string' || !isValidEmail(email.trim())) {
    errors.email = 'A valid email is required';
  }
  if (!password || typeof password !== 'string') {
    errors.password = 'Password is required';
  }

  return {
    errors,
    isValid: Object.keys(errors).length === 0,
  };
}

module.exports = {
  validateRegister,
  validateLogin,
};
