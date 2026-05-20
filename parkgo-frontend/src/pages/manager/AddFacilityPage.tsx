import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { PlusSquare, MapPin, Hash, Cog, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { PageHeader } from '@/components/ui/PageHeader';
import { facilityApi } from '@/api/facility.api';
import { cn } from '@/lib/utils';

type Tab = 'space' | 'installer';

export default function AddFacilityPage() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<Tab>('space');

  /* ---- Space form state ---- */
  const [spaceNumber, setSpaceNumber] = useState('');
  const [location, setLocation] = useState('Zone-A');

  const spaces = useQuery({
    queryKey: ['facility', 'spaces'],
    queryFn: () => facilityApi.listSpaces(),
  });
  const nextSpaceNumber =
    (spaces.data?.reduce((m, s) => Math.max(m, s.space_number), 0) || 0) + 1;

  const installers = useQuery({
    queryKey: ['facility', 'installers'],
    queryFn: () => facilityApi.listInstallers(),
  });
  const suggestedInstallerName = (() => {
    const used = new Set(
      (installers.data || []).map((i) => i.installer_name.toUpperCase())
    );
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    for (const ch of letters) {
      if (!used.has(`INSTALLER-${ch}`)) return `Installer-${ch}`;
    }
    return `Installer-${(installers.data?.length ?? 0) + 1}`;
  })();

  /* ---- Installer form state ---- */
  const [installerName, setInstallerName] = useState('');

  const addSpace = useMutation({
    mutationFn: () =>
      facilityApi.addSpace({
        space_number: spaceNumber ? Number(spaceNumber) : undefined,
        location: location || undefined,
      }),
    onSuccess: (data) => {
      toast.success(`Space #${data.space_number} added`);
      setSpaceNumber('');
      qc.invalidateQueries({ queryKey: ['facility'] });
    },
    onError: (err: { error?: string; message?: string }) => {
      toast.error(err.error || err.message || 'Add failed');
    },
  });

  const addInstaller = useMutation({
    mutationFn: () =>
      facilityApi.addInstaller({
        installer_name: installerName || suggestedInstallerName,
      }),
    onSuccess: (data) => {
      toast.success(`${data.installer_name} added`);
      setInstallerName('');
      qc.invalidateQueries({ queryKey: ['facility'] });
    },
    onError: (err: { error?: string; message?: string }) => {
      toast.error(err.error || err.message || 'Add failed');
    },
  });

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <PageHeader
        eyebrow="Provision"
        title={
          <span className="inline-flex items-center gap-3">
            <span className="h-10 w-10 rounded-2xl bg-success-50 border border-success-100 flex items-center justify-center text-success-600">
              <PlusSquare className="h-5 w-5" />
            </span>
            Add facility
          </span>
        }
        description="Provision new parking spaces or installer machines"
      />

      <div className="inline-flex bg-surface-0 rounded-2xl border border-surface-200 p-1 gap-1 shadow-soft">
        <button
          onClick={() => setTab('space')}
          className={cn(
            'px-4 py-1.5 rounded-xl text-sm font-semibold transition-all flex items-center gap-2',
            tab === 'space'
              ? 'bg-gradient-to-br from-success-500 to-success-700 text-white shadow-soft'
              : 'text-ink-600 hover:bg-surface-100'
          )}
        >
          <MapPin className="h-4 w-4" />
          Parking space
        </button>
        <button
          onClick={() => setTab('installer')}
          className={cn(
            'px-4 py-1.5 rounded-xl text-sm font-semibold transition-all flex items-center gap-2',
            tab === 'installer'
              ? 'bg-gradient-to-br from-success-500 to-success-700 text-white shadow-soft'
              : 'text-ink-600 hover:bg-surface-100'
          )}
        >
          <Cog className="h-4 w-4" />
          Installer
        </button>
      </div>

      {tab === 'space' && (
        <motion.div
          key="space"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl bg-surface-0 border border-surface-200 p-6 md:p-8 shadow-card space-y-5"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Space number"
              placeholder={`Auto: ${nextSpaceNumber}`}
              icon={<Hash className="h-4 w-4" />}
              value={spaceNumber}
              onChange={(e) => setSpaceNumber(e.target.value.replace(/\D/g, ''))}
            />
            <Input
              label="Location / Zone"
              placeholder="Zone-A"
              icon={<MapPin className="h-4 w-4" />}
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>
          <p className="text-xs text-ink-500">
            Leave the number empty to auto-assign{' '}
            <span className="font-mono font-semibold">{nextSpaceNumber}</span>.
            Currently the facility has{' '}
            <span className="font-semibold">{spaces.data?.length ?? '—'}</span>{' '}
            spaces.
          </p>
          <Button
            size="lg"
            fullWidth
            loading={addSpace.isPending}
            onClick={() => addSpace.mutate()}
          >
            <CheckCircle2 className="h-5 w-5" />
            Add parking space
          </Button>
        </motion.div>
      )}

      {tab === 'installer' && (
        <motion.div
          key="installer"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl bg-surface-0 border border-surface-200 p-6 md:p-8 shadow-card space-y-5"
        >
          <Input
            label="Installer name"
            placeholder={`Suggested: ${suggestedInstallerName}`}
            icon={<Cog className="h-4 w-4" />}
            value={installerName}
            onChange={(e) => setInstallerName(e.target.value)}
          />
          <p className="text-xs text-ink-500">
            Currently the facility has{' '}
            <span className="font-semibold">
              {installers.data?.length ?? '—'}
            </span>{' '}
            installer machines. Adding another increases parallel throughput.
          </p>
          <Button
            size="lg"
            fullWidth
            loading={addInstaller.isPending}
            onClick={() => addInstaller.mutate()}
          >
            <CheckCircle2 className="h-5 w-5" />
            Add installer
          </Button>
        </motion.div>
      )}
    </div>
  );
}
