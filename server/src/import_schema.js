const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const config = require('./config');

(async () => {
  try {
    const filePath = path.resolve(__dirname, 'database', 'schema.sql');
    const sql = fs.readFileSync(filePath, 'utf8');

    const connection = await mysql.createConnection({
      host: config.db.host,
      port: config.db.port,
      user: config.db.user,
      password: config.db.password,
      multipleStatements: true,
    });

    await connection.query(sql);
    console.log('SCHEMA_IMPORTED');
    await connection.end();
  } catch (err) {
    console.error('SCHEMA_IMPORT_ERROR', err.message);
    process.exit(1);
  }
})();
