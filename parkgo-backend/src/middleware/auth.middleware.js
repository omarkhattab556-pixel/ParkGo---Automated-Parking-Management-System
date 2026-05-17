import jwt from 'jsonwebtoken';
import { JWT } from '../config/constants.js';

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
