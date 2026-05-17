import { format, formatDistanceToNow } from 'date-fns';

export const formatDate = (date: string | Date | null | undefined): string => {
  if (!date) return '—';
  return format(new Date(date), 'dd/MM/yyyy');
};

export const formatDateTime = (
  date: string | Date | null | undefined
): string => {
  if (!date) return '—';
  return format(new Date(date), 'dd/MM/yyyy HH:mm');
};

export const formatTime = (date: string | Date | null | undefined): string => {
  if (!date) return '—';
  return format(new Date(date), 'HH:mm');
};

export const formatRelative = (
  date: string | Date | null | undefined
): string => {
  if (!date) return '—';
  return formatDistanceToNow(new Date(date), { addSuffix: true });
};

export const formatDuration = (minutes: number): string => {
  const h = Math.floor(minutes / 60);
  const m = Math.floor(minutes % 60);
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
};

export const formatCode = (code: number | string): string => {
  return String(code).padStart(6, '0');
};
