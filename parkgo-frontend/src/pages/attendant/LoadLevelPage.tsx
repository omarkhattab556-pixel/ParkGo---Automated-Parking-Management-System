import { useQuery } from '@tanstack/react-query';
import {
  Gauge as GaugeIcon,
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Legend,
} from 'recharts';
import { motion } from 'framer-motion';

import { facilityApi } from '@/api/facility.api';
import { ChartSkeleton } from '@/components/common/Skeleton';
import { format } from 'date-fns';

/* ----- Half-circle gauge (SVG) ----- */
function Gauge({ percent }: { percent: number }) {
  const clamped = Math.max(0, Math.min(100, percent));
  const angle = (clamped / 100) * 180;
  const r = 80;
  const cx = 100;
  const cy = 100;
  const startRad = Math.PI; // 180°
  const endRad = Math.PI - (angle * Math.PI) / 180;
  const x1 = cx + r * Math.cos(startRad);
  const y1 = cy + r * Math.sin(startRad);
  const x2 = cx + r * Math.cos(endRad);
  const y2 = cy + r * Math.sin(endRad);
  const largeArc = angle > 180 ? 1 : 0;

  const color =
    clamped < 50 ? '#10b981' : clamped < 80 ? '#f59e0b' : '#ef4444';

  return (
    <div className="relative">
      <svg viewBox="0 0 200 120" className="w-full max-w-sm mx-auto">
        {/* Background arc */}
        <path
          d="M 20 100 A 80 80 0 0 1 180 100"
          fill="none"
          stroke="#e2e8f0"
          strokeWidth="14"
          strokeLinecap="round"
        />
        {/* Value arc */}
        {angle > 0 && (
          <motion.path
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
            d={`M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`}
            fill="none"
            stroke={color}
            strokeWidth="14"
            strokeLinecap="round"
          />
        )}
        {/* Big percentage text */}
        <text
          x="100"
          y="86"
          textAnchor="middle"
          fontSize="32"
          fontWeight="700"
          fill="#0f172a"
        >
          {clamped.toFixed(0)}%
        </text>
        <text
          x="100"
          y="108"
          textAnchor="middle"
          fontSize="12"
          fill="#64748b"
        >
          OCCUPIED
        </text>
      </svg>
    </div>
  );
}

const DONUT_COLORS = {
  free: '#10b981',
  reserved: '#f59e0b',
  occupied: '#3b82f6',
} as const;

export default function LoadLevelPage() {
  const load = useQuery({
    queryKey: ['facility', 'load'],
    queryFn: () => facilityApi.getLoad(),
    refetchInterval: 5000,
  });

  const hourly = useQuery({
    queryKey: ['facility', 'hourly', 24],
    queryFn: () => facilityApi.getHourly(24),
    refetchInterval: 60_000,
  });

  const donutData = load.data
    ? [
        { name: 'Occupied', value: load.data.occupied, color: DONUT_COLORS.occupied },
        { name: 'Reserved', value: load.data.reserved, color: DONUT_COLORS.reserved },
        { name: 'Free', value: load.data.free, color: DONUT_COLORS.free },
      ].filter((d) => d.value > 0)
    : [];

  const timelineData = (hourly.data || []).map((p) => ({
    hour: format(new Date(p.hour), 'HH:mm'),
    occupancy: Math.round(p.occupancy_percent),
    occupied: p.occupied,
  }));

  return (
    <div className="space-y-6">
      <header className="flex items-center gap-3">
        <div className="h-11 w-11 rounded-xl bg-accent-100 flex items-center justify-center">
          <GaugeIcon className="h-5 w-5 text-accent-600" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
            Load level
          </h1>
          <p className="text-slate-500 text-sm flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-emerald-700">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live · gauge refreshes every 5s
            </span>
          </p>
        </div>
      </header>

      {load.isLoading && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <ChartSkeleton height={300} />
          <ChartSkeleton height={300} />
        </div>
      )}

      {load.data && (
        <>
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Gauge */}
            <div className="rounded-3xl bg-white border border-slate-100 p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
              <h2 className="text-sm font-semibold text-slate-900 mb-3">
                Occupancy
              </h2>
              <Gauge percent={load.data.occupancy_percent} />
              <div className="grid grid-cols-3 gap-3 mt-2 text-center">
                <div>
                  <p className="text-xs text-slate-500">Occupied</p>
                  <p className="text-xl font-bold text-slate-900 tabular-nums">
                    {load.data.occupied}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Reserved</p>
                  <p className="text-xl font-bold text-slate-900 tabular-nums">
                    {load.data.reserved}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Free</p>
                  <p className="text-xl font-bold text-slate-900 tabular-nums">
                    {load.data.free}
                  </p>
                </div>
              </div>
            </div>

            {/* Donut */}
            <div className="rounded-3xl bg-white border border-slate-100 p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
              <h2 className="text-sm font-semibold text-slate-900 mb-3">
                Distribution
              </h2>
              {donutData.length === 0 ? (
                <p className="text-sm text-slate-500 py-10 text-center">
                  No data yet.
                </p>
              ) : (
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={donutData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={3}
                      >
                        {donutData.map((entry, i) => (
                          <Cell key={i} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          borderRadius: 12,
                          border: '1px solid #e2e8f0',
                          fontSize: 12,
                        }}
                      />
                      <Legend
                        verticalAlign="bottom"
                        wrapperStyle={{ fontSize: 12 }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </section>

          {/* 24h timeline */}
          <section className="rounded-3xl bg-white border border-slate-100 p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-slate-900">
                Last 24 hours · occupancy %
              </h2>
              {hourly.isFetching && (
                <span className="text-xs text-slate-500">refreshing…</span>
              )}
            </div>
            {hourly.isLoading ? (
              <ChartSkeleton height={288} />
            ) : (
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={timelineData}>
                    <defs>
                      <linearGradient id="loadColor" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.45} />
                        <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis
                      dataKey="hour"
                      tick={{ fontSize: 11, fill: '#64748b' }}
                      interval="preserveStartEnd"
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: '#64748b' }}
                      domain={[0, 100]}
                      unit="%"
                    />
                    <Tooltip
                      contentStyle={{
                        borderRadius: 12,
                        border: '1px solid #e2e8f0',
                        fontSize: 12,
                      }}
                      formatter={(v) => `${v}%`}
                    />
                    <Area
                      type="monotone"
                      dataKey="occupancy"
                      stroke="#3b82f6"
                      strokeWidth={2.5}
                      fill="url(#loadColor)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
