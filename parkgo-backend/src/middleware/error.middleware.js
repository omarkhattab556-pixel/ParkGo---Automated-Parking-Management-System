import { APP } from '../config/constants.js';

/**
 * Final route fallback. Mount after all routers so unmatched requests receive
 * the API's consistent JSON 404 payload rather than Express' default response.
 */
export const notFound = (req, res) => {
  res.status(404).json({ error: 'Not Found', path: req.originalUrl });
};

/**
 * Terminal Express error handler.
 *
 * The HTTP status is read from `err.status` or `err.statusCode`; optional
 * machine-readable `code` and validation `details` are preserved. Stack traces
 * are returned outside production only, while server errors are always logged.
 */
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
