import supabase from '../config/supabase.js';
import { getQueueStatus } from '../services/installer.service.js';

/* ---------- Load / Status ---------- */

/**
 * GET /api/facility/load
 * Computes live capacity for any authenticated role from active spaces, open
 * parking sessions and reservations overlapping the current instant. `free`
 * excludes both parked and currently reserved spaces, while
 * `occupancy_percent` measures open parking sessions against active capacity.
 */
export const getLoad = async (_req, res, next) => {
  try {
    const nowIso = new Date().toISOString();

    const { count: totalSpaces } = await supabase
      .from('parking_space')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true);

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
 * Returns the robotic installer queue together with the space inventory's
 * cached `is_occupied` flags. This is an operational equipment snapshot; unlike
 * `/load`, it does not project reservation overlap at the current instant.
 */
export const getStatus = async (_req, res, next) => {
  try {
    const queue = await getQueueStatus();
    const { count: totalSpaces } = await supabase
      .from('parking_space')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true);
    const { count: occupied } = await supabase
      .from('parking_space')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)
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
 * GET /api/facility/hourly?hours=N
 * Staff-only occupancy series sampled at the start of each hour. `hours`
 * defaults to 24 and is clamped to 1..72; returned hour labels are ISO strings.
 * A session contributes to every sampled hour that falls inside its lifetime.
 */
export const getHourly = async (req, res, next) => {
  try {
    const hours = Math.min(72, Math.max(1, Number(req.query.hours || 24)));

    const { count: totalSpaces } = await supabase
      .from('parking_space')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true);

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

/**
 * POST /api/facility/maintenance
 * Records a technician dispatch for authenticated staff and returns its contact
 * details. The maintenance event feeds monthly variable expenses; persistence
 * is best-effort so a reporting failure cannot change the successful response.
 */
export const callMaintenance = async (req, res) => {
  const entry = {
    called_at: new Date().toISOString(),
    called_by: req.user?.email || 'unknown',
    technician_phone: '+972-50-555-1234',
  };
  console.log('[maintenance] Technician called:', entry);

  // Log the call so it feeds the financial report's variable expense
  // (each technician visit costs the editable per-call fee). A failure here
  // must not break the operational "call technician" flow, so we swallow it.
  const { error } = await supabase.from('maintenance_event').insert({
    called_at: entry.called_at,
    called_by: entry.called_by,
  });
  if (error) console.error('[maintenance] could not log event:', error.message);

  return res.json({ success: true, ...entry });
};

/* ---------- Manager CRUD: Parking Spaces ---------- */

/**
 * GET /api/facility/spaces
 * List all parking spaces with occupancy + occupant info (manager/attendant see names).
 * Subscribers get a sanitized payload: only their own occupied space carries identity.
 */
export const listSpaces = async (req, res, next) => {
  try {
    const role = req.user?.user_type;
    const userId = req.user?.id;

    const { data: spaces, error } = await supabase
      .from('parking_space')
      .select('*')
      .eq('is_active', true)
      .order('location', { ascending: true })
      .order('space_number', { ascending: true });
    if (error) throw error;

    const nowIso = new Date().toISOString();
    const [activeParkingsRes, activeReservationsRes] = await Promise.all([
      supabase
        .from('parking')
        .select('parking_space, subscriber_num, parking_code')
        .is('retrieval_time', null),
      supabase
        .from('reservation')
        .select('parking_space, subscriber_num')
        .eq('status', 'active')
        .gt('reservation_end', nowIso),
    ]);

    const parkings = activeParkingsRes.data || [];
    const reservations = activeReservationsRes.data || [];

    const canSeeOccupants = role === 'manager' || role === 'attendant';

    // Bulk-fetch user names only when staff is viewing.
    let usersById = {};
    if (canSeeOccupants) {
      const ids = [
        ...new Set([
          ...parkings.map((p) => p.subscriber_num),
          ...reservations.map((r) => r.subscriber_num),
        ]),
      ].filter(Boolean);
      if (ids.length > 0) {
        const { data: users } = await supabase
          .from('user')
          .select('id, first_name, last_name')
          .in('id', ids);
        usersById = Object.fromEntries((users || []).map((u) => [u.id, u]));
      }
    }

    const parkingBySpace = new Map();
    parkings.forEach((p) => parkingBySpace.set(p.parking_space, p));
    const reservationBySpace = new Map();
    reservations.forEach((r) => reservationBySpace.set(r.parking_space, r));

    const enriched = (spaces || []).map((s) => {
      const p = parkingBySpace.get(s.space_number);
      const r = reservationBySpace.get(s.space_number);
      const isMine = !!(
        (p && userId && p.subscriber_num === userId) ||
        (r && userId && r.subscriber_num === userId)
      );

      const base = {
        ...s,
        in_use: !!p,
        reserved: !!r,
        is_mine: isMine,
      };

      if (canSeeOccupants) {
        const ownerId = p ? p.subscriber_num : r ? r.subscriber_num : null;
        const owner = ownerId ? usersById[ownerId] : null;
        if (owner) {
          base.occupant_name = `${owner.first_name} ${owner.last_name}`;
          // Subscriber id so staff can open the occupant's profile from the map.
          base.occupant_id = ownerId;
        }
      }
      return base;
    });
    return res.json(enriched);
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/facility/floors
 * A "floor" is identified by the `location` string on parking_space.
 * Returns aggregated info per location: total + occupied counts.
 */
export const listFloors = async (_req, res, next) => {
  try {
    const { data: spaces, error } = await supabase
      .from('parking_space')
      .select('location, space_number, is_occupied')
      .eq('is_active', true);
    if (error) throw error;

    const buckets = new Map();
    (spaces || []).forEach((s) => {
      const key = s.location || 'Unzoned';
      if (!buckets.has(key)) {
        buckets.set(key, { location: key, total: 0, occupied: 0 });
      }
      const b = buckets.get(key);
      b.total += 1;
      if (s.is_occupied) b.occupied += 1;
    });
    const floors = Array.from(buckets.values()).sort((a, b) =>
      a.location.localeCompare(b.location)
    );
    return res.json(floors);
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/facility/floors
 * Body: { location: string, spaces: number }
 * Creates `spaces` parking spots tagged with the same `location`.
 * Auto-numbers them continuing the global space_number sequence.
 */
export const addFloor = async (req, res, next) => {
  try {
    const { location, spaces } = req.body;
    const trimmed = (location || '').trim();
    if (!trimmed) {
      return res.status(400).json({ error: 'location is required' });
    }
    if (!Number.isFinite(spaces) || spaces < 1 || spaces > 200) {
      return res.status(400).json({ error: 'spaces must be 1..200' });
    }

    // Deliberately NOT filtered by is_active: retired rows still hold their
    // space_number (and their history), so numbering must continue past them
    // to avoid a new space inheriting a retired one's parking records.
    const { data: max } = await supabase
      .from('parking_space')
      .select('space_number')
      .order('space_number', { ascending: false })
      .limit(1)
      .maybeSingle();
    const next_num = (max?.space_number || 0) + 1;

    const rows = [];
    for (let i = 0; i < spaces; i++) {
      rows.push({
        space_number: next_num + i,
        location: trimmed,
        is_occupied: false,
        is_active: true,
      });
    }
    const { data: created, error } = await supabase
      .from('parking_space')
      .insert(rows)
      .select('*');
    if (error) throw error;

    return res.status(201).json({
      location: trimmed,
      created_count: created?.length || 0,
      spaces: created,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/facility/floors/:location
 * Retires all spaces tagged with this location only if all are empty.
 *
 * Retire, not delete: `parking` and `reservation` keep historical rows that
 * reference these spaces, so a hard DELETE trips
 * `parking_parking_space_fkey`. Flipping is_active removes the floor from the
 * map, the counts and the allocator while the history stays valid.
 */
export const removeFloor = async (req, res, next) => {
  try {
    const location = decodeURIComponent(req.params.location || '').trim();
    if (!location) {
      return res.status(400).json({ error: 'Invalid location' });
    }

    const { data: spaces, error: spErr } = await supabase
      .from('parking_space')
      .select('space_number, is_occupied')
      .eq('location', location)
      .eq('is_active', true);
    if (spErr) throw spErr;
    if (!spaces || spaces.length === 0) {
      return res.status(404).json({ error: 'Floor not found or already empty' });
    }

    if (spaces.some((s) => s.is_occupied)) {
      return res
        .status(409)
        .json({ error: 'Cannot remove floor — some spaces are occupied' });
    }

    const nums = spaces.map((s) => s.space_number);
    const { data: activeParking } = await supabase
      .from('parking')
      .select('parking_code')
      .in('parking_space', nums)
      .is('retrieval_time', null)
      .limit(1);
    if ((activeParking?.length || 0) > 0) {
      return res
        .status(409)
        .json({ error: 'Cannot remove floor — active parking session(s) present' });
    }

    const nowIso = new Date().toISOString();
    const { data: futureRes } = await supabase
      .from('reservation')
      .select('reservation_id')
      .in('parking_space', nums)
      .eq('status', 'active')
      .gt('reservation_end', nowIso)
      .limit(1);
    if ((futureRes?.length || 0) > 0) {
      return res
        .status(409)
        .json({ error: 'Cannot remove floor — future reservation(s) exist' });
    }

    const { error: delErr } = await supabase
      .from('parking_space')
      .update({
        is_active: false,
        is_occupied: false,
        retired_at: new Date().toISOString(),
        retired_by: req.user?.email || null,
      })
      .eq('location', location)
      .eq('is_active', true);
    if (delErr) throw delErr;

    return res.json({
      success: true,
      removed_location: location,
      removed_spaces: nums.length,
    });
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
      // Unfiltered on purpose — see addFloor: retired numbers are never reused
      // implicitly, so the sequence continues past them.
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
        .select('space_number, is_active')
        .eq('space_number', space_number)
        .maybeSingle();

      if (existing?.is_active) {
        return res
          .status(409)
          .json({ error: `Space #${space_number} already exists` });
      }

      // The number belongs to a retired space — bring it back instead of
      // inserting a duplicate key. Its historical parking rows reattach to it.
      if (existing) {
        const { data: revived, error: revErr } = await supabase
          .from('parking_space')
          .update({
            location: location || null,
            is_occupied: false,
            is_active: true,
            retired_at: null,
            retired_by: null,
          })
          .eq('space_number', space_number)
          .select('*')
          .single();
        if (revErr) throw revErr;
        return res.status(201).json(revived);
      }
    }

    const { data: created, error } = await supabase
      .from('parking_space')
      .insert({
        space_number,
        location: location || null,
        is_occupied: false,
        is_active: true,
      })
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
 * Blocks retirement if there's an active parking or future reservation.
 *
 * Retire, not delete — see removeFloor for why a hard DELETE cannot work.
 */
export const removeSpace = async (req, res, next) => {
  try {
    const num = Number(req.params.num);
    if (!Number.isFinite(num)) return res.status(400).json({ error: 'Invalid space number' });

    const { data: existing } = await supabase
      .from('parking_space')
      .select('space_number, is_occupied, is_active')
      .eq('space_number', num)
      .maybeSingle();
    if (!existing || !existing.is_active) {
      return res.status(404).json({ error: 'Space not found' });
    }

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
      .update({
        is_active: false,
        is_occupied: false,
        retired_at: new Date().toISOString(),
        retired_by: req.user?.email || null,
      })
      .eq('space_number', num);
    if (delErr) throw delErr;

    return res.json({ success: true, removed: num });
  } catch (err) {
    next(err);
  }
};

/* ---------- Manager CRUD: Installers ---------- */

/**
 * GET /api/facility/installers
 * Manager view of the full installer fleet, ordered by installer id.
 */
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

/**
 * POST /api/facility/installers
 * Creates a free installer from the route-validated `{ installer_name,
 * Manufacturer }` body and returns the new row with HTTP 201.
 */
export const addInstaller = async (req, res, next) => {
  try {
    const { installer_name, Manufacturer } = req.body;
    const { data: created, error } = await supabase
      .from('installer')
      .insert({
        installer_name,
        Manufacturer,
        is_free: true,
        busy_until: null,
      })
      .select('*')
      .single();
    if (error) throw error;
    return res.status(201).json(created);
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/facility/installers/:id
 * Removes an idle installer. Missing installers return 404, and a unit that is
 * still busy is protected from removal with HTTP 409.
 */
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
