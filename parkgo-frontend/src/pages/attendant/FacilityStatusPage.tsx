import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Settings, Cog, Check, CircleX } from 'lucide-react';
import { cn } from '@/lib/utils';
import { facilityApi } from '@/api/facility.api';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { BUSINESS_RULES } from '@/utils/constants';

function InstallerCard({
  name,
  isFree,
  busyUntil,
}: {
  name: string;
  isFree: boolean;
  busyUntil: string | null;
}) {
  // tick every 250ms to update progress smoothly when busy
  const [, force] = useState(0);
  useEffect(() => {
    if (isFree) return;
    const t = setInterval(() => force((n) => n + 1), 250);
    return () => clearInterval(t);
  }, [isFree]);

  const totalMs = BUSINESS_RULES.INSTALLER_OPERATION_SECONDS * 1000;
  let remainingMs = 0;
  let progress = 0;
  if (!isFree && busyUntil) {
    remainingMs = Math.max(0, new Date(busyUntil).getTime() - Date.now());
    progress = Math.min(100, ((totalMs - remainingMs) / totalMs) * 100);
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'rounded-3xl border p-5 shadow-sm transition-colors',
        isFree
          ? 'bg-emerald-50/60 border-emerald-200'
          : 'bg-amber-50/60 border-amber-200'
      )}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <motion.div
            animate={isFree ? { rotate: 0 } : { rotate: 360 }}
            transition={
              isFree ? { duration: 0 } : { duration: 2, repeat: Infinity, ease: 'linear' }
            }
            className={cn(
              'h-11 w-11 rounded-xl flex items-center justify-center shadow',
              isFree
                ? 'bg-gradient-to-br from-emerald-400 to-emerald-600'
                : 'bg-gradient-to-br from-amber-400 to-amber-600'
            )}
          >
            <Cog className="h-5 w-5 text-white" />
          </motion.div>
          <div>
            <p className="font-bold text-slate-900">{name}</p>
            <p className="text-xs text-slate-500">
              {isFree ? 'Ready' : 'Operating'}
            </p>
          </div>
        </div>
        <span
          className={cn(
            'inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full',
            isFree
              ? 'bg-emerald-100 text-emerald-700'
              : 'bg-amber-100 text-amber-700'
          )}
        >
          {isFree ? <Check className="h-3 w-3" /> : <Cog className="h-3 w-3" />}
          {isFree ? 'Free' : 'Busy'}
        </span>
      </div>

      {!isFree && (
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs text-amber-700">
            <span>Operation in progress</span>
            <span className="font-semibold tabular-nums">
              {Math.ceil(remainingMs / 1000)}s left
            </span>
          </div>
          <div className="h-2 bg-amber-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-400 to-amber-600 transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}
    </motion.div>
  );
}

export default function FacilityStatusPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['facility', 'status'],
    queryFn: () => facilityApi.getStatus(),
    refetchInterval: 3000,
  });

  return (
    <div className="space-y-6">
      <header className="flex items-center gap-3">
        <div className="h-11 w-11 rounded-xl bg-purple-50 flex items-center justify-center">
          <Settings className="h-5 w-5 text-purple-600" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
            Facility status
          </h1>
          <p className="text-slate-500 text-sm flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-emerald-700">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live · refreshes every 3s
            </span>
          </p>
        </div>
      </header>

      {isLoading && <LoadingSpinner />}

      {data && (
        <>
          <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="rounded-2xl bg-white border border-slate-100 px-5 py-4">
              <p className="text-xs uppercase tracking-wider text-slate-500 font-medium">
                Installers
              </p>
              <p className="text-2xl font-bold text-slate-900 tabular-nums">
                {data.installers.total}
              </p>
            </div>
            <div className="rounded-2xl bg-emerald-50 border border-emerald-200 px-5 py-4">
              <p className="text-xs uppercase tracking-wider text-emerald-700 font-medium">
                Free
              </p>
              <p className="text-2xl font-bold text-emerald-800 tabular-nums">
                {data.installers.free}
              </p>
            </div>
            <div className="rounded-2xl bg-amber-50 border border-amber-200 px-5 py-4">
              <p className="text-xs uppercase tracking-wider text-amber-700 font-medium">
                Busy
              </p>
              <p className="text-2xl font-bold text-amber-800 tabular-nums">
                {data.installers.busy}
              </p>
            </div>
            <div className="rounded-2xl bg-white border border-slate-100 px-5 py-4">
              <p className="text-xs uppercase tracking-wider text-slate-500 font-medium">
                Spaces
              </p>
              <p className="text-2xl font-bold text-slate-900 tabular-nums">
                {data.spaces.free} / {data.spaces.total}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                {data.spaces.occupied} occupied
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-sm font-semibold text-slate-900 mb-3">
              Installers
            </h2>
            {data.installers.installers.length === 0 ? (
              <div className="rounded-2xl bg-white border border-dashed border-slate-200 p-8 text-center">
                <CircleX className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                <p className="text-sm text-slate-500">
                  No installers configured. The manager can add them.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {data.installers.installers.map((i) => (
                  <InstallerCard
                    key={i.installer_id}
                    name={i.installer_name}
                    isFree={i.is_free}
                    busyUntil={i.busy_until}
                  />
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
