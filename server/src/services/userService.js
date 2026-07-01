const bcrypt = require('bcrypt');
const { getDatabase } = require('../database/connection');

const SALT_ROUNDS = 10;

async function getAllUsers() {
  const db = getDatabase();
  const [rows] = await db.execute(
    `SELECT id, role_id, first_name, last_name, email, phone, avatar, status, last_login, created_at, updated_at FROM users`
  );
  return rows;
}

async function getUserById(id) {
  const db = getDatabase();
  const [rows] = await db.execute(
    `SELECT id, role_id, first_name, last_name, email, phone, avatar, status, last_login, created_at, updated_at FROM users WHERE id = ?`,
    [id]
  );
  return rows[0] || null;
}

async function findUserByEmail(email) {
  const db = getDatabase();
  const [rows] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
  return rows[0] || null;
}

async function emailExists(email, excludeUserId = null) {
  const db = getDatabase();
  let query = 'SELECT id FROM users WHERE email = ?';
  const params = [email];

  if (excludeUserId) {
    query += ' AND id <> ?';
    params.push(excludeUserId);
  }

  const [rows] = await db.execute(query, params);
  return rows.length > 0;
}

async function roleExists(roleId) {
  const db = getDatabase();
  const [rows] = await db.execute('SELECT id FROM roles WHERE id = ?', [roleId]);
  return rows.length > 0;
}

async function createUser(data) {
  const db = getDatabase();
  const hashedPassword = await bcrypt.hash(data.password, SALT_ROUNDS);
  const [result] = await db.execute(
    `INSERT INTO users (role_id, first_name, last_name, email, password, phone, status, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
    [data.role_id, data.first_name, data.last_name, data.email, hashedPassword, data.phone || null, data.status || 'Active']
  );

  return getUserById(result.insertId);
}

async function updateUser(id, data) {
  const db = getDatabase();
  const fields = [];
  const params = [];

  if (data.role_id !== undefined) {
    fields.push('role_id = ?');
    params.push(data.role_id);
  }
  if (data.first_name !== undefined) {
    fields.push('first_name = ?');
    params.push(data.first_name);
  }
  if (data.last_name !== undefined) {
    fields.push('last_name = ?');
    params.push(data.last_name);
  }
  if (data.email !== undefined) {
    fields.push('email = ?');
    params.push(data.email);
  }
  if (data.password !== undefined && data.password !== '') {
    const hashedPassword = await bcrypt.hash(data.password, SALT_ROUNDS);
    fields.push('password = ?');
    params.push(hashedPassword);
  }
  if (data.phone !== undefined) {
    fields.push('phone = ?');
    params.push(data.phone);
  }
  if (data.avatar !== undefined) {
    fields.push('avatar = ?');
    params.push(data.avatar);
  }
  if (data.status !== undefined) {
    fields.push('status = ?');
    params.push(data.status);
  }

  if (fields.length === 0) {
    return getUserById(id);
  }

  fields.push('updated_at = CURRENT_TIMESTAMP');
  const query = `UPDATE users SET ${fields.join(', ')} WHERE id = ?`;
  params.push(id);

  await db.execute(query, params);
  return getUserById(id);
}

async function deleteUser(id) {
  const db = getDatabase();
  await db.execute('DELETE FROM users WHERE id = ?', [id]);
  return true;
}

module.exports = {
  getAllUsers,
  getUserById,
  findUserByEmail,
  emailExists,
  roleExists,
  createUser,
  updateUser,
  deleteUser,
};
