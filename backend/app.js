const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { corsOrigins, nodeEnv } = require('./config/env');
const api = require('./routes');
const { notFound, errorHandler } = require('./middleware/error');

const app = express();
app.disable('x-powered-by');
app.use(helmet());
app.use(cors({
  origin(origin, cb) {
    if (!origin || corsOrigins.includes('*') || corsOrigins.includes(origin)) return cb(null, true);
    return cb(new Error(`Origin ${origin} not allowed by CORS`));
  },
  credentials: true,
}));
app.use(express.json({ limit: '1mb' }));
if (nodeEnv !== 'test') app.use(morgan(nodeEnv === 'production' ? 'combined' : 'dev'));

app.get('/', (_req, res) => res.json({ success: true, message: 'E-GramSwaraj+ API — see /api/health' }));
app.use('/api', api);
app.use(notFound);
app.use(errorHandler);

module.exports = app;
