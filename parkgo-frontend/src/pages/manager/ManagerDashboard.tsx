import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  PlusSquare,
  MinusSquare,
  BarChart3,
  Users,
  Car,
  Gauge,
  TrendingUp,
  Clock,
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

function KpiCard({
  label,
  value,
  sub,
  icon: Icon,
  accent,
  spark,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: LucideIcon;
  accent: string;
  spark?: { date: string; value: number }[];
}) {
  return (
    <div className="rounded-3xl bg-white border border-slate-100 p-5 shadow-[0_2px_8px_rgba(0,0,0,0.04)] flex flex-col">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-wider text-slate-500 font-medium">
            {label}
          </p>
          <p className="text-2xl md:text-3xl font-bold text-slate-900 mt-1 tabular-nums">
            {value}
          </p>
          {sub && <p className="text-xs text-slate-500 mt-1">{sub}</p>}
        </div>
        <div className={`h-11 w-11 rounded-xl bg-gradient-to-br ${accent} flex items-center justify-center shadow-md`}>
          <Icon className="h-5 w-5 text-white" strokeWidth={2.2} />
        </div>
      </div>

      {spark && spark.length > 1 && (
        <div className="h-16 -mx-1 mt-3">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={spark}>
              <defs>
                <linearGradient id={`spark-${label}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <Tooltip
                contentStyle={{
                  borderRadius: 8,
                  border: '1px solid #e2e8f0',
                  fontSize: 11,
                  padding: '4px 8px',
                }}
                labelFormatter={(d) => format(new Date(d), 'MMM d')}
                formatter={(v) => [`${Math.round(Number(v))}`, label]}
              />
              <XAxis dataKey="date" hide />
              <Area
                type="monotone"
                dataKey="value"
                stroke="#3b82f6"
                strokeWidth={2}
                fill={`url(#spark-${label})`}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

const actions: {
  to: string;
  title: string;
  description: string;
  icon: LucideIcon;
  gradient: string;
}[] = [
  {
    to: '/manager/reports',
    title: 'View reports',
    description: 'Occupancy · Behavior · Reservations',
    icon: BarChart3,
    gradient: 'from-primary-500 to-primary-700',
  },
  {
    to: '/manager/add-facility',
    title: 'Add facility',
    description: 'Provision new spaces or installers',
    icon: PlusSquare,
    gradient: 'from-success-500 to-success-700',
  },
  {
    to: '/manager/remove-facility',
    title: 'Remove facility',
    description: 'Decommission spaces or installers',
    icon: MinusSquare,
    gradient: 'from-rose-500 to-red-600',
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

  // Peak hour heuristic from heatmap
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

  return (
    <div className="space-y-8">
      <header>
        <p className="text-sm text-slate-500">Manager console</p>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
          {user?.first_name} {user?.last_name}
        </h1>
      </header>

      {/* KPIs */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <KpiCard
          label="Occupancy this month"
          value={
            occupancy.isLoading
              ? '—'
              : `${(occupancy.data?.average_occupancy ?? 0).toFixed(0)}%`
          }
          sub={`peak ${(occupancy.data?.peak_hours_occupancy ?? 0).toFixed(0)}% · off-peak ${(occupancy.data?.off_peak_occupancy ?? 0).toFixed(0)}%`}
          icon={Gauge}
          accent="from-primary-500 to-primary-700"
          spark={sparkDaily}
        />
        <KpiCard
          label="Free spots now"
          value={
            load.isLoading
              ? '—'
              : `${load.data?.free ?? 0} / ${load.data?.total ?? 0}`
          }
          sub={
            load.data ? `${load.data.occupancy_percent.toFixed(0)}% occupied` : ''
          }
          icon={Car}
          accent="from-emerald-500 to-emerald-700"
        />
        <KpiCard
          label="Active subscribers"
          value={subscribers.isLoading ? '—' : String(activeSubs)}
          sub={`${totalSubs - activeSubs} inactive of ${totalSubs} total`}
          icon={Users}
          accent="from-cyan-500 to-blue-600"
        />
        <KpiCard
          label="Avg parking duration"
          value={
            behavior.isLoading
              ? '—'
              : behavior.data
              ? formatDuration(behavior.data.average_duration_hours * 60)
              : '—'
          }
          sub={
            behavior.data
              ? `${behavior.data.total_parkings} sessions this month`
              : undefined
          }
          icon={Clock}
          accent="from-amber-500 to-amber-600"
        />
        <KpiCard
          label="Peak hour today"
          value={peakHour != null ? `${String(peakHour).padStart(2, '0')}:00` : '—'}
          sub="based on this month's heatmap"
          icon={TrendingUp}
          accent="from-purple-500 to-fuchsia-600"
        />
        <KpiCard
          label="Installers"
          value={
            installers.isLoading
              ? '—'
              : `${installers.data?.filter((i) => i.is_free).length ?? 0} / ${installers.data?.length ?? 0}`
          }
          sub={`${active.data?.length ?? 0} parkings active`}
          icon={Gauge}
          accent="from-rose-500 to-red-600"
        />
      </section>

      {/* Quick actions */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-5">
        {actions.map((a, i) => (
          <motion.div
            key={a.to}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
          >
            <Link to={a.to} className="block group">
              <div
                className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${a.gradient} p-6 text-white shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all min-h-[150px] flex flex-col`}
              >
                <div className="absolute -top-10 -right-10 h-32 w-32 rounded-full bg-white/10 group-hover:scale-150 transition-transform duration-500" />
                <a.icon className="h-9 w-9 mb-3 relative z-10" strokeWidth={2.2} />
                <h3 className="text-lg md:text-xl font-bold mb-1 relative z-10 tracking-tight">
                  {a.title}
                </h3>
                <p className="text-sm text-white/85 relative z-10 mt-auto">
                  {a.description}
                </p>
              </div>
            </Link>
          </motion.div>
        ))}
      </section>
    </div>
  );
}
