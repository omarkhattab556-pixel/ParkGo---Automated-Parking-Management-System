export const APP_NAME = import.meta.env.VITE_APP_NAME || 'ParkGo';
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const BUSINESS_RULES = {
  MAX_PARKING_HOURS: 4,
  MAX_EXTENSION_HOURS: 4,
  MIN_FREE_PERCENT: 40,
  MIN_RESERVATION_HOURS_AHEAD: 24,
  MAX_RESERVATION_DAYS_AHEAD: 7,
  NO_SHOW_GRACE_MINUTES: 15,
  MAX_DELAYS_BEFORE_CANCEL: 3,
  INSTALLER_OPERATION_SECONDS: 20,
} as const;

export const ROLE_LANDING: Record<string, string> = {
  subscriber: '/subscriber',
  attendant: '/attendant',
  manager: '/manager',
};

export const STORAGE_KEYS = {
  AUTH: 'parkgo-auth',
} as const;
