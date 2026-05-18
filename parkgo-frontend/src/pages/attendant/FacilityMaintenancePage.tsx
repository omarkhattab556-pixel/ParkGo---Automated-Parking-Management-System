import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Wrench, PhoneCall, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';

import { Button } from '@/components/ui/Button';
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
      <header className="flex items-center gap-3">
        <div className="h-11 w-11 rounded-xl bg-rose-50 flex items-center justify-center">
          <Wrench className="h-5 w-5 text-rose-600" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
            Facility maintenance
          </h1>
          <p className="text-slate-500 text-sm">
            Call a technician for hardware issues
          </p>
        </div>
      </header>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-rose-500 to-red-600 text-white p-8 shadow-xl"
      >
        <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-white/10" />
        <div className="absolute -bottom-12 -left-12 h-36 w-36 rounded-full bg-white/5" />
        <Wrench className="h-12 w-12 mb-4 relative z-10" strokeWidth={2.2} />
        <h2 className="text-2xl font-bold mb-2 relative z-10">
          Need a technician?
        </h2>
        <p className="text-white/85 mb-6 relative z-10">
          Use this when an installer is stuck or hardware is malfunctioning.
          A technician will arrive on-site.
        </p>
        <Button
          variant="secondary"
          size="lg"
          onClick={() => call.mutate()}
          loading={call.isPending}
          className="bg-white text-rose-600 hover:bg-rose-50 relative z-10"
        >
          <PhoneCall className="h-5 w-5" />
          Call technician
        </Button>
      </motion.div>

      {lastEntry && (
        <motion.div
          key={lastEntry.called_at}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl bg-emerald-50 border border-emerald-200 p-5 flex items-start gap-3"
        >
          <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold text-emerald-800">
              Technician notified
            </p>
            <p className="text-sm text-emerald-700">
              Called at {formatDateTime(lastEntry.called_at)}
            </p>
            <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white border border-emerald-200 text-sm">
              <PhoneCall className="h-4 w-4 text-emerald-600" />
              <span className="font-mono font-semibold text-slate-900">
                {lastEntry.technician_phone}
              </span>
            </div>
          </div>
        </motion.div>
      )}

      <div className="rounded-2xl bg-amber-50 border border-amber-200 p-4 flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
        <p className="text-sm text-amber-800">
          The cron job releases stuck installers automatically every 5 seconds —
          only call a technician for actual hardware issues, not for "an installer
          is busy".
        </p>
      </div>

      {log.length > 0 && (
        <section className="rounded-3xl bg-white border border-slate-100 p-5">
          <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2 mb-3">
            <Clock className="h-4 w-4 text-slate-500" />
            Recent calls (this session)
          </h3>
          <ul className="space-y-2">
            {log.map((entry) => (
              <li
                key={entry.called_at}
                className="flex items-center justify-between text-sm rounded-lg bg-slate-50 px-3 py-2"
              >
                <span className="text-slate-700">
                  {formatDateTime(entry.called_at)}
                </span>
                <span className="text-slate-500 font-mono text-xs">
                  by {entry.called_by}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
