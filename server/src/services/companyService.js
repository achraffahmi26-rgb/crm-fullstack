const { getDatabase } = require('../database/connection');

function isAdmin(user) {
  return user?.role_name === 'Admin' || Number(user?.role_id) === 1;
}

const COMPANY_SELECT = `SELECT companies.id, companies.name, companies.industry, companies.email,
        companies.phone, companies.website, companies.address, companies.city, companies.country,
        companies.created_by, companies.created_at, companies.updated_at,
        CONCAT(creator.first_name, ' ', creator.last_name) AS creator_user_name,
        creator.email AS creator_user_email
     FROM companies
     LEFT JOIN users creator ON creator.id = companies.created_by`;

function appendCompanyScope(query, params, user) {
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

async function getAllCompanies(user) {
  const db = getDatabase();
  const scoped = appendCompanyScope(COMPANY_SELECT, [], user);
  const [rows] = await db.execute(`${scoped.query} ORDER BY companies.created_at DESC`, scoped.params);
  return rows;
}

async function getCompanyById(id, user) {
  const db = getDatabase();
  const scoped = appendCompanyScope(`${COMPANY_SELECT} WHERE companies.id = ?`, [id], user);
  const [rows] = await db.execute(scoped.query, scoped.params);
  return rows[0] || null;
}

async function createCompany(data, user) {
  const db = getDatabase();
  const [result] = await db.execute(
    `INSERT INTO companies (name, industry, email, phone, website, address, city, country, created_by, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
    [
      data.name,
      data.industry || null,
      data.email || null,
      data.phone || null,
      data.website || null,
      data.address || null,
      data.city || null,
      data.country || null,
      user.id,
    ]
  );
  return getCompanyById(result.insertId, user);
}

async function updateCompany(id, data, user) {
  const db = getDatabase();
  const fields = [];
  const params = [];

  if (data.name !== undefined) {
    fields.push('name = ?');
    params.push(data.name);
  }
  if (data.industry !== undefined) {
    fields.push('industry = ?');
    params.push(data.industry);
  }
  if (data.email !== undefined) {
    fields.push('email = ?');
    params.push(data.email);
  }
  if (data.phone !== undefined) {
    fields.push('phone = ?');
    params.push(data.phone);
  }
  if (data.website !== undefined) {
    fields.push('website = ?');
    params.push(data.website);
  }
  if (data.address !== undefined) {
    fields.push('address = ?');
    params.push(data.address);
  }
  if (data.city !== undefined) {
    fields.push('city = ?');
    params.push(data.city);
  }
  if (data.country !== undefined) {
    fields.push('country = ?');
    params.push(data.country);
  }

  if (fields.length === 0) {
    return getCompanyById(id, user);
  }

  fields.push('updated_at = CURRENT_TIMESTAMP');
  params.push(id);

  await db.execute(`UPDATE companies SET ${fields.join(', ')} WHERE id = ?`, params);
  return getCompanyById(id, user);
}

async function deleteCompany(id) {
  const db = getDatabase();
  await db.execute('DELETE FROM companies WHERE id = ?', [id]);
  return true;
}

module.exports = {
  getAllCompanies,
  getCompanyById,
  createCompany,
  updateCompany,
  deleteCompany,
  isAdmin,
};
