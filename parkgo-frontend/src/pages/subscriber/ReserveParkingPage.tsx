import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CalendarPlus,
  Clock,
  Calendar as CalendarIcon,
  CheckCircle2,
  AlertTriangle,
  Info,
  ArrowLeft,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { format, addDays, addHours, isAfter, isBefore } from 'date-fns';
import toast from 'react-hot-toast';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { CodeDisplay } from '@/components/common/CodeDisplay';
import { reservationApi, type CreateReservationResult } from '@/api/reservation.api';
import type { AvailabilityResult } from '@/api/reservation.api';
import { useFacilityLoad } from '@/hooks/useParking';
import { BUSINESS_RULES } from '@/utils/constants';
import { formatDateTime } from '@/utils/formatters';

const MIN_OFFSET_HOURS = BUSINESS_RULES.MIN_RESERVATION_HOURS_AHEAD;
const MAX_OFFSET_DAYS = BUSINESS_RULES.MAX_RESERVATION_DAYS_AHEAD;
const MIN_FREE_PCT = BUSINESS_RULES.MIN_FREE_PERCENT;

const timeOptions: string[] = (() => {
  const out: string[] = [];
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += 15) {
      out.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
    }
  }
  return out;
})();

export default function ReserveParkingPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const load = useFacilityLoad(15_000);

  const now = useMemo(() => new Date(), []);
  const minDate = useMemo(() => addHours(now, MIN_OFFSET_HOURS), [now]);
  const maxDate = useMemo(() => addDays(now, MAX_OFFSET_DAYS), [now]);

  const [date, setDate] = useState<string>(format(minDate, 'yyyy-MM-dd'));
  const [time, setTime] = useState<string>(() => {
    const minutes = minDate.getMinutes();
    const rounded = Math.ceil(minutes / 15) * 15;
    const t = new Date(minDate);
    t.setMinutes(rounded, 0, 0);
    return format(t, 'HH:mm');
  });

  const [availability, setAvailability] = useState<AvailabilityResult | null>(null);
  const [success, setSuccess] = useState<CreateReservationResult | null>(null);

  const combinedIso = useMemo(() => {
    if (!date || !time) return null;
    const dt = new Date(`${date}T${time}:00`);
    if (Number.isNaN(dt.getTime())) return null;
    return dt.toISOString();
  }, [date, time]);

  const validationError = useMemo(() => {
    if (!combinedIso) return 'Please pick a date and time';
    const dt = new Date(combinedIso);
    if (isBefore(dt, minDate))
      return `Must be at least ${MIN_OFFSET_HOURS} hours from now`;
    if (isAfter(dt, maxDate))
      return `Cannot be more than ${MAX_OFFSET_DAYS} days from now`;
    return null;
  }, [combinedIso, minDate, maxDate]);

  const checkAvailability = useMutation({
    mutationFn: (iso: string) => reservationApi.checkAvailability(iso),
    onSuccess: (data) => setAvailability(data),
    onError: () => setAvailability(null),
  });

  const createReservation = useMutation({
    mutationFn: (iso: string) => reservationApi.create(iso),
    onSuccess: (data) => {
      setSuccess(data);
      qc.invalidateQueries({ queryKey: ['reservations'] });
      qc.invalidateQueries({ queryKey: ['facility'] });
    },
    onError: (err: { message?: string; error?: string }) => {
      toast.error(err.error || err.message || 'Could not create reservation');
    },
  });

  useEffect(() => {
    if (!combinedIso || validationError) {
      setAvailability(null);
      return;
    }
    const t = setTimeout(() => checkAvailability.mutate(combinedIso), 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [combinedIso, validationError]);

  const onSubmit = () => {
    if (!combinedIso || validationError) return;
    if (availability && !availability.ok) return;
    createReservation.mutate(combinedIso);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <header className="flex items-center gap-3">
        <Link
          to="/subscriber"
          aria-label="Back to dashboard"
          className="h-10 w-10 inline-flex items-center justify-center rounded-2xl text-ink-600 hover:bg-surface-100"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <p className="text-[11px] uppercase tracking-[0.12em] font-semibold text-brand-600">
            New reservation
          </p>
          <h1 className="font-display text-2xl md:text-3xl font-bold text-ink-900 tracking-tight">
            Reserve a parking spot
          </h1>
          <p className="text-ink-500 text-sm">
            Bookings must be {MIN_OFFSET_HOURS}h–{MAX_OFFSET_DAYS}d in advance.
          </p>
        </div>
      </header>

      {/* Live availability strip */}
      <Card variant="glass" padding="md" className="flex items-center gap-3">
        <span className="h-10 w-10 rounded-xl bg-brand-50 border border-brand-100 flex items-center justify-center text-brand-600 shrink-0">
          <Info className="h-5 w-5" />
        </span>
        <div className="text-sm text-ink-700 flex-1">
          <p>
            Free right now:{' '}
            <span className="font-bold tabular text-ink-900">
              {load.data ? `${load.data.free} / ${load.data.total}` : '—'}
            </span>
          </p>
          <p className="text-ink-500 text-xs mt-0.5">
            Reservations require ≥{MIN_FREE_PCT}% free at the requested time.
          </p>
        </div>
      </Card>

      <Card variant="default" padding="xl" className="space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            type="date"
            label="Date"
            icon={<CalendarIcon className="h-4 w-4" />}
            value={date}
            min={format(minDate, 'yyyy-MM-dd')}
            max={format(maxDate, 'yyyy-MM-dd')}
            onChange={(e) => setDate(e.target.value)}
          />
          <div>
            <label className="block text-[13px] font-semibold text-ink-700 mb-1.5">
              Time (15-min slots)
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400 pointer-events-none">
                <Clock className="h-4 w-4" />
              </span>
              <select
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="h-12 w-full rounded-2xl border border-surface-200 bg-surface-0 pl-11 pr-4 text-sm shadow-soft focus:outline-none focus:ring-4 focus:ring-brand-100 focus:border-brand-500 appearance-none"
              >
                {timeOptions.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {combinedIso && !validationError && (
          <p className="text-sm text-ink-700">
            <span className="font-semibold">Selected:</span>{' '}
            {formatDateTime(combinedIso)}
          </p>
        )}

        {validationError && (
          <div className="flex items-start gap-3 rounded-2xl bg-danger-50 border border-danger-200 p-4">
            <AlertTriangle className="h-5 w-5 text-danger-600 shrink-0 mt-0.5" />
            <p className="text-sm text-danger-700 font-medium">{validationError}</p>
          </div>
        )}

        {!validationError && availability && (
          <div
            className={`rounded-2xl border p-4 ${
              availability.ok
                ? 'bg-success-50 border-success-200'
                : 'bg-warning-50 border-warning-100'
            }`}
          >
            {availability.ok ? (
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-success-600 shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-semibold text-success-700">
                    Spot available at this time
                  </p>
                  <p className="text-success-700 mt-0.5">
                    {availability.freeAtWindow} / {availability.totalSpaces} free ·{' '}
                    {availability.freePercent?.toFixed(0)}% availability
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-warning-600 shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-semibold text-warning-600">
                    Not enough availability
                  </p>
                  <p className="text-warning-600 mt-0.5">
                    {availability.reason ||
                      `Only ${availability.freePercent?.toFixed(0)}% would be free — at least ${
                        availability.minFreePercent ?? MIN_FREE_PCT
                      }% required.`}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        <Button
          onClick={onSubmit}
          size="lg"
          fullWidth
          loading={createReservation.isPending}
          disabled={
            !!validationError ||
            (availability ? !availability.ok : true) ||
            createReservation.isPending
          }
        >
          <CalendarPlus className="h-5 w-5" />
          Confirm reservation
        </Button>
      </Card>

      <AnimatePresence>
        {success && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-ink-900/60 backdrop-blur-md flex items-center justify-center p-4"
            onClick={() => setSuccess(null)}
          >
            <motion.div
              initial={{ scale: 0.92, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.92, y: 20 }}
              transition={{ type: 'spring', stiffness: 220, damping: 22 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-surface-0 rounded-3xl p-6 md:p-8 shadow-popover"
            >
              <div className="flex items-center justify-center mb-5">
                <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-success-500 to-success-700 flex items-center justify-center shadow-[0_8px_24px_-8px_rgba(16,185,129,0.55)]">
                  <CheckCircle2 className="h-7 w-7 text-white" />
                </div>
              </div>
              <h2 className="font-display text-2xl font-bold text-ink-900 text-center mb-1">
                Reservation confirmed
              </h2>
              <p className="text-sm text-ink-500 text-center mb-6">
                Save this code — you'll need it on arrival.
              </p>

              <CodeDisplay code={success.confirmation_code} />

              <div className="mt-5 rounded-2xl bg-surface-50 border border-surface-200 p-4 text-sm space-y-2">
                <div className="flex justify-between">
                  <span className="text-ink-500">Parking space</span>
                  <Badge tone="brand" size="md">#{success.space_number}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-ink-500">Arrival time</span>
                  <span className="font-semibold text-ink-900">
                    {formatDateTime(success.reservation_start)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-ink-500">Until</span>
                  <span className="font-semibold text-ink-900">
                    {formatDateTime(success.reservation_end)}
                  </span>
                </div>
              </div>

              <div className="flex flex-col-reverse sm:flex-row gap-3 mt-6">
                <Button
                  variant="secondary"
                  fullWidth
                  onClick={() => {
                    setSuccess(null);
                    setAvailability(null);
                  }}
                >
                  Make another
                </Button>
                <Button
                  variant="primary"
                  fullWidth
                  onClick={() => navigate('/subscriber')}
                >
                  Done
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
