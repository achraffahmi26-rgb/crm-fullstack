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

async function getAllInvoices() {
  const db = getDatabase();
  const [rows] = await db.execute('SELECT * FROM invoices ORDER BY created_at DESC');
  return rows;
}

async function getInvoiceById(id) {
  const db = getDatabase();
  const [invoices] = await db.execute('SELECT * FROM invoices WHERE id = ?', [id]);
  if (invoices.length === 0) return null;
  return invoices[0];
}

async function createInvoice(data, userId) {
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
    [data.order_id, invoice_number, data.invoice_date, data.due_date, total_amount, userId]
  );
  const invoice = await getInvoiceById(result.insertId);
  createNotificationSafely({
    title: 'New invoice created',
    message: `Invoice ${invoice.invoice_number} was created for ${formatMoney(invoice.total_amount)}.`,
    type: 'Info',
  }, userId);

  return invoice;
}

async function updateInvoice(id, data) {
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
  return getInvoiceById(id);
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
  createInvoice,
  updateInvoice,
  deleteInvoice,
};
