import { cn } from '@/lib/utils';

/* ---------- Primitive ---------- */
export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'rounded-md bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 bg-[length:200%_100%] animate-shimmer',
        className
      )}
      {...props}
    />
  );
}

/* ---------- Stat strip skeleton ---------- */
export function StatCardSkeleton() {
  return (
    <div className="rounded-2xl bg-white border border-slate-100 px-5 py-4">
      <Skeleton className="h-3 w-20 mb-2" />
      <Skeleton className="h-8 w-24" />
      <Skeleton className="h-3 w-16 mt-2" />
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
        'rounded-2xl bg-white border border-slate-100 p-5 space-y-3',
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
    <div className="rounded-2xl bg-white border border-slate-100 overflow-hidden">
      <div className="bg-slate-50 border-b border-slate-100 px-4 py-3 flex gap-4">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} className="h-3 flex-1" />
        ))}
      </div>
      <div className="divide-y divide-slate-100">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="px-4 py-3 flex gap-4">
            {Array.from({ length: columns }).map((_, c) => (
              <Skeleton
                key={c}
                className={cn(
                  'h-4 flex-1',
                  c === 0 && 'max-w-[60px]', // narrower code column
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
      className="rounded-2xl bg-white border border-slate-100 p-6 flex flex-col gap-3"
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
