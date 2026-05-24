import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  PlusSquare,
  MinusSquare,
  BarChart3,
  Users,
  Car,
  TrendingUp,
  Clock,
  ArrowRight,
  Activity,
  Wrench,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  ResponsiveContainer,
  XAxis,
  Tooltip,
} from 'recharts';
import { format } from 'date-fns';

import { useAuthStore } from '@/store/authStore';
import { facilityApi } from '@/api/facility.api';
import { subscriberApi } from '@/api/subscriber.api';
import { parkingApi } from '@/api/parking.api';
import { reportsApi } from '@/api/reports.api';
import { useFacilityLoad } from '@/hooks/useParking';
import { formatDuration } from '@/utils/formatters';

import { PageHeader, SectionHeader } from '@/components/ui/PageHeader';
import { BentoGrid, BentoCard } from '@/components/ui/Bento';
import { StatTile } from '@/components/ui/StatTile';
import { Badge } from '@/components/ui/Badge';
import { GlowOrbs } from '@/components/ui/GlowOrbs';
import { RadialGauge } from '@/components/charts/RadialGauge';
import { OccupancyDonut } from '@/components/charts/OccupancyDonut';
import { HourHeatmap } from '@/components/charts/HourHeatmap';
import { ParkingLot3D, type ParkingSpot3D } from '@/components/3d/ParkingLot3D';

const quickActions = [
  {
    to: '/manager/reports',
    title: 'View reports',
    description: 'Occupancy · Behavior · Reservations',
    icon: BarChart3,
    tone: 'brand' as const,
  },
  {
    to: '/manager/add-facility',
    title: 'Add facility',
    description: 'Provision new spaces or installers',
    icon: PlusSquare,
    tone: 'success' as const,
  },
  {
    to: '/manager/remove-facility',
    title: 'Remove facility',
    description: 'Decommission spaces or installers',
    icon: MinusSquare,
    tone: 'danger' as const,
  },
];

