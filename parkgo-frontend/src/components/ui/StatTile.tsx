import { type ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatTileProps {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  icon?: LucideIcon;
  iconTone?: 'brand' | 'accent' | 'success' | 'danger' | 'info' | 'ink';
  trend?: { direction: 'up' | 'down' | 'flat'; value: string };
  loading?: boolean;
  className?: string;
  variant?: 'light' | 'dark';
}

const iconToneClasses: Record<
  NonNullable<StatTileProps['iconTone']>,
  string
> = {
  brand: 'bg-brand-50 text-brand-600',
  accent: 'bg-accent-50 text-accent-600',
  success: 'bg-success-50 text-success-600',
  danger: 'bg-danger-50 text-danger-600',
  info: 'bg-info-50 text-info-600',
  ink: 'bg-ink-100 text-ink-700',
};

export function StatTile({
  label,
  value,
  hint,
  icon: Icon,
  iconTone = 'brand',
  trend,
  loading = false,
  className,
  variant = 'light',
}: StatTileProps) {
  const isDark = variant === 'dark';
  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <div className="flex items-start justify-between gap-3">
        <p
          className={cn(
            'text-[11px] uppercase tracking-[0.08em] font-semibold',
            isDark ? 'text-white/60' : 'text-ink-500'
          )}
        >
          {label}
        </p>
        {Icon && (
          <span
            className={cn(
              'inline-flex h-8 w-8 items-center justify-center rounded-xl',
              isDark
                ? 'bg-white/10 text-white'
                : iconToneClasses[iconTone]
            )}
          >
            <Icon className="h-4 w-4" strokeWidth={2.2} />
          </span>
        )}
      </div>

      <p
        className={cn(
          'font-display text-3xl md:text-4xl font-bold tabular tracking-tight',
          isDark ? 'text-white' : 'text-ink-900',
          loading && 'animate-pulse text-ink-200'
        )}
      >
        {loading ? '— —' : value}
      </p>

      <div className="flex items-center gap-2 min-h-[18px]">
        {trend && (
          <span
            className={cn(
              'inline-flex items-center gap-0.5 text-xs font-semibold rounded-full px-1.5 py-0.5',
              trend.direction === 'up'
                ? isDark
                  ? 'bg-success-500/20 text-success-200'
                  : 'bg-success-50 text-success-700'
                : trend.direction === 'down'
                ? isDark
                  ? 'bg-danger-500/20 text-danger-200'
                  : 'bg-danger-50 text-danger-700'
                : isDark
                ? 'bg-white/10 text-white/70'
                : 'bg-ink-100 text-ink-600'
            )}
          >
            {trend.direction === 'up' ? (
              <ArrowUpRight className="h-3 w-3" />
            ) : trend.direction === 'down' ? (
              <ArrowDownRight className="h-3 w-3" />
            ) : (
              <Minus className="h-3 w-3" />
            )}
            {trend.value}
          </span>
        )}
        {hint && (
          <p
            className={cn(
              'text-xs',
              isDark ? 'text-white/60' : 'text-ink-500'
            )}
          >
            {hint}
          </p>
        )}
      </div>
    </div>
  );
}
