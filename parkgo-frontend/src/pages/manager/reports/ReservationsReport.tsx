import { useQuery } from '@tanstack/react-query';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from 'recharts';
import { format } from 'date-fns';

import { ChartSkeleton, StatStripSkeleton } from '@/components/common/Skeleton';
import { reportsApi } from '@/api/reports.api';

const STATUS_COLORS = {
  used: '#10b981',
  cancelled: '#f43f5e',
  noshow: '#94a3b8',
};

function Stat({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-3xl bg-surface-0 border border-surface-200 p-5 shadow-card">
      <p className="text-[11px] uppercase tracking-[0.08em] text-ink-500 font-semibold">
        {label}
      </p>
      <p className="font-display text-3xl font-bold text-ink-900 tabular mt-1">
        {value}
      </p>
      {hint && <p className="text-xs text-ink-500 mt-1">{hint}</p>}
    </div>
  );
}

export function ReservationsReport({ month }: { month: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ['reports', 'reservations', month],
    queryFn: () => reportsApi.reservations(month),
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <StatStripSkeleton count={4} />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <ChartSkeleton height={300} />
          <ChartSkeleton height={300} />
        </div>
      </div>
    );
  }
  if (!data) return null;

  const noShow =
    data.total_reservations - data.used_reservations - data.cancelled_reservations;

  const donutData = [
    { name: 'Used', value: data.used_reservations, color: STATUS_COLORS.used },
    {
      name: 'Cancelled',
      value: data.cancelled_reservations,
      color: STATUS_COLORS.cancelled,
    },
    { name: 'No-show / pending', value: Math.max(0, noShow), color: STATUS_COLORS.noshow },
  ].filter((d) => d.value > 0);

  const timelineData = data.daily.map((d) => ({
    day: format(new Date(d.date), 'd'),
    reservations: d.count,
  }));

  return (
    <div className="space-y-6">
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat
          label="Total reservations"
          value={String(data.total_reservations)}
          hint="this month"
        />
        <Stat
          label="Used"
          value={`${data.used_percent.toFixed(0)}%`}
          hint={`${data.used_reservations} reservations`}
        />
        <Stat
          label="Cancelled"
          value={`${data.cancelled_percent.toFixed(0)}%`}
          hint={`${data.cancelled_reservations} reservations`}
        />
        <Stat
          label="Reservation share"
          value={`${data.reservation_occupancy_share.toFixed(0)}%`}
          hint="of total parkings this month"
        />
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="rounded-3xl bg-surface-0 border border-surface-200 p-6 shadow-card">
          <h3 className="font-display text-base font-semibold text-ink-900 mb-3">
            Reservation outcomes
          </h3>
          {donutData.length === 0 ? (
            <p className="text-sm text-ink-500 py-10 text-center">
              No reservations yet.
            </p>
          ) : (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={donutData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={3}
                  >
                    {donutData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      borderRadius: 14,
                      border: '1px solid var(--color-surface-200)',
                      fontSize: 12,
                      boxShadow: '0 8px 28px rgba(13,13,24,0.10)',
                    }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    wrapperStyle={{ fontSize: 12 }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="rounded-3xl bg-surface-0 border border-surface-200 p-6 shadow-card">
          <h3 className="font-display text-base font-semibold text-ink-900 mb-3">
            Reservations per day
          </h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timelineData}>
                <defs>
                  <linearGradient id="resArea" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-surface-200)" />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: 'var(--color-ink-500)' }} />
                <YAxis
                  tick={{ fontSize: 11, fill: 'var(--color-ink-500)' }}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: 14,
                    border: '1px solid var(--color-surface-200)',
                    fontSize: 12,
                    boxShadow: '0 8px 28px rgba(13,13,24,0.10)',
                  }}
                  labelFormatter={(d) => `Day ${d}`}
                />
                <Area
                  type="monotone"
                  dataKey="reservations"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  fill="url(#resArea)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>
    </div>
  );
}
