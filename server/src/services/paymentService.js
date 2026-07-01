const { getDatabase } = require('../database/connection');
const { createNotificationSafely } = require('./notificationService');

function formatMoney(value) {
  return `${Number(value || 0).toFixed(2)} MAD`;
}

async function getAllPayments() {
  const db = getDatabase();
  const [rows] = await db.execute('SELECT * FROM payments ORDER BY created_at DESC');
  return rows;
}

async function getPaymentById(id) {
  const db = getDatabase();
  const [rows] = await db.execute('SELECT * FROM payments WHERE id = ?', [id]);
  return rows[0] || null;
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

async function createPayment(data, authUserId) {
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
    const payment = await getPaymentById(result.insertId);

    if (payment.status === 'Completed') {
      createNotificationSafely({
        title: 'Payment completed',
        message: `Payment of ${formatMoney(payment.amount)} was completed for invoice ${completedInvoice.invoice_number}.`,
        type: 'Success',
      }, authUserId);
    }

    return payment;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function updatePayment(id, data) {
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
    return getPaymentById(id);
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
  createPayment,
  updatePayment,
  deletePayment,
  recalculateInvoicePaymentStatus,
};
