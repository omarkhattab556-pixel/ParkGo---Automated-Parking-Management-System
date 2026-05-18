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

import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { reportsApi } from '@/api/reports.api';

const STATUS_COLORS = {
  used: '#10b981',
  cancelled: '#ef4444',
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
    <div className="rounded-2xl bg-white border border-slate-100 p-5">
      <p className="text-xs uppercase tracking-wider text-slate-500 font-medium">
        {label}
      </p>
      <p className="text-3xl font-bold text-slate-900 tabular-nums mt-1">
        {value}
      </p>
      {hint && <p className="text-xs text-slate-500 mt-1">{hint}</p>}
    </div>
  );
}

export function ReservationsReport({ month }: { month: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ['reports', 'reservations', month],
    queryFn: () => reportsApi.reservations(month),
  });

  if (isLoading) return <LoadingSpinner />;
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
        <div className="rounded-3xl bg-white border border-slate-100 p-6">
          <h3 className="text-sm font-semibold text-slate-900 mb-3">
            Reservation outcomes
          </h3>
          {donutData.length === 0 ? (
            <p className="text-sm text-slate-500 py-10 text-center">
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
                      borderRadius: 12,
                      border: '1px solid #e2e8f0',
                      fontSize: 12,
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

        <div className="rounded-3xl bg-white border border-slate-100 p-6">
          <h3 className="text-sm font-semibold text-slate-900 mb-3">
            Reservations per day
          </h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timelineData}>
                <defs>
                  <linearGradient id="resArea" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.45} />
                    <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: 12,
                    border: '1px solid #e2e8f0',
                    fontSize: 12,
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
