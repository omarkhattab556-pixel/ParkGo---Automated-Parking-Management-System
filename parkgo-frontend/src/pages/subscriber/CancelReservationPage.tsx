import { useState } from 'react';
import { Link } from 'react-router-dom';
import { XCircle, AlertTriangle, CalendarX, CalendarPlus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { PageHeader } from '@/components/ui/PageHeader';
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
      <PageHeader
        eyebrow="Cancel"
        title={
          <span className="inline-flex items-center gap-3">
            <span className="h-10 w-10 rounded-2xl bg-danger-50 border border-danger-100 flex items-center justify-center text-danger-600">
              <XCircle className="h-5 w-5" />
            </span>
            Cancel reservation
          </span>
        }
        description="Cancel a booking and free the space for others"
      />

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
            >
              <Card padding="lg" className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] uppercase tracking-[0.12em] text-ink-500 font-semibold">
                    Code
                  </p>
                  <p className="font-mono text-2xl font-bold text-ink-900 tracking-[0.25em] tabular">
                    {formatCode(r.confirmation_code)}
                  </p>
                  <div className="flex items-center gap-2 flex-wrap mt-2">
                    <Badge tone="brand" size="md">Space #{r.parking_space}</Badge>
                    <span className="text-sm text-ink-600">
                      {formatDateTime(r.reservation_start)} →{' '}
                      {formatDateTime(r.reservation_end)}
                    </span>
                  </div>
                </div>
                <Button
                  variant="danger"
                  size="md"
                  onClick={() => setPending(r.reservation_id)}
                >
                  <XCircle className="h-4 w-4" />
                  Cancel
                </Button>
              </Card>
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
            className="fixed inset-0 z-50 bg-ink-900/60 backdrop-blur-md flex items-center justify-center p-4"
            onClick={() => setPending(null)}
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
                Cancel this reservation?
              </h2>
              <p className="text-sm text-ink-500 text-center mt-1">
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
