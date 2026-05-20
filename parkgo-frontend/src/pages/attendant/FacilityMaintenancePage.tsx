import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Wrench, PhoneCall, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { PageHeader } from '@/components/ui/PageHeader';
import { GlowOrbs } from '@/components/ui/GlowOrbs';
import { facilityApi, type MaintenanceCallResult } from '@/api/facility.api';
import { formatDateTime } from '@/utils/formatters';

export default function FacilityMaintenancePage() {
  const [log, setLog] = useState<MaintenanceCallResult[]>([]);

  const call = useMutation({
    mutationFn: () => facilityApi.callMaintenance(),
    onSuccess: (data) => {
      setLog((prev) => [data, ...prev].slice(0, 10));
    },
  });

  const lastEntry = log[0];

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <PageHeader
        eyebrow="Operations"
        title={
          <span className="inline-flex items-center gap-3">
            <span className="h-10 w-10 rounded-2xl bg-danger-50 border border-danger-100 flex items-center justify-center text-danger-600">
              <Wrench className="h-5 w-5" />
            </span>
            Facility maintenance
          </span>
        }
        description="Call a technician for hardware issues"
      />

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-danger-500 via-danger-600 to-danger-700 text-white p-8 shadow-[0_18px_48px_-18px_rgba(244,63,94,0.55)]"
      >
        <GlowOrbs variant="accent" />
        <div className="relative">
          <div className="h-14 w-14 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center mb-4">
            <Wrench className="h-6 w-6" strokeWidth={2.4} />
          </div>
          <h2 className="font-display text-2xl md:text-3xl font-bold mb-2 tracking-tight">
            Need a technician?
          </h2>
          <p className="text-white/85 mb-6 max-w-md">
            Use this when an installer is stuck or hardware is malfunctioning.
            A technician will arrive on-site.
          </p>
          <Button
            variant="secondary"
            size="lg"
            onClick={() => call.mutate()}
            loading={call.isPending}
            className="bg-white text-danger-700 hover:bg-white/95 border-none"
          >
            <PhoneCall className="h-5 w-5" />
            Call technician
          </Button>
        </div>
      </motion.div>

      {lastEntry && (
        <motion.div
          key={lastEntry.called_at}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card variant="default" padding="lg" className="bg-gradient-to-br from-success-50 to-surface-0 border-success-200">
            <div className="flex items-start gap-3">
              <span className="h-10 w-10 rounded-2xl bg-gradient-to-br from-success-500 to-success-700 flex items-center justify-center shadow-soft shrink-0">
                <CheckCircle2 className="h-5 w-5 text-white" />
              </span>
              <div className="flex-1">
                <p className="font-display font-semibold text-success-700">
                  Technician notified
                </p>
                <p className="text-sm text-success-700/80 mt-0.5">
                  Called at {formatDateTime(lastEntry.called_at)}
                </p>
                <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-surface-0 border border-success-200 text-sm">
                  <PhoneCall className="h-4 w-4 text-success-600" />
                  <span className="font-mono font-semibold text-ink-900">
                    {lastEntry.technician_phone}
                  </span>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>
      )}

      <div className="rounded-2xl bg-warning-50 border border-warning-100 p-4 flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-warning-600 shrink-0 mt-0.5" />
        <p className="text-sm text-warning-600">
          The cron job releases stuck installers automatically every 5 seconds —
          only call a technician for actual hardware issues.
        </p>
      </div>

      {log.length > 0 && (
        <Card variant="default" padding="lg">
          <h3 className="font-display text-base font-semibold text-ink-900 flex items-center gap-2 mb-3">
            <Clock className="h-4 w-4 text-ink-500" />
            Recent calls
            <Badge tone="neutral" size="sm">{log.length}</Badge>
          </h3>
          <ul className="space-y-2">
            {log.map((entry) => (
              <li
                key={entry.called_at}
                className="flex items-center justify-between text-sm rounded-xl bg-surface-50 border border-surface-200 px-3 py-2.5"
              >
                <span className="text-ink-700 font-medium">
                  {formatDateTime(entry.called_at)}
                </span>
                <span className="text-ink-500 font-mono text-xs">
                  by {entry.called_by}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
