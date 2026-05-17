import dotenv from 'dotenv';
dotenv.config();

const num = (v, fallback) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};

export const BUSINESS = {
  MAX_PARKING_HOURS: num(process.env.MAX_PARKING_HOURS, 4),
  MAX_EXTENSION_HOURS: num(process.env.MAX_EXTENSION_HOURS, 4),
  MIN_FREE_PERCENT: num(process.env.MIN_FREE_PERCENT, 40),
  MIN_RESERVATION_HOURS_AHEAD: num(process.env.MIN_RESERVATION_HOURS_AHEAD, 24),
  MAX_RESERVATION_DAYS_AHEAD: num(process.env.MAX_RESERVATION_DAYS_AHEAD, 7),
  NO_SHOW_GRACE_MINUTES: num(process.env.NO_SHOW_GRACE_MINUTES, 15),
  MAX_DELAYS_BEFORE_CANCEL: num(process.env.MAX_DELAYS_BEFORE_CANCEL, 3),
  INSTALLER_OPERATION_SECONDS: num(process.env.INSTALLER_OPERATION_SECONDS, 20),
  TOTAL_PARKING_SPACES: num(process.env.TOTAL_PARKING_SPACES, 50),
};

export const JWT = {
  SECRET: process.env.JWT_SECRET || 'dev-secret-change-me',
  EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
};

export const APP = {
  PORT: num(process.env.PORT, 5000),
  NODE_ENV: process.env.NODE_ENV || 'development',
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5173',
};
