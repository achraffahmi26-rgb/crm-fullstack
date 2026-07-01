const { getDatabase } = require('../database/connection');
const { createNotificationSafely } = require('./notificationService');

function formatMoney(value) {
  return `${Number(value || 0).toFixed(2)} MAD`;
}

function generateOrderNumber() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const randomSuffix = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `ORD-${year}${month}${day}-${randomSuffix}`;
}

async function getAllOrders() {
  const db = getDatabase();
  const [rows] = await db.execute(
    `SELECT id, order_number, customer_id, created_by, order_date, total_amount, status, notes, created_at, updated_at FROM orders ORDER BY created_at DESC`
  );
  return rows;
}

async function getOrderById(id) {
  const db = getDatabase();
  const [orders] = await db.execute(
    `SELECT id, order_number, customer_id, created_by, order_date, total_amount, status, notes, created_at, updated_at FROM orders WHERE id = ?`,
    [id]
  );
  
  if (orders.length === 0) {
    return null;
  }

  const order = orders[0];

  // Get order items
  const [items] = await db.execute(
    `SELECT id, order_id, product_id, quantity, unit_price, subtotal FROM order_items WHERE order_id = ?`,
    [id]
  );

  order.items = items;
  return order;
}

async function customerExists(customerId) {
  const db = getDatabase();
  const [rows] = await db.execute('SELECT id FROM customers WHERE id = ?', [customerId]);
  return rows.length > 0;
}

async function productExists(productId) {
  const db = getDatabase();
  const [rows] = await db.execute('SELECT id FROM products WHERE id = ?', [productId]);
  return rows.length > 0;
}

async function createOrder(data, authUserId) {
  const db = getDatabase();
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const orderNumber = generateOrderNumber();
    let totalAmount = 0;

    // Calculate total from items
    for (const item of data.items) {
      const subtotal = item.quantity * item.unit_price;
      totalAmount += subtotal;
    }

    // Insert order
    const [orderResult] = await connection.execute(
      `INSERT INTO orders (order_number, customer_id, created_by, order_date, total_amount, status, notes, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
      [
        orderNumber,
        data.customer_id,
        authUserId,
        data.order_date,
        totalAmount,
        data.status || 'Pending',
        data.notes || null,
      ]
    );

    const orderId = orderResult.insertId;

    // Insert order items
    for (const item of data.items) {
      const subtotal = item.quantity * item.unit_price;
      await connection.execute(
        `INSERT INTO order_items (order_id, product_id, quantity, unit_price, subtotal)
         VALUES (?, ?, ?, ?, ?)`,
        [orderId, item.product_id, item.quantity, item.unit_price, subtotal]
      );
    }

    await connection.commit();
    const order = await getOrderById(orderId);
    createNotificationSafely({
      title: 'New order created',
      message: `Order ${order.order_number} was created for ${formatMoney(order.total_amount)}.`,
      type: 'Success',
    }, authUserId);

    return order;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function updateOrder(id, data) {
  const db = getDatabase();
  const fields = [];
  const params = [];

  if (data.status !== undefined) {
    fields.push('status = ?');
    params.push(data.status);
  }
  if (data.notes !== undefined) {
    fields.push('notes = ?');
    params.push(data.notes || null);
  }

  if (fields.length === 0) {
    return getOrderById(id);
  }

  fields.push('updated_at = CURRENT_TIMESTAMP');
  const query = `UPDATE orders SET ${fields.join(', ')} WHERE id = ?`;
  params.push(id);

  await db.execute(query, params);
  return getOrderById(id);
}

async function deleteOrder(id) {
  const db = getDatabase();
  await db.execute('DELETE FROM orders WHERE id = ?', [id]);
  return true;
}

module.exports = {
  getAllOrders,
  getOrderById,
  customerExists,
  productExists,
  createOrder,
  updateOrder,
  deleteOrder,
  generateOrderNumber,
};
