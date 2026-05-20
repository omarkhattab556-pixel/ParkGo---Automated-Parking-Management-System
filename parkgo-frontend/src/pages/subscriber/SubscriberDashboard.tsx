import { useMemo } from 'react';
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
  ShieldCheck,
  Clock,
} from 'lucide-react';

import { useAuthStore } from '@/store/authStore';
import {
  useFacilityLoad,
  useMyActiveParking,
  useMyReservations,
  useMyParkingHistory,
} from '@/hooks/useParking';
import { facilityApi } from '@/api/facility.api';
import { formatCode, formatDateTime } from '@/utils/formatters';
import { BentoGrid, BentoCard } from '@/components/ui/Bento';
import { StatTile } from '@/components/ui/StatTile';
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

export default function SubscriberDashboard() {
  const user = useAuthStore((s) => s.user);
  const load = useFacilityLoad(10_000);
  const activeParking = useMyActiveParking();
  const reservations = useMyReservations();
  const history = useMyParkingHistory();

  const spaces = useQuery({
    queryKey: ['facility', 'spaces'],
    queryFn: () => facilityApi.listSpaces(),
    refetchInterval: 20_000,
  });

  const activeReservationsCount =
    reservations.data?.filter((r) => r.status === 'active').length ?? 0;

  // Privacy: the subscriber should NOT see where other people are parked.
  // We pass `view="subscriber"` to ParkingLot3D which strips occupancy data
  // for spots that aren't the user's own. We still build the full spots list
  // here so the lot dimensions / layout stay accurate.
  const lotSpots = useMemo<ParkingSpot3D[]>(() => {
    const fromApi = spaces.data ?? [];
    const total =
      fromApi.length > 0 ? fromApi.length : load.data?.total ?? 40;
    if (fromApi.length === 0) {
      return Array.from({ length: total }, (_, i) => ({
        space_number: i + 1,
        is_occupied: false,
        is_reserved: false,
        is_mine: activeParking.data?.parking_space === i + 1,
      }));
    }
    return fromApi.map((s) => ({
      space_number: s.space_number,
      is_occupied: false,
      is_reserved: false,
      is_mine: activeParking.data?.parking_space === s.space_number,
    }));
  }, [spaces.data, activeParking.data, load.data]);

  const occupancyPercent = load.data?.occupancy_percent ?? 0;
  const monthlySessions = history.data?.length ?? 0;

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
                  Facility map
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
              <ParkingLot3D spots={lotSpots} cols={8} view="subscriber" />
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
            <div className="rounded-xl bg-success-50 border border-success-100 p-2.5 text-center">
              <p className="text-[10px] uppercase tracking-wider font-semibold text-success-700">
                Free
              </p>
              <p className="font-display text-lg font-bold text-success-700 tabular">
                {load.data?.free ?? 0}
              </p>
            </div>
            <div className="rounded-xl bg-danger-50 border border-danger-100 p-2.5 text-center">
              <p className="text-[10px] uppercase tracking-wider font-semibold text-danger-700">
                Occupied
              </p>
              <p className="font-display text-lg font-bold text-danger-700 tabular">
                {load.data?.occupied ?? 0}
              </p>
            </div>
          </div>
        </BentoCard>

        {/* My stats trio */}
        <BentoCard
          span="col-span-2 md:col-span-3 lg:col-span-4"
          tone="surface"
          padding="lg"
          delay={0.08}
        >
          <StatTile
            label="My reservations"
            value={reservations.isLoading ? '—' : activeReservationsCount}
            hint="currently active"
            icon={CalendarClock}
            iconTone="brand"
            loading={reservations.isLoading}
          />
        </BentoCard>

        <BentoCard
          span="col-span-2 md:col-span-3 lg:col-span-4"
          tone="aurora"
          padding="lg"
          delay={0.1}
          className="relative overflow-hidden text-white"
        >
          <GlowOrbs variant="brand" />
          <div className="relative">
            <StatTile
              label="Sessions this month"
              value={monthlySessions}
              hint="across all visits"
              icon={TrendingUp}
              variant="dark"
              loading={history.isLoading}
            />
          </div>
        </BentoCard>

        {/* Quick actions — pinned bottom row */}
        {actions.map((a, i) => (
          <BentoCard
            key={a.to}
            span="col-span-2 md:col-span-2 lg:col-span-4"
            tone={a.tone}
            padding="lg"
            interactive
            delay={0.12 + i * 0.04}
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
