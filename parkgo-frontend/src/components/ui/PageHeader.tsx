import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface PageHeaderProps {
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  className?: string;
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <header
      className={cn(
        'flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between',
        className
      )}
    >
      <div className="min-w-0">
        {eyebrow && (
          <p className="text-[11px] uppercase tracking-[0.12em] font-semibold text-brand-600 mb-1.5">
            {eyebrow}
          </p>
        )}
        <h1 className="font-display text-2xl md:text-[32px] font-bold text-ink-900 tracking-tight leading-tight">
          {title}
        </h1>
        {description && (
          <p className="text-sm md:text-[15px] text-ink-500 mt-1.5 max-w-2xl">
            {description}
          </p>
        )}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}

interface SectionHeaderProps {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  className?: string;
}

export function SectionHeader({
  title,
  description,
  actions,
  className,
}: SectionHeaderProps) {
  return (
    <div
      className={cn(
        'flex items-end justify-between gap-3 mb-3',
        className
      )}
    >
      <div className="min-w-0">
        <h2 className="font-display text-base md:text-lg font-semibold text-ink-900 tracking-tight">
          {title}
        </h2>
        {description && (
          <p className="text-xs md:text-sm text-ink-500 mt-0.5">{description}</p>
        )}
      </div>
      {actions && <div className="shrink-0">{actions}</div>}
    </div>
  );
}
