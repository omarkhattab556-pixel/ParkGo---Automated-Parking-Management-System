import bcrypt from 'bcryptjs';
import supabase from '../config/supabase.js';
import { sendWelcomeEmail } from '../services/email.service.js';

const stripPassword = (u) => {
  if (!u) return u;
  const { password: _pw, ...rest } = u;
  return rest;
};

/**
 * POST /api/subscribers
 * Attendant registers a new subscriber.
 * Body: { first_name, last_name, email, phone_number, license_plate, password }
 */
export const registerSubscriber = async (req, res, next) => {
  try {
    const {
      first_name,
      last_name,
      email,
      phone_number,
      license_plate,
      password,
    } = req.body;

    const normalizedEmail = email.toLowerCase();

    const { data: existing } = await supabase
      .from('user')
      .select('id')
      .eq('email', normalizedEmail)
      .maybeSingle();
    if (existing) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const hashed = await bcrypt.hash(password, 10);

    const { data: newUser, error: insertUserErr } = await supabase
      .from('user')
      .insert({
        first_name,
        last_name,
        email: normalizedEmail,
        password: hashed,
        phone_number: phone_number || null,
        user_type: 'subscriber',
      })
      .select('*')
      .single();
    if (insertUserErr) throw insertUserErr;

    const { data: newSub, error: insertSubErr } = await supabase
      .from('subscriber')
      .insert({
        subscriber_num: newUser.id,
        license_plate_number: license_plate || null,
        status: 'active',
        delay_count: 0,
      })
      .select('*')
      .single();
    if (insertSubErr) {
      // best-effort cleanup
      await supabase.from('user').delete().eq('id', newUser.id);
      throw insertSubErr;
    }

    sendWelcomeEmail(newUser, password).catch((e) =>
      console.error('[email] welcome:', e)
    );

    return res.status(201).json({
      success: true,
      user: stripPassword(newUser),
      subscriber: newSub,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/subscribers
 * Attendant/manager — list all subscribers with their user info.
 */
export const listSubscribers = async (_req, res, next) => {
  try {
    const { data: users, error: uErr } = await supabase
      .from('user')
      .select('id, first_name, last_name, email, phone_number, user_type')
      .eq('user_type', 'subscriber')
      .order('id', { ascending: false });
    if (uErr) throw uErr;

    const ids = (users || []).map((u) => u.id);
    let subsByNum = {};
    if (ids.length > 0) {
      const { data: subs, error: sErr } = await supabase
        .from('subscriber')
        .select('*')
        .in('subscriber_num', ids);
      if (sErr) throw sErr;
      subsByNum = Object.fromEntries((subs || []).map((s) => [s.subscriber_num, s]));
    }

    const merged = (users || []).map((u) => ({
      ...u,
      subscriber: subsByNum[u.id] || null,
    }));
    return res.json(merged);
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/subscribers/:id
 * Returns user + subscriber + their reservations & parkings.
 */
export const getSubscriberDetail = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ error: 'Invalid id' });

    const { data: user, error: uErr } = await supabase
      .from('user')
      .select('id, first_name, last_name, email, phone_number, user_type')
      .eq('id', id)
      .maybeSingle();
    if (uErr) throw uErr;
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (user.user_type !== 'subscriber') {
      return res.status(400).json({ error: 'Not a subscriber' });
    }

    const [{ data: sub }, { data: reservations }, { data: parkings }] =
      await Promise.all([
        supabase
          .from('subscriber')
          .select('*')
          .eq('subscriber_num', id)
          .maybeSingle(),
        supabase
          .from('reservation')
          .select('*')
          .eq('subscriber_num', id)
          .order('reservation_start', { ascending: false })
          .limit(50),
        supabase
          .from('parking')
          .select('*')
          .eq('subscriber_num', id)
          .order('parking_date', { ascending: false })
          .limit(50),
      ]);

    return res.json({
      user,
      subscriber: sub,
      reservations: reservations || [],
      parkings: parkings || [],
    });
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/subscribers/:id/reactivate
 * Attendant resets delay_count and sets status='active'.
 */
export const reactivateSubscriber = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ error: 'Invalid id' });

    const { data: updated, error } = await supabase
      .from('subscriber')
      .update({ status: 'active', delay_count: 0 })
      .eq('subscriber_num', id)
      .select('*')
      .maybeSingle();
    if (error) throw error;
    if (!updated) return res.status(404).json({ error: 'Subscriber not found' });
    return res.json({ success: true, subscriber: updated });
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/subscribers/:id/deactivate
 * Manager cancels a subscription. Refuses if the subscriber has an active
 * parking session or any non-cancelled reservations — those must clear first.
 */
export const deactivateSubscriber = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ error: 'Invalid id' });

    const [{ data: activeParking }, { data: activeReservations }] =
      await Promise.all([
        supabase
          .from('parking')
          .select('parking_code')
          .eq('subscriber_num', id)
          .is('retrieval_time', null)
          .limit(1)
          .maybeSingle(),
        supabase
          .from('reservation')
          .select('reservation_id')
          .eq('subscriber_num', id)
          .eq('status', 'active'),
      ]);

    if (activeParking) {
      return res.status(409).json({
        error: 'Cannot cancel — subscriber has an active parking session.',
        code: 'ACTIVE_PARKING',
      });
    }

    // Cancel any active reservations first so spaces are freed up.
    if (activeReservations && activeReservations.length > 0) {
      const ids = activeReservations.map((r) => r.reservation_id);
      const { error: cancelErr } = await supabase
        .from('reservation')
        .update({ status: 'cancelled' })
        .in('reservation_id', ids);
      if (cancelErr) throw cancelErr;
    }

    const { data: updated, error } = await supabase
      .from('subscriber')
      .update({ status: 'inactive' })
      .eq('subscriber_num', id)
      .select('*')
      .maybeSingle();
    if (error) throw error;
    if (!updated) return res.status(404).json({ error: 'Subscriber not found' });

    return res.json({
      success: true,
      subscriber: updated,
      cancelled_reservations: activeReservations?.length || 0,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/subscribers/attendant
 * Manager creates a new attendant account. Same shape as a subscriber but
 * user_type='attendant' and NO subscriber row is created.
 */
export const registerAttendant = async (req, res, next) => {
  try {
    const { first_name, last_name, email, phone_number, password } = req.body;

    const normalizedEmail = email.toLowerCase();
    const { data: existing } = await supabase
      .from('user')
      .select('id')
      .eq('email', normalizedEmail)
      .maybeSingle();
    if (existing) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const hashed = await bcrypt.hash(password, 10);
    const { data: newUser, error: insertErr } = await supabase
      .from('user')
      .insert({
        first_name,
        last_name,
        email: normalizedEmail,
        password: hashed,
        phone_number: phone_number || null,
        user_type: 'attendant',
      })
      .select('*')
      .single();
    if (insertErr) throw insertErr;

    sendWelcomeEmail(newUser, password).catch((e) =>
      console.error('[email] welcome (attendant):', e)
    );

    return res.status(201).json({
      success: true,
      user: stripPassword(newUser),
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/subscribers/me/profile  (subscriber)
 */
export const myProfile = async (req, res, next) => {
  try {
    const id = req.user.id;

    const [{ data: user }, { data: sub }] = await Promise.all([
      supabase.from('user').select('*').eq('id', id).maybeSingle(),
      supabase
        .from('subscriber')
        .select('*')
        .eq('subscriber_num', id)
        .maybeSingle(),
    ]);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const { count: totalParkings } = await supabase
      .from('parking')
      .select('parking_code', { count: 'exact', head: true })
      .eq('subscriber_num', id);

    const { count: totalReservations } = await supabase
      .from('reservation')
      .select('reservation_id', { count: 'exact', head: true })
      .eq('subscriber_num', id);

    const { count: activeReservations } = await supabase
      .from('reservation')
      .select('reservation_id', { count: 'exact', head: true })
      .eq('subscriber_num', id)
      .eq('status', 'active');

    return res.json({
      user: stripPassword(user),
      subscriber: sub,
      stats: {
        total_parkings: totalParkings || 0,
        total_reservations: totalReservations || 0,
        active_reservations: activeReservations || 0,
        delay_count: sub?.delay_count || 0,
        status: sub?.status || 'active',
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/subscribers/:id  (subscriber updates own details)
 */
export const updateOwnDetails = async (req, res, next) => {
  try {
    const targetId = Number(req.params.id);
    if (targetId !== req.user.id) {
      return res.status(403).json({ error: 'You can only update your own details' });
    }

    const { current_password, license_plate, phone_number, new_password } =
      req.body;

    const { data: user, error: uErr } = await supabase
      .from('user')
      .select('*')
      .eq('id', targetId)
      .maybeSingle();
    if (uErr) throw uErr;
    if (!user) return res.status(404).json({ error: 'User not found' });

    const ok = await bcrypt.compare(current_password, user.password);
    // 400 (not 401): the auth token is valid — only the supplied password field
    // is wrong. Returning 401 would make the client treat it as an expired
    // session and log the user out.
    if (!ok) return res.status(400).json({ error: 'Current password is incorrect' });

    const userPatch = {};
    if (phone_number && phone_number !== '') userPatch.phone_number = phone_number;
    if (new_password && new_password !== '') {
      userPatch.password = await bcrypt.hash(new_password, 10);
    }
    if (Object.keys(userPatch).length > 0) {
      const { error: updErr } = await supabase
        .from('user')
        .update(userPatch)
        .eq('id', targetId);
      if (updErr) throw updErr;
    }

    if (license_plate && license_plate !== '') {
      const { error: spErr } = await supabase
        .from('subscriber')
        .update({ license_plate_number: license_plate })
        .eq('subscriber_num', targetId);
      if (spErr) throw spErr;
    }

    const { data: refreshedUser } = await supabase
      .from('user')
      .select('*')
      .eq('id', targetId)
      .maybeSingle();
    const { data: refreshedSub } = await supabase
      .from('subscriber')
      .select('*')
      .eq('subscriber_num', targetId)
      .maybeSingle();

    return res.json({
      success: true,
      user: stripPassword(refreshedUser),
      subscriber: refreshedSub,
    });
  } catch (err) {
    next(err);
  }
};
