const { getDatabase } = require('../database/connection');

function isAdmin(user) {
  return user?.role_name === 'Admin' || Number(user?.role_id) === 1;
}

const CONTACT_SELECT = `SELECT contacts.id, contacts.company_id, contacts.first_name, contacts.last_name,
        contacts.email, contacts.phone, contacts.position, contacts.created_at, contacts.updated_at
     FROM contacts
     INNER JOIN companies ON companies.id = contacts.company_id`;

function appendContactScope(query, params, user) {
  if (isAdmin(user)) {
    return { query, params };
  }

  const scopedQuery = query.includes('WHERE')
    ? `${query} AND companies.created_by = ?`
    : `${query} WHERE companies.created_by = ?`;

  return {
    query: scopedQuery,
    params: [...params, user.id],
  };
}

async function getAllContacts(user) {
  const db = getDatabase();
  const scoped = appendContactScope(CONTACT_SELECT, [], user);
  const [rows] = await db.execute(`${scoped.query} ORDER BY contacts.created_at DESC`, scoped.params);
  return rows;
}

async function getContactById(id, user) {
  const db = getDatabase();
  const scoped = appendContactScope(`${CONTACT_SELECT} WHERE contacts.id = ?`, [id], user);
  const [rows] = await db.execute(scoped.query, scoped.params);
  return rows[0] || null;
}

async function companyExists(companyId) {
  const db = getDatabase();
  const [rows] = await db.execute('SELECT id FROM companies WHERE id = ?', [companyId]);
  return rows.length > 0;
}

async function canUseCompany(companyId, user) {
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

async function createContact(data, user) {
  const db = getDatabase();
  const [result] = await db.execute(
    `INSERT INTO contacts (company_id, first_name, last_name, email, phone, position, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
    [
      data.company_id,
      data.first_name,
      data.last_name,
      data.email || null,
      data.phone || null,
      data.position || null,
    ]
  );
  return getContactById(result.insertId, user);
}

async function updateContact(id, data, user) {
  const db = getDatabase();
  const fields = [];
  const params = [];

  if (data.company_id !== undefined) {
    fields.push('company_id = ?');
    params.push(data.company_id);
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
  if (data.position !== undefined) {
    fields.push('position = ?');
    params.push(data.position || null);
  }

  if (fields.length === 0) {
    return getContactById(id, user);
  }

  fields.push('updated_at = CURRENT_TIMESTAMP');
  const query = `UPDATE contacts SET ${fields.join(', ')} WHERE id = ?`;
  params.push(id);

  await db.execute(query, params);
  return getContactById(id, user);
}

async function deleteContact(id) {
  const db = getDatabase();
  await db.execute('DELETE FROM contacts WHERE id = ?', [id]);
  return true;
}

module.exports = {
  getAllContacts,
  getContactById,
  companyExists,
  canUseCompany,
  createContact,
  updateContact,
  deleteContact,
  isAdmin,
};
