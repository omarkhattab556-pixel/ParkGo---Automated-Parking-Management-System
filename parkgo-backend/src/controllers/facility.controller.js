import supabase from '../config/supabase.js';
import { getQueueStatus } from '../services/installer.service.js';

/* ---------- Load / Status ---------- */

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

export const getHourly = async (req, res, next) => {
  try {
    const hours = Math.min(72, Math.max(1, Number(req.query.hours || 24)));

    const { count: totalSpaces } = await supabase
      .from('parking_space')
      .select('*', { count: 'exact', head: true });

    const now = new Date();
    now.setMinutes(0, 0, 0);
    const buckets = [];
    for (let i = hours - 1; i >= 0; i--) {
      const start = new Date(now.getTime() - i * 3600_000);
      buckets.push({ ts: start, hour_label: start.toISOString() });
    }

    const earliest = buckets[0].ts.toISOString();
    const latest = new Date(buckets[buckets.length - 1].ts.getTime() + 3600_000).toISOString();

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

export const callMaintenance = async (req, res) => {
  const entry = {
    called_at: new Date().toISOString(),
    called_by: req.user?.email || 'unknown',
    technician_phone: '+972-50-555-1234',
  };
  console.log('[maintenance] Technician called:', entry);
  return res.json({ success: true, ...entry });
};

/* ---------- Manager CRUD: Parking Spaces ---------- */

/**
 * GET /api/facility/spaces
 * List all parking spaces (with their occupancy + active reservation/parking info).
 */
export const listSpaces = async (_req, res, next) => {
  try {
    const { data: spaces, error } = await supabase
      .from('parking_space')
      .select('*')
      .order('space_number');
    if (error) throw error;

    const nowIso = new Date().toISOString();
    const [activeParkings, activeReservations] = await Promise.all([
      supabase
        .from('parking')
        .select('parking_space')
        .is('retrieval_time', null),
      supabase
        .from('reservation')
        .select('parking_space')
        .eq('status', 'active')
        .gt('reservation_end', nowIso),
    ]);

    const inUse = new Set();
    const reserved = new Set();
    (activeParkings.data || []).forEach((p) => inUse.add(p.parking_space));
    (activeReservations.data || []).forEach((r) => reserved.add(r.parking_space));

    const enriched = (spaces || []).map((s) => ({
      ...s,
      in_use: inUse.has(s.space_number),
      reserved: reserved.has(s.space_number),
    }));
    return res.json(enriched);
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/facility/spaces
 * Body: { space_number?: number, location: string }
 * If space_number omitted, picks the next available integer.
 */
export const addSpace = async (req, res, next) => {
  try {
    let { space_number, location } = req.body;

    if (space_number == null) {
      const { data: max } = await supabase
        .from('parking_space')
        .select('space_number')
        .order('space_number', { ascending: false })
        .limit(1)
        .maybeSingle();
      space_number = (max?.space_number || 0) + 1;
    } else {
      const { data: existing } = await supabase
        .from('parking_space')
        .select('space_number')
        .eq('space_number', space_number)
        .maybeSingle();
      if (existing) {
        return res
          .status(409)
          .json({ error: `Space #${space_number} already exists` });
      }
    }

    const { data: created, error } = await supabase
      .from('parking_space')
      .insert({ space_number, location: location || null, is_occupied: false })
      .select('*')
      .single();
    if (error) throw error;

    return res.status(201).json(created);
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/facility/spaces/:num
 * Blocks deletion if there's an active parking or future reservation.
 */
export const removeSpace = async (req, res, next) => {
  try {
    const num = Number(req.params.num);
    if (!Number.isFinite(num)) return res.status(400).json({ error: 'Invalid space number' });

    const { data: existing } = await supabase
      .from('parking_space')
      .select('space_number, is_occupied')
      .eq('space_number', num)
      .maybeSingle();
    if (!existing) return res.status(404).json({ error: 'Space not found' });

    if (existing.is_occupied) {
      return res
        .status(409)
        .json({ error: 'Cannot remove an occupied space' });
    }

    const { data: activeParking } = await supabase
      .from('parking')
      .select('parking_code')
      .eq('parking_space', num)
      .is('retrieval_time', null)
      .limit(1);
    if ((activeParking?.length || 0) > 0) {
      return res.status(409).json({
        error: 'Cannot remove — an active parking session uses this space',
      });
    }

    const nowIso = new Date().toISOString();
    const { data: futureRes } = await supabase
      .from('reservation')
      .select('reservation_id')
      .eq('parking_space', num)
      .eq('status', 'active')
      .gt('reservation_end', nowIso)
      .limit(1);
    if ((futureRes?.length || 0) > 0) {
      return res.status(409).json({
        error: 'Cannot remove — future reservation(s) exist for this space',
      });
    }

    const { error: delErr } = await supabase
      .from('parking_space')
      .delete()
      .eq('space_number', num);
    if (delErr) throw delErr;

    return res.json({ success: true, removed: num });
  } catch (err) {
    next(err);
  }
};

/* ---------- Manager CRUD: Installers ---------- */

export const listInstallers = async (_req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('installer')
      .select('*')
      .order('installer_id');
    if (error) throw error;
    return res.json(data || []);
  } catch (err) {
    next(err);
  }
};

export const addInstaller = async (req, res, next) => {
  try {
    const { installer_name } = req.body;
    const { data: created, error } = await supabase
      .from('installer')
      .insert({ installer_name, is_free: true, busy_until: null })
      .select('*')
      .single();
    if (error) throw error;
    return res.status(201).json(created);
  } catch (err) {
    next(err);
  }
};

export const removeInstaller = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ error: 'Invalid installer id' });

    const { data: existing } = await supabase
      .from('installer')
      .select('*')
      .eq('installer_id', id)
      .maybeSingle();
    if (!existing) return res.status(404).json({ error: 'Installer not found' });

    if (!existing.is_free) {
      return res.status(409).json({
        error: 'Cannot remove a busy installer — wait for it to free up',
      });
    }

    const { error: delErr } = await supabase
      .from('installer')
      .delete()
      .eq('installer_id', id);
    if (delErr) throw delErr;

    return res.json({ success: true, removed: id });
  } catch (err) {
    next(err);
  }
};
