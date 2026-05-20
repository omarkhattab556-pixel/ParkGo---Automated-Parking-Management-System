import { Skeleton } from './Skeleton';

export function PageSuspenseFallback() {
  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Skeleton className="h-12 w-12 rounded-2xl" />
        <div className="space-y-2">
          <Skeleton className="h-3 w-32" />
          <Skeleton className="h-8 w-64" />
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-6 lg:grid-cols-12 gap-3 md:gap-4">
        <div className="col-span-2 md:col-span-6 lg:col-span-8 row-span-2 rounded-3xl bg-surface-0 border border-surface-200 p-5 shadow-card">
          <Skeleton className="h-5 w-1/3 mb-3" />
          <Skeleton className="h-72 w-full rounded-2xl" />
        </div>
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="col-span-2 md:col-span-3 lg:col-span-4 rounded-3xl bg-surface-0 border border-surface-200 p-5 shadow-card space-y-2.5"
          >
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-9 w-28" />
            <Skeleton className="h-3 w-16" />
          </div>
        ))}
      </div>
    </div>
  );
}
