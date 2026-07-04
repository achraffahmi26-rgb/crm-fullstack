const { getDatabase } = require('../database/connection');
const { createNotificationSafely } = require('./notificationService');

function getCustomerFullName(customer) {
  return `${customer.first_name || ''} ${customer.last_name || ''}`.trim() || 'Unnamed customer';
}

function isAdmin(user) {
  return user?.role_name === 'Admin' || Number(user?.role_id) === 1;
}

const CUSTOMER_SELECT = `SELECT customers.id, customers.company_id, customers.assigned_to, customers.created_by,
        customers.first_name, customers.last_name, customers.email, customers.phone, customers.status,
        customers.address, customers.notes, customers.created_at, customers.updated_at,
        CONCAT(assignee.first_name, ' ', assignee.last_name) AS assigned_user_name,
        assignee.email AS assigned_user_email,
        CONCAT(creator.first_name, ' ', creator.last_name) AS creator_user_name,
        creator.email AS creator_user_email
     FROM customers
     LEFT JOIN users assignee ON assignee.id = customers.assigned_to
     LEFT JOIN users creator ON creator.id = customers.created_by`;

function appendCustomerScope(query, params, user) {
  if (isAdmin(user)) {
    return { query, params };
  }

  const scopedQuery = query.includes('WHERE')
    ? `${query} AND (customers.created_by = ? OR customers.assigned_to = ?)`
    : `${query} WHERE customers.created_by = ? OR customers.assigned_to = ?`;

  return {
    query: scopedQuery,
    params: [...params, user.id, user.id],
  };
}

async function getAllCustomers(user) {
  const db = getDatabase();
  const scoped = appendCustomerScope(CUSTOMER_SELECT, [], user);
  const [rows] = await db.execute(`${scoped.query} ORDER BY customers.created_at DESC`, scoped.params);
  return rows;
}

async function getCustomerById(id, user) {
  const db = getDatabase();
  const scoped = appendCustomerScope(`${CUSTOMER_SELECT} WHERE customers.id = ?`, [id], user);
  const [rows] = await db.execute(scoped.query, scoped.params);
  return rows[0] || null;
}

async function companyExists(companyId) {
  const db = getDatabase();
  const [rows] = await db.execute('SELECT id FROM companies WHERE id = ?', [companyId]);
  return rows.length > 0;
}

async function activeUserExists(userId) {
  const db = getDatabase();
  const [rows] = await db.execute('SELECT id FROM users WHERE id = ? AND status = ?', [userId, 'Active']);
  return rows.length > 0;
}

async function companyOwnedByUser(companyId, user) {
  if (isAdmin(user)) {
    return companyExists(companyId);
  }

  const db = getDatabase();
  const [rows] = await db.execute(
    'SELECT id FROM companies WHERE id = ? AND created_by = ?',
    [companyId, user.id]
  );
  return rows.length > 0;
}

async function createCustomer(data, user) {
  const db = getDatabase();
  const createdBy = user.id;
  const assignedTo = isAdmin(user) ? (data.assigned_to || user.id) : user.id;
  const [result] = await db.execute(
    `INSERT INTO customers (company_id, assigned_to, created_by, first_name, last_name, email, phone, status, address, notes, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
    [
      data.company_id,
      assignedTo,
      createdBy,
      data.first_name,
      data.last_name,
      data.email || null,
      data.phone || null,
      data.status || 'Active',
      data.address || null,
      data.notes || null,
    ]
  );
  const customer = await getCustomerById(result.insertId, user);
  createNotificationSafely({
    title: 'New customer created',
    message: `Customer ${getCustomerFullName(customer)} was created.`,
    type: 'Success',
  }, createdBy);

  return customer;
}

async function updateCustomer(id, data, user) {
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
    return getCustomerById(id, user);
  }

  fields.push('updated_at = CURRENT_TIMESTAMP');
  params.push(id);

  await db.execute(`UPDATE customers SET ${fields.join(', ')} WHERE id = ?`, params);
  return getCustomerById(id, user);
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
  activeUserExists,
  companyOwnedByUser,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  isAdmin,
};
