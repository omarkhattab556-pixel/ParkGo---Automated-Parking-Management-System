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
};

// Pricing model (all amounts in ILS / ₪). Uniform hourly tariff: every started
// hour of parking is billed at HOURLY_RATE. Hours beyond the standard maximum
// (i.e. the extended portion) are additionally surfaced as "extension cost" for
// transparency, but billed at the same hourly rate. A flat LATE_FINE is charged
// per recorded late return, and every active subscriber pays a monthly
// SUBSCRIPTION_FEE. Billing resets each calendar month.
export const PRICING = {
  CURRENCY: process.env.CURRENCY || 'ILS',
  HOURLY_RATE: num(process.env.HOURLY_RATE, 50),
  LATE_FINE: num(process.env.LATE_FINE, 200),
  SUBSCRIPTION_FEE: num(process.env.SUBSCRIPTION_FEE, 150),
};

export const JWT = {
  SECRET: process.env.JWT_SECRET || 'dev-secret-change-me',
  EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
};

// Brute-force protection for POST /api/auth/login. Two tracks: a per-account
// lockout (stops someone guessing one specific account's password) and a
// broader per-IP lockout (stops credential stuffing across many accounts).
// Repeat lockouts on the same account back off exponentially up to MAX_LOCKOUT.
export const SECURITY = {
  // Consecutive failures on one email before that account is locked.
  MAX_LOGIN_ATTEMPTS: num(process.env.MAX_LOGIN_ATTEMPTS, 3),
  // A failure streak older than this is forgotten (a genuine user who mistyped
  // once last week starts from a clean slate).
  ATTEMPT_WINDOW_MS: num(process.env.LOGIN_ATTEMPT_WINDOW_MINUTES, 15) * 60_000,
  // Base lockout, doubled per repeat lockout, capped at MAX_LOCKOUT_MS.
  LOCKOUT_MS: num(process.env.LOGIN_LOCKOUT_MINUTES, 15) * 60_000,
  MAX_LOCKOUT_MS: num(process.env.LOGIN_MAX_LOCKOUT_MINUTES, 120) * 60_000,
  // Per-IP track — deliberately looser, since one IP may legitimately be a
  // shared office NAT with several users behind it.
  MAX_IP_ATTEMPTS: num(process.env.MAX_LOGIN_ATTEMPTS_PER_IP, 15),
  IP_WINDOW_MS: num(process.env.LOGIN_IP_WINDOW_MINUTES, 15) * 60_000,
  IP_LOCKOUT_MS: num(process.env.LOGIN_IP_LOCKOUT_MINUTES, 30) * 60_000,
};

// Google Gemini config for the ParkGo assistant chatbot. The API key lives on
// the backend only — the frontend never talks to Google directly, it proxies
// through POST /api/chat. When ENABLED is false the endpoint returns a friendly
// 503 instead of crashing, so the app still boots without a key configured.
export const GEMINI = {
  API_KEY: process.env.GEMINI_API_KEY || '',
  MODEL: process.env.GEMINI_MODEL || 'gemini-3.1-flash-lite',//Gemini 2.5 Flash
  ENABLED: !!process.env.GEMINI_API_KEY,
};

// Origins always allowed, even if FRONTEND_URL is unset on the host.
const DEFAULT_ORIGINS = [
  'https://parkgo-frontend.onrender.com',
  'http://localhost:5173',
  'http://localhost:3000',
];

// FRONTEND_URL may be a single URL or a comma-separated list.
const envOrigins = (process.env.FRONTEND_URL || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

export const APP = {
  PORT: num(process.env.PORT, 5000),
  NODE_ENV: process.env.NODE_ENV || 'development',
  // Primary frontend URL (used for logging / email links).
  FRONTEND_URL: envOrigins[0] || DEFAULT_ORIGINS[0],
  // Full allow-list used by CORS.
  CORS_ORIGINS: Array.from(new Set([...envOrigins, ...DEFAULT_ORIGINS])),
};
