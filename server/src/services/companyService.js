const { getDatabase } = require('../database/connection');

async function getAllCompanies() {
  const db = getDatabase();
  const [rows] = await db.execute(
    `SELECT id, name, industry, email, phone, website, address, city, country, created_by, created_at, updated_at FROM companies`
  );
  return rows;
}

async function getCompanyById(id) {
  const db = getDatabase();
  const [rows] = await db.execute(
    `SELECT id, name, industry, email, phone, website, address, city, country, created_by, created_at, updated_at FROM companies WHERE id = ?`,
    [id]
  );
  return rows[0] || null;
}

async function createCompany(data, userId) {
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
      userId,
    ]
  );
  return getCompanyById(result.insertId);
}

async function updateCompany(id, data) {
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
    return getCompanyById(id);
  }

  fields.push('updated_at = CURRENT_TIMESTAMP');
  const query = `UPDATE companies SET ${fields.join(', ')} WHERE id = ?`;
  params.push(id);

  await db.execute(query, params);
  return getCompanyById(id);
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
};
