import supabase from '../config/supabase.js';
import { getQueueStatus } from '../services/installer.service.js';

/**
 * GET /api/facility/load
 * Public-ish (authenticated) — current occupancy snapshot. Used by subscriber
 * dashboard, attendant load page, etc.
 */
export const getLoad = async (_req, res, next) => {
  try {
    const nowIso = new Date().toISOString();

    const { count: totalSpaces } = await supabase
      .from('parking_space')
      .select('*', { count: 'exact', head: true });

    const { count: activeParkings } = await supabase
      .from('parking')
      .select('*', { count: 'exact', head: true })
      .is('retrieval_time', null);

    const { count: activeReservationsNow } = await supabase
      .from('reservation')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active')
      .lte('reservation_start', nowIso)
      .gt('reservation_end', nowIso);

    const occupied = activeParkings || 0;
    const reserved = activeReservationsNow || 0;
    const total = totalSpaces || 0;
    const free = Math.max(0, total - occupied - reserved);

    return res.json({
      total,
      occupied,
      reserved,
      free,
      occupancy_percent: total ? (occupied / total) * 100 : 0,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/facility/status
 * Full snapshot of installers + occupancy.
 */
export const getStatus = async (_req, res, next) => {
  try {
    const queue = await getQueueStatus();
    const { count: totalSpaces } = await supabase
      .from('parking_space')
      .select('*', { count: 'exact', head: true });
    const { count: occupied } = await supabase
      .from('parking_space')
      .select('*', { count: 'exact', head: true })
      .eq('is_occupied', true);

    return res.json({
      installers: queue,
      spaces: {
        total: totalSpaces || 0,
        occupied: occupied || 0,
        free: (totalSpaces || 0) - (occupied || 0),
      },
    });
  } catch (err) {
    next(err);
  }
};
