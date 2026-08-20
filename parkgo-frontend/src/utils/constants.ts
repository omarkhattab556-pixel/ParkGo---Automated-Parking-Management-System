/**
 * Cross-feature frontend configuration and shared business-rule mirrors.
 *
 * UI rules provide early feedback only; the backend remains authoritative and
 * must enforce the same limits for every request.
 */
export const APP_NAME = import.meta.env.VITE_APP_NAME || 'ParkGo';
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

/** Frontend mirrors used for validation, limits, and explanatory UI. */
export const BUSINESS_RULES = {
  MAX_PARKING_HOURS: 4,
  MAX_EXTENSION_HOURS: 4,
  MIN_FREE_PERCENT: 40,
  MIN_RESERVATION_HOURS_AHEAD: 24,
  MAX_RESERVATION_DAYS_AHEAD: 7,
  NO_SHOW_GRACE_MINUTES: 15,    // זה הזמן שבו המערכת תאפשר למשתמש להיכנס למקום חניה שהזמין, גם אם הגיע מאוחר מדי. אחרי זה, המערכת תסמן את ההזמנה כ"לא הופיע" ותחשב את זה כניסיון כושל.
  MAX_DELAYS_BEFORE_CANCEL: 3,
  INSTALLER_OPERATION_SECONDS: 20,
} as const;

/** Canonical post-login destination used by routing and auth workflows. */
export const ROLE_LANDING: Record<string, string> = {
  subscriber: '/subscriber',
  attendant: '/attendant',
  manager: '/manager',
};

/** Persisted keys shared by the auth store and the Axios token reader. */
export const STORAGE_KEYS = {
  AUTH: 'parkgo-auth',
} as const;
