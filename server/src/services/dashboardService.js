const { getDatabase } = require('../database/connection');

function isAdmin(user) {
  return user?.role_name === 'Admin' || Number(user?.role_id) === 1;
}

async function getSingleValue(db, query, alias, params = []) {
  const [rows] = await db.execute(query, params);
  return rows[0][alias];
}

function scopedCustomerCondition(alias = 'customers') {
  return `(${alias}.created_by = ? OR ${alias}.assigned_to = ?)`;
}

function scopedLeadCondition(alias = 'leads') {
  return `(${alias}.created_by = ? OR ${alias}.assigned_to = ?)`;
}

function scopedOrderCondition(orderAlias = 'orders', customerAlias = 'customers') {
  return `(${orderAlias}.created_by = ? OR ${scopedCustomerCondition(customerAlias)})`;
}

function scopedInvoiceCondition(invoiceAlias = 'invoices', orderAlias = 'orders', customerAlias = 'customers') {
  return `(${invoiceAlias}.issued_by = ? OR ${scopedOrderCondition(orderAlias, customerAlias)})`;
}

function userParams(user, count) {
  return Array.from({ length: count }, () => user.id);
}

function productCountQuery(user) {
  if (isAdmin(user)) {
    return { query: 'SELECT COUNT(*) AS total FROM products', params: [] };
  }

  return { query: "SELECT COUNT(*) AS total FROM products WHERE status = 'Active'", params: [] };
}

function companiesCountQuery(user) {
  if (isAdmin(user)) {
    return { query: 'SELECT COUNT(*) AS total FROM companies', params: [] };
  }

  return {
    query: `SELECT COUNT(DISTINCT companies.id) AS total
      FROM companies
      LEFT JOIN customers ON customers.company_id = companies.id AND ${scopedCustomerCondition('customers')}
      LEFT JOIN leads ON leads.company_id = companies.id AND ${scopedLeadCondition('leads')}
      WHERE customers.id IS NOT NULL OR leads.id IS NOT NULL`,
    params: userParams(user, 4),
  };
}

function customersCountQuery(user) {
  if (isAdmin(user)) {
    return { query: 'SELECT COUNT(*) AS total FROM customers', params: [] };
  }

  return {
    query: `SELECT COUNT(*) AS total FROM customers WHERE ${scopedCustomerCondition('customers')}`,
    params: userParams(user, 2),
  };
}

function leadsCountQuery(user) {
  if (isAdmin(user)) {
    return { query: 'SELECT COUNT(*) AS total FROM leads', params: [] };
  }

  return {
    query: `SELECT COUNT(*) AS total FROM leads WHERE ${scopedLeadCondition('leads')}`,
    params: userParams(user, 2),
  };
}

function ordersCountQuery(user) {
  if (isAdmin(user)) {
    return { query: 'SELECT COUNT(*) AS total FROM orders', params: [] };
  }

  return {
    query: `SELECT COUNT(*) AS total
      FROM orders
      INNER JOIN customers ON customers.id = orders.customer_id
      WHERE ${scopedOrderCondition('orders', 'customers')}`,
    params: userParams(user, 3),
  };
}

function invoicesCountQuery(user, paymentStatus = null) {
  const statusClause = paymentStatus ? ' AND invoices.payment_status = ?' : '';

  if (isAdmin(user)) {
    return {
      query: `SELECT COUNT(*) AS total FROM invoices WHERE 1 = 1${statusClause}`,
      params: paymentStatus ? [paymentStatus] : [],
    };
  }

  return {
    query: `SELECT COUNT(*) AS total
      FROM invoices
      INNER JOIN orders ON orders.id = invoices.order_id
      INNER JOIN customers ON customers.id = orders.customer_id
      WHERE ${scopedInvoiceCondition('invoices', 'orders', 'customers')}${statusClause}`,
    params: paymentStatus ? [...userParams(user, 4), paymentStatus] : userParams(user, 4),
  };
}

function tasksCountQuery(user, status = null) {
  const statusClause = status ? ' AND status = ?' : '';

  if (isAdmin(user)) {
    return {
      query: `SELECT COUNT(*) AS total FROM tasks WHERE 1 = 1${statusClause}`,
      params: status ? [status] : [],
    };
  }

  return {
    query: `SELECT COUNT(*) AS total FROM tasks WHERE (created_by = ? OR assigned_to = ?)${statusClause}`,
    params: status ? [...userParams(user, 2), status] : userParams(user, 2),
  };
}

function revenueTotalQuery(user) {
  if (isAdmin(user)) {
    return {
      query: "SELECT COALESCE(SUM(amount), 0) AS total FROM payments WHERE status = 'Completed'",
      params: [],
    };
  }

  return {
    query: `SELECT COALESCE(SUM(payments.amount), 0) AS total
      FROM payments
      INNER JOIN invoices ON invoices.id = payments.invoice_id
      INNER JOIN orders ON orders.id = invoices.order_id
      INNER JOIN customers ON customers.id = orders.customer_id
      WHERE payments.status = 'Completed' AND ${scopedInvoiceCondition('invoices', 'orders', 'customers')}`,
    params: userParams(user, 4),
  };
}

