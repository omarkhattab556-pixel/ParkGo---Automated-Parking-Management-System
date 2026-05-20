import { useQuery } from '@tanstack/react-query';
import {
  Pie,
  PieChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from 'recharts';

import { ChartSkeleton, StatStripSkeleton } from '@/components/common/Skeleton';
import { reportsApi } from '@/api/reports.api';
import { formatDuration } from '@/utils/formatters';

const DURATION_COLORS = ['#10b981', '#5d52f7', '#f43f5e'];

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

export function BehaviorReport({ month }: { month: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ['reports', 'behavior', month],
    queryFn: () => reportsApi.behavior(month),
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <StatStripSkeleton count={3} />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <ChartSkeleton height={300} />
          <ChartSkeleton height={300} />
        </div>
      </div>
    );
  }
  if (!data) return null;

  const pieData = [
    { name: 'Up to 1h', value: data.distribution.up_to_1h, pct: data.distribution_percent.up_to_1h },
    { name: '1–4h', value: data.distribution.between_1_and_4h, pct: data.distribution_percent.between_1_and_4h },
    { name: 'Over 4h', value: data.distribution.over_4h, pct: data.distribution_percent.over_4h },
  ].filter((d) => d.value > 0);

  const ratesData = [
    {
      name: 'Extensions',
      value: Math.round(data.extension_rate),
    },
    {
      name: 'Late returns',
      value: Math.round(data.late_return_rate),
    },
  ];

  return (
    <div className="space-y-6">
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Stat
          label="Average duration"
          value={formatDuration(data.average_duration_hours * 60)}
          hint={`${data.total_parkings} sessions this month`}
        />
        <Stat
          label="Extension rate"
          value={`${data.extension_rate.toFixed(0)}%`}
          hint="parkings that requested more time"
        />
        <Stat
          label="Late return rate"
          value={`${data.late_return_rate.toFixed(0)}%`}
          hint="parkings that exceeded the max time"
        />
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="rounded-3xl bg-surface-0 border border-surface-200 p-6 shadow-card">
          <h3 className="font-display text-base font-semibold text-ink-900 mb-3">
            Duration distribution
          </h3>
          {pieData.length === 0 ? (
            <p className="text-sm text-slate-500 py-10 text-center">
              No data yet.
            </p>
          ) : (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={3}
                    label={(entry: { name?: string; pct?: number }) =>
                      `${entry.name}: ${(entry.pct ?? 0).toFixed(0)}%`
                    }
                  >
                    {pieData.map((_, i) => (
                      <Cell key={i} fill={DURATION_COLORS[i]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      borderRadius: 12,
                      border: '1px solid #e2e8f0',
                      fontSize: 12,
                    }}
                    formatter={(v, _n, item: { payload?: { pct?: number } }) =>
                      [`${v} (${item.payload?.pct?.toFixed(0) ?? 0}%)`, item.payload ? 'Count' : '']
                    }
                  />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="rounded-3xl bg-surface-0 border border-surface-200 p-6 shadow-card">
          <h3 className="font-display text-base font-semibold text-ink-900 mb-3">
            Extension & late return rates
          </h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ratesData}>
                <defs>
                  <linearGradient id="extBar" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f97316" />
                    <stop offset="100%" stopColor="#c2410c" />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748b' }} />
                <YAxis
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  domain={[0, 100]}
                  unit="%"
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: 12,
                    border: '1px solid #e2e8f0',
                    fontSize: 12,
                  }}
                  formatter={(v) => `${v}%`}
                />
                <Bar dataKey="value" fill="url(#extBar)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>
    </div>
  );
}
