import { useMemo, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  UserPlus,
  Users,
  Car,
  Gauge,
  Wrench,
  Settings,
  ArrowRight,
  Activity,
  Sparkles,
  Cog,
  Zap,
  AlertTriangle,
  type LucideIcon,
} from 'lucide-react';

import { useAuthStore } from '@/store/authStore';
import { useFacilityLoad } from '@/hooks/useParking';
import { parkingApi } from '@/api/parking.api';
import { facilityApi } from '@/api/facility.api';

import { PageHeader } from '@/components/ui/PageHeader';
import { BentoGrid, BentoCard } from '@/components/ui/Bento';
import { Badge } from '@/components/ui/Badge';
import { GlowOrbs } from '@/components/ui/GlowOrbs';
import { RadialGauge } from '@/components/charts/RadialGauge';
import { ParkingLot3D, type ParkingSpot3D } from '@/components/3d/ParkingLot3D';
import { cn } from '@/lib/utils';

interface Action {
  to: string;
  title: string;
  description: string;
  icon: LucideIcon;
  tone: 'brand' | 'accent' | 'success' | 'danger';
}

const actions: Action[] = [
  {
    to: '/attendant/register',
    title: 'Register subscriber',
    description: 'Add a new subscriber',
    icon: UserPlus,
    tone: 'brand',
  },
  {
    to: '/attendant/active-parkings',
    title: 'Active parkings',
    description: 'Vehicles currently parked',
    icon: Car,
    tone: 'success',
  },
  {
    to: '/attendant/load-level',
    title: 'Load level',
    description: 'Live gauge & 24h timeline',
    icon: Gauge,
    tone: 'accent',
  },
  {
    to: '/attendant/facility-status',
    title: 'Facility status',
    description: 'Installers & inventory',
    icon: Settings,
    tone: 'brand',
  },
  {
    to: '/attendant/subscribers',
    title: 'All subscribers',
    description: 'Search & view records',
    icon: Users,
    tone: 'accent',
  },
  {
    to: '/attendant/maintenance',
    title: 'Maintenance',
    description: 'Call a technician',
    icon: Wrench,
    tone: 'danger',
  },
];

