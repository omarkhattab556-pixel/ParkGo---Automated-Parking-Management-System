import { APP } from '../config/constants.js';

export const notFound = (req, res) => {
  res.status(404).json({ error: 'Not Found', path: req.originalUrl });
};

export const errorHandler = (err, _req, res, _next) => {
  const status = err.status || err.statusCode || 500;
  const payload = {
    error: err.message || 'Internal Server Error',
  };
  if (err.code) payload.code = err.code;
  if (err.details) payload.details = err.details;
  if (APP.NODE_ENV !== 'production' && err.stack) {
    payload.stack = err.stack;
  }
  if (status >= 500) {
    console.error('[error]', err);
  }
  res.status(status).json(payload);
};
