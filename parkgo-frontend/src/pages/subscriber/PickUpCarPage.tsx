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
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
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

  const stateColor = isOvertime
    ? { bg: 'bg-danger-50 border-danger-200', text: 'text-danger-700', icon: 'text-danger-600' }
    : remainingMinutes < 30
    ? { bg: 'bg-warning-50 border-warning-100', text: 'text-warning-600', icon: 'text-warning-600' }
    : { bg: 'bg-success-50 border-success-200', text: 'text-success-700', icon: 'text-success-600' };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <header className="flex items-center gap-3">
        <Link
          to="/subscriber"
          aria-label="Back to dashboard"
          className="h-10 w-10 inline-flex items-center justify-center rounded-2xl text-ink-600 hover:bg-surface-100"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <p className="text-[11px] uppercase tracking-[0.12em] font-semibold text-success-600">
            Pick up
          </p>
          <h1 className="font-display text-2xl md:text-3xl font-bold text-ink-900 tracking-tight">
            Pick up your car
          </h1>
          <p className="text-ink-500 text-sm">
            Enter your code and our installer will retrieve it.
          </p>
        </div>
      </header>

      {phase === 'form' && active && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className={`rounded-3xl border p-5 ${stateColor.bg}`}
        >
          <div className="flex items-start gap-3">
            <Clock className={`h-5 w-5 shrink-0 mt-0.5 ${stateColor.icon}`} />
            <div className="flex-1">
              <p className={`font-semibold text-sm ${stateColor.text}`}>
                Active parking · space #{active.parking_space}
              </p>
              <p className={`text-sm mt-0.5 ${stateColor.text}`}>
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
          className="rounded-3xl bg-surface-100 border border-surface-200 p-5 flex items-start gap-3"
        >
          <AlertTriangle className="h-5 w-5 text-ink-500 shrink-0 mt-0.5" />
          <p className="text-sm text-ink-700">
            You don't have an active parking session right now. If you just
            dropped off, it may take a moment to appear.
          </p>
        </motion.div>
      )}

      {phase === 'form' && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card variant="default" padding="xl" className="space-y-5">
            <div className="flex items-center gap-3 mb-1">
              <div className="h-12 w-12 rounded-2xl bg-success-50 border border-success-100 flex items-center justify-center text-success-600">
                <KeyRound className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-display text-xl font-bold text-ink-900">
                  Enter your code
                </h2>
                <p className="text-sm text-ink-500">
                  The same 6-digit code you used to park
                </p>
              </div>
            </div>

            <Input
              type="text"
              inputMode="numeric"
              maxLength={6}
              placeholder="••••••"
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
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600 hover:text-brand-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Mail className="h-4 w-4" />
              {lostCode.isPending ? 'Sending…' : 'Lost your code? Email it to me'}
            </button>

            <Button
              size="lg"
              fullWidth
              variant="success"
              loading={pickUp.isPending}
              disabled={codeInput.length !== 6}
              onClick={submit}
            >
              <KeyRound className="h-5 w-5" />
              Pick up my car
            </Button>
          </Card>
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
          >
            <Card variant="raised" padding="xl" className="space-y-6">
              <div className="flex items-center justify-center">
                <motion.div
                  initial={{ scale: 0.6 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 220 }}
                  className="h-16 w-16 rounded-2xl bg-gradient-to-br from-success-500 to-success-700 flex items-center justify-center shadow-[0_8px_24px_-8px_rgba(16,185,129,0.55)]"
                >
                  <CheckCircle2 className="h-8 w-8 text-white" />
                </motion.div>
              </div>
              <div className="text-center">
                <h2 className="font-display text-2xl font-bold text-ink-900">
                  Your car is at the pickup zone
                </h2>
                <p className="text-ink-500 mt-1">
                  Handled by {result.installer.name}
                </p>
              </div>

              <div className="rounded-2xl bg-surface-50 border border-surface-200 p-4 text-sm space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-ink-500">Total parked</span>
                  <span className="font-semibold text-ink-900 tabular">
                    {formatDuration(result.elapsed_minutes)}
                  </span>
                </div>
                {result.overtime_minutes > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-ink-500">Overtime</span>
                    <Badge tone="danger" size="md">
                      {formatDuration(result.overtime_minutes)}
                    </Badge>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-ink-500">Retrieved at</span>
                  <span className="font-semibold text-ink-900">
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
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
