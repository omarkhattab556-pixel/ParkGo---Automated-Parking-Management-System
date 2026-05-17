import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import supabase from '../config/supabase.js';
import { JWT } from '../config/constants.js';

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

    const { data: user, error } = await supabase
      .from('user')
      .select('*')
      .eq('email', email.toLowerCase())
      .maybeSingle();

    if (error) throw error;
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
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
