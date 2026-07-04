const authService = require('../services/authService');
const generateToken = require('../utils/generateToken');
const { validateLogin } = require('../validations/authValidation');

function removeSensitiveFields(user) {
  if (!user) return null;
  const { password, ...cleanUser } = user;
  return cleanUser;
}

async function login(req, res) {
  const { errors, isValid } = validateLogin(req.body);
  if (!isValid) {
    return res.status(400).json({ errors });
  }

  try {
    const user = await authService.authenticateUser(req.body.email, req.body.password);
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    if (user.status !== 'Active') {
      return res.status(403).json({ message: 'Your account is inactive. Please contact an administrator.' });
    }

    const token = generateToken(user);
    return res.json({ user: removeSensitiveFields(user), token });
  } catch (error) {
    return res.status(500).json({ message: 'Unable to login', error: error.message });
  }
}

function getMe(req, res) {
  return res.json({ user: removeSensitiveFields(req.user) });
}

module.exports = {
  login,
  getMe,
};
