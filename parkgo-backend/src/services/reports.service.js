import supabase from '../config/supabase.js';
import { BUSINESS, PRICING } from '../config/constants.js';

const MAX_TIME_MINUTES = BUSINESS.MAX_PARKING_HOURS * 60;

/**
 * Bill a single parking session. Every started hour is charged at the uniform
 * hourly rate. Hours beyond the standard maximum (the extended portion) are
 * additionally reported as `extensionCost` for transparency — they are already
 * included in `total`.
 *
 * @param {number} elapsedMinutes  actual minutes parked
 * @param {number} maxTimeMinutes  this session's cap (grows with extensions)
 * @returns {{ hours:number, total:number, baseCost:number, extensionCost:number }}
 */
export const billParkingSession = (elapsedMinutes, maxTimeMinutes) => {
  const rate = PRICING.HOURLY_RATE;
  const minutes = Math.max(0, elapsedMinutes);
  // Round each started hour up (a 61-minute stay is billed as 2 hours).
  const hours = Math.max(1, Math.ceil(minutes / 60));

  const standardMax = maxTimeMinutes || MAX_TIME_MINUTES;
  const standardHours = Math.ceil(standardMax / 60);
  const extendedHours = Math.max(0, hours - standardHours);
  const baseHours = hours - extendedHours;

  return {
    hours,
    baseCost: baseHours * rate,
    extensionCost: extendedHours * rate,
    total: hours * rate,
  };
};

/**
 * Compute the date range for a given month string "YYYY-MM" (or current month
 * when blank). Returns ISO bounds + the calendar metadata used by the reports.
 */
export const computeMonthRange = (monthStr) => {
  const now = new Date();
  let year;
  let monthIdx; // 0-based JS month
  if (monthStr && /^\d{4}-\d{2}$/.test(monthStr)) {
    const [y, m] = monthStr.split('-').map(Number);
    year = y;
    monthIdx = m - 1;
  } else {
    year = now.getFullYear();
    monthIdx = now.getMonth();
  }
  const start = new Date(year, monthIdx, 1);
  const end = new Date(year, monthIdx + 1, 1);
  const daysInMonth = new Date(year, monthIdx + 1, 0).getDate();
  return {
    monthStr: `${year}-${String(monthIdx + 1).padStart(2, '0')}`,
    startIso: start.toISOString(),
    endIso: end.toISOString(),
    start,
    end,
    daysInMonth,
    year,
    monthIdx,
  };
};

/**
 * Walk the month at hourly resolution, counting how many parkings were active
 * at the start of each hour. Returns:
 *   - average_occupancy (%)
 *   - peak_hours_occupancy (avg occupancy 7-10 and 17-20)
 *   - off_peak_occupancy (avg occupancy 0-6 and 22-23)
 *   - daily: [{ date, occupancy }] average % per day-of-month
 *   - hourly_heatmap: [24] each value = average occupancy at that hour-of-day
 */
