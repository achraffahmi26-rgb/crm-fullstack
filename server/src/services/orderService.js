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

function isAdmin(user) {
  return user?.role_name === 'Admin' || Number(user?.role_id) === 1;
}

const ORDER_SELECT = `SELECT orders.id, orders.order_number, orders.customer_id, orders.created_by,
        orders.order_date, orders.total_amount, orders.status, orders.notes, orders.created_at, orders.updated_at,
        CONCAT(customers.first_name, ' ', customers.last_name) AS customer_name,
        customers.email AS customer_email,
        customers.created_by AS customer_created_by,
        customers.assigned_to AS customer_assigned_to,
        CONCAT(creator.first_name, ' ', creator.last_name) AS creator_user_name,
        creator.email AS creator_user_email,
        CONCAT(customer_creator.first_name, ' ', customer_creator.last_name) AS customer_creator_user_name,
        customer_creator.email AS customer_creator_user_email,
        CONCAT(customer_assignee.first_name, ' ', customer_assignee.last_name) AS customer_assignee_user_name,
        customer_assignee.email AS customer_assignee_user_email
     FROM orders
     INNER JOIN customers ON customers.id = orders.customer_id
     LEFT JOIN users creator ON creator.id = orders.created_by
     LEFT JOIN users customer_creator ON customer_creator.id = customers.created_by
     LEFT JOIN users customer_assignee ON customer_assignee.id = customers.assigned_to`;

function appendOrderScope(query, params, user) {
  if (isAdmin(user)) {
    return { query, params };
  }

  const scopedQuery = query.includes('WHERE')
    ? `${query} AND (orders.created_by = ? OR customers.created_by = ? OR customers.assigned_to = ?)`
    : `${query} WHERE orders.created_by = ? OR customers.created_by = ? OR customers.assigned_to = ?`;

  return {
    query: scopedQuery,
    params: [...params, user.id, user.id, user.id],
  };
}

async function getAllOrders(user) {
  const db = getDatabase();
  const scoped = appendOrderScope(ORDER_SELECT, [], user);
  const [rows] = await db.execute(`${scoped.query} ORDER BY orders.created_at DESC`, scoped.params);
  return rows;
}

async function getOrderById(id, user) {
  const db = getDatabase();
  const scoped = appendOrderScope(`${ORDER_SELECT} WHERE orders.id = ?`, [id], user);
  const [orders] = await db.execute(scoped.query, scoped.params);

  if (orders.length === 0) {
    return null;
  }

  const order = orders[0];

  const [items] = await db.execute(
    `SELECT order_items.id, order_items.order_id, order_items.product_id, order_items.quantity,
        order_items.unit_price, order_items.subtotal, products.name AS product_name, products.sku AS product_sku
     FROM order_items
     LEFT JOIN products ON products.id = order_items.product_id
     WHERE order_items.order_id = ?`,
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

async function canUseCustomer(customerId, user) {
  const db = getDatabase();

  if (isAdmin(user)) {
    return customerExists(customerId);
  }

  const [rows] = await db.execute(
    'SELECT id FROM customers WHERE id = ? AND (created_by = ? OR assigned_to = ?)',
    [customerId, user.id, user.id]
  );
  return rows.length > 0;
}

async function productExists(productId) {
  const db = getDatabase();
  const [rows] = await db.execute('SELECT id FROM products WHERE id = ?', [productId]);
  return rows.length > 0;
}

async function activeProductExists(productId) {
  const db = getDatabase();
  const [rows] = await db.execute('SELECT id FROM products WHERE id = ? AND status = ?', [productId, 'Active']);
  return rows.length > 0;
}

async function createOrder(data, user) {
  const db = getDatabase();
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const orderNumber = generateOrderNumber();
    let totalAmount = 0;

    for (const item of data.items) {
      const subtotal = item.quantity * item.unit_price;
      totalAmount += subtotal;
    }

    const [orderResult] = await connection.execute(
      `INSERT INTO orders (order_number, customer_id, created_by, order_date, total_amount, status, notes, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
      [
        orderNumber,
        data.customer_id,
        user.id,
        data.order_date,
        totalAmount,
        data.status || 'Pending',
        data.notes || null,
      ]
    );

    const orderId = orderResult.insertId;

    for (const item of data.items) {
      const subtotal = item.quantity * item.unit_price;
      await connection.execute(
        `INSERT INTO order_items (order_id, product_id, quantity, unit_price, subtotal)
         VALUES (?, ?, ?, ?, ?)`,
        [orderId, item.product_id, item.quantity, item.unit_price, subtotal]
      );
    }

    await connection.commit();
    const order = await getOrderById(orderId, user);
    createNotificationSafely({
      title: 'New order created',
      message: `Order ${order.order_number} was created for ${formatMoney(order.total_amount)}.`,
      type: 'Success',
    }, user.id);

    return order;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function updateOrder(id, data, user) {
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
    return getOrderById(id, user);
  }

  fields.push('updated_at = CURRENT_TIMESTAMP');
  params.push(id);

  await db.execute(`UPDATE orders SET ${fields.join(', ')} WHERE id = ?`, params);
  return getOrderById(id, user);
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
  canUseCustomer,
  productExists,
  activeProductExists,
  createOrder,
  updateOrder,
  deleteOrder,
  generateOrderNumber,
  isAdmin,
};
