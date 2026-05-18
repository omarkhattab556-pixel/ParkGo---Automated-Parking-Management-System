import supabase from '../config/supabase.js';
import { getQueueStatus } from '../services/installer.service.js';

/**
 * GET /api/facility/load
 * Current occupancy snapshot for stats strips.
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
 * Full snapshot of installers + spaces.
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

/**
 * GET /api/facility/hourly?hours=24
 * Counts active parkings per hour for the past N hours.
 * Active = parking_date <= hour AND (retrieval_time IS NULL OR retrieval_time > hour).
 */
export const getHourly = async (req, res, next) => {
  try {
    const hours = Math.min(72, Math.max(1, Number(req.query.hours || 24)));

    const { count: totalSpaces } = await supabase
      .from('parking_space')
      .select('*', { count: 'exact', head: true });

    const now = new Date();
    // Align to top of the current hour
    now.setMinutes(0, 0, 0);
    const buckets = [];
    for (let i = hours - 1; i >= 0; i--) {
      const start = new Date(now.getTime() - i * 3600_000);
      buckets.push({ ts: start, hour_label: start.toISOString() });
    }

    const earliest = buckets[0].ts.toISOString();
    const latest = new Date(buckets[buckets.length - 1].ts.getTime() + 3600_000).toISOString();

    // Fetch parkings that touch the window:
    //   parking_date < latest  AND  (retrieval_time IS NULL OR retrieval_time > earliest)
    const { data: parkings, error } = await supabase
      .from('parking')
      .select('parking_date, retrieval_time')
      .lt('parking_date', latest)
      .or(`retrieval_time.is.null,retrieval_time.gt.${earliest}`)
      .limit(5000);
    if (error) throw error;

    const result = buckets.map((b) => {
      const ts = b.ts.getTime();
      let occupied = 0;
      for (const p of parkings || []) {
        const start = new Date(p.parking_date).getTime();
        const end = p.retrieval_time
          ? new Date(p.retrieval_time).getTime()
          : Date.now();
        if (start <= ts && end > ts) occupied += 1;
      }
      const total = totalSpaces || 0;
      return {
        hour: b.hour_label,
        occupied,
        total,
        occupancy_percent: total ? (occupied / total) * 100 : 0,
      };
    });

    return res.json(result);
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/facility/maintenance
 * Records a maintenance call (currently just logs to console + returns timestamp).
 */
export const callMaintenance = async (req, res) => {
  const entry = {
    called_at: new Date().toISOString(),
    called_by: req.user?.email || 'unknown',
    technician_phone: '+972-50-555-1234',
  };
  console.log('[maintenance] Technician called:', entry);
  return res.json({ success: true, ...entry });
};
