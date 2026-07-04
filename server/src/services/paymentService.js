const { getDatabase } = require('../database/connection');
const { createNotificationSafely } = require('./notificationService');

function formatMoney(value) {
  return `${Number(value || 0).toFixed(2)} MAD`;
}

function isAdmin(user) {
  return user?.role_name === 'Admin' || Number(user?.role_id) === 1;
}

const PAYMENT_SELECT = `SELECT payments.id, payments.invoice_id, payments.amount, payments.payment_method,
        payments.payment_date, payments.transaction_id, payments.reference, payments.status, payments.created_at,
        invoices.invoice_number, invoices.issued_by, invoices.order_id, invoices.total_amount AS invoice_total_amount,
        orders.order_number, orders.created_by AS order_created_by, orders.customer_id,
        CONCAT(customers.first_name, ' ', customers.last_name) AS customer_name,
        customers.email AS customer_email,
        customers.created_by AS customer_created_by,
        customers.assigned_to AS customer_assigned_to
     FROM payments
     INNER JOIN invoices ON invoices.id = payments.invoice_id
     INNER JOIN orders ON orders.id = invoices.order_id
     INNER JOIN customers ON customers.id = orders.customer_id`;

function invoiceScopeCondition() {
  return '(invoices.issued_by = ? OR orders.created_by = ? OR customers.created_by = ? OR customers.assigned_to = ?)';
}

function appendPaymentScope(query, params, user) {
  if (isAdmin(user)) {
    return { query, params };
  }

  const scope = invoiceScopeCondition();
  const scopedQuery = query.includes('WHERE') ? `${query} AND ${scope}` : `${query} WHERE ${scope}`;

  return {
    query: scopedQuery,
    params: [...params, user.id, user.id, user.id, user.id],
  };
}

async function getAllPayments(user) {
  const db = getDatabase();
  const scoped = appendPaymentScope(PAYMENT_SELECT, [], user);
  const [rows] = await db.execute(`${scoped.query} ORDER BY payments.created_at DESC`, scoped.params);
  return rows;
}

async function getPaymentById(id, user) {
  const db = getDatabase();
  const scoped = appendPaymentScope(`${PAYMENT_SELECT} WHERE payments.id = ?`, [id], user);
  const [rows] = await db.execute(scoped.query, scoped.params);
  return rows[0] || null;
}

async function invoiceExists(invoiceId) {
  const db = getDatabase();
  const [rows] = await db.execute('SELECT id FROM invoices WHERE id = ?', [invoiceId]);
  return rows.length > 0;
}

async function canUseInvoice(invoiceId, user) {
  const db = getDatabase();

  if (isAdmin(user)) {
    return invoiceExists(invoiceId);
  }

  const [rows] = await db.execute(
    `SELECT invoices.id
     FROM invoices
     INNER JOIN orders ON orders.id = invoices.order_id
     INNER JOIN customers ON customers.id = orders.customer_id
     WHERE invoices.id = ? AND ${invoiceScopeCondition()}`,
    [invoiceId, user.id, user.id, user.id, user.id]
  );
  return rows.length > 0;
}

async function getInvoiceById(connection, invoiceId) {
  const [rows] = await connection.execute('SELECT id, invoice_number, total_amount FROM invoices WHERE id = ?', [invoiceId]);
  return rows[0] || null;
}

async function getCompletedTotal(connection, invoiceId, excludePaymentId = null) {
  const params = [invoiceId];
  let query = "SELECT COALESCE(SUM(amount), 0) AS total FROM payments WHERE invoice_id = ? AND status = 'Completed'";

  if (excludePaymentId !== null) {
    query += ' AND id != ?';
    params.push(excludePaymentId);
  }

  const [rows] = await connection.execute(query, params);
  return Number(rows[0].total);
}

async function recalculateInvoicePaymentStatus(connection, invoiceId) {
  const invoice = await getInvoiceById(connection, invoiceId);
  if (!invoice) {
    return null;
  }

  const completedTotal = await getCompletedTotal(connection, invoiceId);
  const invoiceTotal = Number(invoice.total_amount);
  let paymentStatus = 'Unpaid';

  if (completedTotal >= invoiceTotal) {
    paymentStatus = 'Paid';
  } else if (completedTotal > 0) {
    paymentStatus = 'Partially Paid';
  }

  await connection.execute(
    'UPDATE invoices SET payment_status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    [paymentStatus, invoiceId]
  );

  return paymentStatus;
}

async function assertCompletedTotalAllowed(connection, invoiceId, amount, excludePaymentId = null) {
  const invoice = await getInvoiceById(connection, invoiceId);
  if (!invoice) {
    throw new Error('invoice_id does not exist');
  }

  const currentCompletedTotal = await getCompletedTotal(connection, invoiceId, excludePaymentId);
  if (currentCompletedTotal + Number(amount) > Number(invoice.total_amount)) {
    throw new Error('Total completed payments cannot exceed invoice total_amount');
  }
}

