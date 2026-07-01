const mysql = require('mysql2/promise');
const config = require('./config');

(async () => {
  try {
    const conn = await mysql.createConnection({
      host: config.db.host,
      port: config.db.port,
      user: config.db.user,
      password: config.db.password,
      database: config.db.database,
    });

    const [rows] = await conn.query(
      'SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?',
      [config.db.database, 'users']
    );

    console.log(rows.length ? 'TABLE_USERS_EXISTS' : 'TABLE_USERS_MISSING');
    await conn.end();
  } catch (err) {
    console.error('SCHEMA_CHECK_ERROR', err.message);
    process.exit(1);
  }
})();
