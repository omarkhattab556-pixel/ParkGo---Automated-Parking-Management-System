import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface Segment {
  label: string;
  value: number;
  color: string;
}

interface OccupancyDonutProps {
  segments: Segment[];
  size?: number;
  thickness?: number;
  centerLabel?: string;
  centerValue?: string | number;
  centerSubvalue?: string;
  className?: string;
  inverted?: boolean;
}

/**
 * Multi-segment animated donut.
 * Renders rotating-arc segments around a hollow center.
 */
export function OccupancyDonut({
  segments,
  size = 200,
  thickness = 22,
  centerLabel,
  centerValue,
  centerSubvalue,
  className,
  inverted = false,
}: OccupancyDonutProps) {
  const [animatedTotal, setAnimatedTotal] = useState(0);
  const total = segments.reduce((acc, s) => acc + s.value, 0) || 1;
  useEffect(() => {
    const t = window.setTimeout(() => setAnimatedTotal(total), 80);
    return () => window.clearTimeout(t);
  }, [total]);

  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  let cumulative = 0;
  const trackColor = inverted ? 'rgba(255,255,255,0.10)' : 'var(--color-surface-200)';
  const ratio = Math.min(1, animatedTotal / total);

  return (
    <div
      className={cn('relative inline-flex items-center justify-center', className)}
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={trackColor}
          strokeWidth={thickness}
          fill="none"
        />
        {segments.map((s, i) => {
          const arcLen = (s.value / total) * c * ratio;
          const dash = `${arcLen} ${c}`;
          const offset = -((cumulative / total) * c) * ratio;
          cumulative += s.value;
          return (
            <circle
              key={i}
              cx={size / 2}
              cy={size / 2}
              r={r}
              stroke={s.color}
              strokeWidth={thickness}
              fill="none"
              strokeLinecap="round"
              strokeDasharray={dash}
              strokeDashoffset={offset}
              style={{ transition: 'all 1.1s cubic-bezier(0.16, 1, 0.3, 1)' }}
            />
          );
        })}
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
        {centerValue !== undefined && (
          <span
            className={cn(
              'font-display font-bold tabular tracking-tight leading-none',
              size > 180 ? 'text-4xl' : 'text-3xl',
              inverted ? 'text-white' : 'text-ink-900'
            )}
          >
            {centerValue}
          </span>
        )}
        {centerLabel && (
          <span
            className={cn(
              'text-[11px] uppercase tracking-[0.08em] font-semibold mt-1',
              inverted ? 'text-white/70' : 'text-ink-500'
            )}
          >
            {centerLabel}
          </span>
        )}
        {centerSubvalue && (
          <span
            className={cn(
              'text-xs mt-0.5',
              inverted ? 'text-white/60' : 'text-ink-500'
            )}
          >
            {centerSubvalue}
          </span>
        )}
      </div>
    </div>
  );
}
