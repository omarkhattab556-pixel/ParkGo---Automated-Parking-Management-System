import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Hash,
  KeyRound,
  CheckCircle2,
  Mail,
  Clock,
  AlertTriangle,
  Timer,
} from 'lucide-react';
import toast from 'react-hot-toast';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { InstallerAnimation } from '@/components/common/InstallerAnimation';
import {
  useExtendParking,
  useLostCode,
  useMyActiveParking,
  usePickUp,
} from '@/hooks/useParking';
import type { PickUpResult } from '@/api/parking.api';
import { BUSINESS_RULES } from '@/utils/constants';
import { formatDateTime, formatDuration } from '@/utils/formatters';

type Phase = 'form' | 'animating' | 'done';

export default function PickUpCarPage() {
  const navigate = useNavigate();
  const [codeInput, setCodeInput] = useState('');
  const [phase, setPhase] = useState<Phase>('form');
  const [result, setResult] = useState<PickUpResult | null>(null);

  const activeParking = useMyActiveParking();
  const pickUp = usePickUp();
  const extend = useExtendParking();
  const lostCode = useLostCode();

  // Auto-fill if subscriber has an active parking session
  useEffect(() => {
    if (activeParking.data && !codeInput) {
      setCodeInput(String(activeParking.data.confirmation_code));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeParking.data?.confirmation_code]);

  const active = activeParking.data;
  const elapsedMinutes = active
    ? Math.floor((Date.now() - new Date(active.parking_date).getTime()) / 60000)
    : 0;
  const maxMinutes = active?.max_time_minutes ?? BUSINESS_RULES.MAX_PARKING_HOURS * 60;
  const isOvertime = elapsedMinutes > maxMinutes;
  const overtimeMinutes = Math.max(0, elapsedMinutes - maxMinutes);
  const remainingMinutes = Math.max(0, maxMinutes - elapsedMinutes);

  const currentExtension = maxMinutes - BUSINESS_RULES.MAX_PARKING_HOURS * 60;
  const extensionLeft = BUSINESS_RULES.MAX_EXTENSION_HOURS * 60 - currentExtension;

  const submit = () => {
    const code = Number(codeInput);
    if (!Number.isFinite(code) || codeInput.length !== 6) {
      toast.error('Enter your 6-digit confirmation code');
      return;
    }
    pickUp.mutate(code, {
      onSuccess: (data) => {
        setResult(data);
        setPhase('animating');
      },
    });
  };

  const reset = () => {
    setCodeInput('');
    setPhase('form');
    setResult(null);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <header className="flex items-center gap-3">
        <Link
          to="/subscriber"
          className="h-9 w-9 inline-flex items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
            Pick up your car
          </h1>
          <p className="text-slate-500 text-sm">
            Enter your code and our installer will retrieve it.
          </p>
        </div>
      </header>

      {phase === 'form' && active && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className={`rounded-2xl border p-5 ${
            isOvertime
              ? 'bg-danger-50 border-danger-200'
              : remainingMinutes < 30
              ? 'bg-amber-50 border-amber-200'
              : 'bg-emerald-50 border-emerald-200'
          }`}
        >
          <div className="flex items-start gap-3">
            <Clock
              className={`h-5 w-5 shrink-0 mt-0.5 ${
                isOvertime
                  ? 'text-danger-600'
                  : remainingMinutes < 30
                  ? 'text-amber-600'
                  : 'text-emerald-600'
              }`}
            />
            <div className="flex-1">
              <p
                className={`font-semibold text-sm ${
                  isOvertime
                    ? 'text-danger-800'
                    : remainingMinutes < 30
                    ? 'text-amber-800'
                    : 'text-emerald-800'
                }`}
              >
                Active parking · space #{active.parking_space}
              </p>
              <p
                className={`text-sm mt-0.5 ${
                  isOvertime
                    ? 'text-danger-700'
                    : remainingMinutes < 30
                    ? 'text-amber-700'
                    : 'text-emerald-700'
                }`}
              >
                Parked {formatDateTime(active.parking_date)} ·{' '}
                {isOvertime
                  ? `${formatDuration(overtimeMinutes)} over limit`
                  : `${formatDuration(remainingMinutes)} remaining`}
              </p>
              {isOvertime && extensionLeft > 0 && (
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <Button
                    size="sm"
                    variant="primary"
                    loading={extend.isPending}
                    onClick={() =>
                      extend.mutate({
                        parkingCode: active.parking_code,
                        minutes: Math.min(60, extensionLeft),
                      })
                    }
                  >
                    <Timer className="h-4 w-4" />
                    Extend by {Math.min(60, extensionLeft)} min
                  </Button>
                  <span className="text-xs text-danger-700">
                    Extension left: {formatDuration(extensionLeft)}
                  </span>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {phase === 'form' && !active && !activeParking.isLoading && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl bg-slate-50 border border-slate-200 p-5 flex items-start gap-3"
        >
          <AlertTriangle className="h-5 w-5 text-slate-500 shrink-0 mt-0.5" />
          <p className="text-sm text-slate-700">
            You don't have an active parking session right now. If you just
            dropped off, it may take a moment to appear.
          </p>
        </motion.div>
      )}

      {phase === 'form' && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl bg-white border border-slate-100 p-6 md:p-8 shadow-[0_2px_8px_rgba(0,0,0,0.04)] space-y-5"
        >
          <div className="flex items-center gap-3 mb-1">
            <div className="h-10 w-10 rounded-xl bg-success-100 flex items-center justify-center">
              <KeyRound className="h-5 w-5 text-success-700" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Enter your code</h2>
              <p className="text-sm text-slate-500">
                The same 6-digit code you used to park
              </p>
            </div>
          </div>

          <Input
            type="text"
            inputMode="numeric"
            maxLength={6}
            placeholder="123456"
            label="6-digit confirmation code"
            icon={<Hash className="h-4 w-4" />}
            value={codeInput}
            onChange={(e) => setCodeInput(e.target.value.replace(/\D/g, ''))}
            className="text-center font-mono tracking-[0.4em] text-2xl h-16"
          />

          <button
            type="button"
            onClick={() => lostCode.mutate()}
            disabled={lostCode.isPending || !active}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-primary-600 hover:text-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Mail className="h-4 w-4" />
            {lostCode.isPending ? 'Sending...' : 'Lost your code? Email it to me'}
          </button>

          <Button
            size="lg"
            fullWidth
            loading={pickUp.isPending}
            disabled={codeInput.length !== 6}
            onClick={submit}
          >
            <KeyRound className="h-5 w-5" />
            Pick up my car
          </Button>
        </motion.div>
      )}

      <AnimatePresence>
        {phase === 'animating' && result && (
          <motion.div
            key="anim"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            <InstallerAnimation
              installerName={result.installer.name}
              totalSeconds={result.operation_seconds}
              direction="retrieve"
              title="Retrieving your vehicle"
              onComplete={() => setPhase('done')}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {phase === 'done' && result && (
          <motion.div
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-3xl bg-white border border-slate-100 p-6 md:p-8 shadow-lg space-y-6"
          >
            <div className="flex items-center justify-center">
              <motion.div
                initial={{ scale: 0.6 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 220 }}
                className="h-16 w-16 rounded-2xl bg-success-500 flex items-center justify-center shadow-lg"
              >
                <CheckCircle2 className="h-8 w-8 text-white" />
              </motion.div>
            </div>
            <div className="text-center">
              <h2 className="text-2xl font-bold text-slate-900">
                Your car is at the pickup zone!
              </h2>
              <p className="text-slate-500">
                Handled by {result.installer.name}
              </p>
            </div>

            <div className="rounded-2xl bg-slate-50 p-4 text-sm space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-500">Total parked</span>
                <span className="font-semibold text-slate-900">
                  {formatDuration(result.elapsed_minutes)}
                </span>
              </div>
              {result.overtime_minutes > 0 && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Overtime</span>
                  <span className="font-semibold text-danger-600">
                    {formatDuration(result.overtime_minutes)}
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-slate-500">Retrieved at</span>
                <span className="font-semibold text-slate-900">
                  {formatDateTime(result.retrieved_at)}
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button variant="secondary" fullWidth onClick={reset}>
                Pick up another
              </Button>
              <Button fullWidth onClick={() => navigate('/subscriber')}>
                Back to dashboard
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
