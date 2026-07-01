const bcrypt = require('bcrypt');
const { getDatabase } = require('../database/connection');

const SALT_ROUNDS = 10;

async function findUserByEmail(email) {
  const db = getDatabase();
  const [rows] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
  return rows[0] || null;
}

async function findUserById(id) {
  const db = getDatabase();
  const [rows] = await db.execute('SELECT id, role_id, first_name, last_name, email, phone, avatar, status, last_login, created_at, updated_at FROM users WHERE id = ?', [id]);
  return rows[0] || null;
}

async function getDefaultRegistrationRoleId() {
  const db = getDatabase();

  await db.execute(
    `INSERT INTO roles (name, description)
     VALUES ('Employee', 'Default employee role for public registration')
     ON DUPLICATE KEY UPDATE description = VALUES(description)`
  );

  const [employeeRows] = await db.execute('SELECT id FROM roles WHERE name = ? LIMIT 1', ['Employee']);
  if (employeeRows.length > 0) {
    return employeeRows[0].id;
  }

  const [fallbackRows] = await db.execute('SELECT id FROM roles WHERE name <> ? ORDER BY id ASC LIMIT 1', ['Admin']);
  if (fallbackRows.length > 0) {
    return fallbackRows[0].id;
  }

  throw new Error('No non-admin registration role is available');
}

async function createUser(userData) {
  const db = getDatabase();
  const hashedPassword = await bcrypt.hash(userData.password, SALT_ROUNDS);
  const [result] = await db.execute(
    `INSERT INTO users (role_id, first_name, last_name, email, password, phone, status, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, 'Active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
    [userData.role_id, userData.first_name, userData.last_name, userData.email, hashedPassword, userData.phone]
  );

  return findUserById(result.insertId);
}

async function verifyPassword(password, hashedPassword) {
  return bcrypt.compare(password, hashedPassword);
}

async function authenticateUser(email, password) {
  const db = getDatabase();
  const [rows] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
  const user = rows[0];
  if (!user) {
    return null;
  }

  const isValid = await verifyPassword(password, user.password);
  if (!isValid) {
    return null;
  }

  return {
    id: user.id,
    role_id: user.role_id,
    first_name: user.first_name,
    last_name: user.last_name,
    email: user.email,
    phone: user.phone,
    avatar: user.avatar,
    status: user.status,
    last_login: user.last_login,
    created_at: user.created_at,
    updated_at: user.updated_at,
  };
}

module.exports = {
  findUserByEmail,
  findUserById,
  getDefaultRegistrationRoleId,
  createUser,
  authenticateUser,
};
