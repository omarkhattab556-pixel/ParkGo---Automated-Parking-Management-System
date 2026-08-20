/**
 * Shared HTTP boundary for the frontend.
 *
 * Requests receive the persisted bearer token, while responses centralise
 * session expiry and transport-level notifications. Rejections are normalised
 * to a small API error object so hooks do not depend on Axios internals.
 */
import axios, { AxiosError } from 'axios';
import { API_URL, STORAGE_KEYS } from '@/utils/constants';
import toast from 'react-hot-toast';

export const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30_000,
});

// Zustand persist stores auth data inside a `{ state: ... }` envelope. Keep
// this reader aligned with authStore's persisted slice; malformed storage is
// treated as an unauthenticated request.
api.interceptors.request.use((config) => { // Before each request goes out to the backend, Axios runs this code.
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.AUTH);
    if (raw) {
      const parsed = JSON.parse(raw);
      const token = parsed?.state?.token;
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;  //וככה ה־Backend יודע מי המשתמש.
      }
    }
  } catch {
    /* swallow */
  }
  return config;
});

// Global handlers cover errors shared by every feature. The rejected value
// below deliberately exposes the backend payload plus status/message only.
api.interceptors.response.use(             // כל Error שעובר דרך Axios מגיע לנקודה מרכזית אחת.
  (response) => response,
  (error: AxiosError<{ error?: string; message?: string }>) => {
    const status = error.response?.status;
    const apiMsg =
      error.response?.data?.error ||
      error.response?.data?.message ||
      error.message;

    if (status === 401) {                        // Token invalid,Token expired, Not authenticated
      const onLogin = window.location.pathname === '/login';
      localStorage.removeItem(STORAGE_KEYS.AUTH);
      if (!onLogin) {
        // A hard redirect discards router and query state tied to the expired session.
        toast.error('Session expired. Please log in again.'); // הודעת שגיאה למשתמש
        window.location.href = '/login';
      }
    } else if (status === 403) {
      toast.error('You do not have permission to perform this action.'); // אין הרשאה לבצע את הפעולה הזו
    } else if (status && status >= 500) {
      toast.error('Server error. Please try again shortly.');
    } else if (!status) {
      toast.error('Network error. Check your connection.');
    }

    return Promise.reject(
      error.response?.data
        ? { ...error.response.data, status, message: apiMsg }
        : { message: apiMsg, status }
    );
  }
);

export default api;
