import { useMemo } from 'react';
import { cn } from '@/lib/utils';

interface HourlyOccupancyChartProps {
  /** length-24 array, each value = average occupancy % (0..100) at that hour */
  values: number[];
  className?: string;
}

// Absolute occupancy thresholds — colour reflects the REAL load level, not the
// relative max, so a quiet day never shows red.
function loadColor(pct: number): { bar: string; text: string } {
  if (pct >= 80) return { bar: 'var(--color-danger-500)', text: 'text-danger-600' };
  if (pct >= 50) return { bar: 'var(--color-warning-500)', text: 'text-warning-600' };
  if (pct > 0) return { bar: 'var(--color-success-500)', text: 'text-success-600' };
  return { bar: 'var(--color-surface-300)', text: 'text-ink-400' };
}

/**
 * Hourly occupancy as a 24-bar column chart. Bar height = occupancy %, colour
 * = absolute load band (green < 50%, amber 50–80%, red ≥ 80%). The peak hour is
 * highlighted. Far clearer for a manager than an opacity heat-strip.
 */
export function HourlyOccupancyChart({
  values,
  className,
}: HourlyOccupancyChartProps) {
  const { peakIdx, peakVal, avg } = useMemo(() => {
    let idx = 0;
    let best = -1;
    let sum = 0;
    values.forEach((v, i) => {
      sum += v;
      if (v > best) {
        best = v;
        idx = i;
      }
    });
    return {
      peakIdx: best > 0 ? idx : -1,
      peakVal: Math.max(0, best),
      avg: values.length ? sum / values.length : 0,
    };
  }, [values]);

  return (
    <div className={cn('w-full', className)}>
      {/* Bars */}
      <div className="flex items-end gap-[3px] h-32">
        {Array.from({ length: 24 }).map((_, h) => {
          const v = Math.max(0, Math.min(100, values[h] ?? 0));
          const { bar } = loadColor(v);
          const isPeak = h === peakIdx;
          return (
            <div
              key={h}
              className="group relative flex-1 flex items-end h-full"
              title={`${String(h).padStart(2, '0')}:00 — ${Math.round(v)}% occupied`}
            >
              <div
                className={cn(
                  'w-full rounded-t-md transition-all duration-500',
                  isPeak && 'ring-2 ring-offset-1 ring-ink-900/20'
                )}
                style={{
                  height: `${Math.max(4, v)}%`,
                  background: bar,
                }}
              />
            </div>
          );
        })}
      </div>

      {/* Hour axis */}
      <div className="mt-2 flex justify-between text-[10px] font-medium tabular text-ink-400">
        <span>00</span>
        <span>06</span>
        <span>12</span>
        <span>18</span>
        <span>23</span>
      </div>

      {/* Summary + legend */}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-y-2">
        <div className="flex items-center gap-3 text-[11px] font-medium text-ink-500">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-success-500" /> &lt;50%
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-warning-500" /> 50–80%
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-danger-500" /> ≥80%
          </span>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <span className="text-ink-500">
            Avg{' '}
            <span className="font-bold text-ink-900 tabular">
              {Math.round(avg)}%
            </span>
          </span>
          {peakIdx >= 0 && (
            <span className="text-ink-500">
              Peak{' '}
              <span className="font-bold text-ink-900 tabular">
                {String(peakIdx).padStart(2, '0')}:00 · {Math.round(peakVal)}%
              </span>
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