export default function AttendantDashboard() {
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();
  const load = useFacilityLoad(10_000);

  const active = useQuery({
    queryKey: ['parking', 'active'],
    queryFn: () => parkingApi.active(),
    refetchInterval: 10_000,
  });

  const spaces = useQuery({
    queryKey: ['facility', 'spaces'],
    queryFn: () => facilityApi.listSpaces(),
    refetchInterval: 15_000,
  });

  // Facility installers/robots status — powers the "Installers" tile so the
  // attendant can spot a stuck or overloaded machine at a glance.
  const status = useQuery({
    queryKey: ['facility', 'status'],
    queryFn: () => facilityApi.getStatus(),
    refetchInterval: 10_000,
  });

  // Attendant view: show occupied vs free in real time, but do NOT mark
  // reservation spots — reservations are shown in the table view, not the map.
  const lotSpots = useMemo<ParkingSpot3D[]>(() => {
    const fromApi = spaces.data ?? [];
    if (fromApi.length === 0) return [];
    return fromApi.map((s) => ({
      space_number: s.space_number,
      is_occupied: s.in_use,
      is_reserved: false,
      is_mine: false,
      location: s.location,
      occupant_name: s.occupant_name,
      occupant_id: s.occupant_id,
    }));
  }, [spaces.data]);

  const occupancyPercent = load.data?.occupancy_percent ?? 0;

  // ── Installers (robots) status ──────────────────────────────────────────
  // A machine is considered "stuck" when it's marked busy but its scheduled
  // completion time has already passed — the operation should have finished.
  const installers = status.data?.installers;
  const installersFree = installers?.free ?? 0;
  const installersBusy = installers?.busy ?? 0;
  const installersTotal = installers?.total ?? 0;
  const stuckInstallers = useMemo(() => {
    const now = Date.now();
    return (installers?.installers ?? []).filter(
      (i) => !i.is_free && i.busy_until && new Date(i.busy_until).getTime() < now
    ).length;
  }, [installers]);
  const installersHealthy = stuckInstallers === 0;

  // ── Operations in the last 30 minutes ───────────────────────────────────
  // Each drop-off (parking_date) and each pick-up (retrieval_time) within the
  // window counts as one attendant-relevant operation. We keep the split so the
  // tile can show how many were entries vs exits.
  const { opsDropOffs, opsPickUps } = useMemo(() => {
    const cutoff = Date.now() - 30 * 60_000;
    let drops = 0;
    let picks = 0;
    for (const p of active.data ?? []) {
      if (new Date(p.parking_date).getTime() >= cutoff) drops++;
      if (p.retrieval_time && new Date(p.retrieval_time).getTime() >= cutoff)
        picks++;
    }
    return { opsDropOffs: drops, opsPickUps: picks };
  }, [active.data]);
  const opsLast30 = opsDropOffs + opsPickUps;

  // ── Overstays / about to overstay ───────────────────────────────────────
  // Vehicles that have already exceeded their allowed time (overtime) or will
  // within the next 15 minutes — the attendant may need to act on these.
  const OVERSTAY_SOON_MIN = 15;
  const { overstayNow, overstaySoon } = useMemo(() => {
    const now = Date.now();
    let over = 0;
    let soon = 0;
    for (const p of active.data ?? []) {
      if (p.retrieval_time) continue; // already picked up
      const endMs =
        new Date(p.parking_date).getTime() + (p.max_time_minutes ?? 0) * 60_000;
      const minsLeft = (endMs - now) / 60_000;
      if (minsLeft <= 0) over++;
      else if (minsLeft <= OVERSTAY_SOON_MIN) soon++;
    }
    return { overstayNow: over, overstaySoon: soon };
  }, [active.data]);
  const overstayTotal = overstayNow + overstaySoon;

  return (
    <div className="space-y-6 md:space-y-8">
      <PageHeader
        eyebrow="Attendant console"
        title={
          <>
            On shift, <span className="text-gradient-brand">{user?.first_name}</span>
          </>
        }
        description="Daily operations — registrations, active vehicles and facility load."
        actions={
          <>
            <Badge tone="accent" dot size="lg">
              Live
            </Badge>
            <Link
              to="/attendant/register"
              className="inline-flex items-center gap-2 h-11 px-5 rounded-2xl bg-gradient-to-br from-accent-500 to-accent-700 text-white font-semibold text-sm shadow-[0_8px_24px_-8px_rgba(249,115,22,0.55)] hover:-translate-y-0.5 transition-transform"
            >
              <UserPlus className="h-4 w-4" />
              New subscriber
            </Link>
          </>
        }
      />

      {/* SECTION 1 — Live facility view (gauge + 3D map) */}
      <BentoCard span="" tone="glass" delay={0.02}>
        <SectionTitle
          icon={Activity}
          tone="accent"
          title="Live facility view"
          description="Real-time occupancy and the 3D parking map"
          actions={
            <Badge tone="accent" dot size="md">
              Live
            </Badge>
          }
        />
        <BentoGrid className="mt-2">
        {/* Live load gauge */}
        <BentoCard
          span="col-span-2 md:col-span-3 lg:col-span-4"
          tone="ink"
          rowSpan="row-span-2"
          delay={0}
          className="relative overflow-hidden min-h-[420px] flex flex-col items-center"
        >
          <GlowOrbs variant="accent" />
          <div className="relative w-full flex items-center justify-between mb-2">
            <Badge tone="ink" size="md" className="bg-white/10 text-white border-white/15">
              Live load
            </Badge>
            <Activity className="h-4 w-4 text-white/50" />
          </div>
          <h3 className="relative font-display text-lg font-semibold text-white tracking-tight self-start">
            Parking occupancy
          </h3>
          <p className="relative text-xs text-white/60 mt-0.5 self-start">
            Updates every 10 seconds
          </p>

          <div className="relative flex-1 flex items-center justify-center my-4">
            <RadialGauge
              value={occupancyPercent}
              size={210}
              thickness={16}
              tone={occupancyPercent > 80 ? 'danger' : occupancyPercent > 60 ? 'accent' : 'success'}
              inverted
              label="Occupied"
              sublabel={`${load.data?.free ?? 0} free of ${load.data?.total ?? 0}`}
            />
          </div>

          <div className="relative grid grid-cols-3 gap-2 w-full">
            <DarkPill label="Free" value={load.data?.free ?? 0} tone="text-success-300" />
            <DarkPill label="Occupied" value={load.data?.occupied ?? 0} tone="text-danger-300" />
            <DarkPill label="Reserved" value={load.data?.reserved ?? 0} tone="text-warning-400" />
          </div>
        </BentoCard>

        {/* 3D facility map — hero */}
        <BentoCard
          span="col-span-2 md:col-span-3 lg:col-span-8"
          tone="ink"
          padding="none"
          rowSpan="row-span-2"
          delay={0.03}
          className="min-h-[420px]"
        >
          <div className="relative h-full p-5 md:p-6 flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <div>
                <Badge tone="ink" size="md" className="bg-white/10 text-white border-white/15 mb-2">
                  Live
                </Badge>
                <h3 className="font-display text-lg font-semibold tracking-tight text-white">
                  Live 3D Parking Map
                </h3>
                <p className="text-xs text-white/60 mt-0.5">
                  Drag to rotate · scroll to zoom · reservations not shown
                </p>
              </div>
              <div className="text-right">
                <p className="text-[11px] uppercase tracking-wider text-white/60 font-semibold">
                  Parked now
                </p>
                <p className="font-display text-2xl font-bold text-white tabular leading-none mt-1">
                  {load.isLoading ? '—' : load.data?.occupied ?? 0}
                  <span className="text-white/50 text-base"> / {load.data?.total ?? 0}</span>
                </p>
              </div>
            </div>
            <div className="flex-1 rounded-2xl overflow-hidden bg-gradient-to-br from-ink-800 to-ink-900 border border-white/5">
              {lotSpots.length > 0 ? (
                <ParkingLot3D
                  spots={lotSpots}
                  cols={8}
                  view="attendant"
                  onSpotClick={(spot) => {
                    if (spot.occupant_id)
                      navigate(`/attendant/subscribers?id=${spot.occupant_id}`);
                  }}
                />
              ) : (
                <div className="h-full flex items-center justify-center text-white/50 text-sm">
                  Loading facility…
                </div>
              )}
            </div>
          </div>
        </BentoCard>
        </BentoGrid>
      </BentoCard>

      {/* SECTION 2 — Shift metrics (the three operational KPI tiles) */}
      <BentoCard span="" tone="glass" delay={0.06}>
        <SectionTitle
          icon={Gauge}
          tone="brand"
          title="Shift metrics"
          description="Machines, live activity and vehicles to watch"
        />
        <BentoGrid className="mt-2">
        {/* 1 · Installers / robots — spot a stuck or overloaded machine. */}
        <MetricCard
          to="/attendant/facility-status"
          delay={0.05}
          loading={status.isLoading}
          icon={installersHealthy ? Cog : AlertTriangle}
          tone={installersHealthy ? (installersBusy > 0 ? 'accent' : 'success') : 'danger'}
          title="Parking machines"
          value={
            status.isLoading
              ? '—'
              : `${installersFree}/${installersTotal}`
          }
          valueSuffix="free"
          status={
            status.isLoading
              ? 'Checking…'
              : !installersHealthy
              ? `${stuckInstallers} stuck`
              : installersBusy > 0
              ? 'Working'
              : 'All idle'
          }
          alert={!installersHealthy}
          stats={[
            { label: 'Working now', value: installersBusy },
            {
              label: 'Stuck',
              value: stuckInstallers,
              tone: stuckInstallers > 0 ? 'danger' : undefined,
            },
          ]}
        />

        {/* 2 · Operations in the last 30 minutes — live workload pulse. */}
        <MetricCard
          delay={0.08}
          loading={active.isLoading}
          icon={Zap}
          tone="brand"
          title="Activity · last 30 min"
          value={active.isLoading ? '—' : opsLast30}
          valueSuffix={opsLast30 === 1 ? 'operation' : 'operations'}
          status={opsLast30 > 0 ? 'Live' : 'Quiet'}
          stats={[
            { label: 'Cars in', value: opsDropOffs },
            { label: 'Cars out', value: opsPickUps },
          ]}
        />

        {/* 3 · Overstays / about to overstay — who to watch right now. */}
        <MetricCard
          to="/attendant/active-parkings"
          delay={0.1}
          loading={active.isLoading}
          icon={AlertTriangle}
          tone={overstayNow > 0 ? 'danger' : overstaySoon > 0 ? 'accent' : 'success'}
          title="Overstays"
          value={active.isLoading ? '—' : overstayTotal}
          valueSuffix={overstayTotal === 1 ? 'vehicle' : 'vehicles'}
          status={
            overstayNow > 0
              ? 'Action needed'
              : overstaySoon > 0
              ? 'Watch soon'
              : 'All on time'
          }
          alert={overstayNow > 0}
          stats={[
            {
              label: 'Over limit',
              value: overstayNow,
              tone: overstayNow > 0 ? 'danger' : undefined,
            },
            {
              label: 'Ending ≤15m',
              value: overstaySoon,
              tone: overstaySoon > 0 ? 'accent' : undefined,
            },
          ]}
        />
        </BentoGrid>
      </BentoCard>

      {/* SECTION 3 — Quick actions */}
      <BentoCard span="" tone="glass" delay={0.1}>
          <SectionTitle
            icon={Sparkles}
            tone="success"
            title="Quick actions"
            description="Most-used controls on your daily shift"
            actions={
              <Badge tone="brand" size="md">
                <Sparkles className="h-3 w-3" /> {actions.length} tools
              </Badge>
            }
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-2">
            {actions.map((a, i) => (
              <Link
                key={a.to}
                to={a.to}
                className="group relative overflow-hidden rounded-2xl p-4 border border-surface-200 bg-surface-0 hover:bg-surface-50 transition-all hover:-translate-y-0.5 hover:shadow-soft no-tap-highlight"
                style={{ animation: `fade-in-up 0.4s ${i * 0.04}s both` }}
              >
                <div className="flex items-start justify-between">
                  <span
                    className={`h-11 w-11 rounded-2xl flex items-center justify-center bg-gradient-to-br shadow-soft text-white ${
                      a.tone === 'brand'
                        ? 'from-brand-500 to-brand-700'
                        : a.tone === 'accent'
                        ? 'from-accent-500 to-accent-700'
                        : a.tone === 'success'
                        ? 'from-success-500 to-success-700'
                        : 'from-danger-500 to-danger-700'
                    }`}
                  >
                    <a.icon className="h-5 w-5" strokeWidth={2.3} />
                  </span>
                  <ArrowRight className="h-4 w-4 text-ink-400 group-hover:text-brand-600 group-hover:translate-x-0.5 transition-all" />
                </div>
                <h3 className="font-display text-base font-bold text-ink-900 mt-3 leading-tight">
                  {a.title}
                </h3>
                <p className="text-xs text-ink-500 mt-1">{a.description}</p>
              </Link>
            ))}
          </div>
      </BentoCard>
    </div>
  );
}

