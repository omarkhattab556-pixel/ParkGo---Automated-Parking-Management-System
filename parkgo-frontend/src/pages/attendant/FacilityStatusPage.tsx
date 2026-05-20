import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Settings, Cog, CircleX } from 'lucide-react';
import { cn } from '@/lib/utils';
import { facilityApi } from '@/api/facility.api';
import { CardSkeleton, StatStripSkeleton } from '@/components/common/Skeleton';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { PageHeader, SectionHeader } from '@/components/ui/PageHeader';
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
        'rounded-3xl border p-5 shadow-card transition-colors',
        isFree
          ? 'bg-gradient-to-br from-success-50 to-surface-0 border-success-200'
          : 'bg-gradient-to-br from-warning-50 to-surface-0 border-warning-100'
      )}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <motion.div
            animate={isFree ? { rotate: 0 } : { rotate: 360 }}
            transition={
              isFree ? { duration: 0 } : { duration: 2.4, repeat: Infinity, ease: 'linear' }
            }
            className={cn(
              'h-12 w-12 rounded-2xl flex items-center justify-center shadow-soft',
              isFree
                ? 'bg-gradient-to-br from-success-500 to-success-700'
                : 'bg-gradient-to-br from-warning-400 to-warning-600'
            )}
          >
            <Cog className="h-5 w-5 text-white" />
          </motion.div>
          <div>
            <p className="font-display font-bold text-ink-900">{name}</p>
            <p className="text-xs text-ink-500">
              {isFree ? 'Ready' : 'Operating'}
            </p>
          </div>
        </div>
        <Badge tone={isFree ? 'success' : 'warning'} dot size="md">
          {isFree ? 'Free' : 'Busy'}
        </Badge>
      </div>

      {!isFree && (
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs text-warning-600">
            <span className="font-medium">Operation in progress</span>
            <span className="font-bold tabular">
              {Math.ceil(remainingMs / 1000)}s left
            </span>
          </div>
          <div className="h-2 bg-warning-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-warning-400 to-warning-600 transition-all"
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
      <PageHeader
        eyebrow="Operations"
        title={
          <span className="inline-flex items-center gap-3">
            <span className="h-10 w-10 rounded-2xl bg-brand-50 border border-brand-100 flex items-center justify-center text-brand-600">
              <Settings className="h-5 w-5" />
            </span>
            Facility status
          </span>
        }
        description="Refreshes every 3 seconds"
        actions={<Badge tone="success" dot size="lg">Live</Badge>}
      />

      {isLoading && (
        <>
          <StatStripSkeleton count={4} />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <CardSkeleton key={i} lines={2} />
            ))}
          </div>
        </>
      )}

      {data && (
        <>
          <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Card padding="md" className="text-center">
              <p className="text-[10px] uppercase tracking-wider text-ink-500 font-semibold">
                Installers
              </p>
              <p className="font-display text-2xl font-bold text-ink-900 tabular mt-1">
                {data.installers.total}
              </p>
            </Card>
            <Card padding="md" className="text-center bg-gradient-to-br from-success-50 to-surface-0 border-success-200">
              <p className="text-[10px] uppercase tracking-wider text-success-700 font-semibold">
                Free
              </p>
              <p className="font-display text-2xl font-bold text-success-700 tabular mt-1">
                {data.installers.free}
              </p>
            </Card>
            <Card padding="md" className="text-center bg-gradient-to-br from-warning-50 to-surface-0 border-warning-100">
              <p className="text-[10px] uppercase tracking-wider text-warning-600 font-semibold">
                Busy
              </p>
              <p className="font-display text-2xl font-bold text-warning-600 tabular mt-1">
                {data.installers.busy}
              </p>
            </Card>
            <Card padding="md" className="text-center">
              <p className="text-[10px] uppercase tracking-wider text-ink-500 font-semibold">
                Spaces
              </p>
              <p className="font-display text-2xl font-bold text-ink-900 tabular mt-1">
                {data.spaces.free} / {data.spaces.total}
              </p>
              <p className="text-xs text-ink-500 mt-1">
                {data.spaces.occupied} occupied
              </p>
            </Card>
          </section>

          <section>
            <SectionHeader title="Installers" description="Robotic shuttles" />
            {data.installers.installers.length === 0 ? (
              <div className="rounded-3xl bg-surface-0 border border-dashed border-surface-300 p-8 text-center">
                <CircleX className="h-8 w-8 text-ink-300 mx-auto mb-2" />
                <p className="text-sm text-ink-500">
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