export const buildOccupancyReport = async (monthStr) => {
  const range = computeMonthRange(monthStr);

  const { count: totalSpaces } = await supabase
    .from('parking_space')
    .select('*', { count: 'exact', head: true });
  const totalSpacesNum = totalSpaces || 0;

  // Fetch all parkings that overlap the month window
  const { data: parkings, error } = await supabase
    .from('parking')
    .select('parking_date, retrieval_time')
    .lt('parking_date', range.endIso)
    .or(`retrieval_time.is.null,retrieval_time.gt.${range.startIso}`)
    .limit(20000);
  if (error) throw error;

  // Build hourly buckets covering the whole month
  const hoursInMonth = range.daysInMonth * 24;
  const hourlyOccupied = new Array(hoursInMonth).fill(0);

  for (const p of parkings || []) {
    const startMs = new Date(p.parking_date).getTime();
    const endMs = p.retrieval_time
      ? new Date(p.retrieval_time).getTime()
      : Date.now();
    for (let h = 0; h < hoursInMonth; h++) {
      const hourMs = range.start.getTime() + h * 3600_000;
      if (startMs <= hourMs && endMs > hourMs) hourlyOccupied[h] += 1;
    }
  }

  const occToPct = (n) =>
    totalSpacesNum ? (n / totalSpacesNum) * 100 : 0;

  // average across all hours
  const avg =
    hourlyOccupied.reduce((a, b) => a + b, 0) / Math.max(1, hourlyOccupied.length);
  const averagePct = occToPct(avg);

  // Peak hours: 07–10 and 17–20 (4 buckets x 2 windows = 8 hours per day)
  const peakHours = [7, 8, 9, 10, 17, 18, 19, 20];
  // Off-peak hours: 00–05 and 22–23
  const offPeakHours = [0, 1, 2, 3, 4, 5, 22, 23];

  let peakSum = 0;
  let peakCount = 0;
  let offSum = 0;
  let offCount = 0;
  const hourlyHeatmap = new Array(24).fill(0);
  const hourlyHeatmapCounts = new Array(24).fill(0);

  for (let h = 0; h < hoursInMonth; h++) {
    const date = new Date(range.start.getTime() + h * 3600_000);
    const hod = date.getHours();
    hourlyHeatmap[hod] += hourlyOccupied[h];
    hourlyHeatmapCounts[hod] += 1;
    if (peakHours.includes(hod)) {
      peakSum += hourlyOccupied[h];
      peakCount += 1;
    } else if (offPeakHours.includes(hod)) {
      offSum += hourlyOccupied[h];
      offCount += 1;
    }
  }
  const peakAvgPct = peakCount > 0 ? occToPct(peakSum / peakCount) : 0;
  const offPeakAvgPct = offCount > 0 ? occToPct(offSum / offCount) : 0;
  const heatmap = hourlyHeatmap.map((v, i) =>
    hourlyHeatmapCounts[i] > 0 ? occToPct(v / hourlyHeatmapCounts[i]) : 0
  );

  // Daily averages
  const daily = [];
  for (let d = 0; d < range.daysInMonth; d++) {
    let sum = 0;
    for (let h = 0; h < 24; h++) {
      sum += hourlyOccupied[d * 24 + h];
    }
    const date = new Date(range.year, range.monthIdx, d + 1);
    daily.push({
      date: date.toISOString().slice(0, 10),
      occupancy: occToPct(sum / 24),
    });
  }

  return {
    month: range.monthStr,
    total_spaces: totalSpacesNum,
    average_occupancy: averagePct,
    peak_hours_occupancy: peakAvgPct,
    off_peak_occupancy: offPeakAvgPct,
    daily,
    hourly_heatmap: heatmap,
  };
};

/**
 * Behavior: average duration, duration distribution, extension rate, late rate.
 */
export const buildBehaviorReport = async (monthStr) => {
  const range = computeMonthRange(monthStr);

  // Only parkings that started in the month
  const { data: parkings, error } = await supabase
    .from('parking')
    .select(
      'parking_code, parking_date, retrieval_time, extension_count, max_time_minutes'
    )
    .gte('parking_date', range.startIso)
    .lt('parking_date', range.endIso)
    .limit(20000);
  if (error) throw error;

  const total = (parkings || []).length;

  if (total === 0) {
    return {
      month: range.monthStr,
      total_parkings: 0,
      average_duration_hours: 0,
      distribution: { up_to_1h: 0, between_1_and_4h: 0, over_4h: 0 },
      distribution_percent: { up_to_1h: 0, between_1_and_4h: 0, over_4h: 0 },
      extension_rate: 0,
      late_return_rate: 0,
    };
  }

  let totalMinutes = 0;
  let upTo1 = 0;
  let oneTo4 = 0;
  let over4 = 0;
  let withExtension = 0;
  let lateReturns = 0;

  for (const p of parkings) {
    const start = new Date(p.parking_date).getTime();
    const end = p.retrieval_time ? new Date(p.retrieval_time).getTime() : Date.now();
    const minutes = (end - start) / 60_000;
    totalMinutes += minutes;
    if (minutes <= 60) upTo1 += 1;
    else if (minutes <= 240) oneTo4 += 1;
    else over4 += 1;

    if ((p.extension_count || 0) > 0) withExtension += 1;

    const maxMin = p.max_time_minutes || MAX_TIME_MINUTES;
    if (p.retrieval_time && minutes > maxMin) lateReturns += 1;
    // For still-active parkings that are already over their limit:
    if (!p.retrieval_time && minutes > maxMin) lateReturns += 1;
  }

  const avgHours = totalMinutes / total / 60;

  return {
    month: range.monthStr,
    total_parkings: total,
    average_duration_hours: avgHours,
    distribution: {
      up_to_1h: upTo1,
      between_1_and_4h: oneTo4,
      over_4h: over4,
    },
    distribution_percent: {
      up_to_1h: (upTo1 / total) * 100,
      between_1_and_4h: (oneTo4 / total) * 100,
      over_4h: (over4 / total) * 100,
    },
    extension_rate: (withExtension / total) * 100,
    late_return_rate: (lateReturns / total) * 100,
  };
};

/**
 * Reservations: total / used / cancelled, plus reservation→occupancy share,
 * plus daily timeline of "created" reservations.
 */
