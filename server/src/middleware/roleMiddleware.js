const { getDatabase } = require('../database/connection');

async function requireAdmin(req, res, next) {
  try {
    const db = getDatabase();
    const [rows] = await db.execute('SELECT id FROM roles WHERE id = ? AND name = ?', [req.user.role_id, 'Admin']);

    if (rows.length === 0) {
      return res.status(403).json({ message: 'Admin access required' });
    }

    return next();
  } catch (error) {
    return res.status(500).json({ message: 'Unable to verify user role', error: error.message });
  }
}

module.exports = {
  requireAdmin,
};
