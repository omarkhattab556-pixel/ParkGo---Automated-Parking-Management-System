import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  UserPlus,
  Users,
  Car,
  Gauge,
  Wrench,
  Settings,
  type LucideIcon,
} from 'lucide-react';

import { useAuthStore } from '@/store/authStore';
import { useFacilityLoad } from '@/hooks/useParking';
import { subscriberApi } from '@/api/subscriber.api';
import { parkingApi } from '@/api/parking.api';

function StatCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="rounded-2xl bg-white border border-slate-100 px-5 py-4 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
      <p className="text-xs uppercase tracking-wider text-slate-500 font-medium">
        {label}
      </p>
      <p className="text-2xl md:text-3xl font-bold text-slate-900 mt-1 tabular-nums">
        {value}
      </p>
      {sub && <p className="text-xs text-slate-500 mt-1">{sub}</p>}
    </div>
  );
}

interface Action {
  to: string;
  title: string;
  description: string;
  icon: LucideIcon;
  gradient: string;
}

const actions: Action[] = [
  {
    to: '/attendant/register',
    title: 'Register Subscriber',
    description: 'Add a new subscriber to the system',
    icon: UserPlus,
    gradient: 'from-primary-500 to-primary-700',
  },
  {
    to: '/attendant/active-parkings',
    title: 'Active Parkings',
    description: 'Real-time view of vehicles currently parked',
    icon: Car,
    gradient: 'from-success-500 to-success-700',
  },
  {
    to: '/attendant/load-level',
    title: 'Load Level',
    description: 'Live occupancy gauge and 24h timeline',
    icon: Gauge,
    gradient: 'from-accent-500 to-accent-600',
  },
  {
    to: '/attendant/facility-status',
    title: 'Facility Status',
    description: 'Installer health and space inventory',
    icon: Settings,
    gradient: 'from-purple-500 to-fuchsia-600',
  },
  {
    to: '/attendant/subscribers',
    title: 'All Subscribers',
    description: 'Search and view subscriber records',
    icon: Users,
    gradient: 'from-cyan-500 to-blue-600',
  },
  {
    to: '/attendant/maintenance',
    title: 'Maintenance',
    description: 'Call a technician for facility issues',
    icon: Wrench,
    gradient: 'from-rose-500 to-red-600',
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

  const totalSubscribers = subscribers.data?.length ?? 0;
  const activeSubscribers =
    subscribers.data?.filter((s) => s.subscriber?.status === 'active').length ??
    0;
  const inactiveSubscribers = totalSubscribers - activeSubscribers;
  const parkedNow = active.data?.length ?? 0;

  return (
    <div className="space-y-8">
      <header>
        <p className="text-sm text-slate-500">Attendant console</p>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
          {user?.first_name} {user?.last_name}
        </h1>
      </header>

      <section className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <StatCard
          label="Total Subscribers"
          value={subscribers.isLoading ? '—' : String(totalSubscribers)}
          sub={
            totalSubscribers > 0 ? `${inactiveSubscribers} inactive` : undefined
          }
        />
        <StatCard
          label="Active Subscribers"
          value={subscribers.isLoading ? '—' : String(activeSubscribers)}
          sub="status = active"
        />
        <StatCard
          label="Parked Now"
          value={active.isLoading ? '—' : String(parkedNow)}
          sub={parkedNow === 1 ? 'vehicle' : 'vehicles'}
        />
        <StatCard
          label="Free Spots"
          value={
            load.isLoading
              ? '—'
              : `${load.data?.free ?? 0} / ${load.data?.total ?? 0}`
          }
          sub={
            load.data
              ? `${load.data.occupancy_percent.toFixed(0)}% occupied`
              : undefined
          }
        />
      </section>

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
        {actions.map((action, i) => (
          <motion.div
            key={action.to}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
          >
            <Link to={action.to} className="block group">
              <div
                className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${action.gradient} p-6 text-white shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all min-h-[170px] flex flex-col`}
              >
                <div className="absolute -top-10 -right-10 h-32 w-32 rounded-full bg-white/10 group-hover:scale-150 transition-transform duration-500" />
                <action.icon className="h-9 w-9 mb-3 relative z-10" strokeWidth={2.2} />
                <h3 className="text-lg md:text-xl font-bold mb-1 relative z-10 tracking-tight">
                  {action.title}
                </h3>
                <p className="text-sm text-white/85 relative z-10 mt-auto">
                  {action.description}
                </p>
              </div>
            </Link>
          </motion.div>
        ))}
      </section>
    </div>
  );
}
