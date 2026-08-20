import supabase from '../config/supabase.js';

export const ACTIVITY_WINDOW_MINUTES = 30;

/**
 * Build the inclusive server-side interval used for recent activity counts.
 *
 * @param {Date|string|number} [now=new Date()] Window end; must parse as a date.
 * @param {number} [windowMinutes=ACTIVITY_WINDOW_MINUTES] Positive window size.
 * @returns {{ windowMinutes: number, from: string, to: string }} ISO boundaries.
 * @throws {TypeError} When the end date or window size is invalid.
 */
export const buildActivityWindow = (
  now = new Date(),
  windowMinutes = ACTIVITY_WINDOW_MINUTES
) => {
  const end = now instanceof Date ? now : new Date(now);
  const endMs = end.getTime();

  if (!Number.isFinite(endMs)) throw new TypeError('now must be a valid date');
  if (!Number.isFinite(windowMinutes) || windowMinutes <= 0) {
    throw new TypeError('windowMinutes must be a positive number');
  }

  return {
    windowMinutes,
    from: new Date(endMs - windowMinutes * 60_000).toISOString(),
    to: new Date(endMs).toISOString(),
  };
};

const countEventsInWindow = async (
  supabaseClient,
  timestampColumn,
  from,
  to
) => {
  const { count, error } = await supabaseClient
    .from('parking')
    .select('parking_code', { count: 'exact', head: true })
    .gte(timestampColumn, from)
    .lte(timestampColumn, to);

  if (error) throw error;
  return count ?? 0;
};

/**
 * Counts vehicle movements in one shared, server-side time window.
 * A parking row may contribute twice: once when the vehicle entered and once
 * when it exited. Completed sessions therefore remain visible in the metric.
 */
export const getRecentParkingActivity = async ({
  supabaseClient = supabase,
  now = new Date(),
  windowMinutes = ACTIVITY_WINDOW_MINUTES,
} = {}) => {
  const window = buildActivityWindow(now, windowMinutes);

  const [entries, exits] = await Promise.all([
    countEventsInWindow(
      supabaseClient,
      'parking_date',
      window.from,
      window.to
    ),
    countEventsInWindow(
      supabaseClient,
      'retrieval_time',
      window.from,
      window.to
    ),
  ]);

  return {
    window_minutes: window.windowMinutes,
    from: window.from,
    to: window.to,
    entries,
    exits,
    total: entries + exits,
  };
};
