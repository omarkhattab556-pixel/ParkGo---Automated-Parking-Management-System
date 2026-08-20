import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  CalendarPlus,
  Car,
  KeyRound,
  Hash,
  ArrowRight,
  TrendingUp,
  CalendarClock,
  CalendarCheck,
  Wallet,
  ShieldCheck,
  Clock,
  Timer as TimerIcon,
  AlarmClockOff,
  LayoutGrid,
  MapPin,
  type LucideIcon,
} from 'lucide-react';

import { useAuthStore } from '@/store/authStore';
import {
  useFacilityLoad,
  useMyActiveParking,
  useMyReservations,
} from '@/hooks/useParking';
import { facilityApi } from '@/api/facility.api';
import { subscriberApi } from '@/api/subscriber.api';
import { reportsApi } from '@/api/reports.api';
import { formatCode, formatDate, formatDateTime, formatTime } from '@/utils/formatters';
import { BentoGrid, BentoCard } from '@/components/ui/Bento';
import { Badge } from '@/components/ui/Badge';
import { PageHeader, SectionHeader } from '@/components/ui/PageHeader';
import { GlowOrbs } from '@/components/ui/GlowOrbs';
import { RadialGauge } from '@/components/charts/RadialGauge';
import { ParkingLot3D, type ParkingSpot3D } from '@/components/3d/ParkingLot3D';

const actions = [
  {
    to: '/subscriber/reserve',
    title: 'Reserve a spot',
    description: '24h–7d in advance',
    icon: CalendarPlus,
    tone: 'brand' as const,
    orb: 'brand' as const,
  },
  {
    to: '/subscriber/drop-off',
    title: 'Drop off car',
    description: 'Park now',
    icon: Car,
    tone: 'accent' as const,
    orb: 'accent' as const,
  },
  {
    to: '/subscriber/pick-up',
    title: 'Pick up car',
    description: 'Retrieve vehicle',
    icon: KeyRound,
    tone: 'success' as const,
    orb: 'success' as const,
  },
];

// Per-accent styling for the white dashboard buttons. Each button sits on a
// white surface (tone="surface") and carries its identity through a soft tinted
// icon square, a matching icon color, an accent arrow and a thin left bar —
// mirroring the reference design.
type Accent = 'brand' | 'accent' | 'success';
const accentStyles: Record<
  Accent,
  { iconBox: string; icon: string; arrow: string; bar: string }
> = {
  brand: {
    iconBox: 'bg-brand-50 border-brand-100',
    icon: 'text-brand-600',
    arrow: 'text-brand-600 border-brand-200',
    bar: 'bg-brand-500',
  },
  accent: {
    iconBox: 'bg-accent-50 border-accent-100',
    icon: 'text-accent-600',
    arrow: 'text-accent-600 border-accent-200',
    bar: 'bg-accent-500',
  },
  success: {
    iconBox: 'bg-success-50 border-success-100',
    icon: 'text-success-600',
    arrow: 'text-success-600 border-success-200',
    bar: 'bg-success-500',
  },
};

// Distinct palette for the three overview buttons ABOVE the map, so they never
// read as duplicates of the action buttons below. Each has a coloured bar along
// the TOP edge and a soft decorative blob tucked into the bottom-right corner.
type TopAccent = 'info' | 'danger' | 'warning';
const topAccentStyles: Record<
  TopAccent,
  { iconBox: string; icon: string; topBar: string; blob: string }
> = {
  info: {
    iconBox: 'bg-info-50 border-info-100',
    icon: 'text-info-600',
    topBar: 'bg-info-500',
    blob: 'bg-info-400/15',
  },
  danger: {
    iconBox: 'bg-danger-50 border-danger-100',
    icon: 'text-danger-600',
    topBar: 'bg-danger-500',
    blob: 'bg-danger-400/15',
  },
  warning: {
    iconBox: 'bg-warning-50 border-warning-100',
    icon: 'text-warning-600',
    topBar: 'bg-warning-500',
    blob: 'bg-warning-400/15',
  },
};

// Formats a currency amount with the ILS shekel sign, no decimals.
function money(currency: string, amount: number): string {
  const symbol = currency === 'ILS' ? '₪' : '';
  return `${symbol}${Math.round(amount).toLocaleString()}`;
}

