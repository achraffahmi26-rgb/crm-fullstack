const { getDatabase } = require('../database/connection');

async function getAllProducts() {
  const db = getDatabase();
  const [rows] = await db.execute(
    `SELECT id, category_id, name, sku, barcode, purchase_price, selling_price, description, status, created_at, updated_at FROM products`
  );
  return rows;
}

async function getProductById(id) {
  const db = getDatabase();
  const [rows] = await db.execute(
    `SELECT id, category_id, name, sku, barcode, purchase_price, selling_price, description, status, created_at, updated_at FROM products WHERE id = ?`,
    [id]
  );
  return rows[0] || null;
}

async function categoryExists(categoryId) {
  const db = getDatabase();
  const [rows] = await db.execute('SELECT id FROM categories WHERE id = ?', [categoryId]);
  return rows.length > 0;
}

async function getSkuByName(sku, excludeId = null) {
  const db = getDatabase();
  let query = 'SELECT id FROM products WHERE sku = ?';
  const params = [sku];
  
  if (excludeId !== null) {
    query += ' AND id != ?';
    params.push(excludeId);
  }
  
  const [rows] = await db.execute(query, params);
  return rows.length > 0;
}

async function getBarcodeByValue(barcode, excludeId = null) {
  const db = getDatabase();
  let query = 'SELECT id FROM products WHERE barcode = ?';
  const params = [barcode];
  
  if (excludeId !== null) {
    query += ' AND id != ?';
    params.push(excludeId);
  }
  
  const [rows] = await db.execute(query, params);
  return rows.length > 0;
}

async function createProduct(data) {
  const db = getDatabase();
  const [result] = await db.execute(
    `INSERT INTO products (category_id, name, sku, barcode, purchase_price, selling_price, description, status, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
    [
      data.category_id || null,
      data.name,
      data.sku,
      data.barcode || null,
      data.purchase_price || 0,
      data.selling_price || 0,
      data.description || null,
      data.status || 'Active',
    ]
  );
  return getProductById(result.insertId);
}

async function updateProduct(id, data) {
  const db = getDatabase();
  const fields = [];
  const params = [];

  if (data.category_id !== undefined) {
    fields.push('category_id = ?');
    params.push(data.category_id || null);
  }
  if (data.name !== undefined) {
    fields.push('name = ?');
    params.push(data.name);
  }
  if (data.sku !== undefined) {
    fields.push('sku = ?');
    params.push(data.sku);
  }
  if (data.barcode !== undefined) {
    fields.push('barcode = ?');
    params.push(data.barcode || null);
  }
  if (data.purchase_price !== undefined) {
    fields.push('purchase_price = ?');
    params.push(data.purchase_price);
  }
  if (data.selling_price !== undefined) {
    fields.push('selling_price = ?');
    params.push(data.selling_price);
  }
  if (data.description !== undefined) {
    fields.push('description = ?');
    params.push(data.description || null);
  }
  if (data.status !== undefined) {
    fields.push('status = ?');
    params.push(data.status);
  }

  if (fields.length === 0) {
    return getProductById(id);
  }

  fields.push('updated_at = CURRENT_TIMESTAMP');
  const query = `UPDATE products SET ${fields.join(', ')} WHERE id = ?`;
  params.push(id);

  await db.execute(query, params);
  return getProductById(id);
}

async function deleteProduct(id) {
  const db = getDatabase();
  await db.execute('DELETE FROM products WHERE id = ?', [id]);
  return true;
}

module.exports = {
  getAllProducts,
  getProductById,
  categoryExists,
  getSkuByName,
  getBarcodeByValue,
  createProduct,
  updateProduct,
  deleteProduct,
};
