import axios, { AxiosError } from 'axios';
import { API_URL, STORAGE_KEYS } from '@/utils/constants';
import toast from 'react-hot-toast';

export const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30_000,
});

api.interceptors.request.use((config) => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.AUTH);
    if (raw) {
      const parsed = JSON.parse(raw);
      const token = parsed?.state?.token;
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
  } catch {
    /* swallow */
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ error?: string; message?: string }>) => {
    const status = error.response?.status;
    const apiMsg =
      error.response?.data?.error ||
      error.response?.data?.message ||
      error.message;

    if (status === 401) {
      const onLogin = window.location.pathname === '/login';
      localStorage.removeItem(STORAGE_KEYS.AUTH);
      if (!onLogin) {
        toast.error('Session expired. Please log in again.');
        window.location.href = '/login';
      }
    } else if (status === 403) {
      toast.error('You do not have permission to perform this action.');
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
