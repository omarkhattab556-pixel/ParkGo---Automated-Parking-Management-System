import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { History, Car, ChevronLeft, ChevronRight } from 'lucide-react';
import { TableSkeleton } from '@/components/common/Skeleton';
import { EmptyState } from '@/components/common/EmptyState';
import { useMyParkingHistory } from '@/hooks/useParking';
import { formatCode, formatDateTime, formatDuration } from '@/utils/formatters';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/PageHeader';

const PAGE_SIZE = 15;

export default function ParkingHistoryPage() {
  const { data, isLoading } = useMyParkingHistory();
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    if (!data) return [];
    return data.filter((p) => {
      const ts = new Date(p.parking_date).getTime();
      if (from && ts < new Date(from).getTime()) return false;
      if (to && ts > new Date(to).getTime() + 24 * 3600_000) return false;
      return true;
    });
  }, [data, from, to]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="History"
        title={
          <span className="inline-flex items-center gap-3">
            <span className="h-10 w-10 rounded-2xl bg-brand-50 border border-brand-100 flex items-center justify-center text-brand-600">
              <History className="h-5 w-5" />
            </span>
            Parking history
          </span>
        }
        description="All your past and current sessions"
      />

      {!isLoading && data && data.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
          <div className="sm:w-48">
            <Input
              type="date"
              label="From"
              value={from}
              onChange={(e) => {
                setFrom(e.target.value);
                setPage(1);
              }}
            />
          </div>
          <div className="sm:w-48">
            <Input
              type="date"
              label="To"
              value={to}
              onChange={(e) => {
                setTo(e.target.value);
                setPage(1);
              }}
            />
          </div>
          {(from || to) && (
            <Button
              variant="ghost"
              onClick={() => {
                setFrom('');
                setTo('');
                setPage(1);
              }}
              className="sm:ml-auto"
            >
              Clear filter
            </Button>
          )}
        </div>
      )}

      {isLoading && <TableSkeleton columns={6} rows={6} />}

      {!isLoading && (!data || data.length === 0) && (
        <EmptyState
          icon={Car}
          title="No parking sessions yet"
          description="Your parking history will appear here once you park your first car."
          action={
            <Link to="/subscriber/drop-off">
              <Button>
                <Car className="h-4 w-4" />
                Drop off your first car
              </Button>
            </Link>
          }
        />
      )}

      {!isLoading && filtered.length === 0 && data && data.length > 0 && (
        <EmptyState
          icon={Car}
          title="No sessions in this date range"
          description="Try widening the date range."
        />
      )}

      {!isLoading && pageItems.length > 0 && (
        <>
          <Card padding="none" className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-surface-50 text-ink-500 text-xs uppercase tracking-wider border-b border-surface-200">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold">Code</th>
                    <th className="px-4 py-3 text-left font-semibold">Space</th>
                    <th className="px-4 py-3 text-left font-semibold">Parked</th>
                    <th className="px-4 py-3 text-left font-semibold">Retrieved</th>
                    <th className="px-4 py-3 text-left font-semibold">Duration</th>
                    <th className="px-4 py-3 text-left font-semibold">Ext.</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-200">
                  {pageItems.map((p) => {
                    const start = new Date(p.parking_date).getTime();
                    const end = p.retrieval_time
                      ? new Date(p.retrieval_time).getTime()
                      : Date.now();
                    const minutes = Math.floor((end - start) / 60000);
                    return (
                      <tr key={p.parking_code} className="hover:bg-surface-50 transition-colors">
                        <td className="px-4 py-3 font-mono font-semibold text-ink-900 tabular">
                          {formatCode(p.confirmation_code)}
                        </td>
                        <td className="px-4 py-3 text-ink-700">
                          <Badge tone="neutral" size="md">#{p.parking_space}</Badge>
                        </td>
                        <td className="px-4 py-3 text-ink-600">
                          {formatDateTime(p.parking_date)}
                        </td>
                        <td className="px-4 py-3 text-ink-600">
                          {p.retrieval_time ? (
                            formatDateTime(p.retrieval_time)
                          ) : (
                            <Badge tone="success" dot size="md">Active</Badge>
                          )}
                        </td>
                        <td className="px-4 py-3 text-ink-700 tabular">
                          {formatDuration(minutes)}
                        </td>
                        <td className="px-4 py-3 text-ink-700 tabular">
                          {p.extension_count || 0}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>

          {pageCount > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-ink-500">
                Showing {(page - 1) * PAGE_SIZE + 1}–
                {Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
              </p>
              <div className="flex gap-2 items-center">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Prev
                </Button>
                <span className="inline-flex items-center px-3 text-sm font-semibold text-ink-700 tabular">
                  {page} / {pageCount}
                </span>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
                  disabled={page === pageCount}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
