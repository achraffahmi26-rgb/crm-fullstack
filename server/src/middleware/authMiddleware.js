const jwt = require('jsonwebtoken');
const config = require('../config');
const { findUserById } = require('../services/authService');

async function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Authorization token missing' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    const user = await findUserById(decoded.id);
    if (!user) {
      return res.status(401).json({ message: 'Invalid token user' });
    }

    if (user.status !== 'Active') {
      return res.status(403).json({ message: 'Your account is inactive. Please contact an administrator.' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}

module.exports = authMiddleware;
