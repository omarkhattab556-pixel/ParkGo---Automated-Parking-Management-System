import supabase from '../../config/supabase.js';
import { BUSINESS } from '../../config/constants.js';
import {
  getAvailabilityAtWindow,
  isValidReservationTime,
} from '../reservation.service.js';
import {
  buildBillingStatement,
  buildRevenueReport,
  buildOccupancyReport,
} from '../reports.service.js';

const MAX_TIME_MINUTES = BUSINESS.MAX_PARKING_HOURS * 60;

/* -------------------------------------------------------------------------- */
/* Tool executors — every one receives (args, user) and is scoped to that     */
/* user. They are READ-ONLY (except the propose* tools, which don't mutate     */
/* anything — they just echo a structured action suggestion back).            */
/* -------------------------------------------------------------------------- */

const getMyActiveParking = async (_args, user) => {
  const { data, error } = await supabase
    .from('parking')
    .select('*')
    .eq('subscriber_num', user.id)
    .is('retrieval_time', null)
    .order('parking_date', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  if (!data) return { active: false, message: 'No active parking session.' };

  const cap = data.max_time_minutes || MAX_TIME_MINUTES;
  const elapsedMin = Math.floor(
    (Date.now() - new Date(data.parking_date).getTime()) / 60_000
  );
  const remainingMin = cap - elapsedMin;
  const endsAt = new Date(
    new Date(data.parking_date).getTime() + cap * 60_000
  ).toISOString();

  return {
    active: true,
    parking_code: data.parking_code,
    space_number: data.parking_space,
    confirmation_code: data.confirmation_code,
    parked_at: data.parking_date,
    elapsed_minutes: elapsedMin,
    remaining_minutes: remainingMin,
    ends_at: endsAt,
    is_overtime: remainingMin < 0,
    extension_count: data.extension_count || 0,
  };
};

const getMyReservations = async (_args, user) => {
  const { data, error } = await supabase
    .from('reservation')
    .select('reservation_id, parking_space, reservation_start, reservation_end, confirmation_code, status')
    .eq('subscriber_num', user.id)
    .order('reservation_start', { ascending: false })
    .limit(20);
  if (error) throw error;
  const now = Date.now();
  const upcoming = (data || []).filter(
    (r) => r.status === 'active' && new Date(r.reservation_start).getTime() >= now
  );
  return { count: (data || []).length, upcoming_count: upcoming.length, reservations: data || [] };
};

const getMyParkingHistory = async (_args, user) => {
  const { data, error } = await supabase
    .from('parking')
    .select('parking_code, parking_space, parking_date, retrieval_time, max_time_minutes, extension_count')
    .eq('subscriber_num', user.id)
    .order('parking_date', { ascending: false })
    .limit(20);
  if (error) throw error;
  return { count: (data || []).length, sessions: data || [] };
};

const getMyBilling = async (args, user) => {
  const statement = await buildBillingStatement(user.id, args?.month);
  return statement;
};

const checkAvailability = async (args, _user) => {
  const startIso = args?.datetime;
  if (!startIso) return { error: 'datetime is required (ISO string).' };
  const valid = isValidReservationTime(startIso);
  if (!valid.ok) return { available: false, reason: valid.reason };
  const avail = await getAvailabilityAtWindow(startIso);
  return {
    available: avail.ok,
    reason: avail.ok ? undefined : `Only ${avail.freePercent.toFixed(0)}% free; need ${avail.minFreePercent}%.`,
    total_spaces: avail.totalSpaces,
    free_at_window: avail.freeAtWindow,
    free_percent: Math.round(avail.freePercent),
  };
};

const getFacilityStatus = async (_args, _user) => {
  const nowIso = new Date().toISOString();
  const [{ count: total }, { count: occupied }, { count: reservedNow }] = await Promise.all([
    supabase.from('parking_space').select('*', { count: 'exact', head: true }),
    supabase.from('parking').select('*', { count: 'exact', head: true }).is('retrieval_time', null),
    supabase
      .from('reservation')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active')
      .lte('reservation_start', nowIso)
      .gt('reservation_end', nowIso),
  ]);
  const t = total || 0;
  const occ = occupied || 0;
  const res = reservedNow || 0;
  return {
    total_spaces: t,
    occupied: occ,
    reserved_now: res,
    free_now: Math.max(0, t - occ - res),
    occupancy_percent: t ? Math.round((occ / t) * 100) : 0,
  };
};

/* ---- staff-only ---- */

const getActiveParkings = async (_args, _user) => {
  const { data, error } = await supabase
    .from('parking')
    .select('parking_code, parking_space, parking_date, subscriber_num, max_time_minutes')
    .is('retrieval_time', null)
    .order('parking_date', { ascending: false });
  if (error) throw error;
  return { active_count: (data || []).length, parkings: data || [] };
};

const getRevenueSummary = async (args, _user) => {
  const r = await buildRevenueReport(args?.month);
  return {
    month: r.month,
    currency: r.currency,
    total_revenue: r.total_revenue,
    parking_revenue: r.parking_revenue,
    extension_revenue: r.extension_revenue,
    late_revenue: r.late_revenue,
    subscription_revenue: r.subscription_revenue,
    active_subscribers: r.active_subscribers,
  };
};

const getOccupancySummary = async (args, _user) => {
  const r = await buildOccupancyReport(args?.month);
  return {
    month: r.month,
    total_spaces: r.total_spaces,
    average_occupancy_percent: Math.round(r.average_occupancy),
    peak_hours_occupancy_percent: Math.round(r.peak_hours_occupancy),
    off_peak_occupancy_percent: Math.round(r.off_peak_occupancy),
  };
};

/* ---- action-proposal tools (no mutation; return a structured suggestion) ---- */

const proposeReservation = async (args, _user) => ({
  __action: { type: 'reservation', params: { reservation_start: args?.datetime } },
  proposed: true,
  reservation_start: args?.datetime,
});

const proposeCancelReservation = async (args, _user) => ({
  __action: {
    type: 'cancel_reservation',
    params: { reservation_id: args?.reservation_id },
  },
  proposed: true,
  reservation_id: args?.reservation_id,
});

const proposeExtendParking = async (args, _user) => ({
  __action: {
    type: 'extend_parking',
    params: {
      parking_code: args?.parking_code,
      extra_minutes: args?.extra_minutes ?? 60,
    },
  },
  proposed: true,
  extra_minutes: args?.extra_minutes ?? 60,
});

/* -------------------------------------------------------------------------- */
/* Registry: name → { declaration, execute, roles }                           */
/* -------------------------------------------------------------------------- */

const REGISTRY = {
  getMyActiveParking: {
    roles: ['subscriber'],
    execute: getMyActiveParking,
    declaration: {
      name: 'getMyActiveParking',
      description:
        "Get the current user's active parking session, including remaining minutes and where the car is. Use for 'how much time do I have left', 'where is my car', 'am I parked'.",
      parameters: { type: 'object', properties: {} },
    },
  },
  getMyReservations: {
    roles: ['subscriber'],
    execute: getMyReservations,
    declaration: {
      name: 'getMyReservations',
      description: "List the current user's reservations (recent + upcoming). Use for 'my reservations', 'when is my reservation'.",
      parameters: { type: 'object', properties: {} },
    },
  },
  getMyParkingHistory: {
    roles: ['subscriber'],
    execute: getMyParkingHistory,
    declaration: {
      name: 'getMyParkingHistory',
      description: "The current user's recent parking sessions history.",
      parameters: { type: 'object', properties: {} },
    },
  },
  getMyBilling: {
    roles: ['subscriber'],
    execute: getMyBilling,
    declaration: {
      name: 'getMyBilling',
      description:
        "The current user's monthly billing statement (charges, fines, subscription fee, total). Use for 'how much do I owe', 'my bill this month'.",
      parameters: {
        type: 'object',
        properties: {
          month: { type: 'string', description: 'Optional month as YYYY-MM. Defaults to current month.' },
        },
      },
    },
  },
  checkAvailability: {
    roles: ['subscriber'],
    execute: checkAvailability,
    declaration: {
      name: 'checkAvailability',
      description:
        'Check whether a reservation can be made for a given start time (validates the timing rules and the 40% free requirement).',
      parameters: {
        type: 'object',
        properties: {
          datetime: { type: 'string', description: 'Desired reservation start, ISO 8601 (e.g. 2026-07-20T10:00:00).' },
        },
        required: ['datetime'],
      },
    },
  },
  getFacilityStatus: {
    roles: ['subscriber', 'attendant', 'manager'],
    execute: getFacilityStatus,
    declaration: {
      name: 'getFacilityStatus',
      description: 'Current facility occupancy right now: total spaces, occupied, reserved, free, occupancy %.',
      parameters: { type: 'object', properties: {} },
    },
  },
  getActiveParkings: {
    roles: ['attendant', 'manager'],
    execute: getActiveParkings,
    declaration: {
      name: 'getActiveParkings',
      description: 'List all currently active parking sessions in the facility (staff view).',
      parameters: { type: 'object', properties: {} },
    },
  },
  getRevenueSummary: {
    roles: ['manager'],
    execute: getRevenueSummary,
    declaration: {
      name: 'getRevenueSummary',
      description: "Facility revenue breakdown for a month (parking, extensions, late fines, subscriptions).",
      parameters: {
        type: 'object',
        properties: {
          month: { type: 'string', description: 'Optional month as YYYY-MM. Defaults to current month.' },
        },
      },
    },
  },
  getOccupancySummary: {
    roles: ['manager'],
    execute: getOccupancySummary,
    declaration: {
      name: 'getOccupancySummary',
      description: 'Facility occupancy report summary for a month (average, peak, off-peak).',
      parameters: {
        type: 'object',
        properties: {
          month: { type: 'string', description: 'Optional month as YYYY-MM. Defaults to current month.' },
        },
      },
    },
  },
  proposeReservation: {
    roles: ['subscriber'],
    execute: proposeReservation,
    declaration: {
      name: 'proposeReservation',
      description:
        "Propose creating a reservation for the user to CONFIRM. Call when the user clearly wants to book. Does NOT create it — the app shows a confirm button. Prefer calling checkAvailability first.",
      parameters: {
        type: 'object',
        properties: {
          datetime: { type: 'string', description: 'Reservation start, ISO 8601.' },
        },
        required: ['datetime'],
      },
    },
  },
  proposeCancelReservation: {
    roles: ['subscriber'],
    execute: proposeCancelReservation,
    declaration: {
      name: 'proposeCancelReservation',
      description:
        'Propose cancelling one of the user\'s reservations for them to CONFIRM. Does NOT cancel it. Use getMyReservations first to find the reservation_id.',
      parameters: {
        type: 'object',
        properties: {
          reservation_id: { type: 'number', description: 'The reservation_id to cancel.' },
        },
        required: ['reservation_id'],
      },
    },
  },
  proposeExtendParking: {
    roles: ['subscriber'],
    execute: proposeExtendParking,
    declaration: {
      name: 'proposeExtendParking',
      description:
        'Propose extending the user\'s active parking for them to CONFIRM. Does NOT extend it. Use getMyActiveParking first to get the parking_code.',
      parameters: {
        type: 'object',
        properties: {
          parking_code: { type: 'number', description: 'The active session parking_code.' },
          extra_minutes: { type: 'number', description: 'Minutes to add (default 60).' },
        },
        required: ['parking_code'],
      },
    },
  },
};

/** Function declarations available to a given role (for the Gemini `tools` param). */
export const toolDeclarations = (userType) =>
  Object.values(REGISTRY)
    .filter((t) => t.roles.includes(userType))
    .map((t) => t.declaration);

/**
 * Run a tool by name, enforcing role scope. Returns the JSON result object.
 * Throws if the tool is unknown or not permitted for the role — the caller
 * turns that into a functionResponse so the model can recover gracefully.
 */
export const runTool = async (name, args, user) => {
  const entry = REGISTRY[name];
  if (!entry) return { error: `Unknown tool: ${name}` };
  if (!entry.roles.includes(user.user_type)) {
    return { error: `Tool ${name} is not available for your role.` };
  }
  return entry.execute(args || {}, user);
};

export const _registry = REGISTRY; // exported for tests
