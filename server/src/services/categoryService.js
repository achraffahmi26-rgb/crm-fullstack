const { getDatabase } = require('../database/connection');

async function getAllCategories() {
  const db = getDatabase();
  const [rows] = await db.execute(
    `SELECT id, name, description, created_at, updated_at FROM categories`
  );
  return rows;
}

async function getCategoryById(id) {
  const db = getDatabase();
  const [rows] = await db.execute(
    `SELECT id, name, description, created_at, updated_at FROM categories WHERE id = ?`,
    [id]
  );
  return rows[0] || null;
}

async function getCategoryByName(name, excludeId = null) {
  const db = getDatabase();
  let query = 'SELECT id FROM categories WHERE name = ?';
  const params = [name];
  
  if (excludeId !== null) {
    query += ' AND id != ?';
    params.push(excludeId);
  }
  
  const [rows] = await db.execute(query, params);
  return rows.length > 0;
}

async function createCategory(data) {
  const db = getDatabase();
  const [result] = await db.execute(
    `INSERT INTO categories (name, description, created_at, updated_at)
     VALUES (?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
    [
      data.name,
      data.description || null,
    ]
  );
  return getCategoryById(result.insertId);
}

async function updateCategory(id, data) {
  const db = getDatabase();
  const fields = [];
  const params = [];

  if (data.name !== undefined) {
    fields.push('name = ?');
    params.push(data.name);
  }
  if (data.description !== undefined) {
    fields.push('description = ?');
    params.push(data.description || null);
  }

  if (fields.length === 0) {
    return getCategoryById(id);
  }

  fields.push('updated_at = CURRENT_TIMESTAMP');
  const query = `UPDATE categories SET ${fields.join(', ')} WHERE id = ?`;
  params.push(id);

  await db.execute(query, params);
  return getCategoryById(id);
}

async function deleteCategory(id) {
  const db = getDatabase();
  await db.execute('DELETE FROM categories WHERE id = ?', [id]);
  return true;
}

module.exports = {
  getAllCategories,
  getCategoryById,
  getCategoryByName,
  createCategory,
  updateCategory,
  deleteCategory,
};
