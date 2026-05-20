import supabase from '../config/supabase.js';
import { BUSINESS } from '../config/constants.js';
import {
  acquireInstaller,
  releaseInstaller,
} from '../services/installer.service.js';
import { pickFreeSpaceNow } from '../services/reservation.service.js';
import { generateConfirmationCode } from '../utils/codeGenerator.js';
import {
  sendDropOffCodeEmail,
  sendLostCodeEmail,
} from '../services/email.service.js';

const OPERATION_MS = BUSINESS.INSTALLER_OPERATION_SECONDS * 1000;
const MAX_TIME_MINUTES = BUSINESS.MAX_PARKING_HOURS * 60;
const MAX_EXTENSION_MINUTES = BUSINESS.MAX_EXTENSION_HOURS * 60;
const NO_SHOW_GRACE_MS = BUSINESS.NO_SHOW_GRACE_MINUTES * 60_000;

const fetchUserById = async (id) => {
  const { data } = await supabase
    .from('user')
    .select('id, first_name, last_name, email')
    .eq('id', id)
    .maybeSingle();
  return data;
};

/**
 * POST /api/parking/drop-off
 * Body: { confirmation_code?: number }
 *
 * Two flows:
 *   A. With reservation: confirmation_code is provided → reuse the reservation's
 *      code/space.
 *   B. Walk-in: no code → assign a free space NOW and generate a new code.
 *
 * Acquires an installer; the parking row is inserted immediately, but the
 * installer stays busy for INSTALLER_OPERATION_SECONDS to simulate the bay.
 *
 * Performance notes:
 *   - Independent reads run in parallel via Promise.all.
 *   - `releaseExpired()` is skipped on the hot path — the cron job handles it.
 *   - parking_space update + welcome email run AFTER the response (setImmediate)
 *     so the client gets its confirmation as fast as possible.
 */