async function getStats(user) {
  const db = getDatabase();
  const companiesQuery = companiesCountQuery(user);
  const customersQuery = customersCountQuery(user);
  const leadsQuery = leadsCountQuery(user);
  const productsQuery = productCountQuery(user);
  const ordersQuery = ordersCountQuery(user);
  const invoicesQuery = invoicesCountQuery(user);
  const paidInvoicesQuery = invoicesCountQuery(user, 'Paid');
  const unpaidInvoicesQuery = invoicesCountQuery(user, 'Unpaid');
  const tasksQuery = tasksCountQuery(user);
  const pendingTasksQuery = tasksCountQuery(user, 'Pending');
  const completedTasksQuery = tasksCountQuery(user, 'Completed');
  const revenueQuery = revenueTotalQuery(user);

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
    isAdmin(user) ? getSingleValue(db, 'SELECT COUNT(*) AS total FROM users', 'total') : Promise.resolve(1),
    getSingleValue(db, companiesQuery.query, 'total', companiesQuery.params),
    getSingleValue(db, customersQuery.query, 'total', customersQuery.params),
    getSingleValue(db, leadsQuery.query, 'total', leadsQuery.params),
    getSingleValue(db, productsQuery.query, 'total', productsQuery.params),
    getSingleValue(db, ordersQuery.query, 'total', ordersQuery.params),
    getSingleValue(db, invoicesQuery.query, 'total', invoicesQuery.params),
    getSingleValue(db, paidInvoicesQuery.query, 'total', paidInvoicesQuery.params),
    getSingleValue(db, unpaidInvoicesQuery.query, 'total', unpaidInvoicesQuery.params),
    getSingleValue(db, tasksQuery.query, 'total', tasksQuery.params),
    getSingleValue(db, pendingTasksQuery.query, 'total', pendingTasksQuery.params),
    getSingleValue(db, completedTasksQuery.query, 'total', completedTasksQuery.params),
    getSingleValue(db, revenueQuery.query, 'total', revenueQuery.params),
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

async function getRevenue(user) {
  const db = getDatabase();

  if (isAdmin(user)) {
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

  const [rows] = await db.execute(
    `SELECT DATE_FORMAT(payments.payment_date, '%Y-%m') AS month, COALESCE(SUM(payments.amount), 0) AS revenue
     FROM payments
     INNER JOIN invoices ON invoices.id = payments.invoice_id
     INNER JOIN orders ON orders.id = invoices.order_id
     INNER JOIN customers ON customers.id = orders.customer_id
     WHERE payments.status = 'Completed' AND ${scopedInvoiceCondition('invoices', 'orders', 'customers')}
     GROUP BY DATE_FORMAT(payments.payment_date, '%Y-%m')
     ORDER BY month ASC`,
    userParams(user, 4)
  );

  return rows.map((row) => ({
    month: row.month,
    revenue: Number(row.revenue),
  }));
}

async function getRecentActivities(user) {
  const db = getDatabase();

  if (isAdmin(user)) {
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

  const [rows] = await db.execute(
    `(SELECT 'Order' AS entity_type, orders.id AS entity_id, orders.order_number AS title, orders.status, orders.created_at
      FROM orders
      INNER JOIN customers ON customers.id = orders.customer_id
      WHERE ${scopedOrderCondition('orders', 'customers')})
     UNION ALL
     (SELECT 'Invoice' AS entity_type, invoices.id AS entity_id, invoices.invoice_number AS title, invoices.payment_status AS status, invoices.created_at
      FROM invoices
      INNER JOIN orders ON orders.id = invoices.order_id
      INNER JOIN customers ON customers.id = orders.customer_id
      WHERE ${scopedInvoiceCondition('invoices', 'orders', 'customers')})
     UNION ALL
     (SELECT 'Payment' AS entity_type, payments.id AS entity_id, CONCAT(payments.payment_method, ' payment') AS title, payments.status, payments.created_at
      FROM payments
      INNER JOIN invoices ON invoices.id = payments.invoice_id
      INNER JOIN orders ON orders.id = invoices.order_id
      INNER JOIN customers ON customers.id = orders.customer_id
      WHERE ${scopedInvoiceCondition('invoices', 'orders', 'customers')})
     UNION ALL
     (SELECT 'Task' AS entity_type, tasks.id AS entity_id, tasks.title, tasks.status, tasks.created_at
      FROM tasks
      WHERE tasks.created_by = ? OR tasks.assigned_to = ?)
     UNION ALL
     (SELECT 'Customer' AS entity_type, customers.id AS entity_id, CONCAT(customers.first_name, ' ', customers.last_name) AS title, customers.status, customers.created_at
      FROM customers
      WHERE ${scopedCustomerCondition('customers')})
     UNION ALL
     (SELECT 'Lead' AS entity_type, leads.id AS entity_id, CONCAT(leads.first_name, ' ', leads.last_name) AS title, leads.status, leads.created_at
      FROM leads
      WHERE ${scopedLeadCondition('leads')})
     ORDER BY created_at DESC
     LIMIT 20`,
    [
      ...userParams(user, 3),
      ...userParams(user, 4),
      ...userParams(user, 4),
      ...userParams(user, 2),
      ...userParams(user, 2),
      ...userParams(user, 2),
    ]
  );

  return rows;
}

module.exports = {
  getStats,
  getRevenue,
  getRecentActivities,
  isAdmin,
};