async function createPayment(data, user) {
  const db = getDatabase();
  const connection = await db.getConnection();
  let completedInvoice = null;

  try {
    await connection.beginTransaction();

    const invoice = await getInvoiceById(connection, data.invoice_id);
    if (!invoice) {
      throw new Error('invoice_id does not exist');
    }

    if (data.status === 'Completed') {
      await assertCompletedTotalAllowed(connection, data.invoice_id, data.amount);
    }

    const [result] = await connection.execute(
      `INSERT INTO payments (invoice_id, amount, payment_method, payment_date, transaction_id, reference, status)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        data.invoice_id,
        data.amount,
        data.payment_method,
        data.payment_date,
        data.transaction_id || null,
        data.reference || null,
        data.status,
      ]
    );

    if (data.status === 'Completed') {
      await recalculateInvoicePaymentStatus(connection, data.invoice_id);
      completedInvoice = invoice;
    }

    await connection.commit();
    const payment = await getPaymentById(result.insertId, user);

    if (payment.status === 'Completed') {
      createNotificationSafely({
        title: 'Payment completed',
        message: `Payment of ${formatMoney(payment.amount)} was completed for invoice ${completedInvoice.invoice_number}.`,
        type: 'Success',
      }, user.id);
    }

    return payment;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function updatePayment(id, data, user) {
  const db = getDatabase();
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const [existingRows] = await connection.execute('SELECT * FROM payments WHERE id = ?', [id]);
    if (existingRows.length === 0) {
      await connection.rollback();
      return null;
    }

    const existingPayment = existingRows[0];
    const nextPayment = {
      invoice_id: data.invoice_id !== undefined ? data.invoice_id : existingPayment.invoice_id,
      amount: data.amount !== undefined ? data.amount : Number(existingPayment.amount),
      payment_method: data.payment_method !== undefined ? data.payment_method : existingPayment.payment_method,
      payment_date: data.payment_date !== undefined ? data.payment_date : existingPayment.payment_date,
      transaction_id: data.transaction_id !== undefined ? data.transaction_id : existingPayment.transaction_id,
      reference: data.reference !== undefined ? data.reference : existingPayment.reference,
      status: data.status !== undefined ? data.status : existingPayment.status,
    };

    const invoice = await getInvoiceById(connection, nextPayment.invoice_id);
    if (!invoice) {
      throw new Error('invoice_id does not exist');
    }

    if (data.invoice_id !== undefined) {
      const invoiceAllowed = await canUseInvoice(data.invoice_id, user);
      if (!invoiceAllowed) {
        throw new Error('You can only move payments to your own scoped invoices');
      }
    }

    if (nextPayment.status === 'Completed') {
      await assertCompletedTotalAllowed(connection, nextPayment.invoice_id, nextPayment.amount, id);
    }

    const fields = [];
    const params = [];

    if (data.invoice_id !== undefined) {
      fields.push('invoice_id = ?');
      params.push(data.invoice_id);
    }
    if (data.amount !== undefined) {
      fields.push('amount = ?');
      params.push(data.amount);
    }
    if (data.payment_method !== undefined) {
      fields.push('payment_method = ?');
      params.push(data.payment_method);
    }
    if (data.payment_date !== undefined) {
      fields.push('payment_date = ?');
      params.push(data.payment_date);
    }
    if (data.transaction_id !== undefined) {
      fields.push('transaction_id = ?');
      params.push(data.transaction_id || null);
    }
    if (data.reference !== undefined) {
      fields.push('reference = ?');
      params.push(data.reference || null);
    }
    if (data.status !== undefined) {
      fields.push('status = ?');
      params.push(data.status);
    }

    if (fields.length > 0) {
      params.push(id);
      await connection.execute(`UPDATE payments SET ${fields.join(', ')} WHERE id = ?`, params);
    }

    await recalculateInvoicePaymentStatus(connection, existingPayment.invoice_id);
    if (Number(nextPayment.invoice_id) !== Number(existingPayment.invoice_id)) {
      await recalculateInvoicePaymentStatus(connection, nextPayment.invoice_id);
    }

    await connection.commit();
    return getPaymentById(id, user);
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function deletePayment(id) {
  const db = getDatabase();
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const [existingRows] = await connection.execute('SELECT id, invoice_id FROM payments WHERE id = ?', [id]);
    if (existingRows.length === 0) {
      await connection.rollback();
      return false;
    }

    const invoiceId = existingRows[0].invoice_id;
    await connection.execute('DELETE FROM payments WHERE id = ?', [id]);
    await recalculateInvoicePaymentStatus(connection, invoiceId);

    await connection.commit();
    return true;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

module.exports = {
  getAllPayments,
  getPaymentById,
  invoiceExists,
  canUseInvoice,
  createPayment,
  updatePayment,
  deletePayment,
  recalculateInvoicePaymentStatus,
  isAdmin,
};
