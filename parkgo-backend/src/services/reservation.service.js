import supabase from '../config/supabase.js';
import { BUSINESS } from '../config/constants.js';

const PARKING_HOURS = BUSINESS.MAX_PARKING_HOURS;
const MIN_HOURS = BUSINESS.MIN_RESERVATION_HOURS_AHEAD;
const MAX_DAYS = BUSINESS.MAX_RESERVATION_DAYS_AHEAD;
const MIN_FREE_PCT = BUSINESS.MIN_FREE_PERCENT;

/**
 * The reservation window starts at `start` and ends `MAX_PARKING_HOURS` later.
 */
export const computeReservationWindow = (startIso) => {
  const start = new Date(startIso);
  const end = new Date(start.getTime() + PARKING_HOURS * 3600_000);
  return { start, end };
};

export const isValidReservationTime = (startIso) => {
  const start = new Date(startIso);
  if (Number.isNaN(start.getTime())) {
    return { ok: false, reason: 'Invalid date format' };
  }
  const diffHours = (start.getTime() - Date.now()) / 3600_000;
  if (diffHours < MIN_HOURS) {
    return { ok: false, reason: `Reservation must be at least ${MIN_HOURS} hours ahead` };
  }
  if (diffHours > MAX_DAYS * 24) {
    return { ok: false, reason: `Reservation cannot be more than ${MAX_DAYS} days ahead` };
  }
  return { ok: true };
};

/**
 * Returns:
 *   {
 *     totalSpaces, occupiedAtWindow, freeAtWindow,
 *     freePercent, ok: boolean, minFreePercent
 *   }
 *
 * "occupied at window" = active reservations that overlap [start, end)
 *                      + active parkings (no retrieval_time) whose parking_date < end
 *                      and (parking_date + max_time) > start.
 */
export const getAvailabilityAtWindow = async (startIso) => {
  const { start, end } = computeReservationWindow(startIso);

  const { count: totalSpaces, error: spaceErr } = await supabase
    .from('parking_space')
    .select('*', { count: 'exact', head: true });
  if (spaceErr) throw spaceErr;
  if (!totalSpaces || totalSpaces === 0) {
    return {
      totalSpaces: 0,
      occupiedAtWindow: 0,
      freeAtWindow: 0,
      freePercent: 0,
      minFreePercent: MIN_FREE_PCT,
      ok: false,
    };
  }

  // Reservations that overlap [start, end)
  // Two intervals overlap iff A.start < B.end AND A.end > B.start.
  const { data: overlappingRes, error: resErr } = await supabase
    .from('reservation')
    .select('parking_space, reservation_start, reservation_end')
    .eq('status', 'active')
    .lt('reservation_start', end.toISOString())
    .gt('reservation_end', start.toISOString());
  if (resErr) throw resErr;

  // Currently-active parkings (no retrieval_time yet)
  const { data: activeParkings, error: parkErr } = await supabase
    .from('parking')
    .select('parking_space, parking_date, max_time_minutes')
    .is('retrieval_time', null);
  if (parkErr) throw parkErr;

  const occupiedSpaces = new Set();
  (overlappingRes || []).forEach((r) => occupiedSpaces.add(r.parking_space));
  (activeParkings || []).forEach((p) => {
    const pStart = new Date(p.parking_date);
    const pEnd = new Date(pStart.getTime() + (p.max_time_minutes || 240) * 60_000);
    if (pStart < end && pEnd > start) {
      occupiedSpaces.add(p.parking_space);
    }
  });

  const occupied = occupiedSpaces.size;
  const free = totalSpaces - occupied;
  const freePercent = (free / totalSpaces) * 100;

  return {
    totalSpaces,
    occupiedAtWindow: occupied,
    freeAtWindow: free,
    freePercent,
    minFreePercent: MIN_FREE_PCT,
    ok: freePercent >= MIN_FREE_PCT,
  };
};

/**
 * Pick a random free parking space for the window [start, end).
 * Returns the space row or throws if none available.
 */
export const pickFreeSpaceForWindow = async (startIso) => {
  const { start, end } = computeReservationWindow(startIso);

  const { data: allSpaces, error: spErr } = await supabase
    .from('parking_space')
    .select('space_number, location');
  if (spErr) throw spErr;
  if (!allSpaces || allSpaces.length === 0) {
    const err = new Error('No parking spaces configured');
    err.status = 500;
    throw err;
  }

  const { data: overlappingRes, error: resErr } = await supabase
    .from('reservation')
    .select('parking_space')
    .eq('status', 'active')
    .lt('reservation_start', end.toISOString())
    .gt('reservation_end', start.toISOString());
  if (resErr) throw resErr;

  const { data: activeParkings, error: parkErr } = await supabase
    .from('parking')
    .select('parking_space, parking_date, max_time_minutes')
    .is('retrieval_time', null);
  if (parkErr) throw parkErr;

  const taken = new Set();
  (overlappingRes || []).forEach((r) => taken.add(r.parking_space));
  (activeParkings || []).forEach((p) => {
    const pStart = new Date(p.parking_date);
    const pEnd = new Date(pStart.getTime() + (p.max_time_minutes || 240) * 60_000);
    if (pStart < end && pEnd > start) taken.add(p.parking_space);
  });

  const free = allSpaces.filter((s) => !taken.has(s.space_number));
  if (free.length === 0) {
    const err = new Error('No free spaces for the requested window');
    err.status = 409;
    err.code = 'NO_FREE_SPACE';
    throw err;
  }

  return free[Math.floor(Math.random() * free.length)];
};

/**
 * Pick a free space _right now_ for walk-ins (no 40% rule).
 * Free = not currently occupied AND not under an active reservation that has already started.
 *
 * Runs the three independent SELECTs in parallel to minimise round-trip latency.
 */
export const pickFreeSpaceNow = async () => {
  const nowIso = new Date().toISOString();

  const [spacesRes, reservationsRes, parkingsRes] = await Promise.all([
    supabase.from('parking_space').select('space_number, location'),
    supabase
      .from('reservation')
      .select('parking_space')
      .eq('status', 'active')
      .lte('reservation_start', nowIso)
      .gt('reservation_end', nowIso),
    supabase
      .from('parking')
      .select('parking_space')
      .is('retrieval_time', null),
  ]);

  if (spacesRes.error) throw spacesRes.error;
  if (reservationsRes.error) throw reservationsRes.error;
  if (parkingsRes.error) throw parkingsRes.error;

  const allSpaces = spacesRes.data || [];
  if (allSpaces.length === 0) {
    const err = new Error('No parking spaces configured');
    err.status = 500;
    throw err;
  }

  const taken = new Set();
  (reservationsRes.data || []).forEach((r) => taken.add(r.parking_space));
  (parkingsRes.data || []).forEach((p) => taken.add(p.parking_space));

  const free = allSpaces.filter((s) => !taken.has(s.space_number));
  if (free.length === 0) {
    const err = new Error('No free parking spaces available');
    err.status = 409;
    err.code = 'NO_FREE_SPACE';
    throw err;
  }

  return free[Math.floor(Math.random() * free.length)];
};
