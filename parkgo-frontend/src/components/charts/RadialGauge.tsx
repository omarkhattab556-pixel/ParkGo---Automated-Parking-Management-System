import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface RadialGaugeProps {
  /** 0-100 */
  value: number;
  size?: number;
  thickness?: number;
  label?: string;
  sublabel?: string;
  tone?: 'brand' | 'success' | 'danger' | 'accent';
  /** Render in white for dark backgrounds */
  inverted?: boolean;
  className?: string;
}

const toneGradients: Record<
  NonNullable<RadialGaugeProps['tone']>,
  { from: string; to: string }
> = {
  brand: { from: '#8c84ff', to: '#5d52f7' },
  success: { from: '#34d399', to: '#059669' },
  danger: { from: '#fb7185', to: '#e11d48' },
  accent: { from: '#fb923c', to: '#ea580c' },
};

export function RadialGauge({
  value,
  size = 180,
  thickness = 14,
  label,
  sublabel,
  tone = 'brand',
  inverted = false,
  className,
}: RadialGaugeProps) {
  const [animated, setAnimated] = useState(0);
  useEffect(() => {
    const t = window.setTimeout(() => setAnimated(value), 80);
    return () => window.clearTimeout(t);
  }, [value]);

  const clamped = Math.min(100, Math.max(0, animated));
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  const dashoffset = c - (clamped / 100) * c;
  const grad = toneGradients[tone];
  const gradId = `gauge-${tone}-${size}`;

  return (
    <div
      className={cn(
        'relative inline-flex items-center justify-center',
        className
      )}
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90">
        <defs>
          <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={grad.from} />
            <stop offset="100%" stopColor={grad.to} />
          </linearGradient>
        </defs>
        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={inverted ? 'rgba(255,255,255,0.12)' : 'var(--color-surface-200)'}
          strokeWidth={thickness}
          fill="none"
        />
        {/* Progress */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={`url(#${gradId})`}
          strokeWidth={thickness}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={dashoffset}
          style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.16, 1, 0.3, 1)' }}
        />
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
        <span
          className={cn(
            'font-display font-bold tabular tracking-tight',
            size > 160 ? 'text-4xl' : 'text-3xl',
            inverted ? 'text-white' : 'text-ink-900'
          )}
        >
          {Math.round(clamped)}
          <span className={cn('text-base font-semibold', inverted ? 'text-white/60' : 'text-ink-400')}>
            %
          </span>
        </span>
        {label && (
          <span
            className={cn(
              'text-[11px] uppercase tracking-[0.08em] font-semibold mt-1',
              inverted ? 'text-white/70' : 'text-ink-500'
            )}
          >
            {label}
          </span>
        )}
        {sublabel && (
          <span className={cn('text-xs mt-0.5', inverted ? 'text-white/60' : 'text-ink-500')}>
            {sublabel}
          </span>
        )}
      </div>
    </div>
  );
}
