import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CalendarPlus, Car, KeyRound, Hash } from 'lucide-react';

import { useAuthStore } from '@/store/authStore';
import { useFacilityLoad, useMyActiveParking, useMyReservations } from '@/hooks/useParking';
import { formatCode, formatDateTime } from '@/utils/formatters';

interface ActionCard {
  to: string;
  title: string;
  description: string;
  icon: typeof CalendarPlus;
  gradient: string;
}

const actions: ActionCard[] = [
  {
    to: '/subscriber/reserve',
    title: 'ORDER NOW',
    description: 'Reserve a spot 24h–7d in advance',
    icon: CalendarPlus,
    gradient: 'from-primary-500 to-primary-700',
  },
  {
    to: '/subscriber/drop-off',
    title: 'DROP OFF CAR',
    description: 'Park your vehicle right now',
    icon: Car,
    gradient: 'from-accent-500 to-accent-600',
  },
  {
    to: '/subscriber/pick-up',
    title: 'PICK UP CAR',
    description: 'Retrieve your parked vehicle',
    icon: KeyRound,
    gradient: 'from-success-500 to-success-700',
  },
];

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

export default function SubscriberDashboard() {
  const user = useAuthStore((s) => s.user);
  const load = useFacilityLoad(10_000);
  const activeParking = useMyActiveParking();
  const reservations = useMyReservations();

  const activeReservationsCount =
    reservations.data?.filter((r) => r.status === 'active').length ?? 0;

  return (
    <div className="space-y-8">
      <header>
        <p className="text-sm text-slate-500">Welcome back,</p>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
          {user?.first_name} {user?.last_name}
        </h1>
      </header>

      {/* Stats strip */}
      <section className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
        <StatCard
          label="Free Spots"
          value={
            load.isLoading
              ? '—'
              : `${load.data?.free ?? 0} / ${load.data?.total ?? 0}`
          }
          sub={
            load.data
              ? `${(100 - load.data.occupancy_percent).toFixed(0)}% available`
              : undefined
          }
        />
        <StatCard
          label="My Reservations"
          value={
            reservations.isLoading ? '—' : String(activeReservationsCount)
          }
          sub="currently active"
        />
        <StatCard
          label="Current Parking"
          value={
            activeParking.isLoading
              ? '—'
              : activeParking.data
              ? `#${formatCode(activeParking.data.confirmation_code)}`
              : 'None'
          }
          sub={
            activeParking.data
              ? `at space #${activeParking.data.parking_space}`
              : undefined
          }
        />
      </section>

      {/* Active parking banner */}
      {activeParking.data && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl bg-gradient-to-r from-success-50 to-emerald-100 border border-emerald-200 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
        >
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-success-500 flex items-center justify-center shadow">
              <Hash className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-sm text-emerald-700 font-medium">
                Active parking session
              </p>
              <p className="text-lg font-bold text-emerald-900 font-mono tracking-widest">
                {formatCode(activeParking.data.confirmation_code)}
              </p>
              <p className="text-xs text-emerald-700">
                Started {formatDateTime(activeParking.data.parking_date)} · space #
                {activeParking.data.parking_space}
              </p>
            </div>
          </div>
          <Link
            to="/subscriber/pick-up"
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-emerald-700 text-white font-medium hover:bg-emerald-800 transition-colors text-sm shrink-0"
          >
            <KeyRound className="h-4 w-4" />
            Pick up now
          </Link>
        </motion.div>
      )}

      {/* Big action cards */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5">
        {actions.map((action, idx) => (
          <motion.div
            key={action.to}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
          >
            <Link to={action.to} className="block group">
              <div
                className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${action.gradient} p-7 text-white shadow-lg transition-all hover:shadow-2xl hover:-translate-y-1 active:translate-y-0 min-h-[200px] flex flex-col`}
              >
                <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-white/10 group-hover:scale-150 transition-transform duration-500" />
                <div className="absolute -bottom-12 -left-12 h-36 w-36 rounded-full bg-white/5 group-hover:scale-125 transition-transform duration-500" />
                <action.icon
                  className="h-10 w-10 mb-4 relative z-10"
                  strokeWidth={2.2}
                />
                <h3 className="text-xl md:text-2xl font-bold mb-1.5 relative z-10 tracking-tight">
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
