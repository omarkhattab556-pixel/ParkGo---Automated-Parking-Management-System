import { cn } from '@/lib/utils';

/* ---------- Primitive ---------- */
export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'rounded-xl bg-gradient-to-r from-surface-200 via-surface-100 to-surface-200 bg-[length:200%_100%] animate-shimmer',
        className
      )}
      {...props}
    />
  );
}

/* ---------- Stat strip skeleton ---------- */
export function StatCardSkeleton() {
  return (
    <div className="rounded-3xl bg-surface-0 border border-surface-200 p-5 shadow-card">
      <Skeleton className="h-3 w-20 mb-2.5" />
      <Skeleton className="h-9 w-24 mb-2" />
      <Skeleton className="h-3 w-16" />
    </div>
  );
}

export function StatStripSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <StatCardSkeleton key={i} />
      ))}
    </div>
  );
}

/* ---------- Generic card skeleton ---------- */
export function CardSkeleton({
  lines = 3,
  className,
}: {
  lines?: number;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'rounded-3xl bg-surface-0 border border-surface-200 p-5 space-y-3 shadow-card',
        className
      )}
    >
      <Skeleton className="h-5 w-1/2" />
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} className={cn('h-4', i % 2 === 0 ? 'w-full' : 'w-4/5')} />
      ))}
    </div>
  );
}

/* ---------- Table skeleton ---------- */
export function TableSkeleton({
  columns = 6,
  rows = 8,
}: {
  columns?: number;
  rows?: number;
}) {
  return (
    <div className="rounded-3xl bg-surface-0 border border-surface-200 overflow-hidden shadow-card">
      <div className="bg-surface-50 border-b border-surface-200 px-4 py-3 flex gap-4">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} className="h-3 flex-1" />
        ))}
      </div>
      <div className="divide-y divide-surface-200">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="px-4 py-3.5 flex gap-4">
            {Array.from({ length: columns }).map((_, c) => (
              <Skeleton
                key={c}
                className={cn(
                  'h-4 flex-1',
                  c === 0 && 'max-w-[60px]',
                  c === columns - 1 && 'max-w-[80px]'
                )}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------- Chart placeholder ---------- */
export function ChartSkeleton({ height = 256 }: { height?: number }) {
  return (
    <div
      className="rounded-3xl bg-surface-0 border border-surface-200 p-6 flex flex-col gap-3 shadow-card"
      style={{ minHeight: height }}
    >
      <Skeleton className="h-4 w-1/3" />
      <div className="flex-1 flex items-end gap-2 pt-2">
        {Array.from({ length: 16 }).map((_, i) => (
          <Skeleton
            key={i}
            className="flex-1 rounded-md"
            style={{ height: `${30 + Math.sin(i * 0.9) * 30 + Math.random() * 20}%` }}
          />
        ))}
      </div>
    </div>
  );
}
