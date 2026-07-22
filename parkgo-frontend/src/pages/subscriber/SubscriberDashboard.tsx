import { useEffect, useMemo, useState } from 'react';
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
import { formatCode, formatDateTime } from '@/utils/formatters';
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
  },
  {
    to: '/subscriber/drop-off',
    title: 'Drop off car',
    description: 'Park now',
    icon: Car,
    tone: 'accent' as const,
  },
  {
    to: '/subscriber/pick-up',
    title: 'Pick up car',
    description: 'Retrieve vehicle',
    icon: KeyRound,
    tone: 'success' as const,
  },
];

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

  // Three overview tiles — rendered as gradient link-buttons that share the
  // exact design of the quick-action buttons below them (6 buttons total).
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
      to: '/subscriber/reservation-history',
      label: 'Upcoming reservation',
      value: upcomingReservation
        ? formatDateTime(upcomingReservation.reservation_start)
        : 'None',
      hint: upcomingReservation
        ? `Space #${upcomingReservation.parking_space}`
        : 'No upcoming bookings',
      icon: CalendarCheck,
      tone: 'accent' as const,
      orb: 'accent' as const,
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

        {/* Occupancy gauge */}
        <BentoCard
          span="col-span-2 md:col-span-3 lg:col-span-4"
          tone="surface"
          padding="lg"
          delay={0.05}
          className="flex flex-col items-center justify-between min-h-[200px]"
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

        {/* Overview — three clickable tiles matching the quick-action buttons.
            Together with the three actions below they form one 6-button grid. */}
        {overviewCards.map((c, i) => (
          <BentoCard
            key={c.to}
            span="col-span-2 md:col-span-2 lg:col-span-4"
            tone={c.tone}
            padding="lg"
            interactive
            delay={0.08 + i * 0.04}
            className="relative overflow-hidden min-h-[150px] cursor-pointer"
          >
            <GlowOrbs variant={c.orb} />
            <Link to={c.to} className="relative flex flex-col h-full">
              <div className="flex items-center justify-between mb-4">
                <span className="h-11 w-11 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center">
                  <c.icon className="h-5 w-5 text-white" strokeWidth={2.4} />
                </span>
                <ArrowRight className="h-5 w-5 text-white/70 group-hover:translate-x-1 transition-transform" />
              </div>
              <p className="text-[11px] uppercase tracking-[0.08em] font-semibold text-white/80">
                {c.label}
              </p>
              <h3 className="font-display text-2xl font-bold tracking-tight leading-tight mt-0.5">
                {c.loading ? '—' : c.value}
              </h3>
              <p className="text-sm text-white/85 mt-auto pt-3">{c.hint}</p>
            </Link>
          </BentoCard>
        ))}

        {/* Quick actions — three buttons side by side */}
        {actions.map((a, i) => (
          <BentoCard
            key={a.to}
            span="col-span-2 md:col-span-2 lg:col-span-4"
            tone={a.tone}
            padding="lg"
            interactive
            delay={0.2 + i * 0.04}
            className="relative overflow-hidden min-h-[150px] cursor-pointer"
          >
            <GlowOrbs variant={a.tone === 'brand' ? 'brand' : a.tone === 'accent' ? 'accent' : 'success'} />
            <Link to={a.to} className="relative flex flex-col h-full">
              <div className="flex items-center justify-between mb-4">
                <span className="h-11 w-11 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center">
                  <a.icon className="h-5 w-5 text-white" strokeWidth={2.4} />
                </span>
                <ArrowRight className="h-5 w-5 text-white/70 group-hover:translate-x-1 transition-transform" />
              </div>
              <h3 className="font-display text-xl font-bold tracking-tight leading-tight">
                {a.title}
              </h3>
              <p className="text-sm text-white/85 mt-auto pt-3">
                {a.description}
              </p>
            </Link>
          </BentoCard>
        ))}
      </BentoGrid>

      {/* TRUST FOOTER */}
      <div className="flex items-center justify-center gap-2 text-xs text-ink-500 pt-2">
        <ShieldCheck className="h-3.5 w-3.5 text-success-600" />
        Your vehicle is fully insured during automated parking operations.
      </div>
    </div>
  );
}
