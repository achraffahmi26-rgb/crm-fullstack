const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const routes = require('./routes');
const errorHandler = require('./middleware/errorHandler');
const config = require('./config');

const app = express();
const corsOptions = config.clientUrl ? { origin: config.clientUrl } : undefined;

app.use(helmet());
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

app.use('/api', routes);

app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    service: 'CRM Full-Stack API',
  });
});

app.use(errorHandler);

module.exports = app;