export const buildReservationsReport = async (monthStr) => {
  const range = computeMonthRange(monthStr);

  // Reservations created _or_ starting in the month — we use reservation_start
  // since that's the operational date the report cares about.
  const { data: reservations, error: resErr } = await supabase
    .from('reservation')
    .select('reservation_id, parking_space, reservation_start, confirmation_code, status, created_at')
    .gte('reservation_start', range.startIso)
    .lt('reservation_start', range.endIso)
    .limit(20000);
  if (resErr) throw resErr;

  // Parkings inside the window — used to detect "actually used" reservations.
  // A reservation was "used" iff some parking row shares the same confirmation_code
  // and was created in the same window.
  const total = (reservations || []).length;

  if (total === 0) {
    return {
      month: range.monthStr,
      total_reservations: 0,
      used_reservations: 0,
      cancelled_reservations: 0,
      used_percent: 0,
      cancelled_percent: 0,
      reservation_occupancy_share: 0,
      daily: [],
    };
  }

  const codes = reservations.map((r) => r.confirmation_code);
  let usedCodes = new Set();
  if (codes.length > 0) {
    const { data: parkings } = await supabase
      .from('parking')
      .select('confirmation_code')
      .in('confirmation_code', codes)
      .gte('parking_date', range.startIso)
      .lt('parking_date', range.endIso)
      .limit(20000);
    usedCodes = new Set((parkings || []).map((p) => p.confirmation_code));
  }

  const used = reservations.filter((r) => usedCodes.has(r.confirmation_code))
    .length;
  const cancelled = reservations.filter((r) => r.status === 'cancelled').length;

  // Reservation occupancy share — what fraction of all parkings in the month
  // originated from a reservation. We count parkings inside the window.
  const { count: totalParkings } = await supabase
    .from('parking')
    .select('*', { count: 'exact', head: true })
    .gte('parking_date', range.startIso)
    .lt('parking_date', range.endIso);
  const reservationShare =
    totalParkings && totalParkings > 0 ? (used / totalParkings) * 100 : 0;

  // Daily timeline (count of reservations by start day)
  const dailyMap = {};
  for (let d = 1; d <= range.daysInMonth; d++) {
    const key = `${range.year}-${String(range.monthIdx + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    dailyMap[key] = 0;
  }
  for (const r of reservations) {
    const key = new Date(r.reservation_start).toISOString().slice(0, 10);
    if (key in dailyMap) dailyMap[key] += 1;
  }
  const daily = Object.entries(dailyMap).map(([date, count]) => ({ date, count }));

  return {
    month: range.monthStr,
    total_reservations: total,
    used_reservations: used,
    cancelled_reservations: cancelled,
    used_percent: (used / total) * 100,
    cancelled_percent: (cancelled / total) * 100,
    reservation_occupancy_share: reservationShare,
    daily,
  };
};

/**
 * Per-subscriber monthly billing statement. Aggregates every parking that
 * STARTED in the month for this subscriber and applies the pricing model:
 *   - hourly parking charges (base)
 *   - extension charges (hours beyond the standard max)
 *   - late fines (one flat fine per late return in the month)
 *   - a flat monthly subscription fee
 * Everything resets each calendar month (the query is scoped to the month).
 */
export const buildBillingStatement = async (subscriberId, monthStr) => {
  const range = computeMonthRange(monthStr);

  const { data: parkings, error } = await supabase
    .from('parking')
    .select('parking_date, retrieval_time, max_time_minutes, extension_count')
    .eq('subscriber_num', subscriberId)
    .gte('parking_date', range.startIso)
    .lt('parking_date', range.endIso)
    .limit(20000);
  if (error) throw error;

  let totalParkings = 0;
  let totalMinutes = 0;
  let baseCost = 0;
  let extensionCost = 0;
  let lateCount = 0;

  for (const p of parkings || []) {
    totalParkings += 1;
    const start = new Date(p.parking_date).getTime();
    const end = p.retrieval_time
      ? new Date(p.retrieval_time).getTime()
      : Date.now();
    const minutes = (end - start) / 60_000;
    totalMinutes += Math.max(0, minutes);

    const bill = billParkingSession(minutes, p.max_time_minutes);
    baseCost += bill.baseCost;
    extensionCost += bill.extensionCost;

    const maxMin = p.max_time_minutes || MAX_TIME_MINUTES;
    if (minutes > maxMin) lateCount += 1;
  }

  const lateFines = lateCount * PRICING.LATE_FINE;
  const subscriptionFee = PRICING.SUBSCRIPTION_FEE;
  const total = baseCost + extensionCost + lateFines + subscriptionFee;

  return {
    month: range.monthStr,
    currency: PRICING.CURRENCY,
    rates: {
      hourly_rate: PRICING.HOURLY_RATE,
      late_fine: PRICING.LATE_FINE,
      subscription_fee: PRICING.SUBSCRIPTION_FEE,
    },
    total_parkings: totalParkings,
    total_hours: totalMinutes / 60,
    parking_cost: baseCost,
    extension_cost: extensionCost,
    late_count: lateCount,
    late_fines: lateFines,
    subscription_fee: subscriptionFee,
    total_due: total,
  };
};

/**
 * Facility-wide monthly revenue report for the manager. Sums the same pricing
 * model across ALL subscribers and breaks the revenue down by source, by day,
 * and by subscriber.
 */
export const buildRevenueReport = async (monthStr) => {
  const range = computeMonthRange(monthStr);

  const { data: parkings, error } = await supabase
    .from('parking')
    .select(
      'subscriber_num, parking_date, retrieval_time, max_time_minutes, extension_count'
    )
    .gte('parking_date', range.startIso)
    .lt('parking_date', range.endIso)
    .limit(50000);
  if (error) throw error;

  // Per-day and per-subscriber accumulators.
  const dailyMap = {};
  for (let d = 1; d <= range.daysInMonth; d++) {
    const key = `${range.year}-${String(range.monthIdx + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    dailyMap[key] = 0;
  }
  const perSubscriber = {}; // id -> revenue accumulator

  let parkingRevenue = 0;
  let extensionRevenue = 0;
  let lateRevenue = 0;
  let totalLateCount = 0;

  for (const p of parkings || []) {
    const start = new Date(p.parking_date).getTime();
    const end = p.retrieval_time
      ? new Date(p.retrieval_time).getTime()
      : Date.now();
    const minutes = (end - start) / 60_000;
    const bill = billParkingSession(minutes, p.max_time_minutes);

    const maxMin = p.max_time_minutes || MAX_TIME_MINUTES;
    const isLate = minutes > maxMin;
    const fine = isLate ? PRICING.LATE_FINE : 0;
    if (isLate) totalLateCount += 1;

    parkingRevenue += bill.baseCost;
    extensionRevenue += bill.extensionCost;
    lateRevenue += fine;

    const dayKey = new Date(p.parking_date).toISOString().slice(0, 10);
    const sessionRevenue = bill.total + fine;
    if (dayKey in dailyMap) dailyMap[dayKey] += sessionRevenue;

    const id = p.subscriber_num;
    if (!perSubscriber[id]) {
      perSubscriber[id] = { subscriber_num: id, parkings: 0, revenue: 0 };
    }
    perSubscriber[id].parkings += 1;
    perSubscriber[id].revenue += sessionRevenue;
  }

  // Subscription fees: one flat fee per active subscriber.
  const { count: activeSubs } = await supabase
    .from('subscriber')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active');
  const activeSubsNum = activeSubs || 0;
  const subscriptionRevenue = activeSubsNum * PRICING.SUBSCRIPTION_FEE;

  // Attach the subscription fee to each subscriber that has one, and resolve
  // names for the per-subscriber breakdown.
  const subscriberIds = Object.keys(perSubscriber).map(Number);
  let usersById = {};
  if (subscriberIds.length > 0) {
    const { data: users } = await supabase
      .from('user')
      .select('id, first_name, last_name')
      .in('id', subscriberIds);
    usersById = Object.fromEntries((users || []).map((u) => [u.id, u]));
  }

  const bySubscriber = Object.values(perSubscriber)
    .map((s) => {
      const u = usersById[s.subscriber_num];
      return {
        subscriber_num: s.subscriber_num,
        name: u ? `${u.first_name} ${u.last_name}` : `#${s.subscriber_num}`,
        parkings: s.parkings,
        revenue: s.revenue,
      };
    })
    .sort((a, b) => b.revenue - a.revenue);

  const totalRevenue =
    parkingRevenue + extensionRevenue + lateRevenue + subscriptionRevenue;

  const daily = Object.entries(dailyMap).map(([date, revenue]) => ({
    date,
    revenue,
  }));

  const averagePerSubscriber =
    activeSubsNum > 0 ? totalRevenue / activeSubsNum : 0;

  return {
    month: range.monthStr,
    currency: PRICING.CURRENCY,
    rates: {
      hourly_rate: PRICING.HOURLY_RATE,
      late_fine: PRICING.LATE_FINE,
      subscription_fee: PRICING.SUBSCRIPTION_FEE,
    },
    total_revenue: totalRevenue,
    parking_revenue: parkingRevenue,
    extension_revenue: extensionRevenue,
    late_revenue: lateRevenue,
    subscription_revenue: subscriptionRevenue,
    total_late_count: totalLateCount,
    active_subscribers: activeSubsNum,
    average_per_subscriber: averagePerSubscriber,
    daily,
    by_subscriber: bySubscriber,
  };
};
