import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MinusSquare,
  Trash2,
  AlertTriangle,
  MapPin,
  Cog,
  Layers,
} from 'lucide-react';
import toast from 'react-hot-toast';

import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { PageHeader, SectionHeader } from '@/components/ui/PageHeader';
import { Skeleton } from '@/components/common/Skeleton';
import { facilityApi } from '@/api/facility.api';
import { cn } from '@/lib/utils';

type Target =
  | { kind: 'space'; id: number; label: string }
  | { kind: 'floor'; id: string; label: string }
  | { kind: 'installer'; id: number; label: string }
  | null;

export default function RemoveFacilityPage() {
  const qc = useQueryClient();
  const [confirm, setConfirm] = useState<Target>(null);

  const spaces = useQuery({
    queryKey: ['facility', 'spaces'],
    queryFn: () => facilityApi.listSpaces(),
  });

  const installers = useQuery({
    queryKey: ['facility', 'installers'],
    queryFn: () => facilityApi.listInstallers(),
  });

  const removeSpace = useMutation({
    mutationFn: (num: number) => facilityApi.removeSpace(num),
    onSuccess: (data) => {
      toast.success(`Space #${data.removed} removed`);
      qc.invalidateQueries({ queryKey: ['facility'] });
    },
    onError: (err: { error?: string; message?: string }) => {
      toast.error(err.error || err.message || 'Remove failed');
    },
    onSettled: () => setConfirm(null),
  });

  const removeInstaller = useMutation({
    mutationFn: (id: number) => facilityApi.removeInstaller(id),
    onSuccess: (data) => {
      toast.success(`Installer #${data.removed} removed`);
      qc.invalidateQueries({ queryKey: ['facility'] });
    },
    onError: (err: { error?: string; message?: string }) => {
      toast.error(err.error || err.message || 'Remove failed');
    },
    onSettled: () => setConfirm(null),
  });

  const removeFloorMut = useMutation({
    mutationFn: (location: string) => facilityApi.removeFloor(location),
    onSuccess: (data) => {
      toast.success(
        `Floor "${data.removed_location}" removed (${data.removed_spaces} spaces)`
      );
      qc.invalidateQueries({ queryKey: ['facility'] });
    },
    onError: (err: { error?: string; message?: string }) => {
      toast.error(err.error || err.message || 'Remove floor failed');
    },
    onSettled: () => setConfirm(null),
  });

  const doRemove = () => {
    if (!confirm) return;
    if (confirm.kind === 'space') removeSpace.mutate(confirm.id);
    else if (confirm.kind === 'floor') removeFloorMut.mutate(confirm.id);
    else removeInstaller.mutate(confirm.id);
  };

  /* ---- Group spaces by floor (location string) ---- */
  const spacesByFloor = useMemo(() => {
    const map = new Map<
      string,
      {
        location: string;
        spaces: NonNullable<typeof spaces.data>;
        anyLocked: boolean;
      }
    >();
    (spaces.data || []).forEach((s) => {
      const key = (s.location && s.location.trim()) || 'Unzoned';
      if (!map.has(key)) {
        map.set(key, { location: key, spaces: [], anyLocked: false });
      }
      const b = map.get(key)!;
      b.spaces.push(s);
      if (s.in_use || s.reserved || s.is_occupied) b.anyLocked = true;
    });
    return Array.from(map.values()).sort((a, b) =>
      a.location.localeCompare(b.location)
    );
  }, [spaces.data]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Decommission"
        title={
          <span className="inline-flex items-center gap-3">
            <span className="h-10 w-10 rounded-2xl bg-danger-50 border border-danger-100 flex items-center justify-center text-danger-600">
              <MinusSquare className="h-5 w-5" />
            </span>
            Remove facility
          </span>
        }
        description="Decommission spaces or installers · busy/occupied ones are blocked"
      />

      {/* Spaces — grouped by floor */}
      <section className="space-y-5">
        <SectionHeader
          title={
            <span className="inline-flex items-center gap-2">
              <MapPin className="h-4 w-4 text-ink-500" />
              Parking spaces
              <Badge tone="neutral" size="sm">{spaces.data?.length ?? 0}</Badge>
            </span>
          }
        />
        {spaces.isLoading && (
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
            {[...Array(16)].map((_, i) => (
              <Skeleton key={i} className="h-20 rounded-xl" />
            ))}
          </div>
        )}
        {spaces.data && spaces.data.length === 0 && (
          <p className="text-sm text-slate-500 italic">No spaces configured.</p>
        )}
        {spacesByFloor.map((group) => (
          <div key={group.location} className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-ink-500" />
                <p className="font-display font-bold text-ink-900">
                  Floor "{group.location}"
                </p>
                <Badge tone="neutral" size="sm">
                  {group.spaces.length} spaces
                </Badge>
              </div>
              <Button
                variant="danger"
                size="sm"
                disabled={group.anyLocked}
                aria-label={`Remove floor ${group.location}`}
                onClick={() =>
                  setConfirm({
                    kind: 'floor',
                    id: group.location,
                    label: `Floor "${group.location}" (${group.spaces.length} spaces)`,
                  })
                }
              >
                <Trash2 className="h-4 w-4" />
                Remove floor
              </Button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
              {group.spaces.map((s) => {
                const locked = s.in_use || s.reserved || s.is_occupied;
                return (
                  <motion.button
                    layout
                    key={s.space_number}
                    disabled={locked}
                    onClick={() =>
                      setConfirm({
                        kind: 'space',
                        id: s.space_number,
                        label: `Space #${s.space_number}`,
                      })
                    }
                    className={cn(
                      'rounded-2xl border p-3 text-left transition-all',
                      locked
                        ? 'bg-surface-100 border-surface-200 text-ink-500 cursor-not-allowed'
                        : 'bg-surface-0 border-surface-200 hover:border-danger-300 hover:bg-danger-50/50 hover:-translate-y-0.5 shadow-soft'
                    )}
                  >
                    <p className="text-[10px] text-ink-500 uppercase tracking-wider font-semibold">
                      {s.location || '—'}
                    </p>
                    <p className="font-display text-lg font-bold text-ink-900 tabular">
                      #{s.space_number}
                    </p>
                    <p className="text-[10px] mt-1 uppercase tracking-wider font-semibold text-ink-500">
                      {s.in_use
                        ? 'In use'
                        : s.reserved
                        ? 'Reserved'
                        : s.is_occupied
                        ? 'Occupied'
                        : 'Free'}
                    </p>
                  </motion.button>
                );
              })}
            </div>
          </div>
        ))}
      </section>

      {/* Installers */}
      <section>
        <SectionHeader
          title={
            <span className="inline-flex items-center gap-2">
              <Cog className="h-4 w-4 text-ink-500" />
              Installers
              <Badge tone="neutral" size="sm">{installers.data?.length ?? 0}</Badge>
            </span>
          }
        />
        {installers.isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-20 rounded-2xl" />
            ))}
          </div>
        )}
        {installers.data && installers.data.length === 0 && (
          <p className="text-sm text-slate-500 italic">No installers configured.</p>
        )}
        {installers.data && installers.data.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {installers.data.map((i) => {
              const locked = !i.is_free;
              return (
                <div
                  key={i.installer_id}
                  className={cn(
                    'rounded-2xl border p-4 flex items-center justify-between gap-3 shadow-soft',
                    locked
                      ? 'bg-warning-50 border-warning-100'
                      : 'bg-surface-0 border-surface-200'
                  )}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-11 w-11 rounded-2xl bg-surface-100 flex items-center justify-center shrink-0">
                      <Cog className="h-5 w-5 text-ink-500" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-display font-bold text-ink-900 truncate">
                        {i.installer_name}
                      </p>
                      <Badge tone={locked ? 'warning' : 'success'} dot size="sm">
                        {locked ? 'Busy — locked' : 'Free'}
                      </Badge>
                    </div>
                  </div>
                  <Button
                    variant="danger"
                    size="sm"
                    disabled={locked}
                    aria-label={`Remove ${i.installer_name}`}
                    onClick={() =>
                      setConfirm({
                        kind: 'installer',
                        id: i.installer_id,
                        label: i.installer_name,
                      })
                    }
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <AnimatePresence>
        {confirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-ink-900/60 backdrop-blur-md flex items-center justify-center p-4"
            onClick={() => setConfirm(null)}
          >
            <motion.div
              initial={{ scale: 0.92 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.92 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm rounded-3xl bg-surface-0 p-6 shadow-popover"
            >
              <div className="flex items-center justify-center mb-4">
                <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-danger-500 to-danger-700 flex items-center justify-center shadow-[0_8px_24px_-8px_rgba(244,63,94,0.55)]">
                  <AlertTriangle className="h-7 w-7 text-white" />
                </div>
              </div>
              <h2 className="font-display text-xl font-bold text-ink-900 text-center">
                Remove {confirm.label}?
              </h2>
              <p className="text-sm text-ink-500 text-center mt-1">
                This cannot be undone. The facility will be permanently removed.
              </p>
              <div className="flex gap-3 mt-6">
                <Button variant="secondary" fullWidth onClick={() => setConfirm(null)}>
                  Cancel
                </Button>
                <Button
                  variant="danger"
                  fullWidth
                  loading={
                    removeSpace.isPending ||
                    removeInstaller.isPending ||
                    removeFloorMut.isPending
                  }
                  onClick={doRemove}
                >
                  Yes, remove
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
