import { formatDistanceToNow } from 'date-fns';

// All dates are stored as UTC (ISO) on the backend. We always render them in
// Israel time (Asia/Jerusalem) so the displayed time is correct regardless of
// the viewer's device timezone. Uses the native Intl API — no extra deps.
const TIME_ZONE = 'Asia/Jerusalem';

const dateFmt = new Intl.DateTimeFormat('en-GB', {
  timeZone: TIME_ZONE,
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

const dateTimeFmt = new Intl.DateTimeFormat('en-GB', {
  timeZone: TIME_ZONE,
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

const timeFmt = new Intl.DateTimeFormat('en-GB', {
  timeZone: TIME_ZONE,
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

export const formatDate = (date: string | Date | null | undefined): string => {
  if (!date) return '—';
  return dateFmt.format(new Date(date));
};

export const formatDateTime = (
  date: string | Date | null | undefined
): string => {
  if (!date) return '—';
  // en-GB renders as "dd/MM/yyyy, HH:mm" — drop the comma for a cleaner look.
  return dateTimeFmt.format(new Date(date)).replace(',', '');
};

export const formatTime = (date: string | Date | null | undefined): string => {
  if (!date) return '—';
  return timeFmt.format(new Date(date));
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

/**
 * Returns the UTC offset of Asia/Jerusalem, in minutes, for a given instant.
 * Positive means ahead of UTC (Israel is +120 in winter, +180 in summer/DST).
 */
function israelOffsetMinutes(at: Date): number {
  // Format the instant as it appears in Israel, then read it back as if it were
  // UTC — the difference between the two is the zone's offset at that instant.
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(at);
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value);
  let hour = get('hour');
  if (hour === 24) hour = 0; // some engines emit "24" for midnight
  const asUtc = Date.UTC(
    get('year'),
    get('month') - 1,
    get('day'),
    hour,
    get('minute'),
    get('second')
  );
  return Math.round((asUtc - at.getTime()) / 60_000);
}

/**
 * Converts an Israel wall-clock date + time (e.g. "2026-07-17" + "17:15",
 * as the user typed it) into the correct UTC ISO instant for storage —
 * regardless of the device's own timezone. This guarantees a reservation for
 * 17:15 in Israel is always stored as 17:15 Israel time, even if the browser
 * is set to UTC or another zone.
 */
export const israelWallClockToUtcIso = (
  dateStr: string,
  timeStr: string
): string | null => {
  const [y, mo, d] = dateStr.split('-').map(Number);
  const [h, mi] = timeStr.split(':').map(Number);
  if ([y, mo, d, h, mi].some((n) => Number.isNaN(n))) return null;

  // First guess: treat the wall-clock as if it were UTC.
  const utcGuess = Date.UTC(y, mo - 1, d, h, mi, 0);
  // Correct by Israel's offset at that instant (DST-aware).
  const offset = israelOffsetMinutes(new Date(utcGuess));
  return new Date(utcGuess - offset * 60_000).toISOString();
};
