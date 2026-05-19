import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MinusSquare,
  Trash2,
  AlertTriangle,
  MapPin,
  Cog,
} from 'lucide-react';
import toast from 'react-hot-toast';

import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/common/Skeleton';
import { facilityApi } from '@/api/facility.api';
import { cn } from '@/lib/utils';

type Target =
  | { kind: 'space'; id: number; label: string }
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

  const doRemove = () => {
    if (!confirm) return;
    if (confirm.kind === 'space') removeSpace.mutate(confirm.id);
    else removeInstaller.mutate(confirm.id);
  };

  return (
    <div className="space-y-6">
      <header className="flex items-center gap-3">
        <div className="h-11 w-11 rounded-xl bg-rose-50 flex items-center justify-center">
          <MinusSquare className="h-5 w-5 text-rose-600" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
            Remove facility
          </h1>
          <p className="text-slate-500 text-sm">
            Decommission spaces or installers · busy/occupied ones are blocked
          </p>
        </div>
      </header>

      {/* Spaces */}
      <section>
        <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2 mb-3">
          <MapPin className="h-4 w-4 text-slate-500" />
          Parking spaces ({spaces.data?.length ?? 0})
        </h2>
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
        {spaces.data && spaces.data.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
            {spaces.data.map((s) => {
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
                    'rounded-xl border p-3 text-left transition-all',
                    locked
                      ? 'bg-slate-100 border-slate-200 text-slate-500 cursor-not-allowed'
                      : 'bg-white border-slate-200 hover:border-rose-300 hover:bg-rose-50/50'
                  )}
                >
                  <p className="text-xs text-slate-500">{s.location || '—'}</p>
                  <p className="text-base font-bold text-slate-900">
                    #{s.space_number}
                  </p>
                  <p className="text-[10px] mt-1 uppercase tracking-wider">
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
        )}
      </section>

      {/* Installers */}
      <section>
        <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2 mb-3">
          <Cog className="h-4 w-4 text-slate-500" />
          Installers ({installers.data?.length ?? 0})
        </h2>
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
                    'rounded-2xl border p-4 flex items-center justify-between gap-3',
                    locked
                      ? 'bg-amber-50 border-amber-200'
                      : 'bg-white border-slate-200'
                  )}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                      <Cog className="h-5 w-5 text-slate-500" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-900 truncate">
                        {i.installer_name}
                      </p>
                      <p className="text-xs text-slate-500">
                        {locked ? 'Busy — cannot remove' : 'Free'}
                      </p>
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
            className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setConfirm(null)}
          >
            <motion.div
              initial={{ scale: 0.92 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.92 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl"
            >
              <div className="flex items-center justify-center mb-4">
                <div className="h-14 w-14 rounded-2xl bg-danger-50 flex items-center justify-center">
                  <AlertTriangle className="h-7 w-7 text-danger-600" />
                </div>
              </div>
              <h2 className="text-xl font-bold text-slate-900 text-center">
                Remove {confirm.label}?
              </h2>
              <p className="text-sm text-slate-500 text-center mt-1">
                This cannot be undone. The facility will be permanently removed.
              </p>
              <div className="flex gap-3 mt-6">
                <Button variant="secondary" fullWidth onClick={() => setConfirm(null)}>
                  Cancel
                </Button>
                <Button
                  variant="danger"
                  fullWidth
                  loading={removeSpace.isPending || removeInstaller.isPending}
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
