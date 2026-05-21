import { useMemo } from 'react';
import { Link } from 'react-router-dom';
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
  type LucideIcon,
} from 'lucide-react';

import { useAuthStore } from '@/store/authStore';
import { useFacilityLoad } from '@/hooks/useParking';
import { subscriberApi } from '@/api/subscriber.api';
import { parkingApi } from '@/api/parking.api';
import { facilityApi } from '@/api/facility.api';

import { PageHeader, SectionHeader } from '@/components/ui/PageHeader';
import { BentoGrid, BentoCard } from '@/components/ui/Bento';
import { StatTile } from '@/components/ui/StatTile';
import { Badge } from '@/components/ui/Badge';
import { GlowOrbs } from '@/components/ui/GlowOrbs';
import { RadialGauge } from '@/components/charts/RadialGauge';
import { ParkingLot3D, type ParkingSpot3D } from '@/components/3d/ParkingLot3D';

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
  const load = useFacilityLoad(10_000);

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

  const spaces = useQuery({
    queryKey: ['facility', 'spaces'],
    queryFn: () => facilityApi.listSpaces(),
    refetchInterval: 15_000,
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
    }));
  }, [spaces.data]);

  const totalSubscribers = subscribers.data?.length ?? 0;
  const activeSubscribers =
    subscribers.data?.filter((s) => s.subscriber?.status === 'active').length ??
    0;
  const inactiveSubscribers = totalSubscribers - activeSubscribers;
  const parkedNow = active.data?.length ?? 0;
  const occupancyPercent = load.data?.occupancy_percent ?? 0;

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

      <BentoGrid>
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
                <ParkingLot3D spots={lotSpots} cols={8} view="attendant" />
              ) : (
                <div className="h-full flex items-center justify-center text-white/50 text-sm">
                  Loading facility…
                </div>
              )}
            </div>
          </div>
        </BentoCard>

        {/* KPI tiles */}
        <BentoCard span="col-span-2 md:col-span-3 lg:col-span-4" delay={0.05}>
          <StatTile
            label="Parked now"
            value={active.isLoading ? '—' : parkedNow}
            hint={parkedNow === 1 ? 'vehicle' : 'vehicles'}
            icon={Car}
            iconTone="success"
            loading={active.isLoading}
          />
        </BentoCard>
        <BentoCard
          span="col-span-2 md:col-span-3 lg:col-span-4"
          tone="aurora"
          delay={0.08}
          className="relative overflow-hidden"
        >
          <GlowOrbs variant="brand" />
          <div className="relative">
            <StatTile
              label="Active subscribers"
              value={subscribers.isLoading ? '—' : activeSubscribers}
              hint={`${inactiveSubscribers} inactive · ${totalSubscribers} total`}
              icon={Users}
              variant="dark"
              loading={subscribers.isLoading}
            />
          </div>
        </BentoCard>

        <BentoCard span="col-span-2 md:col-span-3 lg:col-span-4" delay={0.1}>
          <StatTile
            label="Total subscribers"
            value={subscribers.isLoading ? '—' : totalSubscribers}
            hint="across all statuses"
            icon={Users}
            iconTone="brand"
            loading={subscribers.isLoading}
          />
        </BentoCard>
        <BentoCard span="col-span-2 md:col-span-3 lg:col-span-4" delay={0.12}>
          <StatTile
            label="Free spots"
            value={
              load.isLoading
                ? '—'
                : `${load.data?.free ?? 0} / ${load.data?.total ?? 0}`
            }
            hint={`${occupancyPercent.toFixed(0)}% occupied`}
            icon={Gauge}
            iconTone="info"
            loading={load.isLoading}
          />
        </BentoCard>

        {/* Quick actions banner */}
        <BentoCard
          span="col-span-2 md:col-span-6 lg:col-span-12"
          tone="glass"
          delay={0.14}
        >
          <SectionHeader
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
      </BentoGrid>
    </div>
  );
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
