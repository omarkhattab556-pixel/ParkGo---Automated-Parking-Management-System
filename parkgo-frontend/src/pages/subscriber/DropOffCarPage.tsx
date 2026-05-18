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
          className="h-9 w-9 inline-flex items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
            Drop off your car
          </h1>
          <p className="text-slate-500 text-sm">
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
            className="group rounded-3xl bg-gradient-to-br from-primary-500 to-primary-700 text-white p-6 text-left shadow-lg hover:shadow-2xl hover:-translate-y-0.5 transition-all"
          >
            <Hash className="h-9 w-9 mb-3" strokeWidth={2.2} />
            <h3 className="text-xl font-bold mb-1">Have a reservation</h3>
            <p className="text-sm text-white/85">
              Enter your 6-digit confirmation code
            </p>
          </button>

          <button
            onClick={() => setMode('walk-in')}
            className="group rounded-3xl bg-gradient-to-br from-accent-500 to-accent-600 text-white p-6 text-left shadow-lg hover:shadow-2xl hover:-translate-y-0.5 transition-all"
          >
            <Car className="h-9 w-9 mb-3" strokeWidth={2.2} />
            <h3 className="text-xl font-bold mb-1">Walk-in</h3>
            <p className="text-sm text-white/85">
              No reservation? We'll find a spot now
            </p>
          </button>
        </motion.div>
      )}

      {phase === 'form' && mode === 'with-reservation' && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl bg-white border border-slate-100 p-6 md:p-8 shadow-[0_2px_8px_rgba(0,0,0,0.04)] space-y-5"
        >
          <div className="flex items-center gap-3 mb-1">
            <div className="h-10 w-10 rounded-xl bg-primary-50 flex items-center justify-center">
              <KeyRound className="h-5 w-5 text-primary-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Enter your code</h2>
              <p className="text-sm text-slate-500">
                Your reservation must start within 15 minutes
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
        </motion.div>
      )}

      {phase === 'form' && mode === 'walk-in' && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl bg-white border border-slate-100 p-6 md:p-8 shadow-[0_2px_8px_rgba(0,0,0,0.04)] space-y-5"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-xl bg-accent-100 flex items-center justify-center">
              <Car className="h-5 w-5 text-accent-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Walk-in drop off</h2>
              <p className="text-sm text-slate-500">
                We'll assign you a spot if one is free
              </p>
            </div>
          </div>

          <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-sm text-amber-800">
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
              loading={dropOff.isPending}
              onClick={() => submit(undefined)}
            >
              <Car className="h-5 w-5" />
              Drop off now
            </Button>
          </div>
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
                Your car is parked!
              </h2>
              <p className="text-slate-500">
                Space #{result.space_number} · handled by {result.installer.name}
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
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
