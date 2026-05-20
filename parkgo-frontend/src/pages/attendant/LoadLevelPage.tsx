import { useQuery } from '@tanstack/react-query';
import { Gauge as GaugeIcon } from 'lucide-react';
import {
  ResponsiveContainer,
  Tooltip,
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
} from 'recharts';
import { format } from 'date-fns';

import { facilityApi } from '@/api/facility.api';
import { ChartSkeleton } from '@/components/common/Skeleton';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { PageHeader, SectionHeader } from '@/components/ui/PageHeader';
import { RadialGauge } from '@/components/charts/RadialGauge';
import { OccupancyDonut } from '@/components/charts/OccupancyDonut';

export default function LoadLevelPage() {
  const load = useQuery({
    queryKey: ['facility', 'load'],
    queryFn: () => facilityApi.getLoad(),
    refetchInterval: 5000,
  });

  const hourly = useQuery({
    queryKey: ['facility', 'hourly', 24],
    queryFn: () => facilityApi.getHourly(24),
    refetchInterval: 60_000,
  });

  const timelineData = (hourly.data || []).map((p) => ({
    hour: format(new Date(p.hour), 'HH:mm'),
    occupancy: Math.round(p.occupancy_percent),
    occupied: p.occupied,
  }));

  const occupancyPct = load.data?.occupancy_percent ?? 0;
  const tone = occupancyPct < 50 ? 'success' : occupancyPct < 80 ? 'accent' : 'danger';

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Operations"
        title={
          <span className="inline-flex items-center gap-3">
            <span className="h-10 w-10 rounded-2xl bg-accent-50 border border-accent-100 flex items-center justify-center text-accent-600">
              <GaugeIcon className="h-5 w-5" />
            </span>
            Load level
          </span>
        }
        description="Live gauge refreshes every 5 seconds"
        actions={<Badge tone="success" dot size="lg">Live</Badge>}
      />

      {load.isLoading && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <ChartSkeleton height={300} />
          <ChartSkeleton height={300} />
        </div>
      )}

      {load.data && (
        <>
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Gauge */}
            <Card variant="default" padding="xl" className="flex flex-col items-center">
              <SectionHeader title="Occupancy" className="w-full" />
              <div className="my-2">
                <RadialGauge
                  value={occupancyPct}
                  size={220}
                  thickness={18}
                  tone={tone}
                  label="Occupied"
                  sublabel={`${load.data.free} free of ${load.data.total}`}
                />
              </div>
              <div className="grid grid-cols-3 gap-3 mt-3 text-center w-full">
                <div className="rounded-2xl bg-surface-50 border border-surface-200 p-3">
                  <p className="text-[10px] uppercase tracking-wider text-ink-500 font-semibold">Occupied</p>
                  <p className="font-display text-xl font-bold text-ink-900 tabular">{load.data.occupied}</p>
                </div>
                <div className="rounded-2xl bg-warning-50 border border-warning-100 p-3">
                  <p className="text-[10px] uppercase tracking-wider text-warning-600 font-semibold">Reserved</p>
                  <p className="font-display text-xl font-bold text-warning-600 tabular">{load.data.reserved}</p>
                </div>
                <div className="rounded-2xl bg-success-50 border border-success-100 p-3">
                  <p className="text-[10px] uppercase tracking-wider text-success-700 font-semibold">Free</p>
                  <p className="font-display text-xl font-bold text-success-700 tabular">{load.data.free}</p>
                </div>
              </div>
            </Card>

            {/* Donut */}
            <Card variant="default" padding="xl" className="flex flex-col items-center">
              <SectionHeader title="Distribution" className="w-full" />
              <div className="my-2 flex-1 flex items-center justify-center">
                <OccupancyDonut
                  size={220}
                  thickness={22}
                  segments={[
                    { label: 'Occupied', value: load.data.occupied, color: '#5d52f7' },
                    { label: 'Reserved', value: load.data.reserved, color: '#f59e0b' },
                    { label: 'Free', value: load.data.free, color: '#10b981' },
                  ]}
                  centerValue={load.data.total}
                  centerLabel="Total spaces"
                />
              </div>
              <div className="grid grid-cols-3 gap-2 w-full mt-3">
                <Legend color="bg-brand-500" label="Occupied" value={load.data.occupied} />
                <Legend color="bg-warning-500" label="Reserved" value={load.data.reserved} />
                <Legend color="bg-success-500" label="Free" value={load.data.free} />
              </div>
            </Card>
          </section>

          {/* 24h timeline */}
          <Card variant="default" padding="xl">
            <SectionHeader
              title="Last 24 hours · occupancy %"
              actions={
                hourly.isFetching ? (
                  <Badge tone="neutral" size="md">Refreshing…</Badge>
                ) : (
                  <Badge tone="neutral" size="md">Updated</Badge>
                )
              }
            />
            {hourly.isLoading ? (
              <ChartSkeleton height={288} />
            ) : (
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={timelineData}>
                    <defs>
                      <linearGradient id="loadColor" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#5d52f7" stopOpacity={0.5} />
                        <stop offset="100%" stopColor="#5d52f7" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-surface-200)" />
                    <XAxis
                      dataKey="hour"
                      tick={{ fontSize: 11, fill: 'var(--color-ink-500)' }}
                      interval="preserveStartEnd"
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: 'var(--color-ink-500)' }}
                      domain={[0, 100]}
                      unit="%"
                    />
                    <Tooltip
                      contentStyle={{
                        borderRadius: 14,
                        border: '1px solid var(--color-surface-200)',
                        fontSize: 12,
                        boxShadow: '0 8px 28px rgba(13,13,24,0.10)',
                      }}
                      formatter={(v) => `${v}%`}
                    />
                    <Area
                      type="monotone"
                      dataKey="occupancy"
                      stroke="#5d52f7"
                      strokeWidth={2.5}
                      fill="url(#loadColor)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  );
}

function Legend({
  color,
  label,
  value,
}: {
  color: string;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-xl bg-surface-50 border border-surface-200 p-2 text-center">
      <div className="flex items-center justify-center gap-1.5">
        <span className={`h-2 w-2 rounded-full ${color}`} />
        <span className="text-[10px] uppercase font-semibold text-ink-500 tracking-wider">
          {label}
        </span>
      </div>
      <p className="font-display text-sm font-bold text-ink-900 tabular mt-0.5">{value}</p>
    </div>
  );
}
