import { useState } from 'react';
import { CalendarClock, CalendarX } from 'lucide-react';
import { cn } from '@/lib/utils';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { EmptyState } from '@/components/common/EmptyState';
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
      <header className="flex items-center gap-3">
        <div className="h-11 w-11 rounded-xl bg-primary-50 flex items-center justify-center">
          <CalendarClock className="h-5 w-5 text-primary-600" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
            Reservation history
          </h1>
          <p className="text-slate-500 text-sm">
            All bookings you've created
          </p>
        </div>
      </header>

      {!isLoading && data && data.length > 0 && (
        <div className="inline-flex bg-white rounded-xl border border-slate-200 p-1 gap-1">
          {(['all', 'active', 'cancelled'] as Filter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                'px-4 py-1.5 rounded-lg text-sm font-medium capitalize transition',
                filter === f
                  ? 'bg-primary-500 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-50'
              )}
            >
              {f}
            </button>
          ))}
        </div>
      )}

      {isLoading && <LoadingSpinner />}

      {!isLoading && (!data || data.length === 0) && (
        <EmptyState
          icon={CalendarX}
          title="No reservations yet"
          description="You haven't made any reservations. Use ORDER NOW from the dashboard."
        />
      )}

      {!isLoading && filtered.length > 0 && (
        <div className="rounded-2xl bg-white border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">Code</th>
                  <th className="px-4 py-3 text-left font-semibold">Space</th>
                  <th className="px-4 py-3 text-left font-semibold">Start</th>
                  <th className="px-4 py-3 text-left font-semibold">End</th>
                  <th className="px-4 py-3 text-left font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((r) => (
                  <tr key={r.reservation_id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-mono font-semibold text-slate-900">
                      {formatCode(r.confirmation_code)}
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      #{r.parking_space}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {formatDateTime(r.reservation_start)}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {formatDateTime(r.reservation_end)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          'inline-flex px-2 py-0.5 text-xs font-medium rounded-full',
                          r.status === 'active'
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-slate-100 text-slate-600'
                        )}
                      >
                        {r.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