export const dropOff = async (req, res, next) => {
  try {
    const subscriberNum = req.user.id;
    const { confirmation_code } = req.body;

    const { data: sub } = await supabase
      .from('subscriber')
      .select('subscriber_num, status')
      .eq('subscriber_num', subscriberNum)
      .maybeSingle();
    if (!sub) return res.status(404).json({ error: 'Subscriber not found' });
    if (sub.status === 'inactive') {
      return res.status(403).json({ error: 'Subscription is inactive' });
    }

    let spaceNumber;
    let codeToUse;
    let reservationRow = null;

    if (confirmation_code) {
      // Reservation + already-parked check run in parallel
      const [resQ, parkedQ] = await Promise.all([
        supabase
          .from('reservation')
          .select('*')
          .eq('confirmation_code', confirmation_code)
          .eq('status', 'active')
          .maybeSingle(),
        supabase
          .from('parking')
          .select('parking_code')
          .eq('confirmation_code', confirmation_code)
          .is('retrieval_time', null)
          .maybeSingle(),
      ]);
      if (resQ.error) throw resQ.error;
      if (parkedQ.error) throw parkedQ.error;

      const existingRes = resQ.data;
      if (!existingRes) {
        return res.status(404).json({
          error: 'No active reservation found for this code',
        });
      }
      if (existingRes.subscriber_num !== subscriberNum) {
        return res.status(403).json({
          error: 'This reservation belongs to a different subscriber',
        });
      }

      const startMs = new Date(existingRes.reservation_start).getTime();
      if (startMs - NO_SHOW_GRACE_MS > Date.now()) {
        return res.status(400).json({
          error: 'Too early — please arrive within 15 minutes of your reservation time',
        });
      }
      if (Date.now() > startMs + NO_SHOW_GRACE_MS) {
        return res.status(410).json({
          error: 'This reservation expired (no-show grace period elapsed)',
        });
      }
      if (parkedQ.data) {
        return res.status(409).json({
          error: 'A parking session is already active for this code',
        });
      }

      spaceNumber = existingRes.parking_space;
      codeToUse = existingRes.confirmation_code;
      reservationRow = existingRes;
    } else {
      // Walk-in: pick a space + generate code in parallel (independent).
      const [space, code] = await Promise.all([
        pickFreeSpaceNow(),
        generateConfirmationCode(),
      ]);
      spaceNumber = space.space_number;
      codeToUse = code;
    }

    const installer = await acquireInstaller();
    if (!installer) {
      const [totalRes, freeRes] = await Promise.all([
        supabase
          .from('installer')
          .select('installer_id', { count: 'exact', head: true }),
        supabase
          .from('installer')
          .select('installer_id', { count: 'exact', head: true })
          .eq('is_free', true),
      ]);
      return res.status(503).json({
        error: 'All installers are busy',
        code: 'NO_FREE_INSTALLER',
        queue: {
          total: totalRes.count || 0,
          free: freeRes.count || 0,
        },
      });
    }

    const { data: parking, error: parkErr } = await supabase
      .from('parking')
      .insert({
        parking_space: spaceNumber,
        parking_date: new Date().toISOString(),
        confirmation_code: codeToUse,
        subscriber_num: subscriberNum,
        max_time_minutes: MAX_TIME_MINUTES,
      })
      .select('*')
      .single();
    if (parkErr) {
      await releaseInstaller(installer.installer_id);
      throw parkErr;
    }

    setTimeout(() => {
      releaseInstaller(installer.installer_id).catch((e) =>
        console.error('[installer release error]', e)
      );
    }, OPERATION_MS);

    // Fire-and-forget: send response, then update the cached is_occupied flag
    // and email the code in the background. None of these block the client.
    setImmediate(() => {
      supabase
        .from('parking_space')
        .update({ is_occupied: true })
        .eq('space_number', spaceNumber)
        .then(({ error }) => {
          if (error) console.error('[parking_space update]', error);
        });

      if (!reservationRow) {
        fetchUserById(subscriberNum)
          .then((user) => {
            if (user) {
              return sendDropOffCodeEmail(user, {
                code: codeToUse,
                spaceNumber,
              });
            }
          })
          .catch((e) => console.error('[email] drop-off code:', e));
      }
    });

    return res.status(201).json({
      success: true,
      parking_code: parking.parking_code,
      space_number: spaceNumber,
      confirmation_code: codeToUse,
      installer: {
        id: installer.installer_id,
        name: installer.installer_name,
        completes_at: installer.busy_until,
      },
      operation_seconds: BUSINESS.INSTALLER_OPERATION_SECONDS,
      parked_at: parking.parking_date,
      max_time_minutes: MAX_TIME_MINUTES,
      had_reservation: !!reservationRow,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/parking/pick-up
 * Body: { confirmation_code: number }
 */
export const pickUp = async (req, res, next) => {
  try {
    const subscriberNum = req.user.id;
    const { confirmation_code } = req.body;

    const { data: parking, error: parkErr } = await supabase
      .from('parking')
      .select('*')
      .eq('confirmation_code', confirmation_code)
      .is('retrieval_time', null)
      .maybeSingle();
    if (parkErr) throw parkErr;
    if (!parking) {
      return res.status(404).json({
        error: 'No active parking session found for this code',
      });
    }
    if (parking.subscriber_num !== subscriberNum) {
      return res.status(403).json({
        error: 'This parking session belongs to a different subscriber',
      });
    }

    const elapsedMs = Date.now() - new Date(parking.parking_date).getTime();
    const elapsedMinutes = Math.floor(elapsedMs / 60_000);
    const overtimeMinutes = Math.max(
      0,
      elapsedMinutes - (parking.max_time_minutes || MAX_TIME_MINUTES)
    );

    const installer = await acquireInstaller();
    if (!installer) {
      return res.status(503).json({
        error: 'All installers are busy',
        code: 'NO_FREE_INSTALLER',
      });
    }

    const retrievalTime = new Date().toISOString();
    const { data: updated, error: updErr } = await supabase
      .from('parking')
      .update({ retrieval_time: retrievalTime })
      .eq('parking_code', parking.parking_code)
      .select('*')
      .single();
    if (updErr) {
      await releaseInstaller(installer.installer_id);
      throw updErr;
    }

    setTimeout(() => {
      releaseInstaller(installer.installer_id).catch((e) =>
        console.error('[installer release error]', e)
      );
    }, OPERATION_MS);

    // Free the space flag in the background — display-only cache, not blocking.
    setImmediate(() => {
      supabase
        .from('parking_space')
        .update({ is_occupied: false })
        .eq('space_number', parking.parking_space)
        .then(({ error }) => {
          if (error) console.error('[parking_space update]', error);
        });
    });

    return res.json({
      success: true,
      parking_code: updated.parking_code,
      space_number: updated.parking_space,
      retrieved_at: retrievalTime,
      installer: {
        id: installer.installer_id,
        name: installer.installer_name,
        completes_at: installer.busy_until,
      },
      operation_seconds: BUSINESS.INSTALLER_OPERATION_SECONDS,
      elapsed_minutes: elapsedMinutes,
      overtime_minutes: overtimeMinutes,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/parking/extend/:parkingCode
 * Body: { extra_minutes?: number }   default 60
 *
 * Caps total extension at MAX_EXTENSION_MINUTES (240).
 * Additionally refuses extensions that would push the parking past the
 * start of an active reservation on the same space — reservations have
 * priority over walk-in / extended sessions.
 */
export const extendParking = async (req, res, next) => {
  try {
    const subscriberNum = req.user.id;
    const parkingCode = Number(req.params.parkingCode);
    const extraMinutes = Number(req.body?.extra_minutes ?? 60);

    if (!Number.isFinite(parkingCode)) {
      return res.status(400).json({ error: 'Invalid parking code' });
    }
    if (!Number.isFinite(extraMinutes) || extraMinutes <= 0) {
      return res.status(400).json({ error: 'extra_minutes must be positive' });
    }

    const { data: parking, error: pErr } = await supabase
      .from('parking')
      .select('*')
      .eq('parking_code', parkingCode)
      .maybeSingle();
    if (pErr) throw pErr;
    if (!parking) return res.status(404).json({ error: 'Parking not found' });
    if (parking.subscriber_num !== subscriberNum) {
      return res.status(403).json({ error: 'Not your parking session' });
    }
    if (parking.retrieval_time) {
      return res.status(409).json({ error: 'Parking session already ended' });
    }

    const currentMax = parking.max_time_minutes || MAX_TIME_MINUTES;
    const currentExtension = currentMax - MAX_TIME_MINUTES;
    const remainingExtension = MAX_EXTENSION_MINUTES - currentExtension;
    if (remainingExtension <= 0) {
      return res.status(409).json({
        error: `Maximum extension (${MAX_EXTENSION_MINUTES} minutes) already used`,
      });
    }

    // How long would the session run if we granted the full request?
    const parkStart = new Date(parking.parking_date);
    const requestedMinutes = Math.min(extraMinutes, remainingExtension);
    const candidateEnd = new Date(
      parkStart.getTime() + (currentMax + requestedMinutes) * 60_000
    );

    // Find the next active reservation on this same space that starts AFTER
    // the current session start. That reservation has priority.
    const { data: blocking, error: blockErr } = await supabase
      .from('reservation')
      .select('reservation_id, reservation_start, confirmation_code')
      .eq('parking_space', parking.parking_space)
      .eq('status', 'active')
      .neq('confirmation_code', parking.confirmation_code)
      .gt('reservation_start', parkStart.toISOString())
      .order('reservation_start', { ascending: true })
      .limit(1)
      .maybeSingle();
    if (blockErr) throw blockErr;

    let minutesToAdd = requestedMinutes;
    let cappedByReservation = false;
    if (blocking) {
      const resStart = new Date(blocking.reservation_start);
      // We can extend up to (but not into) the reservation's start.
      const maxAllowedEnd = resStart.getTime();
      const currentEnd = parkStart.getTime() + currentMax * 60_000;
      const allowedAdd = Math.max(
        0,
        Math.floor((maxAllowedEnd - currentEnd) / 60_000)
      );
      if (candidateEnd.getTime() > maxAllowedEnd) {
        if (allowedAdd <= 0) {
          return res.status(409).json({
            error:
              'Cannot extend — another reservation starts on this space immediately after your session.',
            code: 'BLOCKED_BY_RESERVATION',
            reservation_start: blocking.reservation_start,
          });
        }
        minutesToAdd = Math.min(allowedAdd, remainingExtension);
        cappedByReservation = true;
      }
    }

    const newMax = currentMax + minutesToAdd;

    const { data: updated, error: upErr } = await supabase
      .from('parking')
      .update({
        max_time_minutes: newMax,
        extension_count: (parking.extension_count || 0) + 1,
      })
      .eq('parking_code', parkingCode)
      .select('*')
      .single();
    if (upErr) throw upErr;

    return res.json({
      success: true,
      parking: updated,
      minutes_added: minutesToAdd,
      remaining_extension_minutes: remainingExtension - minutesToAdd,
      capped_by_reservation: cappedByReservation,
      next_reservation_start: blocking?.reservation_start || null,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/parking/lost-code
 * Re-sends the active parking's confirmation_code by email.
 */
export const lostCode = async (req, res, next) => {
  try {
    const subscriberNum = req.user.id;

    const { data: parking, error } = await supabase
      .from('parking')
      .select('*')
      .eq('subscriber_num', subscriberNum)
      .is('retrieval_time', null)
      .order('parking_date', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    if (!parking) {
      return res
        .status(404)
        .json({ error: 'No active parking session found for your account' });
    }

    const user = await fetchUserById(subscriberNum);
    if (user) {
      await sendLostCodeEmail(user, {
        code: parking.confirmation_code,
        spaceNumber: parking.parking_space,
        parkingDate: parking.parking_date,
      });
    }

    return res.json({
      success: true,
      message: 'Code re-sent to your email',
      space_number: parking.parking_space,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/parking/my-history
 */
export const myHistory = async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('parking')
      .select('*')
      .eq('subscriber_num', req.user.id)
      .order('parking_date', { ascending: false });
    if (error) throw error;
    return res.json(data || []);
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/parking/active
 * For attendant/manager. Joins user + subscriber data for the row.
 */
export const listActiveParkings = async (_req, res, next) => {
  try {
    const { data: parkings, error } = await supabase
      .from('parking')
      .select('*')
      .is('retrieval_time', null)
      .order('parking_date', { ascending: false });
    if (error) throw error;

    const ids = [...new Set((parkings || []).map((p) => p.subscriber_num))];
    let usersById = {};
    let subsById = {};
    if (ids.length > 0) {
      const [{ data: users }, { data: subs }] = await Promise.all([
        supabase
          .from('user')
          .select('id, first_name, last_name, email, phone_number')
          .in('id', ids),
        supabase
          .from('subscriber')
          .select('subscriber_num, license_plate_number, status')
          .in('subscriber_num', ids),
      ]);
      usersById = Object.fromEntries((users || []).map((u) => [u.id, u]));
      subsById = Object.fromEntries(
        (subs || []).map((s) => [s.subscriber_num, s])
      );
    }

    const enriched = (parkings || []).map((p) => ({
      ...p,
      user: usersById[p.subscriber_num] || null,
      subscriber: subsById[p.subscriber_num] || null,
    }));
    return res.json(enriched);
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/parking/my-active
 * Returns the subscriber's current active parking session (if any).
 */
export const myActiveParking = async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('parking')
      .select('*')
      .eq('subscriber_num', req.user.id)
      .is('retrieval_time', null)
      .order('parking_date', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    return res.json(data || null);
  } catch (err) {
    next(err);
  }
};
