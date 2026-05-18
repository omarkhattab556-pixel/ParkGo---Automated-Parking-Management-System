import { useState } from 'react';
import { format } from 'date-fns';
import {
  BarChart3,
  TrendingUp,
  Clock,
  CalendarClock,
  Download,
  Printer,
} from 'lucide-react';
import toast from 'react-hot-toast';

import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { reportsApi, type ReportType } from '@/api/reports.api';
import { OccupancyReport } from './reports/OccupancyReport';
import { BehaviorReport } from './reports/BehaviorReport';
import { ReservationsReport } from './reports/ReservationsReport';

const tabs: {
  key: ReportType;
  label: string;
  icon: typeof TrendingUp;
}[] = [
  { key: 'occupancy', label: 'Occupancy', icon: TrendingUp },
  { key: 'behavior', label: 'Duration & Behavior', icon: Clock },
  { key: 'reservations', label: 'Reservations', icon: CalendarClock },
];

export default function ReportsPage() {
  const today = new Date();
  const defaultMonth = format(today, 'yyyy-MM');
  const [month, setMonth] = useState(defaultMonth);
  const [active, setActive] = useState<ReportType>('occupancy');
  const [exporting, setExporting] = useState(false);

  const exportCsv = async () => {
    setExporting(true);
    try {
      await reportsApi.exportCsv(active, month);
      toast.success('CSV downloaded');
    } catch (err) {
      toast.error((err as Error).message || 'Export failed');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between print:hidden">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-xl bg-primary-50 flex items-center justify-center">
            <BarChart3 className="h-5 w-5 text-primary-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
              Reports
            </h1>
            <p className="text-slate-500 text-sm">
              Operational analytics — pick a month and tab
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-primary-400"
          />
          <Button
            variant="secondary"
            size="md"
            onClick={() => window.print()}
            title="Print or save as PDF"
          >
            <Printer className="h-4 w-4" />
            <span className="hidden sm:inline">Print / PDF</span>
          </Button>
          <Button
            variant="primary"
            size="md"
            onClick={exportCsv}
            loading={exporting}
          >
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">CSV</span>
          </Button>
        </div>
      </header>

      <div className="inline-flex bg-white rounded-xl border border-slate-200 p-1 gap-1 print:hidden">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setActive(t.key)}
            className={cn(
              'px-4 py-1.5 rounded-lg text-sm font-medium transition flex items-center gap-2',
              active === t.key
                ? 'bg-primary-500 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-50'
            )}
          >
            <t.icon className="h-4 w-4" />
            {t.label}
          </button>
        ))}
      </div>

      <div className="print:pt-2">
        <h2 className="hidden print:block text-2xl font-bold text-slate-900 mb-1">
          {tabs.find((t) => t.key === active)?.label} report
        </h2>
        <p className="hidden print:block text-sm text-slate-500 mb-4">
          ParkGo · {month} · Generated{' '}
          {new Date().toLocaleString()}
        </p>

        {active === 'occupancy' && <OccupancyReport month={month} />}
        {active === 'behavior' && <BehaviorReport month={month} />}
        {active === 'reservations' && <ReservationsReport month={month} />}
      </div>
    </div>
  );
}
