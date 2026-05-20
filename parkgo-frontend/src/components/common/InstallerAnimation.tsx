import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Cog } from 'lucide-react';

interface Props {
  installerName: string;
  totalSeconds: number;
  /** "park" → car moves into bay; "retrieve" → car moves out */
  direction?: 'park' | 'retrieve';
  onComplete?: () => void;
  title?: string;
}

/**
 * Car SVG seen from the side — used by the bay simulation.
 * Includes body, cabin, windows, wheels, and headlight beam.
 */
function CarShape({ headlightOn = false }: { headlightOn?: boolean }) {
  return (
    <svg
      width="120"
      height="64"
      viewBox="0 0 120 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      {/* Headlight beam */}
      {headlightOn && (
        <defs>
          <linearGradient id="beam" x1="0%" y1="50%" x2="100%" y2="50%">
            <stop offset="0%" stopColor="#fef3c7" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#fef3c7" stopOpacity="0" />
          </linearGradient>
        </defs>
      )}
      {headlightOn && (
        <path
          d="M110 32 L160 14 L160 50 Z"
          fill="url(#beam)"
          opacity="0.6"
        />
      )}

      {/* Shadow under car */}
      <ellipse cx="60" cy="58" rx="46" ry="3" fill="#0d0d18" opacity="0.22" />

      {/* Lower body */}
      <path
        d="M8 44 Q8 36 16 34 L34 32 Q44 22 58 22 L78 22 Q92 22 102 32 L112 34 Q116 36 116 44 L116 50 Q116 54 112 54 L8 54 Q8 54 8 50 Z"
        fill="url(#carBody)"
      />

      {/* Cabin */}
      <path
        d="M36 32 Q48 24 58 24 L78 24 Q88 24 96 32 L96 34 L36 34 Z"
        fill="url(#carCabin)"
      />

      {/* Window */}
      <path
        d="M42 32 Q50 27 58 27 L76 27 Q86 27 92 32 Z"
        fill="#0d0d18"
        opacity="0.6"
      />
      {/* Window highlight */}
      <path
        d="M44 31 Q52 28 60 28 L74 28 Q82 28 88 31"
        stroke="rgba(255,255,255,0.18)"
        strokeWidth="1.2"
        fill="none"
      />

      {/* Door split */}
      <line x1="62" y1="32" x2="62" y2="50" stroke="rgba(0,0,0,0.18)" strokeWidth="1" />

      {/* Headlight */}
      <circle cx="112" cy="42" r="2" fill="#fffbeb" opacity={headlightOn ? 1 : 0.4} />
      {headlightOn && (
        <circle cx="112" cy="42" r="3.5" fill="#fef3c7" opacity="0.5" />
      )}

      {/* Tail light */}
      <circle cx="9" cy="42" r="1.8" fill="#f43f5e" opacity="0.85" />

      {/* Wheels */}
      <circle cx="28" cy="54" r="7" fill="#0d0d18" />
      <circle cx="28" cy="54" r="3" fill="#4d4d5a" />
      <circle cx="92" cy="54" r="7" fill="#0d0d18" />
      <circle cx="92" cy="54" r="3" fill="#4d4d5a" />

      <defs>
        <linearGradient id="carBody" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#6e64ff" />
          <stop offset="100%" stopColor="#3a2bc4" />
        </linearGradient>
        <linearGradient id="carCabin" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#8c84ff" />
          <stop offset="100%" stopColor="#5d52f7" />
        </linearGradient>
      </defs>
    </svg>
  );
}

/**
 * Robotic installer arm (top-down) descending toward / lifting away from
 * the bay floor. Adds a sense of mechanical operation.
 */
