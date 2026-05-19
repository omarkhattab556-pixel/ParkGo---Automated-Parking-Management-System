import { Skeleton } from './Skeleton';

/**
 * Shown while a lazy-loaded route chunk is being fetched. We try to mimic the
 * shell of a typical dashboard page (header + stat strip + content block) so
 * the layout doesn't jump when the real component arrives.
 */
export function PageSuspenseFallback() {
  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-150">
      <div className="flex items-center gap-3">
        <Skeleton className="h-11 w-11 rounded-xl" />
        <div className="space-y-2">
          <Skeleton className="h-3 w-32" />
          <Skeleton className="h-7 w-56" />
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="rounded-2xl bg-white border border-slate-100 p-5 space-y-2"
          >
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-3 w-20" />
          </div>
        ))}
      </div>

      <div className="rounded-3xl bg-white border border-slate-100 p-6 space-y-3">
        <Skeleton className="h-5 w-1/3" />
        <Skeleton className="h-40 w-full rounded-xl" />
      </div>
    </div>
  );
}
