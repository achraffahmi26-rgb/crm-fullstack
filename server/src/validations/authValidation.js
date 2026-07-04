function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
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
  validateLogin,
};