function InstallerArm({ phase }: { phase: 'descend' | 'lift' }) {
  return (
    <motion.div
      className="absolute top-0 left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-none"
      initial={false}
      animate={phase === 'descend' ? { y: 0 } : { y: -20 }}
      transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="w-1 h-10 bg-gradient-to-b from-ink-400 to-ink-700 rounded-b" />
      <div className="w-10 h-3 bg-gradient-to-b from-ink-700 to-ink-900 rounded-b-md shadow-soft" />
      <div className="flex gap-1 mt-0.5">
        <div className="w-1 h-2 bg-ink-700 rounded-b" />
        <div className="w-1 h-2 bg-ink-700 rounded-b" />
      </div>
    </motion.div>
  );
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

  // For retrieve flow: ramp the arm down at start, then car slides out + headlights on
  const isRetrieve = direction === 'retrieve';

  return (
    <div className="rounded-3xl bg-surface-0 border border-surface-200 p-6 md:p-8 shadow-elevated relative overflow-hidden">
      {/* Ambient blob */}
      <div
        aria-hidden
        className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-brand-100 blur-3xl opacity-60"
      />
      <div
        aria-hidden
        className="absolute -bottom-20 -left-20 h-56 w-56 rounded-full bg-accent-100 blur-3xl opacity-40"
      />

      {/* Header */}
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
          <p className="text-sm text-ink-500">
            {installerName} {isRetrieve ? 'is bringing it out' : 'is on it'}
          </p>
        </div>
      </div>

      {/* Bay scene */}
      <div className="relative h-44 rounded-3xl overflow-hidden bg-gradient-to-b from-ink-800 via-ink-900 to-ink-900 border border-ink-700 shadow-inner">
        {/* Floor */}
        <div className="absolute bottom-0 inset-x-0 h-12 bg-gradient-to-b from-ink-700 to-ink-900" />
        {/* Floor stripes (moving lane markers) */}
        <motion.div
          className="absolute bottom-3 inset-x-0 h-1.5 flex gap-6"
          initial={{ x: 0 }}
          animate={{ x: isRetrieve ? 60 : -60 }}
          transition={{
            duration: 1.4,
            repeat: Infinity,
            ease: 'linear',
          }}
          aria-hidden
        >
          {Array.from({ length: 14 }).map((_, i) => (
            <div key={i} className="h-1.5 w-8 rounded-full bg-warning-400/70 shrink-0" />
          ))}
        </motion.div>

        {/* Ceiling lights */}
        <div className="absolute top-0 inset-x-0 flex justify-around px-6 py-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0.3 }}
              animate={{ opacity: [0.3, 0.9, 0.3] }}
              transition={{
                duration: 1.8,
                repeat: Infinity,
                delay: i * 0.18,
              }}
              className="h-1 w-8 rounded-full bg-warning-300 shadow-[0_0_12px_rgba(251,191,36,0.6)]"
            />
          ))}
        </div>

        {/* Bay labels */}
        <div className="absolute top-2 left-3 text-[9px] font-mono font-bold tracking-widest text-white/40 select-none">
          {isRetrieve ? 'PICKUP ZONE →' : '← PARKING BAY'}
        </div>
        <div className="absolute top-2 right-3 text-[9px] font-mono font-bold tracking-widest text-white/40 select-none">
          {isRetrieve ? '← BAY' : 'OUT →'}
        </div>

        {/* Robotic arm — only meaningful for "park" */}
        {!isRetrieve && progress < 40 && <InstallerArm phase="descend" />}
        {!isRetrieve && progress >= 40 && progress < 70 && <InstallerArm phase="lift" />}

        {/* Car animation */}
        <motion.div
          className="absolute bottom-3"
          initial={{
            x: isRetrieve ? '-110%' : '110%',
            opacity: isRetrieve ? 0.6 : 1,
          }}
          animate={{
            x: isRetrieve ? '110%' : '-110%',
            opacity: 1,
          }}
          transition={{
            duration: totalSeconds * 0.8,
            ease: isRetrieve ? [0.16, 1, 0.3, 1] : 'easeInOut',
            delay: isRetrieve ? 0.4 : 0,
          }}
          style={{ filter: 'drop-shadow(0 6px 12px rgba(93,82,247,0.4))' }}
        >
          <CarShape headlightOn={isRetrieve} />
        </motion.div>

        {/* Speed lines behind the car when retrieving */}
        {isRetrieve && (
          <div className="absolute bottom-5 left-0 right-0 pointer-events-none">
            <motion.div
              className="flex gap-2 px-4"
              animate={{ x: [0, 30] }}
              transition={{ duration: 0.6, repeat: Infinity, ease: 'linear' }}
            >
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="h-0.5 rounded-full bg-white/30"
                  style={{ width: 14 + i * 4 }}
                />
              ))}
            </motion.div>
          </div>
        )}
      </div>

      {/* Progress */}
      <div className="mt-6">
        <div className="flex justify-between text-xs text-ink-500 mb-1.5">
          <span className="font-medium">
            {isRetrieve ? 'Retrieving your car' : 'Parking in progress'}
          </span>
          <span className="font-bold tabular text-ink-900">
            {Math.max(0, remaining)}s remaining
          </span>
        </div>
        <div className="h-2.5 bg-surface-100 rounded-full overflow-hidden border border-surface-200">
          <motion.div
            initial={{ width: '0%' }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 1, ease: 'linear' }}
            className="h-full bg-gradient-to-r from-brand-500 via-brand-600 to-accent-500 rounded-full relative"
          >
            <span className="absolute inset-y-0 right-0 w-6 bg-gradient-to-r from-transparent to-white/40" />
          </motion.div>
        </div>
      </div>
    </div>
  );
}
