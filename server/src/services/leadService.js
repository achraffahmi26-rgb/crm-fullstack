const { getDatabase } = require('../database/connection');
const { createNotificationSafely } = require('./notificationService');

function getLeadFullName(lead) {
  return `${lead.first_name || ''} ${lead.last_name || ''}`.trim() || 'Unnamed lead';
}

async function getAllLeads() {
  const db = getDatabase();
  const [rows] = await db.execute(
    `SELECT id, company_id, first_name, last_name, email, phone, source, status, estimated_value, assigned_to, created_at, updated_at FROM leads`
  );
  return rows;
}

async function getLeadById(id) {
  const db = getDatabase();
  const [rows] = await db.execute(
    `SELECT id, company_id, first_name, last_name, email, phone, source, status, estimated_value, assigned_to, created_at, updated_at FROM leads WHERE id = ?`,
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

async function createLead(data, authUserId) {
  const db = getDatabase();
  const assignedTo = data.assigned_to !== undefined ? data.assigned_to : authUserId;
  
  const [result] = await db.execute(
    `INSERT INTO leads (company_id, first_name, last_name, email, phone, source, status, estimated_value, assigned_to, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
    [
      data.company_id,
      data.first_name,
      data.last_name,
      data.email || null,
      data.phone || null,
      data.source || null,
      data.status || 'New',
      data.estimated_value || null,
      assignedTo,
    ]
  );
  const lead = await getLeadById(result.insertId);
  createNotificationSafely({
    title: 'New lead created',
    message: `Lead ${getLeadFullName(lead)} was created with status ${lead.status}.`,
    type: 'Info',
  }, authUserId);

  return lead;
}

async function updateLead(id, data) {
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
  if (data.source !== undefined) {
    fields.push('source = ?');
    params.push(data.source || null);
  }
  if (data.status !== undefined) {
    fields.push('status = ?');
    params.push(data.status);
  }
  if (data.estimated_value !== undefined) {
    fields.push('estimated_value = ?');
    params.push(data.estimated_value || null);
  }
  if (data.assigned_to !== undefined) {
    fields.push('assigned_to = ?');
    params.push(data.assigned_to);
  }

  if (fields.length === 0) {
    return getLeadById(id);
  }

  fields.push('updated_at = CURRENT_TIMESTAMP');
  const query = `UPDATE leads SET ${fields.join(', ')} WHERE id = ?`;
  params.push(id);

  await db.execute(query, params);
  return getLeadById(id);
}

async function deleteLead(id) {
  const db = getDatabase();
  await db.execute('DELETE FROM leads WHERE id = ?', [id]);
  return true;
}

module.exports = {
  getAllLeads,
  getLeadById,
  companyExists,
  userExists,
  createLead,
  updateLead,
  deleteLead,
};
