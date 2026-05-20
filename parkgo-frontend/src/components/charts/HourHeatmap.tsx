import { useMemo } from 'react';
import { cn } from '@/lib/utils';

interface HourHeatmapProps {
  /** length 24 array of occupancy values (any scale) */
  values: number[];
  className?: string;
  inverted?: boolean;
}

/**
 * Compact horizontal hourly heatmap (24 cells), 0..max scaled to opacity.
 * Brand color, label every 6 hours.
 */
export function HourHeatmap({ values, className, inverted }: HourHeatmapProps) {
  const max = useMemo(() => Math.max(1, ...values), [values]);
  return (
    <div className={cn('w-full', className)}>
      <div className="grid grid-cols-24 gap-[3px]" style={{ gridTemplateColumns: 'repeat(24, minmax(0, 1fr))' }}>
        {Array.from({ length: 24 }).map((_, h) => {
          const v = values[h] ?? 0;
          const opacity = 0.18 + (v / max) * 0.82;
          return (
            <div
              key={h}
              className="h-8 rounded-md transition-all hover:scale-110"
              title={`${String(h).padStart(2, '0')}:00 — ${Math.round(v)}`}
              style={{
                background: inverted
                  ? `rgba(140, 132, 255, ${opacity})`
                  : `rgba(93, 82, 247, ${opacity})`,
              }}
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
    </div>
  );
}
