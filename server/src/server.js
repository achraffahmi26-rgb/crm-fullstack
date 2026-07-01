const dotenv = require('dotenv');
const app = require('./app');
const { connectDatabase } = require('./database/connection');
const config = require('./config');

dotenv.config();

const RETRY_DELAY_MS = 5000;
const PORT = config.port;

function wait(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function logDatabaseStartupError(error) {
  console.error(
    `Unable to connect to MySQL at ${config.db.host}:${config.db.port}/${config.db.database}. ` +
      `Retrying in ${RETRY_DELAY_MS / 1000}s. Error: ${error.message}`
  );
}

async function init() {
  while (true) {
    try {
      await connectDatabase();
      app.listen(PORT, () => {
        console.log(`Server running in ${config.nodeEnv} mode on port ${PORT}`);
      });
      return;
    } catch (error) {
      logDatabaseStartupError(error);
      await wait(RETRY_DELAY_MS);
    }
  }
}

init();
