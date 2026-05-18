import { History, Car } from 'lucide-react';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { EmptyState } from '@/components/common/EmptyState';
import { useMyParkingHistory } from '@/hooks/useParking';
import { formatCode, formatDateTime, formatDuration } from '@/utils/formatters';

export default function ParkingHistoryPage() {
  const { data, isLoading } = useMyParkingHistory();

  return (
    <div className="space-y-6">
      <header className="flex items-center gap-3">
        <div className="h-11 w-11 rounded-xl bg-primary-50 flex items-center justify-center">
          <History className="h-5 w-5 text-primary-600" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
            Parking history
          </h1>
          <p className="text-slate-500 text-sm">All your past and current sessions</p>
        </div>
      </header>

      {isLoading && <LoadingSpinner />}

      {!isLoading && (!data || data.length === 0) && (
        <EmptyState
          icon={Car}
          title="No parking sessions yet"
          description="Your parking history will appear here once you park your first car."
        />
      )}

      {!isLoading && data && data.length > 0 && (
        <div className="rounded-2xl bg-white border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">Code</th>
                  <th className="px-4 py-3 text-left font-semibold">Space</th>
                  <th className="px-4 py-3 text-left font-semibold">Parked</th>
                  <th className="px-4 py-3 text-left font-semibold">Retrieved</th>
                  <th className="px-4 py-3 text-left font-semibold">Duration</th>
                  <th className="px-4 py-3 text-left font-semibold">Extensions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.map((p) => {
                  const start = new Date(p.parking_date).getTime();
                  const end = p.retrieval_time
                    ? new Date(p.retrieval_time).getTime()
                    : Date.now();
                  const minutes = Math.floor((end - start) / 60000);
                  return (
                    <tr key={p.parking_code} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-mono font-semibold text-slate-900">
                        {formatCode(p.confirmation_code)}
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        #{p.parking_space}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {formatDateTime(p.parking_date)}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {p.retrieval_time ? (
                          formatDateTime(p.retrieval_time)
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Active
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        {formatDuration(minutes)}
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        {p.extension_count || 0}
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
