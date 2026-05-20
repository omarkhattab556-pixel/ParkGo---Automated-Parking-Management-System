import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Car, Activity, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TableSkeleton } from '@/components/common/Skeleton';
import { EmptyState } from '@/components/common/EmptyState';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { PageHeader } from '@/components/ui/PageHeader';
import { parkingApi } from '@/api/parking.api';
import { formatCode, formatDateTime, formatDuration } from '@/utils/formatters';

function rowStatusTone(elapsedMin: number, maxMin: number): { label: string; tone: 'danger' | 'warning' | 'success' } {
  const remaining = maxMin - elapsedMin;
  if (remaining < 0) return { label: 'Overtime', tone: 'danger' };
  if (remaining < 30) return { label: 'Soon', tone: 'warning' };
  return { label: 'OK', tone: 'success' };
}

function rowBg(elapsedMin: number, maxMin: number) {
  const remaining = maxMin - elapsedMin;
  if (remaining < 0) return 'bg-danger-50/50';
  if (remaining < 30) return 'bg-warning-50/40';
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
      <PageHeader
        eyebrow="Live operations"
        title={
          <span className="inline-flex items-center gap-3">
            <span className="h-10 w-10 rounded-2xl bg-success-50 border border-success-100 flex items-center justify-center text-success-600">
              <Car className="h-5 w-5" />
            </span>
            Active parkings
          </span>
        }
        description="Refreshes every 10 seconds"
        actions={
          <Badge tone="success" dot size="lg">Live</Badge>
        }
      />

      {overtimeCount > 0 && (
        <div className="rounded-3xl bg-gradient-to-r from-danger-50 to-warning-50 border border-danger-200 p-4 flex items-start gap-3">
          <span className="h-10 w-10 rounded-2xl bg-gradient-to-br from-danger-500 to-danger-700 flex items-center justify-center shadow-soft shrink-0">
            <AlertTriangle className="h-5 w-5 text-white" />
          </span>
          <div>
            <p className="font-semibold text-danger-700 text-sm">
              {overtimeCount} vehicle{overtimeCount > 1 ? 's' : ''} over time limit
            </p>
            <p className="text-danger-700/80 text-sm">
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
        <Card padding="none" className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-surface-50 text-ink-500 text-xs uppercase tracking-wider border-b border-surface-200">
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
              <tbody className="divide-y divide-surface-200">
                {data.map((p) => {
                  const start = new Date(p.parking_date).getTime();
                  const elapsedMin = Math.floor((Date.now() - start) / 60000);
                  const maxMin = p.max_time_minutes || 240;
                  const remainingMin = maxMin - elapsedMin;
                  const status = rowStatusTone(elapsedMin, maxMin);
                  return (
                    <tr
                      key={p.parking_code}
                      className={cn('transition-colors hover:bg-surface-50', rowBg(elapsedMin, maxMin))}
                    >
                      <td className="px-4 py-3 font-mono font-semibold text-ink-900 tabular">
                        {formatCode(p.confirmation_code)}
                      </td>
                      <td className="px-4 py-3 text-ink-700 font-medium">
                        {p.user
                          ? `${p.user.first_name} ${p.user.last_name}`
                          : `#${p.subscriber_num}`}
                      </td>
                      <td className="px-4 py-3 text-ink-700 font-mono text-xs">
                        {p.subscriber?.license_plate_number || '—'}
                      </td>
                      <td className="px-4 py-3">
                        <Badge tone="neutral" size="md">#{p.parking_space}</Badge>
                      </td>
                      <td className="px-4 py-3 text-ink-600">
                        {formatDateTime(p.parking_date)}
                      </td>
                      <td className="px-4 py-3 tabular">
                        {remainingMin < 0 ? (
                          <span className="font-semibold text-danger-700">
                            +{formatDuration(-remainingMin)} over
                          </span>
                        ) : (
                          <span className="text-ink-700 font-medium">
                            {formatDuration(remainingMin)}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-ink-700 tabular">
                        {p.extension_count || 0}
                      </td>
                      <td className="px-4 py-3">
                        <Badge tone={status.tone} dot size="md">
                          {status.label}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
