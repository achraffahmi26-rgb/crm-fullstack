const { getDatabase } = require('../database/connection');
const { createNotificationSafely } = require('./notificationService');

const VALID_PAYMENT_STATUSES = ['Unpaid', 'Partially Paid', 'Paid'];

function formatMoney(value) {
  return `${Number(value || 0).toFixed(2)} MAD`;
}

function generateInvoiceNumber() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const randomSuffix = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `INV-${year}${month}${day}-${randomSuffix}`;
}

function isAdmin(user) {
  return user?.role_name === 'Admin' || Number(user?.role_id) === 1;
}

const INVOICE_SELECT = `SELECT invoices.id, invoices.order_id, invoices.issued_by, invoices.invoice_number,
        invoices.invoice_date, invoices.due_date, invoices.total_amount, invoices.payment_status,
        invoices.created_at, invoices.updated_at,
        orders.order_number, orders.created_by AS order_created_by, orders.customer_id,
        CONCAT(customers.first_name, ' ', customers.last_name) AS customer_name,
        customers.email AS customer_email,
        customers.created_by AS customer_created_by,
        customers.assigned_to AS customer_assigned_to,
        CONCAT(issuer.first_name, ' ', issuer.last_name) AS issuer_user_name,
        issuer.email AS issuer_user_email
     FROM invoices
     INNER JOIN orders ON orders.id = invoices.order_id
     INNER JOIN customers ON customers.id = orders.customer_id
     LEFT JOIN users issuer ON issuer.id = invoices.issued_by`;

function appendInvoiceScope(query, params, user) {
  if (isAdmin(user)) {
    return { query, params };
  }

  const scope = '(invoices.issued_by = ? OR orders.created_by = ? OR customers.created_by = ? OR customers.assigned_to = ?)';
  const scopedQuery = query.includes('WHERE') ? `${query} AND ${scope}` : `${query} WHERE ${scope}`;

  return {
    query: scopedQuery,
    params: [...params, user.id, user.id, user.id, user.id],
  };
}

async function getAllInvoices(user) {
  const db = getDatabase();
  const scoped = appendInvoiceScope(INVOICE_SELECT, [], user);
  const [rows] = await db.execute(`${scoped.query} ORDER BY invoices.created_at DESC`, scoped.params);
  return rows;
}

async function getInvoiceById(id, user) {
  const db = getDatabase();
  const scoped = appendInvoiceScope(`${INVOICE_SELECT} WHERE invoices.id = ?`, [id], user);
  const [invoices] = await db.execute(scoped.query, scoped.params);
  return invoices[0] || null;
}

async function orderExists(orderId) {
  const db = getDatabase();
  const [rows] = await db.execute('SELECT id FROM orders WHERE id = ?', [orderId]);
  return rows.length > 0;
}

async function canUseOrder(orderId, user) {
  const db = getDatabase();

  if (isAdmin(user)) {
    return orderExists(orderId);
  }

  const [rows] = await db.execute(
    `SELECT orders.id
     FROM orders
     INNER JOIN customers ON customers.id = orders.customer_id
     WHERE orders.id = ?
       AND (orders.created_by = ? OR customers.created_by = ? OR customers.assigned_to = ?)`,
    [orderId, user.id, user.id, user.id]
  );
  return rows.length > 0;
}

async function createInvoice(data, user) {
  const db = getDatabase();
  const [orders] = await db.execute('SELECT id, total_amount FROM orders WHERE id = ?', [data.order_id]);
  if (orders.length === 0) throw new Error('order_id does not exist');

  const [existing] = await db.execute('SELECT id FROM invoices WHERE order_id = ?', [data.order_id]);
  if (existing.length > 0) throw new Error('Invoice already exists for this order');

  const invoice_number = generateInvoiceNumber();
  const total_amount = orders[0].total_amount;
  const [result] = await db.execute(
    `INSERT INTO invoices (order_id, invoice_number, invoice_date, due_date, total_amount, issued_by, payment_status, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, 'Unpaid', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
    [data.order_id, invoice_number, data.invoice_date, data.due_date, total_amount, user.id]
  );
  const invoice = await getInvoiceById(result.insertId, user);
  createNotificationSafely({
    title: 'New invoice created',
    message: `Invoice ${invoice.invoice_number} was created for ${formatMoney(invoice.total_amount)}.`,
    type: 'Info',
  }, user.id);

  return invoice;
}

async function updateInvoice(id, data, user) {
  const db = getDatabase();
  const updates = [];
  const params = [];

  if (data.payment_status) {
    if (!VALID_PAYMENT_STATUSES.includes(data.payment_status)) throw new Error('Invalid payment_status');
    updates.push('payment_status = ?');
    params.push(data.payment_status);
  }
  if (data.due_date) {
    updates.push('due_date = ?');
    params.push(data.due_date);
  }
  if (updates.length === 0) throw new Error('No valid fields to update');
  params.push(id);
  const [result] = await db.execute(`UPDATE invoices SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`, params);
  if (result.affectedRows === 0) return null;
  return getInvoiceById(id, user);
}

async function deleteInvoice(id) {
  const db = getDatabase();
  const [payments] = await db.execute('SELECT id FROM payments WHERE invoice_id = ?', [id]);
  if (payments.length > 0) throw new Error('Cannot delete invoice with payments');
  const [result] = await db.execute('DELETE FROM invoices WHERE id = ?', [id]);
  return result.affectedRows > 0;
}

module.exports = {
  getAllInvoices,
  getInvoiceById,
  orderExists,
  canUseOrder,
  createInvoice,
  updateInvoice,
  deleteInvoice,
  isAdmin,
};
