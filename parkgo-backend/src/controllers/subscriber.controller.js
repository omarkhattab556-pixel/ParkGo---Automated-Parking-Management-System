import bcrypt from 'bcryptjs';
import supabase from '../config/supabase.js';

const stripPassword = (u) => {
  if (!u) return u;
  const { password: _pw, ...rest } = u;
  return rest;
};

/**
 * GET /api/subscribers/me/profile
 * Returns user + subscriber details + stats for the logged-in subscriber.
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
 * PATCH /api/subscribers/:id
 * Subscriber updates own license_plate / phone_number / password.
 * Requires current_password to change anything.
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
    if (!ok) return res.status(401).json({ error: 'Current password is incorrect' });

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