/* ============================================================
   SectionTitle — a section heading with an icon tile, matching the look of
   the "Quick actions" header. Used to box each of the three dashboard parts.
   ============================================================ */
const sectionTitleTone: Record<MetricTone, string> = {
  brand: 'bg-brand-50 text-brand-600',
  accent: 'bg-accent-50 text-accent-600',
  success: 'bg-success-50 text-success-600',
  danger: 'bg-danger-50 text-danger-600',
};

function SectionTitle({
  icon: Icon,
  tone,
  title,
  description,
  actions,
}: {
  icon: LucideIcon;
  tone: MetricTone;
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3 mb-1">
      <div className="flex items-center gap-3 min-w-0">
        <span
          className={cn(
            'h-11 w-11 shrink-0 rounded-2xl flex items-center justify-center',
            sectionTitleTone[tone]
          )}
        >
          <Icon className="h-5 w-5" strokeWidth={2.3} />
        </span>
        <div className="min-w-0">
          <h2 className="font-display text-base md:text-lg font-bold text-ink-900 tracking-tight leading-tight">
            {title}
          </h2>
          {description && (
            <p className="text-xs md:text-sm text-ink-500 mt-0.5 truncate">
              {description}
            </p>
          )}
        </div>
      </div>
      {actions && <div className="shrink-0">{actions}</div>}
    </div>
  );
}

