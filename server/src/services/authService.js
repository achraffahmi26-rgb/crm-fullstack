const bcrypt = require('bcrypt');
const { getDatabase } = require('../database/connection');

async function findUserById(id) {
  const db = getDatabase();
  const [rows] = await db.execute(
    `SELECT users.id, users.role_id, roles.name AS role_name, users.first_name, users.last_name,
            users.email, users.phone, users.avatar, users.status, users.last_login,
            users.created_at, users.updated_at
     FROM users
     LEFT JOIN roles ON roles.id = users.role_id
     WHERE users.id = ?`,
    [id]
  );
  return rows[0] || null;
}

async function verifyPassword(password, hashedPassword) {
  return bcrypt.compare(password, hashedPassword);
}

async function authenticateUser(email, password) {
  const db = getDatabase();
  const [rows] = await db.execute('SELECT id, password FROM users WHERE email = ?', [email]);
  const user = rows[0];
  if (!user) {
    return null;
  }

  const isValid = await verifyPassword(password, user.password);
  if (!isValid) {
    return null;
  }

  return findUserById(user.id);
}

module.exports = {
  findUserById,
  authenticateUser,
};
