const mysql = require('mysql2/promise');
const config = require('../config');

let pool;

async function connectDatabase() {
  if (pool) {
    return pool;
  }

  const nextPool = mysql.createPool({
    host: config.db.host,
    port: config.db.port,
    database: config.db.database,
    user: config.db.user,
    password: config.db.password,
    waitForConnections: true,
    connectionLimit: config.db.connectionLimit,
    queueLimit: 0,
    decimalNumbers: true,
  });

  const connection = await nextPool.getConnection();
  connection.release();

  pool = nextPool;
  console.log('Connected to MySQL database.');

  return pool;
}

function getDatabase() {
  if (!pool) {
    throw new Error('Database connection has not been initialized.');
  }
  return pool;
}

module.exports = {
  connectDatabase,
  getDatabase,
};
