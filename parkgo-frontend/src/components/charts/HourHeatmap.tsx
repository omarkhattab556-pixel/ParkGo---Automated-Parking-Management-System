import { useMemo } from 'react';
import { cn } from '@/lib/utils';

interface HourHeatmapProps {
  /** length 24 array of occupancy values (any scale) */
  values: number[];
  className?: string;
  inverted?: boolean;
  /**
   * 'brand'  → single-hue opacity ramp (original look).
   * 'load'   → green (quiet) → yellow (busy) → red (peak), clearer at a glance.
   */
  variant?: 'brand' | 'load';
}

// Maps a 0..1 intensity to a green→yellow→red color. Low = calm green,
// mid = amber, high = red — so a busy hour is unmistakable.
function loadColor(t: number): string {
  const stops: [number, [number, number, number]][] = [
    [0, [16, 185, 129]], // emerald-500
    [0.5, [245, 158, 11]], // amber-500
    [1, [239, 68, 68]], // red-500
  ];
  let lo = stops[0];
  let hi = stops[stops.length - 1];
  for (let i = 0; i < stops.length - 1; i++) {
    if (t >= stops[i][0] && t <= stops[i + 1][0]) {
      lo = stops[i];
      hi = stops[i + 1];
      break;
    }
  }
  const span = hi[0] - lo[0] || 1;
  const f = (t - lo[0]) / span;
  const c = lo[1].map((v, i) => Math.round(v + (hi[1][i] - v) * f));
  return `rgb(${c[0]}, ${c[1]}, ${c[2]})`;
}

/**
 * Compact horizontal hourly heatmap (24 cells), 0..max scaled.
 * Label every 6 hours.
 */
export function HourHeatmap({
  values,
  className,
  inverted,
  variant = 'brand',
}: HourHeatmapProps) {
  const max = useMemo(() => Math.max(1, ...values), [values]);
  const isLoad = variant === 'load';

  return (
    <div className={cn('w-full', className)}>
      <div
        className="grid gap-[3px]"
        style={{ gridTemplateColumns: 'repeat(24, minmax(0, 1fr))' }}
      >
        {Array.from({ length: 24 }).map((_, h) => {
          const v = values[h] ?? 0;
          const t = v / max;
          const opacity = 0.18 + t * 0.82;
          const background = isLoad
            ? loadColor(t)
            : inverted
            ? `rgba(140, 132, 255, ${opacity})`
            : `rgba(93, 82, 247, ${opacity})`;
          return (
            <div
              key={h}
              className="h-6 rounded-md transition-all hover:scale-110"
              title={`${String(h).padStart(2, '0')}:00 — ${Math.round(v)}`}
              style={{ background, opacity: isLoad ? 0.35 + t * 0.65 : 1 }}
            />
          );
        })}
      </div>

      <div
        className={cn(
          'mt-2 flex justify-between text-[10px] font-medium tabular',
          inverted ? 'text-white/50' : 'text-ink-400'
        )}
      >
        <span>00</span>
        <span>06</span>
        <span>12</span>
        <span>18</span>
        <span>23</span>
      </div>

      {isLoad && (
        <div className="mt-3 flex items-center gap-4 text-[11px] font-medium text-ink-500">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-success-500" /> Quiet
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-warning-500" /> Busy
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-danger-500" /> Peak
          </span>
        </div>
      )}
    </div>
  );
}
