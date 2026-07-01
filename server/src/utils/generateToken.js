const jwt = require('jsonwebtoken');
const config = require('../config');

function generateToken(user) {
  const payload = {
    id: user.id,
    role_id: user.role_id,
    email: user.email,
  };

  return jwt.sign(payload, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn,
  });
}

module.exports = generateToken;
