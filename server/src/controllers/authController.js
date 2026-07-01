const authService = require('../services/authService');
const generateToken = require('../utils/generateToken');
const { validateRegister, validateLogin } = require('../validations/authValidation');

function removeSensitiveFields(user) {
  if (!user) return null;
  const { password, ...cleanUser } = user;
  return cleanUser;
}

async function register(req, res) {
  const { errors, isValid } = validateRegister(req.body);
  if (!isValid) {
    return res.status(400).json({ errors });
  }

  try {
    const existingUser = await authService.findUserByEmail(req.body.email);
    if (existingUser) {
      return res.status(409).json({ message: 'Email already in use' });
    }

    const roleId = await authService.getDefaultRegistrationRoleId();
    const newUser = await authService.createUser({
      ...req.body,
      role_id: roleId,
    });
    const token = generateToken(newUser);

    return res.status(201).json({
      user: removeSensitiveFields(newUser),
      token,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Unable to register user', error: error.message });
  }
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
  register,
  login,
  getMe,
};