/* ============================================================
   MetricCard — a tall, self-explanatory KPI card used for the three
   operational tiles. White background, clear header, a big value, a status
   pill, and a two-cell breakdown row so each number is labelled.
   ============================================================ */
type MetricTone = 'brand' | 'accent' | 'success' | 'danger';

const metricTone: Record<
  MetricTone,
  { iconBox: string; pill: string }
> = {
  brand: { iconBox: 'bg-brand-50 text-brand-600', pill: 'bg-brand-50 text-brand-700' },
  accent: { iconBox: 'bg-accent-50 text-accent-600', pill: 'bg-accent-50 text-accent-700' },
  success: { iconBox: 'bg-success-50 text-success-600', pill: 'bg-success-50 text-success-700' },
  danger: { iconBox: 'bg-danger-50 text-danger-600', pill: 'bg-danger-50 text-danger-700' },
};

interface MetricStat {
  label: string;
  value: number;
  tone?: 'danger' | 'accent';
}

function MetricCard({
  to,
  delay = 0,
  loading,
  icon: Icon,
  tone,
  title,
  value,
  valueSuffix,
  status,
  alert = false,
  stats,
}: {
  to?: string;
  delay?: number;
  loading?: boolean;
  icon: LucideIcon;
  tone: MetricTone;
  title: string;
  value: ReactNode;
  valueSuffix?: string;
  status: string;
  alert?: boolean;
  stats: MetricStat[];
}) {
  const t = metricTone[tone];

  const body = (
    <BentoCard
      span=""
      delay={delay}
      interactive={!!to}
      className={cn(
        'h-full min-h-[190px] flex flex-col',
        alert && 'border-danger-200 bg-danger-50/40'
      )}
    >
      {/* Header: icon + title, status pill on the right */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <span
            className={cn(
              'h-10 w-10 shrink-0 rounded-2xl flex items-center justify-center',
              t.iconBox
            )}
          >
            <Icon className="h-5 w-5" strokeWidth={2.3} />
          </span>
          <p className="font-display text-sm font-bold text-ink-800 leading-tight truncate">
            {title}
          </p>
        </div>
        <span
          className={cn(
            'shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide',
            t.pill
          )}
        >
          {status}
        </span>
      </div>

      {/* Big value */}
      <div className="mt-4 flex items-end gap-2">
        <span
          className={cn(
            'font-display text-4xl font-bold tabular tracking-tight text-ink-900',
            loading && 'animate-pulse text-ink-200'
          )}
        >
          {loading ? '—' : value}
        </span>
        {valueSuffix && !loading && (
          <span className="text-sm font-medium text-ink-500 pb-1.5">
            {valueSuffix}
          </span>
        )}
      </div>

      {/* Breakdown row — every number is clearly labelled */}
      <div className="mt-auto pt-4 grid grid-cols-2 gap-2">
        {stats.map((s) => (
          <div
            key={s.label}
            className="rounded-xl bg-surface-100 border border-surface-200 px-3 py-2"
          >
            <p className="text-[10px] uppercase tracking-wider font-semibold text-ink-500">
              {s.label}
            </p>
            <p
              className={cn(
                'font-display text-lg font-bold tabular leading-none mt-0.5',
                s.tone === 'danger'
                  ? 'text-danger-600'
                  : s.tone === 'accent'
                  ? 'text-accent-600'
                  : 'text-ink-900'
              )}
            >
              {loading ? '—' : s.value}
            </p>
          </div>
        ))}
      </div>
    </BentoCard>
  );

  if (to) {
    return (
      <Link to={to} className="col-span-2 md:col-span-3 lg:col-span-4">
        {body}
      </Link>
    );
  }
  return <div className="col-span-2 md:col-span-3 lg:col-span-4">{body}</div>;
}

function DarkPill({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: string;
}) {
  return (
    <div className="rounded-xl bg-white/5 border border-white/10 p-2 text-center">
      <p className="text-[9px] uppercase font-semibold text-white/60 tracking-wider">
        {label}
      </p>
      <p className={`font-display text-base font-bold tabular mt-0.5 ${tone}`}>
        {value}
      </p>
    </div>
  );
}