export default function ManagerDashboard() {
  const user = useAuthStore((s) => s.user);
  const load = useFacilityLoad(15_000);

  const occupancy = useQuery({
    queryKey: ['reports', 'occupancy', 'this-month'],
    queryFn: () => reportsApi.occupancy(),
    refetchInterval: 5 * 60_000,
  });

  const behavior = useQuery({
    queryKey: ['reports', 'behavior', 'this-month'],
    queryFn: () => reportsApi.behavior(),
    refetchInterval: 5 * 60_000,
  });

  const subscribers = useQuery({
    queryKey: ['subscribers', 'list'],
    queryFn: () => subscriberApi.list(),
    refetchInterval: 60_000,
  });

  const active = useQuery({
    queryKey: ['parking', 'active'],
    queryFn: () => parkingApi.active(),
    refetchInterval: 10_000,
  });

  const installers = useQuery({
    queryKey: ['facility', 'installers'],
    queryFn: () => facilityApi.listInstallers(),
    refetchInterval: 30_000,
  });

  const spaces = useQuery({
    queryKey: ['facility', 'spaces'],
    queryFn: () => facilityApi.listSpaces(),
    refetchInterval: 20_000,
  });

  let peakHour: number | null = null;
  if (occupancy.data?.hourly_heatmap) {
    let bestIdx = 0;
    let best = -1;
    occupancy.data.hourly_heatmap.forEach((v, i) => {
      if (v > best) {
        best = v;
        bestIdx = i;
      }
    });
    if (best > 0) peakHour = bestIdx;
  }

  const totalSubs = subscribers.data?.length ?? 0;
  const activeSubs =
    subscribers.data?.filter((s) => s.subscriber?.status === 'active').length ??
    0;

  const sparkDaily = (occupancy.data?.daily || []).map((d) => ({
    date: d.date,
    value: d.occupancy,
  }));

  const lotSpots = useMemo<ParkingSpot3D[]>(() => {
    const fromApi = spaces.data ?? [];
    if (fromApi.length === 0) return [];
    return fromApi.map((s) => ({
      space_number: s.space_number,
      is_occupied: s.in_use,
      is_reserved: s.reserved,
      location: s.location,
      occupant_name: s.occupant_name,
    }));
  }, [spaces.data]);

  return (
    <div className="space-y-6 md:space-y-8">
      <PageHeader
        eyebrow="Manager console"
        title={
          <>
            Good day, <span className="text-gradient-brand">{user?.first_name}</span>
          </>
        }
        description="Real-time facility state, monthly trends and operational controls."
        actions={
          <>
            <Badge tone="success" dot size="lg">
              Live
            </Badge>
            <Link
              to="/manager/reports"
              className="inline-flex items-center gap-2 h-11 px-5 rounded-2xl bg-ink-900 text-white font-semibold text-sm shadow-elevated hover:bg-ink-800"
            >
              <BarChart3 className="h-4 w-4" />
              Reports
            </Link>
          </>
        }
      />

      <BentoGrid>
        {/* Occupancy gauge — hero */}
        <BentoCard
          span="col-span-2 md:col-span-3 lg:col-span-4"
          tone="ink"
          padding="lg"
          rowSpan="row-span-2"
          delay={0}
          className="relative overflow-hidden min-h-[420px] flex flex-col"
        >
          <GlowOrbs variant="brand" />
          <div className="relative flex items-center justify-between mb-2">
            <Badge tone="ink" size="md" className="bg-white/10 text-white border-white/15">
              This month
            </Badge>
            <Activity className="h-4 w-4 text-white/50" />
          </div>
          <h3 className="relative font-display text-lg font-semibold text-white tracking-tight">
            Avg occupancy
          </h3>
          <p className="relative text-xs text-white/60 mt-0.5">
            Compared with prior month
          </p>

          <div className="relative flex-1 flex items-center justify-center my-4">
            <RadialGauge
              value={occupancy.data?.average_occupancy ?? 0}
              size={200}
              thickness={16}
              tone="brand"
              inverted
              label="Avg"
              sublabel={`${occupancy.data?.peak_hours_occupancy?.toFixed(0) ?? '—'}% peak`}
            />
          </div>

          {sparkDaily.length > 1 && (
            <div className="relative h-20 -mx-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={sparkDaily}>
                  <defs>
                    <linearGradient id="dash-spark" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#8c84ff" stopOpacity={0.55} />
                      <stop offset="100%" stopColor="#8c84ff" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <Tooltip
                    contentStyle={{
                      borderRadius: 10,
                      border: '1px solid rgba(255,255,255,0.1)',
                      background: '#0d0d18',
                      color: '#fff',
                      fontSize: 11,
                      padding: '6px 10px',
                    }}
                    labelFormatter={(d) => format(new Date(d), 'MMM d')}
                    formatter={(v) => [`${Math.round(Number(v))}%`, 'Occupancy']}
                  />
                  <XAxis dataKey="date" hide />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="#a8a1ff"
                    strokeWidth={2.2}
                    fill="url(#dash-spark)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </BentoCard>

        {/* 3D lot — hero */}
        <BentoCard
          span="col-span-2 md:col-span-3 lg:col-span-8"
          tone="surface"
          padding="lg"
          rowSpan="row-span-2"
          delay={0.05}
          className="min-h-[420px] flex flex-col"
        >
          <SectionHeader
            title="Live 3D Parking Map"
            description="Drag to orbit · scroll to zoom"
            actions={
              <div className="flex items-center gap-2">
                <Badge tone="success" dot size="md">
                  {load.data?.free ?? 0} free
                </Badge>
                <Badge tone="danger" dot size="md">
                  {load.data?.occupied ?? 0} occupied
                </Badge>
              </div>
            }
          />
          <div className="flex-1 rounded-2xl overflow-hidden bg-gradient-to-br from-ink-800 to-ink-900 border border-surface-200">
            {lotSpots.length > 0 ? (
              <ParkingLot3D spots={lotSpots} cols={8} />
            ) : (
              <div className="h-full flex items-center justify-center text-white/50 text-sm">
                Loading facility…
              </div>
            )}
          </div>
        </BentoCard>

        {/* KPI tiles */}
        <BentoCard span="col-span-2 md:col-span-3 lg:col-span-3" delay={0.08}>
          <StatTile
            label="Free now"
            value={
              load.isLoading
                ? '—'
                : `${load.data?.free ?? 0} / ${load.data?.total ?? 0}`
            }
            hint={`${load.data?.occupancy_percent?.toFixed(0) ?? 0}% occupied`}
            icon={Car}
            iconTone="success"
            loading={load.isLoading}
          />
        </BentoCard>
        <BentoCard span="col-span-2 md:col-span-3 lg:col-span-3" delay={0.1}>
          <StatTile
            label="Active subscribers"
            value={subscribers.isLoading ? '—' : activeSubs}
            hint={`${totalSubs - activeSubs} inactive · ${totalSubs} total`}
            icon={Users}
            iconTone="info"
            loading={subscribers.isLoading}
          />
        </BentoCard>
        <BentoCard span="col-span-2 md:col-span-3 lg:col-span-3" delay={0.12}>
          <StatTile
            label="Avg duration"
            value={
              behavior.isLoading
                ? '—'
                : behavior.data
                ? formatDuration(behavior.data.average_duration_hours * 60)
                : '—'
            }
            hint={
              behavior.data
                ? `${behavior.data.total_parkings} sessions / mo`
                : undefined
            }
            icon={Clock}
            iconTone="accent"
            loading={behavior.isLoading}
          />
        </BentoCard>
        <BentoCard span="col-span-2 md:col-span-3 lg:col-span-3" delay={0.14}>
          <StatTile
            label="Peak hour"
            value={
              peakHour != null ? `${String(peakHour).padStart(2, '0')}:00` : '—'
            }
            hint="Highest hourly load"
            icon={TrendingUp}
            iconTone="brand"
            loading={occupancy.isLoading}
          />
        </BentoCard>

        {/* Hourly heatmap — wide */}
        <BentoCard
          span="col-span-2 md:col-span-6 lg:col-span-8"
          tone="surface"
          delay={0.16}
        >
          <SectionHeader
            title="Hourly occupancy heatmap"
            description="Darker = busier hour"
          />
          <HourHeatmap values={occupancy.data?.hourly_heatmap ?? new Array(24).fill(0)} />
        </BentoCard>

        {/* Duration donut */}
        <BentoCard
          span="col-span-2 md:col-span-3 lg:col-span-4"
          tone="surface"
          delay={0.18}
          className="flex flex-col items-center"
        >
          <SectionHeader
            title="Session duration"
            description="Distribution this month"
            className="w-full"
          />
          <OccupancyDonut
            size={180}
            segments={[
              {
                label: '< 1h',
                value: behavior.data?.distribution.up_to_1h ?? 0,
                color: '#10b981',
              },
              {
                label: '1–4h',
                value: behavior.data?.distribution.between_1_and_4h ?? 0,
                color: '#5d52f7',
              },
              {
                label: '> 4h',
                value: behavior.data?.distribution.over_4h ?? 0,
                color: '#f97316',
              },
            ]}
            centerValue={behavior.data?.total_parkings ?? 0}
            centerLabel="Sessions"
          />
          <div className="grid grid-cols-3 gap-1.5 w-full mt-4">
            <Legend tone="bg-success-500" label="< 1h" value={`${behavior.data?.distribution_percent.up_to_1h?.toFixed(0) ?? 0}%`} />
            <Legend tone="bg-brand-500" label="1–4h" value={`${behavior.data?.distribution_percent.between_1_and_4h?.toFixed(0) ?? 0}%`} />
            <Legend tone="bg-accent-500" label="> 4h" value={`${behavior.data?.distribution_percent.over_4h?.toFixed(0) ?? 0}%`} />
          </div>
        </BentoCard>

        {/* Installers status */}
        <BentoCard
          span="col-span-2 md:col-span-3 lg:col-span-4"
          tone="surface"
          delay={0.2}
        >
          <SectionHeader
            title="Installers"
            description="Robotic shuttle status"
            actions={
              <Badge tone="brand" size="md">
                {installers.data?.filter((i) => i.is_free).length ?? 0} / {installers.data?.length ?? 0}
              </Badge>
            }
          />
          <ul className="space-y-2 mt-2">
            {(installers.data ?? []).slice(0, 5).map((i) => (
              <li
                key={i.installer_id}
                className="flex items-center justify-between p-2.5 rounded-xl bg-surface-50 border border-surface-200"
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className={`h-2 w-2 rounded-full ${
                      i.is_free ? 'bg-success-500' : 'bg-accent-500 animate-pulse'
                    }`}
                  />
                  <span className="text-sm font-medium text-ink-800 truncate">
                    {i.installer_name}
                  </span>
                </div>
                <Badge tone={i.is_free ? 'success' : 'warning'} size="sm">
                  {i.is_free ? 'Idle' : 'Busy'}
                </Badge>
              </li>
            ))}
            {(installers.data?.length ?? 0) === 0 && (
              <li className="text-sm text-ink-500 py-4 text-center">
                No installers configured.
              </li>
            )}
          </ul>
        </BentoCard>

        {/* Active parkings live list */}
        <BentoCard
          span="col-span-2 md:col-span-3 lg:col-span-4"
          tone="surface"
          delay={0.22}
        >
          <SectionHeader
            title="Active parkings"
            description="Live"
            actions={
              <Link
                to="/manager/active-parkings"
                className="text-xs font-semibold text-brand-700 hover:text-brand-800 inline-flex items-center gap-1"
              >
                View all <ArrowRight className="h-3 w-3" />
              </Link>
            }
          />
          <p className="font-display text-4xl font-bold tabular text-ink-900 leading-none">
            {active.data?.length ?? 0}
          </p>
          <p className="text-xs text-ink-500 mt-1">cars currently parked</p>
          <div className="mt-4 space-y-1.5">
            {(active.data ?? []).slice(0, 3).map((p) => (
              <div
                key={p.parking_code}
                className="flex items-center justify-between p-2 rounded-lg bg-surface-50 border border-surface-200"
              >
                <span className="text-xs font-mono font-semibold text-ink-700">
                  #{p.parking_code}
                </span>
                <span className="text-xs text-ink-500 truncate">
                  {p.user ? `${p.user.first_name} ${p.user.last_name}` : '—'}
                </span>
                <Badge tone="brand" size="sm">space {p.parking_space}</Badge>
              </div>
            ))}
          </div>
        </BentoCard>

        {/* Quick actions */}
        {quickActions.map((a, i) => (
          <BentoCard
            key={a.to}
            span="col-span-2 md:col-span-3 lg:col-span-4"
            tone={a.tone}
            padding="lg"
            interactive
            delay={0.24 + i * 0.04}
            className="relative overflow-hidden min-h-[150px] cursor-pointer"
          >
            <GlowOrbs variant={a.tone === 'brand' ? 'brand' : a.tone === 'success' ? 'success' : 'accent'} />
            <Link to={a.to} className="relative flex flex-col h-full">
              <div className="flex items-center justify-between mb-4">
                <span className="h-11 w-11 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center">
                  <a.icon className="h-5 w-5 text-white" strokeWidth={2.4} />
                </span>
                <ArrowRight className="h-5 w-5 text-white/70" />
              </div>
              <h3 className="font-display text-xl font-bold tracking-tight leading-tight">
                {a.title}
              </h3>
              <p className="text-sm text-white/85 mt-auto pt-3">{a.description}</p>
            </Link>
          </BentoCard>
        ))}

        {/* Maintenance shortcut */}
        <BentoCard
          span="col-span-2 md:col-span-6 lg:col-span-12"
          tone="glass"
          delay={0.36}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-3"
        >
          <div className="flex items-center gap-3">
            <span className="h-11 w-11 rounded-2xl bg-warning-50 border border-warning-100 flex items-center justify-center text-warning-600">
              <Wrench className="h-5 w-5" strokeWidth={2.2} />
            </span>
            <div>
              <p className="font-display font-semibold text-ink-900">
                Need maintenance?
              </p>
              <p className="text-sm text-ink-500">
                Call a technician on-site — the call surfaces the technician's
                phone number to dispatch immediately.
              </p>
            </div>
          </div>
          <Link
            to="/manager/maintenance"
            className="inline-flex items-center gap-2 h-11 px-5 rounded-2xl bg-gradient-to-br from-danger-500 to-danger-700 text-white font-semibold text-sm shadow-[0_8px_24px_-8px_rgba(244,63,94,0.55)] hover:-translate-y-0.5 transition-transform"
          >
            <Wrench className="h-4 w-4" />
            Call technician
          </Link>
        </BentoCard>
      </BentoGrid>
    </div>
  );
}

function Legend({
  tone,
  label,
  value,
}: {
  tone: string;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl bg-surface-50 border border-surface-200 p-2 text-center">
      <div className="flex items-center justify-center gap-1.5">
        <span className={`h-2 w-2 rounded-full ${tone}`} />
        <span className="text-[10px] uppercase font-semibold text-ink-500 tracking-wider">
          {label}
        </span>
      </div>
      <p className="font-display text-sm font-bold text-ink-900 tabular mt-0.5">{value}</p>
    </div>
  );
}

