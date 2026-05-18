import supabase from '../config/supabase.js';
import {
  isValidReservationTime,
  getAvailabilityAtWindow,
  pickFreeSpaceForWindow,
} from '../services/reservation.service.js';
import { generateConfirmationCode } from '../utils/codeGenerator.js';
import { sendReservationCodeEmail } from '../services/email.service.js';

const fetchUserById = async (id) => {
  const { data } = await supabase
    .from('user')
    .select('id, first_name, last_name, email, phone_number, user_type')
    .eq('id', id)
    .maybeSingle();
  return data;
};

/**
 * POST /api/reservations
 * Subscriber creates a reservation.
 */
export const createReservation = async (req, res, next) => {
  try {
    const subscriberNum = req.user.id;
    const { reservation_start } = req.body;

    const window = isValidReservationTime(reservation_start);
    if (!window.ok) {
      return res.status(400).json({ error: window.reason });
    }

    const { data: sub } = await supabase
      .from('subscriber')
      .select('subscriber_num, status')
      .eq('subscriber_num', subscriberNum)
      .maybeSingle();
    if (!sub) return res.status(404).json({ error: 'Subscriber not found' });
    if (sub.status === 'inactive') {
      return res.status(403).json({ error: 'Subscription is inactive' });
    }

    const availability = await getAvailabilityAtWindow(reservation_start);
    if (!availability.ok) {
      return res.status(409).json({
        error: `Only ${availability.freePercent.toFixed(0)}% spaces will be free at that time — at least ${availability.minFreePercent}% required.`,
        code: 'INSUFFICIENT_AVAILABILITY',
        availability,
      });
    }

    const space = await pickFreeSpaceForWindow(reservation_start);
    const code = await generateConfirmationCode();

    const { data: inserted, error: insertErr } = await supabase
      .from('reservation')
      .insert({
        subscriber_num: subscriberNum,
        parking_space: space.space_number,
        reservation_start: new Date(reservation_start).toISOString(),
        confirmation_code: code,
        status: 'active',
      })
      .select('*')
      .single();
    if (insertErr) throw insertErr;

    const user = await fetchUserById(subscriberNum);
    if (user) {
      sendReservationCodeEmail(user, {
        code,
        spaceNumber: space.space_number,
        reservationStart: inserted.reservation_start,
      }).catch((e) => console.error('[email] reservation code:', e));
    }

    return res.status(201).json({
      reservation: inserted,
      confirmation_code: code,
      space_number: space.space_number,
      reservation_start: inserted.reservation_start,
      reservation_end: inserted.reservation_end,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/reservations/check-availability
 * Lightweight check (does NOT create a reservation).
 */
export const checkAvailability = async (req, res, next) => {
  try {
    const { reservation_start } = req.body;
    const window = isValidReservationTime(reservation_start);
    if (!window.ok) {
      return res.status(200).json({
        ok: false,
        reason: window.reason,
      });
    }
    const availability = await getAvailabilityAtWindow(reservation_start);
    return res.json(availability);
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/reservations/my
 * Subscriber's own reservations (most recent first).
 */
export const myReservations = async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('reservation')
      .select('*')
      .eq('subscriber_num', req.user.id)
      .order('reservation_start', { ascending: false });
    if (error) throw error;
    return res.json(data || []);
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/reservations
 * For attendants/managers — all reservations.
 */
export const listReservations = async (_req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('reservation')
      .select('*, "user":subscriber!subscriber_num(*, user_info:subscriber_num)')
      .order('reservation_start', { ascending: false })
      .limit(500);
    if (error) throw error;
    return res.json(data || []);
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/reservations/:id/cancel
 */
export const cancelReservation = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ error: 'Invalid id' });

    const { data: existing, error: fetchErr } = await supabase
      .from('reservation')
      .select('*')
      .eq('reservation_id', id)
      .maybeSingle();
    if (fetchErr) throw fetchErr;
    if (!existing) return res.status(404).json({ error: 'Reservation not found' });

    const isOwner = existing.subscriber_num === req.user.id;
    const isStaff = ['attendant', 'manager'].includes(req.user.user_type);
    if (!isOwner && !isStaff) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    if (existing.status === 'cancelled') {
      return res.status(409).json({ error: 'Reservation already cancelled' });
    }

    const { data: parking } = await supabase
      .from('parking')
      .select('parking_code')
      .eq('confirmation_code', existing.confirmation_code)
      .is('retrieval_time', null)
      .maybeSingle();
    if (parking) {
      return res.status(409).json({
        error: 'Cannot cancel — a parking session is active under this reservation',
      });
    }

    const { data: updated, error: updateErr } = await supabase
      .from('reservation')
      .update({ status: 'cancelled' })
      .eq('reservation_id', id)
      .select('*')
      .single();
    if (updateErr) throw updateErr;

    return res.json(updated);
  } catch (err) {
    next(err);
  }
};
