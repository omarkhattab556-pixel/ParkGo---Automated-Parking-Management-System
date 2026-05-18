import {
  buildOccupancyReport,
  buildBehaviorReport,
  buildReservationsReport,
} from '../services/reports.service.js';

const escapeCsv = (v) => {
  if (v == null) return '';
  const s = String(v);
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
};

const toCsv = (headers, rows) => {
  const out = [headers.join(',')];
  for (const r of rows) {
    out.push(r.map(escapeCsv).join(','));
  }
  return out.join('\n');
};

export const occupancyReport = async (req, res, next) => {
  try {
    const data = await buildOccupancyReport(req.query.month);
    return res.json(data);
  } catch (err) {
    next(err);
  }
};

export const behaviorReport = async (req, res, next) => {
  try {
    const data = await buildBehaviorReport(req.query.month);
    return res.json(data);
  } catch (err) {
    next(err);
  }
};

export const reservationsReport = async (req, res, next) => {
  try {
    const data = await buildReservationsReport(req.query.month);
    return res.json(data);
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/reports/export/:type?month=YYYY-MM
 *  type ∈ { occupancy | behavior | reservations }
 * Returns text/csv.
 */
export const exportReport = async (req, res, next) => {
  try {
    const { type } = req.params;
    const month = req.query.month;

    let csv = '';
    let filename = '';
    if (type === 'occupancy') {
      const r = await buildOccupancyReport(month);
      const summary = toCsv(
        ['metric', 'value'],
        [
          ['month', r.month],
          ['total_spaces', r.total_spaces],
          ['average_occupancy_percent', r.average_occupancy.toFixed(2)],
          ['peak_hours_occupancy_percent', r.peak_hours_occupancy.toFixed(2)],
          ['off_peak_occupancy_percent', r.off_peak_occupancy.toFixed(2)],
        ]
      );
      const daily = toCsv(
        ['date', 'occupancy_percent'],
        r.daily.map((d) => [d.date, d.occupancy.toFixed(2)])
      );
      const heatmap = toCsv(
        ['hour_of_day', 'occupancy_percent'],
        r.hourly_heatmap.map((v, i) => [i, v.toFixed(2)])
      );
      csv = `# Occupancy Report ${r.month}\n${summary}\n\n# Daily Occupancy\n${daily}\n\n# Hourly Heatmap (avg occupancy by hour-of-day)\n${heatmap}\n`;
      filename = `occupancy-${r.month}.csv`;
    } else if (type === 'behavior') {
      const r = await buildBehaviorReport(month);
      const summary = toCsv(
        ['metric', 'value'],
        [
          ['month', r.month],
          ['total_parkings', r.total_parkings],
          ['average_duration_hours', r.average_duration_hours.toFixed(2)],
          ['extension_rate_percent', r.extension_rate.toFixed(2)],
          ['late_return_rate_percent', r.late_return_rate.toFixed(2)],
        ]
      );
      const dist = toCsv(
        ['bucket', 'count', 'percent'],
        [
          ['up_to_1h', r.distribution.up_to_1h, r.distribution_percent.up_to_1h.toFixed(2)],
          ['1_to_4h', r.distribution.between_1_and_4h, r.distribution_percent.between_1_and_4h.toFixed(2)],
          ['over_4h', r.distribution.over_4h, r.distribution_percent.over_4h.toFixed(2)],
        ]
      );
      csv = `# Behavior Report ${r.month}\n${summary}\n\n# Duration Distribution\n${dist}\n`;
      filename = `behavior-${r.month}.csv`;
    } else if (type === 'reservations') {
      const r = await buildReservationsReport(month);
      const summary = toCsv(
        ['metric', 'value'],
        [
          ['month', r.month],
          ['total_reservations', r.total_reservations],
          ['used_reservations', r.used_reservations],
          ['cancelled_reservations', r.cancelled_reservations],
          ['used_percent', r.used_percent.toFixed(2)],
          ['cancelled_percent', r.cancelled_percent.toFixed(2)],
          ['reservation_occupancy_share_percent', r.reservation_occupancy_share.toFixed(2)],
        ]
      );
      const daily = toCsv(
        ['date', 'reservations'],
        r.daily.map((d) => [d.date, d.count])
      );
      csv = `# Reservations Report ${r.month}\n${summary}\n\n# Daily Reservations\n${daily}\n`;
      filename = `reservations-${r.month}.csv`;
    } else {
      return res.status(400).json({ error: `Unknown report type: ${type}` });
    }

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${filename}"`
    );
    return res.send(csv);
  } catch (err) {
    next(err);
  }
};