// Formats a positive minute count as "Hh Mm" / "Mm", or "0m" when non-positive.
function formatRemaining(totalMinutes: number): string {
  const clamped = Math.max(0, Math.round(totalMinutes));
  const h = Math.floor(clamped / 60);
  const m = clamped % 60;
  if (h === 0) return `${m}m`;
  return `${h}h ${m.toString().padStart(2, '0')}m`;
}

// Per-section theming for the three shadowed section cards on the dashboard.
type SectionTone = 'brand' | 'success' | 'accent';
const sectionThemes: Record<
  SectionTone,
  { card: string; iconBox: string; icon: string; eyebrow: string; underline: string }
> = {
  brand: {
    card: 'bg-brand-50/40 border-brand-100',
    iconBox: 'bg-brand-100 border-brand-200',
    icon: 'text-brand-600',
    eyebrow: 'text-brand-600',
    underline: 'bg-brand-500',
  },
  success: {
    card: 'bg-success-50/40 border-success-100',
    iconBox: 'bg-success-100 border-success-200',
    icon: 'text-success-600',
    eyebrow: 'text-success-600',
    underline: 'bg-success-500',
  },
  accent: {
    card: 'bg-accent-50/40 border-accent-100',
    iconBox: 'bg-accent-100 border-accent-200',
    icon: 'text-accent-600',
    eyebrow: 'text-accent-600',
    underline: 'bg-accent-500',
  },
};

// A shadowed section card with the eyebrow + icon + title + subtitle header
// shown in the reference design. Wraps each of the dashboard's three parts.
function SectionShell({
  tone,
  icon: Icon,
  eyebrow,
  title,
  subtitle,
  delay = 0,
  children,
}: {
  tone: SectionTone;
  icon: LucideIcon;
  eyebrow: string;
  title: string;
  subtitle: string;
  delay?: number;
  children: ReactNode;
}) {
  const t = sectionThemes[tone];
  return (
    <motion.section
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay, ease: [0.16, 1, 0.3, 1] }}
      className={`rounded-3xl border shadow-card p-4 md:p-6 ${t.card}`}
    >
      <header className="flex items-center gap-3.5 mb-5">
        <span
          className={`h-12 w-12 shrink-0 rounded-2xl border flex items-center justify-center ${t.iconBox}`}
        >
          <Icon className={`h-6 w-6 ${t.icon}`} strokeWidth={2.2} />
        </span>
        <div>
          <p
            className={`text-[11px] font-bold uppercase tracking-[0.12em] ${t.eyebrow}`}
          >
            {eyebrow}
          </p>
          <h2 className="font-display text-lg md:text-xl font-bold tracking-tight text-ink-900 leading-tight">
            {title}
          </h2>
          <p className="text-sm text-ink-500 mt-0.5">{subtitle}</p>
          <span className={`mt-2 block h-1 w-10 rounded-full ${t.underline}`} />
        </div>
      </header>
      {children}
    </motion.section>
  );
}

/**
 * Subscriber landing page combining live capacity, the current parking timer,
 * upcoming reservations, monthly billing, quick actions, and the 3D lot view.
 * Spot data is reduced to the subscriber-safe representation before rendering,
 * so other drivers' occupancy and identity are never exposed by this screen.
 */
