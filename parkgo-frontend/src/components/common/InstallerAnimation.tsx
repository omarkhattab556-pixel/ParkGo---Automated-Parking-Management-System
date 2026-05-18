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
    <div className="rounded-3xl bg-white border border-slate-100 p-8 shadow-lg">
      <div className="flex items-center justify-center gap-3 mb-6">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-md"
        >
          <Cog className="h-5 w-5 text-white" />
        </motion.div>
        <div>
          <h3 className="text-xl font-bold text-slate-900">{heading}</h3>
          <p className="text-sm text-slate-500">
            {installerName} is on it
          </p>
        </div>
      </div>

      {/* The "bay" */}
      <div className="relative h-32 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 overflow-hidden">
        <div className="absolute inset-y-0 left-2 w-8 flex items-center justify-center text-[10px] font-bold text-slate-400 rotate-90 origin-center select-none">
          BAY
        </div>
        <div className="absolute inset-y-0 right-2 w-8 flex items-center justify-center text-[10px] font-bold text-slate-400 -rotate-90 origin-center select-none">
          OUT
        </div>

        <motion.div
          initial={{ x: direction === 'park' ? '-110%' : '110%' }}
          animate={{ x: direction === 'park' ? '110%' : '-110%' }}
          transition={{
            duration: totalSeconds,
            ease: 'easeInOut',
          }}
          className="absolute top-1/2 -translate-y-1/2"
        >
          <div className="bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl px-4 py-3 shadow-xl">
            <Car className="h-8 w-8 text-white" strokeWidth={2.2} />
          </div>
        </motion.div>
      </div>

      {/* Progress bar */}
      <div className="mt-6">
        <div className="flex justify-between text-xs text-slate-500 mb-1.5">
          <span>Progress</span>
          <span className="font-semibold tabular-nums">
            {Math.max(0, remaining)}s remaining
          </span>
        </div>
        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: '0%' }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 1, ease: 'linear' }}
            className="h-full bg-gradient-to-r from-primary-500 to-primary-700 rounded-full"
          />
        </div>
      </div>
    </div>
  );
}
