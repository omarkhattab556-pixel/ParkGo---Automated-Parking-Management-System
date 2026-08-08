import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import supabase from '../config/supabase.js';
import { JWT } from '../config/constants.js';
import {
  checkLoginAllowed,
  recordFailedLogin,
  clearLoginAttempts,
} from '../services/loginAttempts.service.js';

const stripPassword = (u) => {
  if (!u) return u;
  const { password: _pw, ...rest } = u;
  return rest;
};

const signToken = (user) =>
  jwt.sign(
    { id: user.id, email: user.email, user_type: user.user_type },
    JWT.SECRET,
    { expiresIn: JWT.EXPIRES_IN }
  );

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const ip = req.ip;
    const userAgent = req.get('user-agent');

    // Brute-force gate: refuse before touching the database or bcrypt, so a
    // locked-out attacker costs us nothing.
    const blocked = checkLoginAllowed({ email, ip });
    if (blocked) {
      const minutes = Math.ceil(blocked.retryAfterSeconds / 60);
      res.setHeader('Retry-After', String(blocked.retryAfterSeconds));
      return res.status(429).json({
        error:
          blocked.scope === 'account'
            ? `Too many failed sign-in attempts. This account is temporarily locked. Please try again in ${minutes} minute${minutes === 1 ? '' : 's'}. We have emailed the account owner a security alert.`
            : `Too many failed sign-in attempts from this device. Please try again in ${minutes} minute${minutes === 1 ? '' : 's'}.`,
        code: 'ACCOUNT_LOCKED',
        retry_after_seconds: blocked.retryAfterSeconds,
      });
    }

    const { data: user, error } = await supabase
      .from('user')
      .select('*')
      .eq('email', email.toLowerCase())
      .maybeSingle();

    if (error) throw error;

    // Unknown email and wrong password are handled identically — same status,
    // same message, same counter — so the response can't be used to discover
    // which emails are registered.
    if (!user || !(await bcrypt.compare(password, user.password))) {
      const result = recordFailedLogin({ email, ip, user: user || null, userAgent });

      if (result.locked) {
        const minutes = Math.ceil(result.retryAfterSeconds / 60);
        res.setHeader('Retry-After', String(result.retryAfterSeconds));
        return res.status(429).json({
          error: `Too many failed sign-in attempts. This account is temporarily locked for ${minutes} minute${minutes === 1 ? '' : 's'}. A security alert has been emailed to the account owner.`,
          code: 'ACCOUNT_LOCKED',
          retry_after_seconds: result.retryAfterSeconds,
        });
      }

      return res.status(401).json({
        error: 'Invalid email or password',
        code: 'INVALID_CREDENTIALS',
        remaining_attempts: result.remainingAttempts,
      });
    }

    if (user.user_type === 'subscriber') {
      const { data: sub } = await supabase
        .from('subscriber')
        .select('status')
        .eq('subscriber_num', user.id)
        .maybeSingle();
      if (sub && sub.status === 'inactive') {
        return res.status(403).json({
          error:
            'Your subscription has been cancelled. Please contact an attendant.',
        });
      }
    }

    // Credentials verified — wipe the failure streak for this account.
    clearLoginAttempts({ email, ip });

    const token = signToken(user);
    return res.json({ token, user: stripPassword(user) });
  } catch (err) {
    next(err);
  }
};

export const me = async (req, res, next) => {
  try {
    const { data: user, error } = await supabase
      .from('user')
      .select('*')
      .eq('id', req.user.id)
      .maybeSingle();

    if (error) throw error;
    if (!user) return res.status(404).json({ error: 'User not found' });

    return res.json(stripPassword(user));
  } catch (err) {
    next(err);
  }
};

export const logout = (_req, res) => {
  // JWT is stateless — client just drops the token. Endpoint exists for symmetry.
  return res.json({ success: true });
};
