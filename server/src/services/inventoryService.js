const { getDatabase } = require('../database/connection');

async function getAllInventory() {
  const db = getDatabase();
  const [rows] = await db.execute(
    `SELECT id, product_id, quantity, minimum_stock, warehouse, updated_at FROM inventory`
  );
  return rows;
}

async function getInventoryById(id) {
  const db = getDatabase();
  const [rows] = await db.execute(
    `SELECT id, product_id, quantity, minimum_stock, warehouse, updated_at FROM inventory WHERE id = ?`,
    [id]
  );
  return rows[0] || null;
}

async function getInventoryByProductId(productId) {
  const db = getDatabase();
  const [rows] = await db.execute(
    `SELECT id, product_id, quantity, minimum_stock, warehouse, updated_at FROM inventory WHERE product_id = ?`,
    [productId]
  );
  return rows[0] || null;
}

async function productExists(productId) {
  const db = getDatabase();
  const [rows] = await db.execute('SELECT id FROM products WHERE id = ?', [productId]);
  return rows.length > 0;
}

async function productHasInventory(productId, excludeId = null) {
  const db = getDatabase();
  let query = 'SELECT id FROM inventory WHERE product_id = ?';
  const params = [productId];
  
  if (excludeId !== null) {
    query += ' AND id != ?';
    params.push(excludeId);
  }
  
  const [rows] = await db.execute(query, params);
  return rows.length > 0;
}

async function createInventory(data) {
  const db = getDatabase();
  const [result] = await db.execute(
    `INSERT INTO inventory (product_id, quantity, minimum_stock)
     VALUES (?, ?, ?)`,
    [
      data.product_id,
      data.quantity || 0,
      data.minimum_stock || 0,
    ]
  );
  return getInventoryById(result.insertId);
}

async function updateInventory(id, data) {
  const db = getDatabase();
  const fields = [];
  const params = [];

  if (data.quantity !== undefined) {
    fields.push('quantity = ?');
    params.push(data.quantity);
  }
  if (data.minimum_stock !== undefined) {
    fields.push('minimum_stock = ?');
    params.push(data.minimum_stock);
  }

  if (fields.length === 0) {
    return getInventoryById(id);
  }

  const query = `UPDATE inventory SET ${fields.join(', ')} WHERE id = ?`;
  params.push(id);

  await db.execute(query, params);
  return getInventoryById(id);
}

async function deleteInventory(id) {
  const db = getDatabase();
  await db.execute('DELETE FROM inventory WHERE id = ?', [id]);
  return true;
}

module.exports = {
  getAllInventory,
  getInventoryById,
  getInventoryByProductId,
  productExists,
  productHasInventory,
  createInventory,
  updateInventory,
  deleteInventory,
};
