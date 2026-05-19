import { useState } from 'react';
import { Link } from 'react-router-dom';
import { XCircle, AlertTriangle, CalendarX, CalendarPlus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { Button } from '@/components/ui/Button';
import { CardSkeleton } from '@/components/common/Skeleton';
import { EmptyState } from '@/components/common/EmptyState';
import { useCancelReservation, useMyReservations } from '@/hooks/useParking';
import { formatCode, formatDateTime } from '@/utils/formatters';

export default function CancelReservationPage() {
  const { data, isLoading } = useMyReservations();
  const cancel = useCancelReservation();
  const [pending, setPending] = useState<number | null>(null);

  const active = (data || []).filter((r) => r.status === 'active');

  const confirmCancel = (id: number) => {
    cancel.mutate(id, {
      onSettled: () => setPending(null),
    });
  };

  return (
    <div className="space-y-6">
      <header className="flex items-center gap-3">
        <div className="h-11 w-11 rounded-xl bg-danger-50 flex items-center justify-center">
          <XCircle className="h-5 w-5 text-danger-600" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
            Cancel reservation
          </h1>
          <p className="text-slate-500 text-sm">
            Cancel a booking and free the space for others
          </p>
        </div>
      </header>

      {isLoading && (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <CardSkeleton key={i} lines={2} />
          ))}
        </div>
      )}

      {!isLoading && active.length === 0 && (
        <EmptyState
          icon={CalendarX}
          title="No active reservations"
          description="You don't have any reservations to cancel."
          action={
            <Link to="/subscriber/reserve">
              <Button variant="secondary">
                <CalendarPlus className="h-4 w-4" />
                Make a reservation
              </Button>
            </Link>
          }
        />
      )}

      {!isLoading && active.length > 0 && (
        <div className="space-y-3">
          {active.map((r) => (
            <motion.div
              key={r.reservation_id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl bg-white border border-slate-100 p-5 flex flex-col sm:flex-row sm:items-center gap-4"
            >
              <div className="flex-1 min-w-0">
                <p className="text-xs uppercase tracking-wider text-slate-500 font-medium">
                  Code
                </p>
                <p className="font-mono text-2xl font-bold text-slate-900 tracking-widest">
                  {formatCode(r.confirmation_code)}
                </p>
                <p className="text-sm text-slate-600 mt-1">
                  Space #{r.parking_space} ·{' '}
                  {formatDateTime(r.reservation_start)} →{' '}
                  {formatDateTime(r.reservation_end)}
                </p>
              </div>
              <Button
                variant="danger"
                size="md"
                onClick={() => setPending(r.reservation_id)}
              >
                <XCircle className="h-4 w-4" />
                Cancel
              </Button>
            </motion.div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {pending != null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setPending(null)}
          >
            <motion.div
              initial={{ scale: 0.92 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.92 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl"
            >
              <div className="flex items-center justify-center mb-4">
                <div className="h-14 w-14 rounded-2xl bg-danger-50 flex items-center justify-center">
                  <AlertTriangle className="h-7 w-7 text-danger-600" />
                </div>
              </div>
              <h2 className="text-xl font-bold text-slate-900 text-center">
                Cancel this reservation?
              </h2>
              <p className="text-sm text-slate-500 text-center mt-1">
                This frees the parking space for others. You cannot undo this.
              </p>
              <div className="flex gap-3 mt-6">
                <Button
                  variant="secondary"
                  fullWidth
                  onClick={() => setPending(null)}
                >
                  Keep it
                </Button>
                <Button
                  variant="danger"
                  fullWidth
                  loading={cancel.isPending}
                  onClick={() => confirmCancel(pending)}
                >
                  Yes, cancel
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
