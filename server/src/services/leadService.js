const { getDatabase } = require('../database/connection');
const { createNotificationSafely } = require('./notificationService');

function getLeadFullName(lead) {
  return `${lead.first_name || ''} ${lead.last_name || ''}`.trim() || 'Unnamed lead';
}

function isAdmin(user) {
  return user?.role_name === 'Admin' || Number(user?.role_id) === 1;
}

const LEAD_SELECT = `SELECT leads.id, leads.company_id, leads.assigned_to, leads.created_by,
        leads.first_name, leads.last_name, leads.email, leads.phone, leads.source, leads.status,
        leads.estimated_value, leads.notes, leads.created_at, leads.updated_at,
        CONCAT(assignee.first_name, ' ', assignee.last_name) AS assigned_user_name,
        assignee.email AS assigned_user_email,
        CONCAT(creator.first_name, ' ', creator.last_name) AS creator_user_name,
        creator.email AS creator_user_email
     FROM leads
     LEFT JOIN users assignee ON assignee.id = leads.assigned_to
     LEFT JOIN users creator ON creator.id = leads.created_by`;

function appendLeadScope(query, params, user) {
  if (isAdmin(user)) {
    return { query, params };
  }

  const scopedQuery = query.includes('WHERE')
    ? `${query} AND (leads.created_by = ? OR leads.assigned_to = ?)`
    : `${query} WHERE leads.created_by = ? OR leads.assigned_to = ?`;

  return {
    query: scopedQuery,
    params: [...params, user.id, user.id],
  };
}

async function getAllLeads(user) {
  const db = getDatabase();
  const scoped = appendLeadScope(LEAD_SELECT, [], user);
  const [rows] = await db.execute(`${scoped.query} ORDER BY leads.created_at DESC`, scoped.params);
  return rows;
}

async function getLeadById(id, user) {
  const db = getDatabase();
  const scoped = appendLeadScope(`${LEAD_SELECT} WHERE leads.id = ?`, [id], user);
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

async function createLead(data, user) {
  const db = getDatabase();
  const createdBy = user.id;
  const assignedTo = isAdmin(user) ? (data.assigned_to || user.id) : user.id;

  const [result] = await db.execute(
    `INSERT INTO leads (company_id, assigned_to, created_by, first_name, last_name, email, phone, source, status, estimated_value, notes, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
    [
      data.company_id,
      assignedTo,
      createdBy,
      data.first_name,
      data.last_name,
      data.email || null,
      data.phone || null,
      data.source || null,
      data.status || 'New',
      data.estimated_value || null,
      data.notes || null,
    ]
  );
  const lead = await getLeadById(result.insertId, user);
  createNotificationSafely({
    title: 'New lead created',
    message: `Lead ${getLeadFullName(lead)} was created with status ${lead.status}.`,
    type: 'Info',
  }, createdBy);

  return lead;
}

async function updateLead(id, data, user) {
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
  if (data.notes !== undefined) {
    fields.push('notes = ?');
    params.push(data.notes || null);
  }

  if (fields.length === 0) {
    return getLeadById(id, user);
  }

  fields.push('updated_at = CURRENT_TIMESTAMP');
  params.push(id);

  await db.execute(`UPDATE leads SET ${fields.join(', ')} WHERE id = ?`, params);
  return getLeadById(id, user);
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
  activeUserExists,
  companyOwnedByUser,
  createLead,
  updateLead,
  deleteLead,
  isAdmin,
};