export default function SubscriberDashboard() {
  const user = useAuthStore((s) => s.user);
  const load = useFacilityLoad(10_000);
  const activeParking = useMyActiveParking();
  const reservations = useMyReservations();

  const profile = useQuery({
    queryKey: ['subscriber', 'me-profile'],
    queryFn: () => subscriberApi.myProfile(),
  });

  // Current-month billing statement — powers the "Monthly payment" tile.
  const billing = useQuery({
    queryKey: ['reports', 'my-billing', 'current'],
    queryFn: () => reportsApi.myBilling(),
  });

  // Live clock so the parking timer counts down in real time.
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const spaces = useQuery({
    queryKey: ['facility', 'spaces'],
    queryFn: () => facilityApi.listSpaces(),
    refetchInterval: 20_000,
  });

  const activeReservationsCount =
    reservations.data?.filter((r) => r.status === 'active').length ?? 0;

  // Nearest upcoming reservation (soonest start time still in the future).
  const upcomingReservation = useMemo(() => {
    const upcoming = (reservations.data ?? [])
      .filter(
        (r) =>
          r.status === 'active' &&
          new Date(r.reservation_start).getTime() > now
      )
      .sort(
        (a, b) =>
          new Date(a.reservation_start).getTime() -
          new Date(b.reservation_start).getTime()
      );
    return upcoming[0] ?? null;
  }, [reservations.data, now]);

  // The subscriber sees ONLY the floor (location) they're parked on when active;
  // when idle, the first available floor. `view="subscriber"` strips occupancy
  // info for other spots so privacy is preserved regardless.
  const myLocation = useMemo<string | null>(() => {
    const myParkingSpace = activeParking.data?.parking_space;
    if (!myParkingSpace) return null;
    const mySpace = spaces.data?.find((s) => s.space_number === myParkingSpace);
    return mySpace?.location ?? null;
  }, [activeParking.data, spaces.data]);

  const lotSpots = useMemo<ParkingSpot3D[]>(() => {
    const fromApi = spaces.data ?? [];
    if (fromApi.length === 0) {
      const total = load.data?.total ?? 40;
      return Array.from({ length: total }, (_, i) => ({
        space_number: i + 1,
        is_occupied: false,
        is_reserved: false,
        is_mine: activeParking.data?.parking_space === i + 1,
        location: null,
      }));
    }
    return fromApi.map((s) => ({
      space_number: s.space_number,
      is_occupied: false,
      is_reserved: false,
      is_mine: activeParking.data?.parking_space === s.space_number,
      location: s.location,
    }));
  }, [spaces.data, activeParking.data, load.data]);

  const occupancyPercent = load.data?.occupancy_percent ?? 0;

  // Total delays (איחורים) across the subscriber's history.
  const delayCount = profile.data?.stats.delay_count ?? 0;

  // Live remaining time for the active parking session, in minutes.
  // Positive → time left; negative → the driver is in overtime (late).
  const active = activeParking.data;
  const timer = useMemo(() => {
    if (!active) return null;
    const maxMinutes = active.max_time_minutes ?? 0;
    const elapsedMs = now - new Date(active.parking_date).getTime();
    const remainingMinutes = maxMinutes - elapsedMs / 60_000;
    return {
      remainingMinutes,
      isOvertime: remainingMinutes <= 0,
    };
  }, [active, now]);

  // Three overview tiles shown ABOVE the 3D map, in one row.
  // "Next reservation" is the centre-piece and renders its date & time in a
  // dedicated, elegant layout (handled separately in the JSX below).
  const overviewCards = [
    {
      to: '/subscriber/reservation-history',
      label: 'My reservations',
      value: activeReservationsCount,
      hint: 'currently active · view all',
      icon: CalendarClock,
      tone: 'brand' as const,
      orb: 'brand' as const,
      loading: reservations.isLoading,
    },
    {
      to: '/subscriber/statistics',
      label: 'Monthly payment',
      value:
        billing.data != null
          ? money(billing.data.currency, billing.data.total_due)
          : '—',
      hint: 'this month · view billing',
      icon: Wallet,
      tone: 'success' as const,
      orb: 'success' as const,
      loading: billing.isLoading,
    },
  ];

  return (
    <div className="space-y-6 md:space-y-8">
      {/* HERO HEADER */}
      <PageHeader
        eyebrow="Dashboard"
        title={
          <>
            <span className="text-ink-500 font-medium">Welcome back, </span>
            <span className="text-gradient-brand">
              {user?.first_name || 'Driver'}
            </span>
          </>
        }
        description="Your live parking overview, reservations and quick actions in one view."
        actions={
          <Link
            to="/subscriber/parking-history"
            className="inline-flex items-center gap-2 h-11 px-5 rounded-2xl bg-surface-0 border border-surface-200 text-ink-800 font-semibold text-sm shadow-soft hover:bg-surface-100"
          >
            <TrendingUp className="h-4 w-4" />
            History
          </Link>
        }
      />

      {/* ACTIVE BANNER */}
      {activeParking.data && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-success-600 via-success-500 to-emerald-400 text-white p-5 sm:p-6 shadow-[0_18px_48px_-18px_rgba(16,185,129,0.6)]"
        >
          <GlowOrbs variant="success" />
          <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center">
                <Hash className="h-5 w-5 text-white" strokeWidth={2.4} />
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-white/80 font-semibold">
                  Active parking session
                </p>
                <p className="font-display text-2xl md:text-3xl font-bold font-mono tracking-[0.25em] mt-0.5">
                  {formatCode(activeParking.data.confirmation_code)}
                </p>
                <p className="text-xs text-white/85 mt-1 flex items-center gap-1.5">
                  <Clock className="h-3 w-3" />
                  Started {formatDateTime(activeParking.data.parking_date)} · space #
                  {activeParking.data.parking_space}
                </p>
              </div>
            </div>
            <Link
              to="/subscriber/pick-up"
              className="inline-flex items-center justify-center gap-2 px-5 h-11 rounded-2xl bg-white text-success-700 font-semibold hover:bg-white/95 transition-all hover:-translate-y-0.5 shadow-[0_8px_24px_-8px_rgba(0,0,0,0.4)] shrink-0"
            >
              <KeyRound className="h-4 w-4" />
              Pick up now
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </motion.div>
      )}

      {/* SECTION 1 — OVERVIEW: reservations & monthly payment at a glance. */}
      <SectionShell
        tone="brand"
        icon={LayoutGrid}
        eyebrow="Overview"
        title="My Parking Overview"
        subtitle="Reservations and monthly payment at a glance."
        delay={0.02}
      >
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
        {/* My reservations */}
        <BentoCard
          span=""
          tone="surface"
          padding="lg"
          interactive
          delay={0.02}
          className="group relative overflow-hidden min-h-[132px] cursor-pointer"
        >
          <span className={`absolute inset-x-0 top-0 h-1 ${topAccentStyles.info.topBar}`} />
          <span className={`pointer-events-none absolute -bottom-10 -right-10 h-28 w-28 rounded-full blur-2xl ${topAccentStyles.info.blob}`} />
          <Link to={overviewCards[0].to} className="relative flex flex-col h-full">
            <div className="flex items-center gap-3 mb-3">
              <span className={`h-11 w-11 shrink-0 rounded-2xl border flex items-center justify-center ${topAccentStyles.info.iconBox}`}>
                <CalendarClock className={`h-5 w-5 ${topAccentStyles.info.icon}`} strokeWidth={2.4} />
              </span>
              <p className="text-[11px] uppercase tracking-[0.08em] font-semibold text-ink-500">
                {overviewCards[0].label}
              </p>
              <ArrowRight className={`h-5 w-5 ml-auto group-hover:translate-x-1 transition-transform ${topAccentStyles.info.icon}`} />
            </div>
            <h3 className="font-display text-2xl font-bold tracking-tight leading-tight text-ink-900">
              {overviewCards[0].loading ? '—' : overviewCards[0].value}
            </h3>
            <p className="text-sm text-ink-500 mt-auto pt-3">
              {overviewCards[0].hint}
            </p>
          </Link>
        </BentoCard>

        {/* Next reservation — featured with an elegant date & time layout */}
        <BentoCard
          span=""
          tone="surface"
          padding="lg"
          interactive
          delay={0.06}
          className="group relative overflow-hidden min-h-[132px] cursor-pointer"
        >
          <span className={`absolute inset-x-0 top-0 h-1 ${topAccentStyles.danger.topBar}`} />
          <span className={`pointer-events-none absolute -bottom-10 -right-10 h-28 w-28 rounded-full blur-2xl ${topAccentStyles.danger.blob}`} />
          <Link
            to="/subscriber/reservation-history"
            className="relative flex flex-col h-full"
          >
            <div className="flex items-center gap-3 mb-3">
              <span className={`h-11 w-11 shrink-0 rounded-2xl border flex items-center justify-center ${topAccentStyles.danger.iconBox}`}>
                <CalendarCheck className={`h-5 w-5 ${topAccentStyles.danger.icon}`} strokeWidth={2.4} />
              </span>
              <p className="text-[11px] uppercase tracking-[0.08em] font-semibold text-ink-500">
                Next reservation
              </p>
              <ArrowRight className={`h-5 w-5 ml-auto group-hover:translate-x-1 transition-transform ${topAccentStyles.danger.icon}`} />
            </div>
            {reservations.isLoading ? (
              <h3 className="font-display text-2xl font-bold tracking-tight mt-0.5 text-ink-900">
                —
              </h3>
            ) : upcomingReservation ? (
              <>
                <div className="mt-1.5 flex items-end gap-3">
                  {/* Time — the hero number */}
                  <span className="font-display text-3xl font-bold leading-none tabular text-ink-900">
                    {formatTime(upcomingReservation.reservation_start)}
                  </span>
                  {/* Date — quieter, sits beside the time */}
                  <span className="flex items-center gap-1.5 text-sm font-medium text-ink-500 pb-0.5">
                    <CalendarCheck className={`h-3.5 w-3.5 ${topAccentStyles.danger.icon}`} />
                    {formatDate(upcomingReservation.reservation_start)}
                  </span>
                </div>
                <p className="text-sm text-ink-500 mt-auto pt-3">
                  Space #{upcomingReservation.parking_space}
                </p>
              </>
            ) : (
              <>
                <h3 className="font-display text-2xl font-bold tracking-tight leading-tight mt-0.5 text-ink-900">
                  None scheduled
                </h3>
                <p className="text-sm text-ink-500 mt-auto pt-3">
                  No upcoming bookings
                </p>
              </>
            )}
          </Link>
        </BentoCard>

        {/* Monthly payment */}
        <BentoCard
          span=""
          tone="surface"
          padding="lg"
          interactive
          delay={0.1}
          className="group relative overflow-hidden min-h-[132px] cursor-pointer"
        >
          <span className={`absolute inset-x-0 top-0 h-1 ${topAccentStyles.warning.topBar}`} />
          <span className={`pointer-events-none absolute -bottom-10 -right-10 h-28 w-28 rounded-full blur-2xl ${topAccentStyles.warning.blob}`} />
          <Link to={overviewCards[1].to} className="relative flex flex-col h-full">
            <div className="flex items-center gap-3 mb-3">
              <span className={`h-11 w-11 shrink-0 rounded-2xl border flex items-center justify-center ${topAccentStyles.warning.iconBox}`}>
                <Wallet className={`h-5 w-5 ${topAccentStyles.warning.icon}`} strokeWidth={2.4} />
              </span>
              <p className="text-[11px] uppercase tracking-[0.08em] font-semibold text-ink-500">
                {overviewCards[1].label}
              </p>
              <ArrowRight className={`h-5 w-5 ml-auto group-hover:translate-x-1 transition-transform ${topAccentStyles.warning.icon}`} />
            </div>
            <h3 className="font-display text-2xl font-bold tracking-tight leading-tight text-ink-900">
              {overviewCards[1].loading ? '—' : overviewCards[1].value}
            </h3>
            <p className="text-sm text-ink-500 mt-auto pt-3">
              {overviewCards[1].hint}
            </p>
          </Link>
        </BentoCard>
      </div>
      </SectionShell>

      {/* SECTION 2 — LIVE PARKING: real-time 3D map and availability. */}
      <SectionShell
        tone="success"
        icon={MapPin}
        eyebrow="Live Parking"
        title="Live Parking Status"
        subtitle="Real-time map and space availability."
        delay={0.06}
      >
      {/* BENTO GRID */}
      <BentoGrid>
        {/* 3D Lot — hero */}
        <BentoCard
          span="col-span-2 md:col-span-6 lg:col-span-8"
          tone="ink"
          padding="none"
          rowSpan="row-span-2"
          delay={0}
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
                  Drag to rotate · scroll to zoom
                </p>
              </div>
              <div className="text-right">
                <p className="text-[11px] uppercase tracking-wider text-white/60 font-semibold">
                  Free now
                </p>
                <p className="font-display text-2xl font-bold text-white tabular leading-none mt-1">
                  {load.isLoading ? '—' : load.data?.free ?? 0}
                  <span className="text-white/50 text-base"> / {load.data?.total ?? 0}</span>
                </p>
              </div>
            </div>
            <div className="flex-1 rounded-2xl overflow-hidden bg-gradient-to-br from-ink-800 to-ink-900 border border-white/5">
              <ParkingLot3D
                spots={lotSpots}
                cols={8}
                view="subscriber"
                location={myLocation}
                hideFloorSwitcher
              />
            </div>
          </div>
        </BentoCard>

        {/* Occupancy gauge — matches the 3D map height (spans both rows) */}
        <BentoCard
          span="col-span-2 md:col-span-3 lg:col-span-4"
          tone="surface"
          padding="lg"
          rowSpan="row-span-2"
          delay={0.05}
          className="flex flex-col items-center justify-between min-h-[420px]"
        >
          <SectionHeader
            title="Availability"
            description="Updated every 10s"
          />
          <RadialGauge
            value={100 - occupancyPercent}
            size={170}
            tone="success"
            label="Free"
            sublabel={`${load.data?.free ?? 0} of ${load.data?.total ?? 0} spots`}
          />
          <div className="grid grid-cols-2 gap-2 w-full mt-3">
            {/* Timer — time left in my active parking session */}
            <div
              className={`rounded-xl border p-2.5 text-center ${
                timer?.isOvertime
                  ? 'bg-danger-50 border-danger-100'
                  : 'bg-brand-50 border-brand-100'
              }`}
            >
              <p
                className={`text-[10px] uppercase tracking-wider font-semibold inline-flex items-center gap-1 ${
                  timer?.isOvertime ? 'text-danger-700' : 'text-brand-700'
                }`}
              >
                <TimerIcon className="h-3 w-3" />
                Timer
              </p>
              <p
                className={`font-display text-lg font-bold tabular ${
                  timer?.isOvertime ? 'text-danger-700' : 'text-brand-700'
                }`}
              >
                {!timer
                  ? '—'
                  : timer.isOvertime
                    ? `+${formatRemaining(-timer.remainingMinutes)}`
                    : formatRemaining(timer.remainingMinutes)}
              </p>
            </div>
            {/* Total delays (איחורים) */}
            <div className="rounded-xl bg-amber-50 border border-amber-100 p-2.5 text-center">
              <p className="text-[10px] uppercase tracking-wider font-semibold text-amber-700 inline-flex items-center gap-1">
                <AlarmClockOff className="h-3 w-3" />
                Delays
              </p>
              <p className="font-display text-lg font-bold text-amber-700 tabular">
                {profile.isLoading ? '—' : delayCount}
              </p>
            </div>
          </div>
        </BentoCard>

      </BentoGrid>
      </SectionShell>

      {/* SECTION 3 — SERVICES: quick actions the member can trigger. */}
      <SectionShell
        tone="accent"
        icon={Car}
        eyebrow="Services"
        title="Parking Services"
        subtitle="Choose any service whenever you need it."
        delay={0.1}
      >
      {/* QUICK ACTIONS ROW — three buttons BELOW the 3D map, one row.
          Reserve a spot · Drop off car · Pick up car. */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
        {actions.map((a, i) => {
          const s = accentStyles[a.tone];
          return (
            <BentoCard
              key={a.to}
              span=""
              tone="surface"
              padding="lg"
              interactive
              delay={0.14 + i * 0.04}
              className="group relative overflow-hidden min-h-[150px] cursor-pointer"
            >
              <span className={`absolute left-0 top-0 h-full w-1 ${s.bar}`} />
              <Link to={a.to} className="relative flex flex-col h-full pl-1.5">
                <div className="flex items-center gap-3 mb-2">
                  <span className={`h-11 w-11 shrink-0 rounded-2xl border flex items-center justify-center ${s.iconBox}`}>
                    <a.icon className={`h-5 w-5 ${s.icon}`} strokeWidth={2.4} />
                  </span>
                  <h3 className="font-display text-xl font-bold tracking-tight leading-tight text-ink-900">
                    {a.title}
                  </h3>
                  <span className={`h-8 w-8 ml-auto shrink-0 rounded-full border flex items-center justify-center ${s.arrow}`}>
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                  </span>
                </div>
                <p className="text-sm text-ink-500 mt-auto pt-3">
                  {a.description}
                </p>
              </Link>
            </BentoCard>
          );
        })}
      </div>
      </SectionShell>

      {/* TRUST FOOTER */}
      <div className="flex items-center justify-center gap-2 text-xs text-ink-500 pt-2">
        <ShieldCheck className="h-3.5 w-3.5 text-success-600" />
        Your vehicle is fully insured during automated parking operations.
      </div>
    </div>
  );
}
