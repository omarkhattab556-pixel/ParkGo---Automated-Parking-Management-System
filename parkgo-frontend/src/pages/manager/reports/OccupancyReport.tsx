import { useQuery } from '@tanstack/react-query';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { format } from 'date-fns';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

import { ChartSkeleton, StatStripSkeleton } from '@/components/common/Skeleton';
import { reportsApi } from '@/api/reports.api';
import { cn } from '@/lib/utils';

function Stat({
  label,
  value,
  hint,
  trend,
}: {
  label: string;
  value: string;
  hint?: string;
  trend?: 'up' | 'down' | 'flat';
}) {
  return (
    <div className="rounded-3xl bg-surface-0 border border-surface-200 p-5 shadow-card">
      <p className="text-[11px] uppercase tracking-[0.08em] text-ink-500 font-semibold">
        {label}
      </p>
      <div className="flex items-baseline gap-2 mt-1">
        <p className="font-display text-3xl font-bold text-ink-900 tabular">{value}</p>
        {trend === 'up' && <TrendingUp className="h-5 w-5 text-success-500" />}
        {trend === 'down' && <TrendingDown className="h-5 w-5 text-danger-500" />}
        {trend === 'flat' && <Minus className="h-5 w-5 text-ink-400" />}
      </div>
      {hint && <p className="text-xs text-ink-500 mt-1">{hint}</p>}
    </div>
  );
}

export function OccupancyReport({ month }: { month: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ['reports', 'occupancy', month],
    queryFn: () => reportsApi.occupancy(month),
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <StatStripSkeleton count={3} />
        <ChartSkeleton height={300} />
        <ChartSkeleton height={200} />
      </div>
    );
  }
  if (!data) return null;

  const dailyData = data.daily.map((d) => ({
    day: format(new Date(d.date), 'd'),
    occupancy: Math.round(d.occupancy),
  }));

  const peakVsOff =
    data.peak_hours_occupancy > data.off_peak_occupancy
      ? 'up'
      : data.peak_hours_occupancy < data.off_peak_occupancy
      ? 'down'
      : 'flat';

  return (
    <div className="space-y-6">
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Stat
          label="Average monthly occupancy"
          value={`${data.average_occupancy.toFixed(0)}%`}
          hint={`across ${data.total_spaces} spaces`}
        />
        <Stat
          label="Peak hours"
          value={`${data.peak_hours_occupancy.toFixed(0)}%`}
          hint="07–10 & 17–20"
          trend={peakVsOff}
        />
        <Stat
          label="Off-peak hours"
          value={`${data.off_peak_occupancy.toFixed(0)}%`}
          hint="00–05 & 22–23"
        />
      </section>

      <section className="rounded-3xl bg-surface-0 border border-surface-200 p-6 shadow-card">
        <h3 className="font-display text-base font-semibold text-ink-900 mb-3">
          Daily occupancy this month
        </h3>
        {dailyData.length === 0 ? (
          <p className="text-sm text-slate-500 py-10 text-center">No data yet.</p>
        ) : (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyData}>
                <defs>
                  <linearGradient id="dailyBar" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#5d52f7" />
                    <stop offset="100%" stopColor="#3a2bc4" />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#64748b' }} />
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
                  labelFormatter={(d) => `Day ${d}`}
                />
                <Bar dataKey="occupancy" fill="url(#dailyBar)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </section>

      <section className="rounded-3xl bg-surface-0 border border-surface-200 p-6 shadow-card">
        <h3 className="font-display text-base font-semibold text-ink-900 mb-3">
          Hourly heatmap (avg occupancy by hour-of-day)
        </h3>
        <div className="grid grid-cols-12 gap-1.5">
          {data.hourly_heatmap.map((v, i) => {
            const intensity = Math.min(1, v / 100);
            return (
              <div
                key={i}
                className="aspect-square rounded-md flex items-end justify-center text-[10px] font-mono font-semibold"
                style={{
                  backgroundColor: `rgba(59, 130, 246, ${0.1 + intensity * 0.9})`,
                  color: intensity > 0.5 ? 'white' : '#1e3a8a',
                }}
                title={`${String(i).padStart(2, '0')}:00 — ${v.toFixed(0)}%`}
              >
                <span className="pb-1">{String(i).padStart(2, '0')}</span>
              </div>
            );
          })}
        </div>
        <div className="mt-4 flex items-center gap-2 text-xs text-slate-500">
          <span>Less</span>
          <div className="flex gap-1">
            {[0.15, 0.35, 0.55, 0.75, 0.95].map((alpha, idx) => (
              <div
                key={idx}
                className="h-4 w-4 rounded"
                style={{ backgroundColor: `rgba(59, 130, 246, ${alpha})` }}
              />
            ))}
          </div>
          <span>More</span>
        </div>
      </section>

      {/* Print-only signature line */}
      <p className={cn('hidden print:block text-xs text-slate-400')}>
        Generated {new Date().toLocaleString()} — ParkGo Occupancy Report
      </p>
    </div>
  );
}
