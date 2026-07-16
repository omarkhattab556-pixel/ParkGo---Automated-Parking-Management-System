import { useQuery } from '@tanstack/react-query';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from 'recharts';
import { format } from 'date-fns';

import { ChartSkeleton, StatStripSkeleton } from '@/components/common/Skeleton';
import { reportsApi } from '@/api/reports.api';

// One consistent palette across all revenue sources.
const SOURCE_COLORS = {
  parking: '#5d52f7', // brand
  extension: '#22c55e', // green
  late: '#f43f5e', // danger
  subscription: '#f59e0b', // amber
};

const tooltipStyle = {
  borderRadius: 14,
  border: '1px solid var(--color-surface-200)',
  fontSize: 12,
  boxShadow: '0 8px 28px rgba(13,13,24,0.10)',
};

function money(currency: string, amount: number): string {
  const symbol = currency === 'ILS' ? '₪' : '';
  return `${symbol}${amount.toLocaleString(undefined, {
    maximumFractionDigits: 0,
  })}`;
}

function Stat({
  label,
  value,
  hint,
  accent,
}: {
  label: string;
  value: string;
  hint?: string;
  accent?: string;
}) {
  return (
    <div className="rounded-3xl bg-surface-0 border border-surface-200 p-5 shadow-card">
      <p className="text-[11px] uppercase tracking-[0.08em] text-ink-500 font-semibold">
        {label}
      </p>
      <p
        className="font-display text-3xl font-bold tabular mt-1"
        style={{ color: accent || 'var(--color-ink-900)' }}
      >
        {value}
      </p>
      {hint && <p className="text-xs text-ink-500 mt-1">{hint}</p>}
    </div>
  );
}

export function RevenueReport({ month }: { month: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ['reports', 'revenue', month],
    queryFn: () => reportsApi.revenue(month),
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

  const cur = data.currency;

  const sourceData = [
    { name: 'Parking', value: data.parking_revenue, color: SOURCE_COLORS.parking },
    {
      name: 'Extensions',
      value: data.extension_revenue,
      color: SOURCE_COLORS.extension,
    },
    { name: 'Late fines', value: data.late_revenue, color: SOURCE_COLORS.late },
    {
      name: 'Subscriptions',
      value: data.subscription_revenue,
      color: SOURCE_COLORS.subscription,
    },
  ].filter((d) => d.value > 0);

  const dailyData = data.daily.map((d) => ({
    day: format(new Date(d.date), 'd'),
    revenue: Math.round(d.revenue),
  }));

  const topSubscribers = data.by_subscriber.slice(0, 10).map((s) => ({
    name: s.name,
    revenue: Math.round(s.revenue),
    parkings: s.parkings,
  }));

  return (
    <div className="space-y-6">
      {/* KPI strip */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat
          label="Total revenue"
          value={money(cur, data.total_revenue)}
          hint="this month"
          accent={SOURCE_COLORS.parking}
        />
        <Stat
          label="Avg / subscriber"
          value={money(cur, data.average_per_subscriber)}
          hint={`${data.active_subscribers} active`}
        />
        <Stat
          label="Late fines"
          value={money(cur, data.late_revenue)}
          hint={`${data.total_late_count} late returns`}
          accent={SOURCE_COLORS.late}
        />
        <Stat
          label="Subscriptions"
          value={money(cur, data.subscription_revenue)}
          hint={`${money(cur, data.rates.subscription_fee)} each`}
          accent={SOURCE_COLORS.subscription}
        />
      </section>

      {/* Source breakdown + daily trend */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="rounded-3xl bg-surface-0 border border-surface-200 p-6 shadow-card">
          <h3 className="font-display text-base font-semibold text-ink-900 mb-3">
            Revenue by source
          </h3>
          {sourceData.length === 0 ? (
            <p className="text-sm text-ink-500 py-10 text-center">
              No revenue recorded this month.
            </p>
          ) : (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={sourceData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={3}
                  >
                    {sourceData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={tooltipStyle}
                    formatter={(v) => money(cur, Number(v))}
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
            Revenue per day
          </h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailyData}>
                <defs>
                  <linearGradient id="revArea" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="0%"
                      stopColor={SOURCE_COLORS.parking}
                      stopOpacity={0.5}
                    />
                    <stop
                      offset="100%"
                      stopColor={SOURCE_COLORS.parking}
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="var(--color-surface-200)"
                />
                <XAxis
                  dataKey="day"
                  tick={{ fontSize: 11, fill: 'var(--color-ink-500)' }}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: 'var(--color-ink-500)' }}
                  width={48}
                  tickFormatter={(v) => money(cur, Number(v))}
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  labelFormatter={(d) => `Day ${d}`}
                  formatter={(v) => money(cur, Number(v))}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke={SOURCE_COLORS.parking}
                  strokeWidth={2.5}
                  fill="url(#revArea)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      {/* Revenue by subscriber */}
      <section className="rounded-3xl bg-surface-0 border border-surface-200 p-6 shadow-card">
        <h3 className="font-display text-base font-semibold text-ink-900 mb-3">
          Top subscribers by revenue
        </h3>
        {topSubscribers.length === 0 ? (
          <p className="text-sm text-ink-500 py-10 text-center">
            No subscriber activity this month.
          </p>
        ) : (
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={topSubscribers}
                layout="vertical"
                margin={{ left: 24, right: 16 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="var(--color-surface-200)"
                  horizontal={false}
                />
                <XAxis
                  type="number"
                  tick={{ fontSize: 11, fill: 'var(--color-ink-500)' }}
                  tickFormatter={(v) => money(cur, Number(v))}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fontSize: 11, fill: 'var(--color-ink-500)' }}
                  width={120}
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(v) => money(cur, Number(v))}
                />
                <Bar
                  dataKey="revenue"
                  fill={SOURCE_COLORS.parking}
                  radius={[0, 8, 8, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </section>
    </div>
  );
}
