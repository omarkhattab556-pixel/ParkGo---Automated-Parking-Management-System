import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  Search,
  Eye,
  RotateCcw,
  X,
  Mail,
  Phone,
  Hash,
  Calendar,
  Car,
  CalendarClock,
  Ban,
  AlertTriangle,
} from 'lucide-react';
import toast from 'react-hot-toast';

import { useAuthStore } from '@/store/authStore';

import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { PageHeader } from '@/components/ui/PageHeader';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { TableSkeleton } from '@/components/common/Skeleton';
import { EmptyState } from '@/components/common/EmptyState';
import { cn } from '@/lib/utils';
import { subscriberApi, type SubscriberListItem } from '@/api/subscriber.api';
import {
  formatCode,
  formatDate,
  formatDateTime,
  formatDuration,
} from '@/utils/formatters';

type Filter = 'all' | 'active' | 'inactive';

function SubscriberDetailModal({
  id,
  onClose,
}: {
  id: number;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const userType = useAuthStore((s) => s.user?.user_type);
  const isManager = userType === 'manager';
  const isAttendant = userType === 'attendant';
  const [confirmDeactivate, setConfirmDeactivate] = useState(false);

  const detail = useQuery({
    queryKey: ['subscriber', 'detail', id],
    queryFn: () => subscriberApi.detail(id),
  });

  const reactivate = useMutation({
    mutationFn: () => subscriberApi.reactivate(id),
    onSuccess: () => {
      toast.success('Subscription reactivated');
      qc.invalidateQueries({ queryKey: ['subscriber', 'detail', id] });
      qc.invalidateQueries({ queryKey: ['subscribers'] });
    },
    onError: (err: { error?: string; message?: string }) => {
      toast.error(err.error || err.message || 'Could not reactivate');
    },
  });

  const deactivate = useMutation({
    mutationFn: () => subscriberApi.deactivate(id),
    onSuccess: (data) => {
      const note =
        data.cancelled_reservations > 0
          ? ` · ${data.cancelled_reservations} reservations cancelled`
          : '';
      toast.success(`Subscription cancelled${note}`);
      setConfirmDeactivate(false);
      qc.invalidateQueries({ queryKey: ['subscriber', 'detail', id] });
      qc.invalidateQueries({ queryKey: ['subscribers'] });
      qc.invalidateQueries({ queryKey: ['reservations'] });
    },
    onError: (err: { error?: string; message?: string }) => {
      toast.error(err.error || err.message || 'Could not cancel');
      setConfirmDeactivate(false);
    },
  });

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-start justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.94, y: 16 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.94, y: 16 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-3xl rounded-3xl bg-white p-6 md:p-8 shadow-2xl my-8"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-slate-900">
            Subscriber details
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-500 hover:bg-slate-100"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {detail.isLoading && <LoadingSpinner />}
        {detail.data && (
          <div className="space-y-6">
            {/* Profile */}
            <section className="rounded-2xl bg-slate-50 p-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-xs uppercase tracking-wider text-slate-500">
                    Name
                  </p>
                  <p className="font-semibold text-slate-900">
                    {detail.data.user.first_name} {detail.data.user.last_name}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider text-slate-500 flex items-center gap-1">
                    <Mail className="h-3 w-3" /> Email
                  </p>
                  <p className="font-semibold text-slate-900 truncate">
                    {detail.data.user.email}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider text-slate-500 flex items-center gap-1">
                    <Phone className="h-3 w-3" /> Phone
                  </p>
                  <p className="font-semibold text-slate-900">
                    {detail.data.user.phone_number || '—'}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider text-slate-500 flex items-center gap-1">
                    <Hash className="h-3 w-3" /> License plate
                  </p>
                  <p className="font-semibold text-slate-900">
                    {detail.data.subscriber?.license_plate_number || '—'}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider text-slate-500 flex items-center gap-1">
                    <Calendar className="h-3 w-3" /> Registered
                  </p>
                  <p className="font-semibold text-slate-900">
                    {formatDate(detail.data.subscriber?.registration_date)}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider text-slate-500">
                    Status
                  </p>
                  <span
                    className={cn(
                      'inline-flex px-2 py-0.5 text-xs font-medium rounded-full',
                      detail.data.subscriber?.status === 'active'
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-danger-100 text-danger-700'
                    )}
                  >
                    {detail.data.subscriber?.status} ·{' '}
                    {detail.data.subscriber?.delay_count} delays
                  </span>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {detail.data.subscriber?.status === 'inactive' && isAttendant && (
                  <Button
                    variant="success"
                    onClick={() => reactivate.mutate()}
                    loading={reactivate.isPending}
                  >
                    <RotateCcw className="h-4 w-4" />
                    Reactivate subscription
                  </Button>
                )}
                {detail.data.subscriber?.status === 'active' && isManager && (
                  <Button
                    variant="danger"
                    onClick={() => setConfirmDeactivate(true)}
                    loading={deactivate.isPending}
                  >
                    <Ban className="h-4 w-4" />
                    Cancel subscription
                  </Button>
                )}
              </div>
            </section>

            <AnimatePresence>
              {confirmDeactivate && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-[60] bg-ink-900/60 backdrop-blur-md flex items-center justify-center p-4"
                  onClick={() => setConfirmDeactivate(false)}
                >
                  <motion.div
                    initial={{ scale: 0.92 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0.92 }}
                    onClick={(e) => e.stopPropagation()}
                    className="w-full max-w-sm rounded-3xl bg-surface-0 p-6 shadow-popover"
                  >
                    <div className="flex items-center justify-center mb-4">
                      <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-danger-500 to-danger-700 flex items-center justify-center shadow-[0_8px_24px_-8px_rgba(244,63,94,0.55)]">
                        <AlertTriangle className="h-7 w-7 text-white" />
                      </div>
                    </div>
                    <h2 className="font-display text-xl font-bold text-ink-900 text-center">
                      Cancel subscription?
                    </h2>
                    <p className="text-sm text-ink-500 text-center mt-1">
                      The subscriber will become inactive. Any active
                      reservations they have will be cancelled too.
                    </p>
                    <div className="flex gap-3 mt-6">
                      <Button
                        variant="secondary"
                        fullWidth
                        onClick={() => setConfirmDeactivate(false)}
                      >
                        Keep
                      </Button>
                      <Button
                        variant="danger"
                        fullWidth
                        loading={deactivate.isPending}
                        onClick={() => deactivate.mutate()}
                      >
                        Yes, cancel
                      </Button>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Recent reservations */}
            <section>
              <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2 mb-3">
                <CalendarClock className="h-4 w-4 text-slate-500" />
                Recent reservations
              </h3>
              {detail.data.reservations.length === 0 ? (
                <p className="text-sm text-slate-500 italic">None yet</p>
              ) : (
                <div className="rounded-xl border border-slate-200 overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
                      <tr>
                        <th className="px-3 py-2 text-left">Code</th>
                        <th className="px-3 py-2 text-left">Space</th>
                        <th className="px-3 py-2 text-left">Start</th>
                        <th className="px-3 py-2 text-left">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {detail.data.reservations.slice(0, 6).map((r) => (
                        <tr key={r.reservation_id}>
                          <td className="px-3 py-2 font-mono text-slate-900">
                            {formatCode(r.confirmation_code)}
                          </td>
                          <td className="px-3 py-2 text-slate-700">
                            #{r.parking_space}
                          </td>
                          <td className="px-3 py-2 text-slate-600">
                            {formatDateTime(r.reservation_start)}
                          </td>
                          <td className="px-3 py-2">
                            <span
                              className={cn(
                                'inline-flex px-2 py-0.5 text-xs rounded-full',
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
              )}
            </section>

            {/* Recent parkings */}
            <section>
              <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2 mb-3">
                <Car className="h-4 w-4 text-slate-500" />
                Recent parkings
              </h3>
              {detail.data.parkings.length === 0 ? (
                <p className="text-sm text-slate-500 italic">None yet</p>
              ) : (
                <div className="rounded-xl border border-slate-200 overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
                      <tr>
                        <th className="px-3 py-2 text-left">Code</th>
                        <th className="px-3 py-2 text-left">Space</th>
                        <th className="px-3 py-2 text-left">Parked</th>
                        <th className="px-3 py-2 text-left">Duration</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {detail.data.parkings.slice(0, 6).map((p) => {
                        const start = new Date(p.parking_date).getTime();
                        const end = p.retrieval_time
                          ? new Date(p.retrieval_time).getTime()
                          : Date.now();
                        const minutes = Math.floor((end - start) / 60000);
                        return (
                          <tr key={p.parking_code}>
                            <td className="px-3 py-2 font-mono text-slate-900">
                              {formatCode(p.confirmation_code)}
                            </td>
                            <td className="px-3 py-2 text-slate-700">
                              #{p.parking_space}
                            </td>
                            <td className="px-3 py-2 text-slate-600">
                              {formatDateTime(p.parking_date)}
                            </td>
                            <td className="px-3 py-2 text-slate-700">
                              {p.retrieval_time
                                ? formatDuration(minutes)
                                : `${formatDuration(minutes)} (active)`}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

export default function ActiveSubscribersPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['subscribers', 'list'],
    queryFn: () => subscriberApi.list(),
  });

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [openId, setOpenId] = useState<number | null>(null);

  const filtered = useMemo<SubscriberListItem[]>(() => {
    if (!data) return [];
    const q = search.trim().toLowerCase();
    return data.filter((u) => {
      const status = u.subscriber?.status || 'active';
      if (filter !== 'all' && status !== filter) return false;
      if (!q) return true;
      return (
        u.first_name.toLowerCase().includes(q) ||
        u.last_name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.phone_number || '').includes(q) ||
        (u.subscriber?.license_plate_number || '').toLowerCase().includes(q) ||
        String(u.id).includes(q)
      );
    });
  }, [data, search, filter]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Directory"
        title={
          <span className="inline-flex items-center gap-3">
            <span className="h-10 w-10 rounded-2xl bg-accent-50 border border-accent-100 flex items-center justify-center text-accent-600">
              <Users className="h-5 w-5" />
            </span>
            Active subscribers
          </span>
        }
        description="Search by name, email, license plate, or ID"
      />

      <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
        <div className="flex-1">
          <Input
            placeholder="Search…"
            icon={<Search className="h-4 w-4" />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="inline-flex bg-surface-0 rounded-2xl border border-surface-200 p-1 gap-1 self-start sm:self-auto shadow-soft">
          {(['all', 'active', 'inactive'] as Filter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                'px-4 py-1.5 rounded-xl text-sm font-semibold capitalize transition-all',
                filter === f
                  ? 'bg-gradient-to-br from-accent-500 to-accent-700 text-white shadow-soft'
                  : 'text-ink-600 hover:bg-surface-100'
              )}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {isLoading && <TableSkeleton columns={9} rows={8} />}

      {!isLoading && filtered.length === 0 && (
        <EmptyState
          icon={Users}
          title="No subscribers match"
          description={
            data && data.length === 0
              ? 'Register your first subscriber from the dashboard.'
              : 'Try a different search or filter.'
          }
        />
      )}

      {!isLoading && filtered.length > 0 && (
        <Card padding="none" className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-surface-50 text-ink-500 text-xs uppercase tracking-wider border-b border-surface-200">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">ID</th>
                  <th className="px-4 py-3 text-left font-semibold">Name</th>
                  <th className="px-4 py-3 text-left font-semibold">Email</th>
                  <th className="px-4 py-3 text-left font-semibold">Phone</th>
                  <th className="px-4 py-3 text-left font-semibold">License</th>
                  <th className="px-4 py-3 text-left font-semibold">Status</th>
                  <th className="px-4 py-3 text-left font-semibold">Delays</th>
                  <th className="px-4 py-3 text-left font-semibold">Joined</th>
                  <th className="px-4 py-3 text-right font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-200">
                {filtered.map((u) => {
                  const status = u.subscriber?.status || 'active';
                  return (
                    <tr key={u.id} className="hover:bg-surface-50 transition-colors">
                      <td className="px-4 py-3 font-mono text-ink-700 tabular">
                        {u.id}
                      </td>
                      <td className="px-4 py-3 font-semibold text-ink-900">
                        {u.first_name} {u.last_name}
                      </td>
                      <td className="px-4 py-3 text-ink-600">{u.email}</td>
                      <td className="px-4 py-3 text-ink-600">
                        {u.phone_number || '—'}
                      </td>
                      <td className="px-4 py-3 text-ink-700 font-mono text-xs">
                        {u.subscriber?.license_plate_number || '—'}
                      </td>
                      <td className="px-4 py-3">
                        <Badge tone={status === 'active' ? 'success' : 'danger'} dot size="md">
                          {status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-ink-700 tabular">
                        {u.subscriber?.delay_count ?? 0}
                      </td>
                      <td className="px-4 py-3 text-ink-600">
                        {formatDate(u.subscriber?.registration_date)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => setOpenId(u.id)}
                          className="inline-flex items-center gap-1 text-sm font-semibold text-brand-600 hover:text-brand-700"
                        >
                          <Eye className="h-4 w-4" />
                          View
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <AnimatePresence>
        {openId != null && (
          <SubscriberDetailModal id={openId} onClose={() => setOpenId(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}
