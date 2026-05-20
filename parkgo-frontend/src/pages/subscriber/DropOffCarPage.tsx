import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Car,
  ArrowLeft,
  CheckCircle2,
  Hash,
  KeyRound,
  AlertTriangle,
} from 'lucide-react';
import toast from 'react-hot-toast';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { GlowOrbs } from '@/components/ui/GlowOrbs';
import { InstallerAnimation } from '@/components/common/InstallerAnimation';
import { CodeDisplay } from '@/components/common/CodeDisplay';
import { useDropOff } from '@/hooks/useParking';
import type { DropOffResult } from '@/api/parking.api';

type Mode = 'choose' | 'with-reservation' | 'walk-in';

export default function DropOffCarPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>('choose');
  const [codeInput, setCodeInput] = useState('');
  const [phase, setPhase] = useState<'form' | 'animating' | 'done'>('form');
  const [result, setResult] = useState<DropOffResult | null>(null);

  const dropOff = useDropOff();

  const submit = (code?: number) => {
    if (mode === 'with-reservation' && (!code || isNaN(code))) {
      toast.error('Enter your 6-digit confirmation code');
      return;
    }
    dropOff.mutate(code, {
      onSuccess: (data) => {
        setResult(data);
        setPhase('animating');
      },
    });
  };

  const reset = () => {
    setMode('choose');
    setCodeInput('');
    setPhase('form');
    setResult(null);
  };

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
          <p className="text-[11px] uppercase tracking-[0.12em] font-semibold text-accent-600">
            Drop off
          </p>
          <h1 className="font-display text-2xl md:text-3xl font-bold text-ink-900 tracking-tight">
            Drop off your car
          </h1>
          <p className="text-ink-500 text-sm">
            One of our installers will park it for you.
          </p>
        </div>
      </header>

      {phase === 'form' && mode === 'choose' && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          <button
            onClick={() => setMode('with-reservation')}
            className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-500 via-brand-600 to-brand-800 text-white p-7 text-left shadow-[0_18px_48px_-18px_rgba(93,82,247,0.55)] hover:-translate-y-1 transition-all"
          >
            <GlowOrbs variant="brand" />
            <div className="relative">
              <div className="h-12 w-12 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center mb-4">
                <Hash className="h-6 w-6" strokeWidth={2.4} />
              </div>
              <h3 className="font-display text-xl font-bold mb-1">Have a reservation</h3>
              <p className="text-sm text-white/85">
                Enter your 6-digit confirmation code
              </p>
            </div>
          </button>

          <button
            onClick={() => setMode('walk-in')}
            className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-accent-400 via-accent-500 to-accent-700 text-white p-7 text-left shadow-[0_18px_48px_-18px_rgba(249,115,22,0.55)] hover:-translate-y-1 transition-all"
          >
            <GlowOrbs variant="accent" />
            <div className="relative">
              <div className="h-12 w-12 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center mb-4">
                <Car className="h-6 w-6" strokeWidth={2.4} />
              </div>
              <h3 className="font-display text-xl font-bold mb-1">Walk-in</h3>
              <p className="text-sm text-white/85">
                No reservation? We'll find a spot now
              </p>
            </div>
          </button>
        </motion.div>
      )}

      {phase === 'form' && mode === 'with-reservation' && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card variant="default" padding="xl" className="space-y-5">
            <div className="flex items-center gap-3 mb-1">
              <div className="h-12 w-12 rounded-2xl bg-brand-50 border border-brand-100 flex items-center justify-center text-brand-600">
                <KeyRound className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-display text-xl font-bold text-ink-900">
                  Enter your code
                </h2>
                <p className="text-sm text-ink-500">
                  Your reservation must start within 15 minutes
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

            <div className="flex gap-3">
              <Button variant="secondary" fullWidth onClick={reset}>
                Back
              </Button>
              <Button
                fullWidth
                size="lg"
                loading={dropOff.isPending}
                disabled={codeInput.length !== 6}
                onClick={() => submit(Number(codeInput))}
              >
                <Car className="h-5 w-5" />
                Drop off
              </Button>
            </div>
          </Card>
        </motion.div>
      )}

      {phase === 'form' && mode === 'walk-in' && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card variant="default" padding="xl" className="space-y-5">
            <div className="flex items-center gap-3 mb-1">
              <div className="h-12 w-12 rounded-2xl bg-accent-50 border border-accent-100 flex items-center justify-center text-accent-600">
                <Car className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-display text-xl font-bold text-ink-900">
                  Walk-in drop off
                </h2>
                <p className="text-sm text-ink-500">
                  We'll assign you a spot if one is free
                </p>
              </div>
            </div>

            <div className="rounded-2xl bg-warning-50 border border-warning-100 p-4 flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-warning-600 shrink-0 mt-0.5" />
              <div className="text-sm text-warning-600">
                <p className="font-semibold mb-0.5">No 40% rule for walk-ins</p>
                <p>You only need a single free space. A new code will be issued.</p>
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="secondary" fullWidth onClick={reset}>
                Back
              </Button>
              <Button
                fullWidth
                size="lg"
                variant="accent"
                loading={dropOff.isPending}
                onClick={() => submit(undefined)}
              >
                <Car className="h-5 w-5" />
                Drop off now
              </Button>
            </div>
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
              direction="park"
              title="Parking your vehicle"
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
                  Your car is parked
                </h2>
                <p className="text-ink-500 mt-1 flex items-center justify-center gap-2 flex-wrap">
                  <Badge tone="success" size="md" dot>Space #{result.space_number}</Badge>
                  <span className="text-sm">handled by {result.installer.name}</span>
                </p>
              </div>

              <CodeDisplay
                code={result.confirmation_code}
                label={
                  result.had_reservation
                    ? 'Your code (same as reservation)'
                    : 'Save this code for pickup'
                }
                hint={
                  result.had_reservation
                    ? 'Use this code when you return'
                    : 'Also sent to your email'
                }
              />

              <div className="flex flex-col sm:flex-row gap-3">
                <Button variant="secondary" fullWidth onClick={reset}>
                  New drop off
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
