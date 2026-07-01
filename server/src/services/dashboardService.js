const { getDatabase } = require('../database/connection');

async function getSingleValue(db, query, alias) {
  const [rows] = await db.execute(query);
  return rows[0][alias];
}

async function getStats() {
  const db = getDatabase();

  const [
    totalUsers,
    totalCompanies,
    totalCustomers,
    totalLeads,
    totalProducts,
    totalOrders,
    totalInvoices,
    totalPaidInvoices,
    totalUnpaidInvoices,
    totalTasks,
    pendingTasks,
    completedTasks,
    totalRevenue,
  ] = await Promise.all([
    getSingleValue(db, 'SELECT COUNT(*) AS total FROM users', 'total'),
    getSingleValue(db, 'SELECT COUNT(*) AS total FROM companies', 'total'),
    getSingleValue(db, 'SELECT COUNT(*) AS total FROM customers', 'total'),
    getSingleValue(db, 'SELECT COUNT(*) AS total FROM leads', 'total'),
    getSingleValue(db, 'SELECT COUNT(*) AS total FROM products', 'total'),
    getSingleValue(db, 'SELECT COUNT(*) AS total FROM orders', 'total'),
    getSingleValue(db, 'SELECT COUNT(*) AS total FROM invoices', 'total'),
    getSingleValue(db, "SELECT COUNT(*) AS total FROM invoices WHERE payment_status = 'Paid'", 'total'),
    getSingleValue(db, "SELECT COUNT(*) AS total FROM invoices WHERE payment_status = 'Unpaid'", 'total'),
    getSingleValue(db, 'SELECT COUNT(*) AS total FROM tasks', 'total'),
    getSingleValue(db, "SELECT COUNT(*) AS total FROM tasks WHERE status = 'Pending'", 'total'),
    getSingleValue(db, "SELECT COUNT(*) AS total FROM tasks WHERE status = 'Completed'", 'total'),
    getSingleValue(db, "SELECT COALESCE(SUM(amount), 0) AS total FROM payments WHERE status = 'Completed'", 'total'),
  ]);

  return {
    total_users: totalUsers,
    total_companies: totalCompanies,
    total_customers: totalCustomers,
    total_leads: totalLeads,
    total_products: totalProducts,
    total_orders: totalOrders,
    total_invoices: totalInvoices,
    total_paid_invoices: totalPaidInvoices,
    total_unpaid_invoices: totalUnpaidInvoices,
    total_tasks: totalTasks,
    pending_tasks: pendingTasks,
    completed_tasks: completedTasks,
    total_revenue: Number(totalRevenue),
  };
}

async function getRevenue() {
  const db = getDatabase();
  const [rows] = await db.execute(
    `SELECT DATE_FORMAT(payment_date, '%Y-%m') AS month, COALESCE(SUM(amount), 0) AS revenue
     FROM payments
     WHERE status = 'Completed'
     GROUP BY DATE_FORMAT(payment_date, '%Y-%m')
     ORDER BY month ASC`
  );

  return rows.map((row) => ({
    month: row.month,
    revenue: Number(row.revenue),
  }));
}

async function getRecentActivities() {
  const db = getDatabase();
  const [rows] = await db.execute(
    `(SELECT 'Order' AS entity_type, id AS entity_id, order_number AS title, status, created_at
      FROM orders)
     UNION ALL
     (SELECT 'Invoice' AS entity_type, id AS entity_id, invoice_number AS title, payment_status AS status, created_at
      FROM invoices)
     UNION ALL
     (SELECT 'Payment' AS entity_type, id AS entity_id, CONCAT(payment_method, ' payment') AS title, status, created_at
      FROM payments)
     UNION ALL
     (SELECT 'Task' AS entity_type, id AS entity_id, title, status, created_at
      FROM tasks)
     UNION ALL
     (SELECT 'Customer' AS entity_type, id AS entity_id, CONCAT(first_name, ' ', last_name) AS title, status, created_at
      FROM customers)
     UNION ALL
     (SELECT 'Lead' AS entity_type, id AS entity_id, CONCAT(first_name, ' ', last_name) AS title, status, created_at
      FROM leads)
     ORDER BY created_at DESC
     LIMIT 20`
  );

  return rows;
}

module.exports = {
  getStats,
  getRevenue,
  getRecentActivities,
};
