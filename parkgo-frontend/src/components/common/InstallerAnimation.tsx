import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Car, Cog } from 'lucide-react';

interface Props {
  installerName: string;
  totalSeconds: number;
  /** "park" → car moves into bay; "retrieve" → car moves out */
  direction?: 'park' | 'retrieve';
  onComplete?: () => void;
  title?: string;
}

export function InstallerAnimation({
  installerName,
  totalSeconds,
  direction = 'park',
  onComplete,
  title,
}: Props) {
  const [remaining, setRemaining] = useState(totalSeconds);

  useEffect(() => {
    if (remaining <= 0) {
      onComplete?.();
      return;
    }
    const t = setTimeout(() => setRemaining((r) => r - 1), 1000);
    return () => clearTimeout(t);
  }, [remaining, onComplete]);

  const progress = ((totalSeconds - remaining) / totalSeconds) * 100;
  const heading =
    title || (direction === 'park' ? 'Parking your vehicle' : 'Retrieving your vehicle');

  return (
    <div className="rounded-3xl bg-surface-0 border border-surface-200 p-8 shadow-elevated relative overflow-hidden">
      <div
        aria-hidden
        className="absolute -top-20 -right-20 h-56 w-56 rounded-full bg-brand-100 blur-3xl opacity-60"
      />
      <div className="relative flex items-center justify-center gap-3 mb-6">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2.4, repeat: Infinity, ease: 'linear' }}
          className="h-12 w-12 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shadow-[0_8px_24px_-8px_rgba(93,82,247,0.55)]"
        >
          <Cog className="h-5 w-5 text-white" strokeWidth={2.4} />
        </motion.div>
        <div>
          <h3 className="font-display text-xl font-bold text-ink-900">{heading}</h3>
          <p className="text-sm text-ink-500">{installerName} is on it</p>
        </div>
      </div>

      {/* Bay */}
      <div className="relative h-32 rounded-2xl border-2 border-dashed border-surface-300 bg-gradient-to-r from-surface-50 via-surface-100 to-surface-50 overflow-hidden">
        <div className="absolute inset-y-0 left-2 w-8 flex items-center justify-center text-[10px] font-bold text-ink-400 rotate-90 origin-center select-none">
          BAY
        </div>
        <div className="absolute inset-y-0 right-2 w-8 flex items-center justify-center text-[10px] font-bold text-ink-400 -rotate-90 origin-center select-none">
          OUT
        </div>

        <motion.div
          initial={{ x: direction === 'park' ? '-110%' : '110%' }}
          animate={{ x: direction === 'park' ? '110%' : '-110%' }}
          transition={{ duration: totalSeconds, ease: 'easeInOut' }}
          className="absolute top-1/2 -translate-y-1/2"
        >
          <div className="bg-gradient-to-br from-brand-500 to-brand-700 rounded-2xl px-4 py-3 shadow-[0_12px_24px_-8px_rgba(93,82,247,0.55)]">
            <Car className="h-8 w-8 text-white" strokeWidth={2.2} />
          </div>
        </motion.div>
      </div>

      {/* Progress */}
      <div className="mt-6">
        <div className="flex justify-between text-xs text-ink-500 mb-1.5">
          <span className="font-medium">Progress</span>
          <span className="font-bold tabular text-ink-900">
            {Math.max(0, remaining)}s remaining
          </span>
        </div>
        <div className="h-2.5 bg-surface-100 rounded-full overflow-hidden border border-surface-200">
          <motion.div
            initial={{ width: '0%' }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 1, ease: 'linear' }}
            className="h-full bg-gradient-to-r from-brand-500 via-brand-600 to-accent-500 rounded-full"
          />
        </div>
      </div>
    </div>
  );
}
