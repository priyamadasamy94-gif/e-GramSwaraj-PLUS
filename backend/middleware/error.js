const { nodeEnv } = require('../config/env');

function notFound(req, res) {
  res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.originalUrl}` });
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, _next) {
  let status = err.statusCode || 500;
  let message = err.message || 'Something went wrong';
  let errors;

  if (err.name === 'ValidationError' || err.name === 'SequelizeValidationError') {
    status = 400;
    errors = Array.isArray(err.errors)
      ? Object.fromEntries(err.errors.map((item) => [item.path, item.message]))
      : Object.fromEntries(Object.entries(err.errors).map(([k, v]) => [k, v.message]));
    message = Object.values(errors)[0] || 'Validation failed';
  } else if (err.name === 'CastError') {
    status = 400;
    message = `Invalid value for ${err.path}`;
  } else if (err.name === 'SequelizeUniqueConstraintError') {
    status = 409;
    const field = err.errors?.[0]?.path || 'field';
    message = `A record with this ${field} already exists`;
  } else if (err.type === 'entity.parse.failed') {
    status = 400;
    message = 'Malformed JSON body';
  }

  if (status >= 500) {
    console.error('[error]', err);
    if (nodeEnv === 'production') message = 'Internal server error';
  }
  const body = { success: false, message };
  if (errors) body.errors = errors;
  if (err.details) body.details = err.details;
  res.status(status).json(body);
}

module.exports = { notFound, errorHandler };
