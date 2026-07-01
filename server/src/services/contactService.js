const { getDatabase } = require('../database/connection');

async function getAllContacts() {
  const db = getDatabase();
  const [rows] = await db.execute(
    `SELECT id, company_id, first_name, last_name, email, phone, position, created_at, updated_at FROM contacts`
  );
  return rows;
}

async function getContactById(id) {
  const db = getDatabase();
  const [rows] = await db.execute(
    `SELECT id, company_id, first_name, last_name, email, phone, position, created_at, updated_at FROM contacts WHERE id = ?`,
    [id]
  );
  return rows[0] || null;
}

async function companyExists(companyId) {
  const db = getDatabase();
  const [rows] = await db.execute('SELECT id FROM companies WHERE id = ?', [companyId]);
  return rows.length > 0;
}

async function createContact(data) {
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
  return getContactById(result.insertId);
}

async function updateContact(id, data) {
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
    return getContactById(id);
  }

  fields.push('updated_at = CURRENT_TIMESTAMP');
  const query = `UPDATE contacts SET ${fields.join(', ')} WHERE id = ?`;
  params.push(id);

  await db.execute(query, params);
  return getContactById(id);
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
  createContact,
  updateContact,
  deleteContact,
};
