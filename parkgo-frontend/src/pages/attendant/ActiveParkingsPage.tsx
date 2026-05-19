import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Car, Activity, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TableSkeleton } from '@/components/common/Skeleton';
import { EmptyState } from '@/components/common/EmptyState';
import { parkingApi } from '@/api/parking.api';
import { formatCode, formatDateTime, formatDuration } from '@/utils/formatters';

function rowStatus(elapsedMin: number, maxMin: number) {
  const remaining = maxMin - elapsedMin;
  if (remaining < 0) return { label: 'Overtime', color: 'bg-danger-100 text-danger-700' };
  if (remaining < 30) return { label: 'Soon', color: 'bg-amber-100 text-amber-700' };
  return { label: 'OK', color: 'bg-emerald-100 text-emerald-700' };
}

function rowBg(elapsedMin: number, maxMin: number) {
  const remaining = maxMin - elapsedMin;
  if (remaining < 0) return 'bg-danger-50/50';
  if (remaining < 30) return 'bg-amber-50/40';
  return '';
}

export default function ActiveParkingsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['parking', 'active'],
    queryFn: () => parkingApi.active(),
    refetchInterval: 10_000,
    refetchIntervalInBackground: false,
  });

  // tick every second so the "remaining" column updates live
  const [, setTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setTick((n) => n + 1), 1000);
    return () => clearInterval(t);
  }, []);

  const overtimeCount =
    data?.filter((p) => {
      const elapsed = Math.floor(
        (Date.now() - new Date(p.parking_date).getTime()) / 60000
      );
      return elapsed > (p.max_time_minutes || 240);
    }).length ?? 0;

  return (
    <div className="space-y-6">
      <header className="flex items-center gap-3">
        <div className="h-11 w-11 rounded-xl bg-success-50 flex items-center justify-center">
          <Car className="h-5 w-5 text-success-700" />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
            Active parkings
          </h1>
          <p className="text-slate-500 text-sm flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-emerald-700">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live · refreshes every 10s
            </span>
          </p>
        </div>
      </header>

      {overtimeCount > 0 && (
        <div className="rounded-2xl bg-danger-50 border border-danger-200 p-4 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-danger-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-danger-800 text-sm">
              {overtimeCount} vehicle{overtimeCount > 1 ? 's' : ''} over time limit
            </p>
            <p className="text-danger-700 text-sm">
              Subscribers are subject to a delay strike per late return.
            </p>
          </div>
        </div>
      )}

      {isLoading && <TableSkeleton columns={8} rows={6} />}

      {!isLoading && (!data || data.length === 0) && (
        <EmptyState
          icon={Activity}
          title="No active parking sessions"
          description="The facility is empty at the moment."
        />
      )}

      {!isLoading && data && data.length > 0 && (
        <div className="rounded-2xl bg-white border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">Code</th>
                  <th className="px-4 py-3 text-left font-semibold">Subscriber</th>
                  <th className="px-4 py-3 text-left font-semibold">License</th>
                  <th className="px-4 py-3 text-left font-semibold">Space</th>
                  <th className="px-4 py-3 text-left font-semibold">Parked at</th>
                  <th className="px-4 py-3 text-left font-semibold">Remaining</th>
                  <th className="px-4 py-3 text-left font-semibold">Ext.</th>
                  <th className="px-4 py-3 text-left font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.map((p) => {
                  const start = new Date(p.parking_date).getTime();
                  const elapsedMin = Math.floor(
                    (Date.now() - start) / 60000
                  );
                  const maxMin = p.max_time_minutes || 240;
                  const remainingMin = maxMin - elapsedMin;
                  const status = rowStatus(elapsedMin, maxMin);
                  return (
                    <tr
                      key={p.parking_code}
                      className={cn('transition-colors', rowBg(elapsedMin, maxMin))}
                    >
                      <td className="px-4 py-3 font-mono font-semibold text-slate-900">
                        {formatCode(p.confirmation_code)}
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        {p.user
                          ? `${p.user.first_name} ${p.user.last_name}`
                          : `#${p.subscriber_num}`}
                      </td>
                      <td className="px-4 py-3 text-slate-700 font-mono text-xs">
                        {p.subscriber?.license_plate_number || '—'}
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        #{p.parking_space}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {formatDateTime(p.parking_date)}
                      </td>
                      <td className="px-4 py-3 tabular-nums">
                        {remainingMin < 0 ? (
                          <span className="font-semibold text-danger-700">
                            +{formatDuration(-remainingMin)} over
                          </span>
                        ) : (
                          <span className="text-slate-700">
                            {formatDuration(remainingMin)}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-700 tabular-nums">
                        {p.extension_count || 0}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            'inline-flex px-2 py-0.5 text-xs font-medium rounded-full',
                            status.color
                          )}
                        >
                          {status.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
