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
import { CodeDisplay } from '@/components/common/CodeDisplay';
import { reservationApi, type CreateReservationResult } from '@/api/reservation.api';
import type { AvailabilityResult } from '@/api/reservation.api';
import { useFacilityLoad } from '@/hooks/useParking';
import { BUSINESS_RULES } from '@/utils/constants';
import { formatDateTime } from '@/utils/formatters';

const MIN_OFFSET_HOURS = BUSINESS_RULES.MIN_RESERVATION_HOURS_AHEAD;
const MAX_OFFSET_DAYS = BUSINESS_RULES.MAX_RESERVATION_DAYS_AHEAD;
const MIN_FREE_PCT = BUSINESS_RULES.MIN_FREE_PERCENT;

// 15-minute time options for a day
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

  // Re-check availability whenever the chosen datetime is valid
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
          className="h-9 w-9 inline-flex items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
            Reserve a parking spot
          </h1>
          <p className="text-slate-500 text-sm">
            Bookings must be {MIN_OFFSET_HOURS}h–{MAX_OFFSET_DAYS}d in advance.
          </p>
        </div>
      </header>

      {/* Live availability strip */}
      <div className="rounded-2xl bg-white border border-slate-100 px-5 py-4 flex items-center gap-3">
        <Info className="h-5 w-5 text-primary-500 shrink-0" />
        <div className="text-sm text-slate-700">
          Free right now:{' '}
          <span className="font-bold tabular-nums">
            {load.data ? `${load.data.free} / ${load.data.total}` : '—'}
          </span>{' '}
          ·{' '}
          <span className="text-slate-500">
            Reservations require ≥{MIN_FREE_PCT}% free at the requested time.
          </span>
        </div>
      </div>

      <div className="rounded-3xl bg-white border border-slate-100 p-6 md:p-8 shadow-[0_2px_8px_rgba(0,0,0,0.04)] space-y-5">
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
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Time (15-min slots)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                <Clock className="h-4 w-4" />
              </span>
              <select
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-primary-400 appearance-none"
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
          <p className="text-sm text-slate-600">
            <span className="font-medium">Selected:</span>{' '}
            {formatDateTime(combinedIso)}
          </p>
        )}

        {validationError && (
          <div className="flex items-start gap-3 rounded-xl bg-danger-50 border border-danger-200 p-4">
            <AlertTriangle className="h-5 w-5 text-danger-500 shrink-0 mt-0.5" />
            <p className="text-sm text-danger-700 font-medium">{validationError}</p>
          </div>
        )}

        {!validationError && availability && (
          <div
            className={`rounded-xl border p-4 ${
              availability.ok
                ? 'bg-emerald-50 border-emerald-200'
                : 'bg-amber-50 border-amber-200'
            }`}
          >
            {availability.ok ? (
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-semibold text-emerald-800">
                    Spot available at this time
                  </p>
                  <p className="text-emerald-700 mt-0.5">
                    {availability.freeAtWindow} / {availability.totalSpaces} free ·{' '}
                    {availability.freePercent?.toFixed(0)}% availability
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-semibold text-amber-800">
                    Not enough availability
                  </p>
                  <p className="text-amber-700 mt-0.5">
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
      </div>

      <AnimatePresence>
        {success && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setSuccess(null)}
          >
            <motion.div
              initial={{ scale: 0.92, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.92, y: 20 }}
              transition={{ type: 'spring', stiffness: 220, damping: 22 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-white rounded-3xl p-6 md:p-8 shadow-2xl"
            >
              <div className="flex items-center justify-center mb-5">
                <div className="h-14 w-14 rounded-2xl bg-success-500 flex items-center justify-center shadow-lg">
                  <CheckCircle2 className="h-7 w-7 text-white" />
                </div>
              </div>
              <h2 className="text-2xl font-bold text-slate-900 text-center mb-1">
                Reservation confirmed!
              </h2>
              <p className="text-sm text-slate-500 text-center mb-6">
                Save this code — you'll need it on arrival.
              </p>

              <CodeDisplay code={success.confirmation_code} />

              <div className="mt-5 rounded-xl bg-slate-50 p-4 text-sm space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-500">Parking space</span>
                  <span className="font-semibold text-slate-900">
                    #{success.space_number}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Arrival time</span>
                  <span className="font-semibold text-slate-900">
                    {formatDateTime(success.reservation_start)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Until</span>
                  <span className="font-semibold text-slate-900">
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
