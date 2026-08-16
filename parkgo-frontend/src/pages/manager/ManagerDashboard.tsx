import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  PlusSquare,
  MinusSquare,
  BarChart3,
  Users,
  TrendingUp,
  TrendingDown,
  Clock,
  ArrowRight,
  Activity,
  Wrench,
  Wallet,
  ShieldCheck,
  AlertTriangle,
  Info,
  ChevronRight,
  Gauge,
  Cog,
  Sparkles,
  type LucideIcon,
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
import { HourlyOccupancyChart } from '@/components/charts/HourlyOccupancyChart';
import { ParkingLot3D, type ParkingSpot3D } from '@/components/3d/ParkingLot3D';

// A single real-time operational alert shown in the live activity panel.
type AlertLevel = 'danger' | 'warning' | 'info';
interface OpAlert {
  id: string;
  level: AlertLevel;
  message: string;
  /** epoch ms the event happened — rendered as a relative "N min ago". */
  at: number;
}

// Currency formatter — matches the reports pages. Compacts large sums to "K".
function money(currency: string, amount: number, compact = false): string {
  const symbol = currency === 'ILS' ? '₪' : '';
  if (compact && Math.abs(amount) >= 1000) {
    return `${symbol}${(amount / 1000).toLocaleString(undefined, {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    })}K`;
  }
  return `${symbol}${Math.round(amount).toLocaleString()}`;
}

// Compact "N min ago" / "just now" relative label for alert timestamps.
function agoLabel(at: number, now: number): string {
  const secs = Math.max(0, Math.round((now - at) / 1000));
  if (secs < 60) return 'just now';
  const mins = Math.round(secs / 60);
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.round(mins / 60);
  return `${hrs}h ago`;
}

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

// Per-section accent for the boxed section headers.
type SectionTone = 'brand' | 'accent' | 'success' | 'info';
const sectionToneClasses: Record<SectionTone, string> = {
  brand: 'bg-brand-50 text-brand-600',
  accent: 'bg-accent-50 text-accent-600',
  success: 'bg-success-50 text-success-600',
  info: 'bg-info-50 text-info-600',
};

// A boxed section: a shadowed glass card with an icon + title + description
// header, wrapping a part of the dashboard. Same pattern as the attendant view.
function SectionShell({
  icon: Icon,
  tone,
  title,
  description,
  actions,
  children,
}: {
  icon: LucideIcon;
  tone: SectionTone;
  title: string;
  description?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-surface-200 bg-surface-0 shadow-card p-4 md:p-5">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-3 min-w-0">
          <span
            className={`h-11 w-11 shrink-0 rounded-2xl flex items-center justify-center ${sectionToneClasses[tone]}`}
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
      {children}
    </section>
  );
}

