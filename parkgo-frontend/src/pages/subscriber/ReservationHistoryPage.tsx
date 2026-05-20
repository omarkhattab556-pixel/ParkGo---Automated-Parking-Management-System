import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarClock, CalendarX, CalendarPlus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TableSkeleton } from '@/components/common/Skeleton';
import { EmptyState } from '@/components/common/EmptyState';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/PageHeader';
import { useMyReservations } from '@/hooks/useParking';
import { formatCode, formatDateTime } from '@/utils/formatters';

type Filter = 'all' | 'active' | 'cancelled';

export default function ReservationHistoryPage() {
  const { data, isLoading } = useMyReservations();
  const [filter, setFilter] = useState<Filter>('all');

  const filtered = (data || []).filter((r) =>
    filter === 'all' ? true : r.status === filter
  );

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Reservations"
        title={
          <span className="inline-flex items-center gap-3">
            <span className="h-10 w-10 rounded-2xl bg-brand-50 border border-brand-100 flex items-center justify-center text-brand-600">
              <CalendarClock className="h-5 w-5" />
            </span>
            Reservation history
          </span>
        }
        description="All bookings you've created"
      />

      {!isLoading && data && data.length > 0 && (
        <div className="inline-flex bg-surface-0 rounded-2xl border border-surface-200 p-1 gap-1 shadow-soft">
          {(['all', 'active', 'cancelled'] as Filter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                'px-4 py-1.5 rounded-xl text-sm font-semibold capitalize transition-all',
                filter === f
                  ? 'bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-soft'
                  : 'text-ink-600 hover:bg-surface-100'
              )}
            >
              {f}
            </button>
          ))}
        </div>
      )}

      {isLoading && <TableSkeleton columns={5} rows={6} />}

      {!isLoading && (!data || data.length === 0) && (
        <EmptyState
          icon={CalendarX}
          title="No reservations yet"
          description="Book a parking spot 24h–7d in advance from the reserve page."
          action={
            <Link to="/subscriber/reserve">
              <Button>
                <CalendarPlus className="h-4 w-4" />
                Order now
              </Button>
            </Link>
          }
        />
      )}

      {!isLoading && filtered.length > 0 && (
        <Card padding="none" className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-surface-50 text-ink-500 text-xs uppercase tracking-wider border-b border-surface-200">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">Code</th>
                  <th className="px-4 py-3 text-left font-semibold">Space</th>
                  <th className="px-4 py-3 text-left font-semibold">Start</th>
                  <th className="px-4 py-3 text-left font-semibold">End</th>
                  <th className="px-4 py-3 text-left font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-200">
                {filtered.map((r) => (
                  <tr key={r.reservation_id} className="hover:bg-surface-50 transition-colors">
                    <td className="px-4 py-3 font-mono font-semibold text-ink-900 tabular">
                      {formatCode(r.confirmation_code)}
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone="neutral" size="md">#{r.parking_space}</Badge>
                    </td>
                    <td className="px-4 py-3 text-ink-600">
                      {formatDateTime(r.reservation_start)}
                    </td>
                    <td className="px-4 py-3 text-ink-600">
                      {formatDateTime(r.reservation_end)}
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        tone={r.status === 'active' ? 'success' : 'neutral'}
                        dot
                        size="md"
                      >
                        {r.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
