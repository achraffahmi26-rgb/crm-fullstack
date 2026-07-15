const dotenv = require('dotenv');

dotenv.config();

function requireEnv(name) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} is required. Set it in server/.env before starting the backend.`);
  }

  return value;
}

module.exports = {
  port: parseInt(process.env.PORT, 10) || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  jwtSecret: requireEnv('JWT_SECRET'),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1d',
  clientUrl: process.env.CLIENT_URL || process.env.CORS_ORIGIN || '',
  db: {
    host: process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT, 10) || 3306,
    database: process.env.DB_DATABASE || 'crm_pro',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT, 10) || 10,
  },
};
