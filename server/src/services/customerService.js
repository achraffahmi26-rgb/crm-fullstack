const { getDatabase } = require('../database/connection');
const { createNotificationSafely } = require('./notificationService');

function getCustomerFullName(customer) {
  return `${customer.first_name || ''} ${customer.last_name || ''}`.trim() || 'Unnamed customer';
}

async function getAllCustomers() {
  const db = getDatabase();
  const [rows] = await db.execute(
    `SELECT id, company_id, assigned_to, first_name, last_name, email, phone, status, address, notes, created_at, updated_at FROM customers`
  );
  return rows;
}

async function getCustomerById(id) {
  const db = getDatabase();
  const [rows] = await db.execute(
    `SELECT id, company_id, assigned_to, first_name, last_name, email, phone, status, address, notes, created_at, updated_at FROM customers WHERE id = ?`,
    [id]
  );
  return rows[0] || null;
}

async function companyExists(companyId) {
  const db = getDatabase();
  const [rows] = await db.execute('SELECT id FROM companies WHERE id = ?', [companyId]);
  return rows.length > 0;
}

async function userExists(userId) {
  const db = getDatabase();
  const [rows] = await db.execute('SELECT id FROM users WHERE id = ?', [userId]);
  return rows.length > 0;
}

async function createCustomer(data, authUserId) {
  const db = getDatabase();
  const assignedTo = data.assigned_to || authUserId;
  const [result] = await db.execute(
    `INSERT INTO customers (company_id, assigned_to, first_name, last_name, email, phone, status, address, notes, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
    [
      data.company_id,
      assignedTo,
      data.first_name,
      data.last_name,
      data.email || null,
      data.phone || null,
      data.status || 'Active',
      data.address || null,
      data.notes || null,
    ]
  );
  const customer = await getCustomerById(result.insertId);
  createNotificationSafely({
    title: 'New customer created',
    message: `Customer ${getCustomerFullName(customer)} was created.`,
    type: 'Success',
  }, authUserId);

  return customer;
}

async function updateCustomer(id, data) {
  const db = getDatabase();
  const fields = [];
  const params = [];

  if (data.company_id !== undefined) {
    fields.push('company_id = ?');
    params.push(data.company_id);
  }
  if (data.assigned_to !== undefined) {
    fields.push('assigned_to = ?');
    params.push(data.assigned_to);
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
    params.push(data.email || null);
  }
  if (data.phone !== undefined) {
    fields.push('phone = ?');
    params.push(data.phone || null);
  }
  if (data.status !== undefined) {
    fields.push('status = ?');
    params.push(data.status);
  }
  if (data.address !== undefined) {
    fields.push('address = ?');
    params.push(data.address || null);
  }
  if (data.notes !== undefined) {
    fields.push('notes = ?');
    params.push(data.notes || null);
  }

  if (fields.length === 0) {
    return getCustomerById(id);
  }

  fields.push('updated_at = CURRENT_TIMESTAMP');
  const query = `UPDATE customers SET ${fields.join(', ')} WHERE id = ?`;
  params.push(id);

  await db.execute(query, params);
  return getCustomerById(id);
}

async function deleteCustomer(id) {
  const db = getDatabase();
  await db.execute('DELETE FROM customers WHERE id = ?', [id]);
  return true;
}

module.exports = {
  getAllCustomers,
  getCustomerById,
  companyExists,
  userExists,
  createCustomer,
  updateCustomer,
  deleteCustomer,
};
