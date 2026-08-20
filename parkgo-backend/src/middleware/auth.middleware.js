import jwt from 'jsonwebtoken';
import { JWT } from '../config/constants.js';

/**
 * Authenticate an Express request using an `Authorization: Bearer <token>` JWT.
 * On success, `req.user` contains only `{ id, email, user_type }` from the
 * verified token and downstream handlers may apply role or ownership checks.
 * This middleware validates token claims only; it does not reload the user or
 * subscription from the database. Missing, malformed, expired and invalid
 * tokens terminate the request with HTTP 401.
 */
export const authenticate = (req, res, next) => {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ error: 'Missing or malformed token' });
  }

  try {
    const decoded = jwt.verify(token, JWT.SECRET);
    req.user = {
      id: decoded.id,
      email: decoded.email,
      user_type: decoded.user_type,
    };
    next();
  } catch (err) {
    const msg = err.name === 'TokenExpiredError' ? 'Token expired' : 'Invalid token';
    return res.status(401).json({ error: msg });
  }
};