export default function ManagerDashboard() {
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();
  const load = useFacilityLoad(15_000);

  // 1-second clock so busy-installer countdowns tick smoothly in real time.
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

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

  // Revenue breakdown — powers the new "Revenue breakdown" donut card.
  const revenue = useQuery({
    queryKey: ['reports', 'revenue', 'this-month'],
    queryFn: () => reportsApi.revenue(),
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
    // Installer status must feel live — poll often and keep polling even when
    // the tab is in the background, and don't serve stale cached data.
    refetchInterval: 5_000,
    refetchIntervalInBackground: true,
    staleTime: 0,
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

  // Today-vs-yesterday occupancy delta (percentage points) for the hero tile.
  const occupancyDelta = useMemo(() => {
    const daily = occupancy.data?.daily ?? [];
    if (daily.length < 2) return null;
    const today = daily[daily.length - 1].occupancy;
    const yesterday = daily[daily.length - 2].occupancy;
    return Math.round(today - yesterday);
  }, [occupancy.data]);

  // Live facility counts — drive the enriched Avg occupancy legend & map badges.
  const occupiedNow = load.data?.occupied ?? 0;
  const reservedNow = load.data?.reserved ?? 0;
  const freeNow = load.data?.free ?? 0;

  // Revenue breakdown segments (parking / extensions / late fines / subscription).
  const revenueCurrency = revenue.data?.currency ?? 'ILS';
  const revenueSegments = useMemo(
    () => [
      { key: 'parking', label: 'Parking', value: revenue.data?.parking_revenue ?? 0, color: '#5d52f7' },
      { key: 'extension', label: 'Extensions', value: revenue.data?.extension_revenue ?? 0, color: '#10b981' },
      { key: 'late', label: 'Late fines', value: revenue.data?.late_revenue ?? 0, color: '#f97316' },
      { key: 'subscription', label: 'Subscription', value: revenue.data?.subscription_revenue ?? 0, color: '#38bdf8' },
    ],
    [revenue.data]
  );
  const revenueTotal = revenue.data?.total_revenue ?? 0;

  // ── Floor capacity health ───────────────────────────────────────────────
  // Per-floor utilisation, busiest floor first. The headline occupancy % hides
  // this: the facility can sit at 60% overall while one floor is completely
  // full and drivers are circling it, so the manager needs the split.
  const floorHealth = useMemo(() => {
    const map = new Map<
      string,
      { location: string; total: number; used: number; reserved: number }
    >();

    for (const s of spaces.data ?? []) {
      const key = (s.location && s.location.trim()) || 'Unzoned';
      if (!map.has(key)) {
        map.set(key, { location: key, total: 0, used: 0, reserved: 0 });
      }
      const b = map.get(key)!;
      b.total += 1;
      if (s.in_use) b.used += 1;
      else if (s.reserved) b.reserved += 1;
    }

    return Array.from(map.values())
      .map((f) => ({
        ...f,
        free: f.total - f.used - f.reserved,
        // Reserved spaces are unavailable to a walk-in, so they count towards
        // how "full" the floor feels on the ground.
        pct: f.total ? Math.round(((f.used + f.reserved) / f.total) * 100) : 0,
      }))
      .sort((a, b) => b.pct - a.pct);
  }, [spaces.data]);

  // ── Live operational alerts / activity log ──────────────────────────────
  // Built entirely from real-time data (active parkings + installers + load),
  // most-urgent first. `now` (1-second clock) keeps the "ago" labels fresh.
  const alerts = useMemo<OpAlert[]>(() => {
    const list: OpAlert[] = [];

    for (const p of active.data ?? []) {
      const start = new Date(p.parking_date).getTime();
      const endMs = start + (p.max_time_minutes ?? 0) * 60_000;
      const minsOver = (now - endMs) / 60_000;
      const minsLeft = (endMs - now) / 60_000;
      if (minsOver > 0) {
        list.push({
          id: `over-${p.parking_code}`,
          level: 'danger',
          message: `Vehicle #${p.parking_space} exceeded parking time`,
          at: endMs,
        });
      } else if (minsLeft <= 15) {
        list.push({
          id: `soon-${p.parking_code}`,
          level: 'warning',
          message: `Vehicle #${p.parking_space} ending in ${Math.max(
            1,
            Math.round(minsLeft)
          )} min`,
          at: now,
        });
      }
    }

    for (const i of installers.data ?? []) {
      if (!i.is_free && i.busy_until) {
        const busyMs = new Date(i.busy_until).getTime();
        // Flag machines that should have finished but are still marked busy.
        if (busyMs < now) {
          const stuckMin = Math.max(1, Math.round((now - busyMs) / 60_000));
          list.push({
            id: `stuck-${i.installer_id}`,
            level: 'warning',
            message: `${i.installer_name}${i.Manufacturer ? ` (${i.Manufacturer})` : ''} has been busy for ${stuckMin} min`,
            at: busyMs,
          });
        }
      }
    }

    // Capacity pressure — the facility cannot accept walk-ins for much longer.
    const totalSpaces = occupiedNow + reservedNow + freeNow;
    if (totalSpaces > 0) {
      const usedPct = ((occupiedNow + reservedNow) / totalSpaces) * 100;
      if (freeNow === 0) {
        list.push({
          id: 'capacity-full',
          level: 'danger',
          message: 'Facility is full — no free spaces for walk-ins',
          at: now,
        });
      } else if (usedPct >= 90) {
        list.push({
          id: 'capacity-critical',
          level: 'danger',
          message: `Capacity critical — only ${freeNow} space${freeNow > 1 ? 's' : ''} left`,
          at: now,
        });
      } else if (usedPct >= 75) {
        list.push({
          id: 'capacity-high',
          level: 'warning',
          message: `Filling up — ${Math.round(usedPct)}% occupied, ${freeNow} free`,
          at: now,
        });
      }
    }

    // A floor at capacity while the facility overall still has room: drivers
    // will circle that floor, so the manager may want to redirect them.
    for (const f of floorHealth) {
      if (f.pct >= 95 && f.total > 0 && freeNow > 0) {
        list.push({
          id: `floor-full-${f.location}`,
          level: 'warning',
          message: `Floor ${f.location} is full — redirect arrivals`,
          at: now,
        });
      }
    }

    // Every machine busy = new arrivals queue at the gate.
    const installerList = installers.data ?? [];
    if (installerList.length > 0 && installerList.every((i) => !i.is_free)) {
      list.push({
        id: 'installers-saturated',
        level: 'danger',
        message: `All ${installerList.length} installers busy — arrivals will queue`,
        at: now,
      });
    }

    // Subscribers suspended for repeat late returns need staff follow-up.
    const suspended =
      subscribers.data?.filter((s) => s.subscriber?.status === 'inactive') ?? [];
    if (suspended.length > 0) {
      list.push({
        id: 'subs-suspended',
        level: 'warning',
        message: `${suspended.length} subscription${suspended.length > 1 ? 's' : ''} suspended — awaiting reactivation`,
        at: now,
      });
    }

    // Subscribers one strike away from automatic cancellation (3 delays).
    const atRisk =
      subscribers.data?.filter(
        (s) => s.subscriber?.status === 'active' && (s.subscriber?.delay_count ?? 0) === 2
      ) ?? [];
    if (atRisk.length > 0) {
      list.push({
        id: 'subs-at-risk',
        level: 'info',
        message: `${atRisk.length} subscriber${atRisk.length > 1 ? 's' : ''} one delay from cancellation`,
        at: now,
      });
    }

    // Long-staying vehicles tie up capacity even while still within their time.
    const longStay = (active.data ?? []).filter(
      (p) => now - new Date(p.parking_date).getTime() > 8 * 3600_000
    );
    if (longStay.length > 0) {
      list.push({
        id: 'long-stay',
        level: 'info',
        message: `${longStay.length} vehicle${longStay.length > 1 ? 's' : ''} parked over 8 hours`,
        at: now,
      });
    }

    if (reservedNow > 0) {
      list.push({
        id: 'reservations-soon',
        level: 'info',
        message: `${reservedNow} reservation${reservedNow > 1 ? 's' : ''} holding a space`,
        at: now,
      });
    }

    // Most urgent first (danger → warning → info), then most recent.
    const rank = { danger: 0, warning: 1, info: 2 } as const;
    return list
      .sort((a, b) => rank[a.level] - rank[b.level] || b.at - a.at)
      .slice(0, 8);
  }, [
    active.data,
    installers.data,
    subscribers.data,
    floorHealth,
    occupiedNow,
    reservedNow,
    freeNow,
    now,
  ]);

  const lotSpots = useMemo<ParkingSpot3D[]>(() => {
    const fromApi = spaces.data ?? [];
    if (fromApi.length === 0) return [];
    return fromApi.map((s) => ({
      space_number: s.space_number,
      is_occupied: s.in_use,
      is_reserved: s.reserved,
      location: s.location,
      occupant_name: s.occupant_name,
      occupant_id: s.occupant_id,
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

      {/* SECTION 1 — Live facility (occupancy gauge + 3D map) */}
      <SectionShell
        icon={Activity}
        tone="accent"
        title="Live facility"
        description="Real-time occupancy and the 3D parking map"
        actions={
          <Badge tone="success" dot size="md">
            Live
          </Badge>
        }
      >
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

          <div className="relative flex items-center justify-center my-4">
            <RadialGauge
              value={occupancy.data?.average_occupancy ?? 0}
              size={180}
              thickness={16}
              tone="brand"
              inverted
              label="Avg"
              sublabel={`${occupancy.data?.peak_hours_occupancy?.toFixed(0) ?? '—'}% peak`}
            />
          </div>

          {/* Live breakdown — occupied / reserved / free, like the reference. */}
          <div className="relative grid grid-cols-3 gap-2">
            <OccStat label="Occupied" value={occupiedNow} dot="bg-danger-400" />
            <OccStat label="Reserved" value={reservedNow} dot="bg-warning-400" />
            <OccStat label="Free" value={freeNow} dot="bg-success-400" />
          </div>

          {/* Today vs yesterday delta */}
          {occupancyDelta != null && (
            <div className="relative mt-3 flex items-center justify-between rounded-xl bg-white/5 border border-white/10 px-3 py-2">
              <span className="text-xs text-white/60">Daily Avg ocuupancy</span>
              <span
                className={`inline-flex items-center gap-1 text-sm font-bold tabular ${
                  occupancyDelta > 0
                    ? 'text-danger-300'
                    : occupancyDelta < 0
                    ? 'text-success-300'
                    : 'text-white/70'
                }`}
              >
                {occupancyDelta > 0 ? (
                  <TrendingUp className="h-3.5 w-3.5" />
                ) : occupancyDelta < 0 ? (
                  <TrendingDown className="h-3.5 w-3.5" />
                ) : null}
                {occupancyDelta > 0 ? '+' : ''}
                {occupancyDelta}%
              </span>
            </div>
          )}

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
                  {freeNow} free
                </Badge>
                <Badge tone="danger" dot size="md">
                  {occupiedNow} occupied
                </Badge>
                <Badge tone="warning" dot size="md">
                  {reservedNow} reserved
                </Badge>
              </div>
            }
          />
          <div className="flex-1 rounded-2xl overflow-hidden bg-gradient-to-br from-ink-800 to-ink-900 border border-surface-200">
            {lotSpots.length > 0 ? (
              <ParkingLot3D
                spots={lotSpots}
                cols={8}
                onSpotClick={(spot) => {
                  if (spot.occupant_id)
                    navigate(`/manager/subscribers?id=${spot.occupant_id}`);
                }}
              />
            ) : (
              <div className="h-full flex items-center justify-center text-white/50 text-sm">
                Loading facility…
              </div>
            )}
          </div>
        </BentoCard>
      </BentoGrid>
      </SectionShell>

      {/* SECTION 2 — Key metrics */}
      <SectionShell
        icon={Gauge}
        tone="brand"
        title="Key metrics"
        description="This month's headline numbers"
      >
      <BentoGrid>
        {/* KPI tiles — "Free now" removed (now covered by Avg occupancy). */}
        <BentoCard span="col-span-2 md:col-span-3 lg:col-span-3" delay={0.08}>
          <StatTile
            label="Revenue · this month"
            value={revenue.isLoading ? '—' : money(revenueCurrency, revenueTotal, true)}
            hint={
              revenue.data
                ? `${money(revenueCurrency, revenue.data.average_per_subscriber)} / subscriber`
                : undefined
            }
            icon={Wallet}
            iconTone="success"
            loading={revenue.isLoading}
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
      </BentoGrid>
      </SectionShell>

      {/* SECTION 3 — Open operational alerts (real-time activity log) */}
      <SectionShell
        icon={ShieldCheck}
        tone="info"
        title="Open operational alerts"
        description="Live — what needs attention right now"
        actions={
          <Badge tone={alerts.length ? 'danger' : 'success'} dot size="md">
            {alerts.length ? `${alerts.length} open` : 'All clear'}
          </Badge>
        }
      >
        <div className="space-y-2">
          {alerts.map((al) => (
            <AlertRow key={al.id} alert={al} now={now} />
          ))}
          {alerts.length === 0 && (
            <div className="flex items-center gap-3 rounded-2xl bg-success-50 border border-success-100 px-4 py-3">
              <ShieldCheck className="h-5 w-5 text-success-600 shrink-0" />
              <p className="text-sm text-success-700 font-medium">
                No open alerts — everything is running smoothly.
              </p>
            </div>
          )}
        </div>
      </SectionShell>

      {/* SECTION 4 — Analytics (occupancy, revenue, session duration) */}
      <SectionShell
        icon={BarChart3}
        tone="brand"
        title="Analytics"
        description="Occupancy, revenue and session trends this month"
      >
      <BentoGrid>
        {/* Hourly occupancy — clear column chart, coloured by real load level */}
        <BentoCard
          span="col-span-2 md:col-span-3 lg:col-span-4"
          tone="surface"
          delay={0.16}
          className="flex flex-col justify-center"
        >
          <SectionHeader
            title="Hourly occupancy"
            description="Average % busy by hour of day"
          />
          <HourlyOccupancyChart
            values={occupancy.data?.hourly_heatmap ?? new Array(24).fill(0)}
          />
        </BentoCard>

        {/* Revenue breakdown — where the money comes from this month */}
        <BentoCard
          span="col-span-2 md:col-span-3 lg:col-span-4"
          tone="surface"
          delay={0.17}
          className="flex flex-col items-center"
        >
          <SectionHeader
            title="Revenue breakdown"
            description="Income sources this month"
            className="w-full"
            actions={
              <Link
                to="/manager/reports"
                className="text-xs font-semibold text-brand-700 hover:text-brand-800 inline-flex items-center gap-1"
              >
                Details <ArrowRight className="h-3 w-3" />
              </Link>
            }
          />
          <OccupancyDonut
            size={180}
            thickness={22}
            segments={revenueSegments}
            centerValue={
              revenue.isLoading ? '—' : money(revenueCurrency, revenueTotal, true)
            }
            centerLabel="Total revenue"
          />
          <div className="w-full mt-4 space-y-1.5">
            {revenueSegments.map((s) => {
              const pct =
                revenueTotal > 0 ? Math.round((s.value / revenueTotal) * 100) : 0;
              return (
                <div
                  key={s.key}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="flex items-center gap-2 text-ink-600">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ background: s.color }}
                    />
                    {s.label}
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="font-semibold text-ink-900 tabular">
                      {money(revenueCurrency, s.value)}
                    </span>
                    <span className="text-xs text-ink-400 tabular w-8 text-right">
                      {pct}%
                    </span>
                  </span>
                </div>
              );
            })}
          </div>
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
      </BentoGrid>
      </SectionShell>

      {/* SECTION 5 — Operations (installers + active parkings) */}
      <SectionShell
        icon={Cog}
        tone="success"
        title="Operations"
        description="Machines and vehicles on site right now"
      >
      <BentoGrid>
        {/* Installers status */}
        <BentoCard
          span="col-span-2 md:col-span-3 lg:col-span-4"
          tone="surface"
          delay={0.2}
        >
          <SectionHeader
            title="Installers"
            description="Robotic shuttle status · live"
            actions={
              <Badge tone={installers.isFetching ? 'success' : 'brand'} dot size="md">
                {installers.data?.filter((i) => i.is_free).length ?? 0} / {installers.data?.length ?? 0} idle
              </Badge>
            }
          />
          <ul className="space-y-2 mt-2">
            {(installers.data ?? []).slice(0, 5).map((i) => {
              const busyLeft =
                !i.is_free && i.busy_until
                  ? Math.max(
                      0,
                      Math.ceil(
                        (new Date(i.busy_until).getTime() - now) / 1000
                      )
                    )
                  : null;
              return (
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
                    {i.Manufacturer && (
                      <span className="ml-1 text-xs font-semibold text-brand-600">
                        · {i.Manufacturer}
                      </span>
                    )}
                  </span>
                </div>
                <Badge tone={i.is_free ? 'success' : 'warning'} size="sm">
                  {i.is_free
                    ? 'Idle'
                    : busyLeft != null && busyLeft > 0
                    ? `Busy · ${busyLeft}s`
                    : 'Busy'}
                </Badge>
              </li>
              );
            })}
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

        {/* Floor capacity — completes the Operations row */}
        <BentoCard
          span="col-span-2 md:col-span-6 lg:col-span-4"
          tone="surface"
          delay={0.24}
          aria-label="Floor capacity"
        >
          <SectionHeader
            title="Floor capacity"
            description="Utilisation per floor · live"
            actions={
              <Badge
                tone={
                  floorHealth.some((f) => f.pct >= 90)
                    ? 'danger'
                    : floorHealth.some((f) => f.pct >= 75)
                    ? 'warning'
                    : 'success'
                }
                dot
                size="md"
              >
                {floorHealth.filter((f) => f.pct >= 90).length > 0
                  ? `${floorHealth.filter((f) => f.pct >= 90).length} full`
                  : 'Balanced'}
              </Badge>
            }
          />
          <ul className="space-y-2.5 mt-2">
            {floorHealth.slice(0, 5).map((f) => {
              const tone =
                f.pct >= 90
                  ? { bar: 'bg-danger-500', text: 'text-danger-600' }
                  : f.pct >= 75
                  ? { bar: 'bg-warning-500', text: 'text-warning-600' }
                  : { bar: 'bg-success-500', text: 'text-success-600' };
              return (
                <li key={f.location}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-ink-800 truncate">
                      {f.location}
                    </span>
                    <span className="text-xs text-ink-500 tabular shrink-0 ml-2">
                      <span className={`font-semibold ${tone.text}`}>{f.pct}%</span>
                      {' · '}
                      {f.free} free
                    </span>
                  </div>
                  <div
                    className="h-2 rounded-full bg-surface-100 overflow-hidden"
                    role="progressbar"
                    aria-valuenow={f.pct}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`${f.location} utilisation`}
                  >
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${tone.bar}`}
                      style={{ width: `${f.pct}%` }}
                    />
                  </div>
                </li>
              );
            })}
            {floorHealth.length === 0 && (
              <li className="text-sm text-ink-500 py-4 text-center">
                No floors configured.
              </li>
            )}
          </ul>
        </BentoCard>

      </BentoGrid>
      </SectionShell>

      {/* SECTION 6 — Quick actions */}
      <SectionShell
        icon={Sparkles}
        tone="accent"
        title="Quick actions"
        description="Reports and facility controls"
      >
      <BentoGrid>
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
      </BentoGrid>
      </SectionShell>

      {/* Maintenance shortcut — standalone CTA banner */}
      <BentoGrid>
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

// A single row in the live operational-alerts panel, styled by severity.
const alertStyle: Record<
  AlertLevel,
  { row: string; iconBox: string; icon: LucideIcon }
> = {
  danger: {
    row: 'bg-danger-50/60 border-danger-100',
    iconBox: 'bg-danger-100 text-danger-600',
    icon: AlertTriangle,
  },
  warning: {
    row: 'bg-warning-50/60 border-warning-100',
    iconBox: 'bg-warning-100 text-warning-600',
    icon: AlertTriangle,
  },
  info: {
    row: 'bg-info-50/60 border-info-100',
    iconBox: 'bg-info-100 text-info-600',
    icon: Info,
  },
};

function AlertRow({ alert, now }: { alert: OpAlert; now: number }) {
  const s = alertStyle[alert.level];
  const Icon = s.icon;
  return (
    <div
      className={`flex items-center gap-3 rounded-2xl border px-3 py-2.5 ${s.row}`}
    >
      <span
        className={`h-8 w-8 shrink-0 rounded-xl flex items-center justify-center ${s.iconBox}`}
      >
        <Icon className="h-4 w-4" strokeWidth={2.3} />
      </span>
      <p className="text-sm font-medium text-ink-800 flex-1 min-w-0 truncate">
        {alert.message}
      </p>
      <span className="text-xs text-ink-400 shrink-0 tabular">
        {agoLabel(alert.at, now)}
      </span>
      <ChevronRight className="h-4 w-4 text-ink-300 shrink-0" />
    </div>
  );
}

function OccStat({
  label,
  value,
  dot,
}: {
  label: string;
  value: number;
  dot: string;
}) {
  return (
    <div className="rounded-xl bg-white/5 border border-white/10 p-2 text-center">
      <p className="text-[9px] uppercase font-semibold text-white/60 tracking-wider inline-flex items-center gap-1">
        <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
        {label}
      </p>
      <p className="font-display text-base font-bold tabular text-white mt-0.5">
        {value}
      </p>
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
