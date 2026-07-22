import { useState } from 'react';
import { format } from 'date-fns';
import {
  BarChart3,
  TrendingUp,
  Clock,
  CalendarClock,
  Wallet,
  Download,
  Printer,
} from 'lucide-react';
import toast from 'react-hot-toast';

import { Button } from '@/components/ui/Button';
import { PageHeader } from '@/components/ui/PageHeader';
import { cn } from '@/lib/utils';
import { reportsApi, type ReportType } from '@/api/reports.api';
import { OccupancyReport } from './reports/OccupancyReport';
import { BehaviorReport } from './reports/BehaviorReport';
import { ReservationsReport } from './reports/ReservationsReport';
import { FinancialReport } from './reports/FinancialReport';

const tabs: {
  key: ReportType;
  label: string;
  icon: typeof TrendingUp;
}[] = [
  { key: 'occupancy', label: 'Occupancy', icon: TrendingUp },
  { key: 'behavior', label: 'Duration & Behavior', icon: Clock },
  { key: 'reservations', label: 'Reservations', icon: CalendarClock },
  { key: 'financial', label: 'Financial Report', icon: Wallet },
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
      <div className="print:hidden">
        <PageHeader
          eyebrow="Analytics"
          title={
            <span className="inline-flex items-center gap-3">
              <span className="h-10 w-10 rounded-2xl bg-brand-50 border border-brand-100 flex items-center justify-center text-brand-600">
                <BarChart3 className="h-5 w-5" />
              </span>
              Reports
            </span>
          }
          description="Operational analytics — pick a month and tab"
          actions={
            <>
              <input
                type="month"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                className="h-11 rounded-2xl border border-surface-200 bg-surface-0 px-3 text-sm shadow-soft focus:outline-none focus:ring-4 focus:ring-brand-100 focus:border-brand-500"
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
            </>
          }
        />
      </div>

      <div className="inline-flex bg-surface-0 rounded-2xl border border-surface-200 p-1 gap-1 shadow-soft print:hidden">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setActive(t.key)}
            className={cn(
              'px-4 py-1.5 rounded-xl text-sm font-semibold transition-all flex items-center gap-2',
              active === t.key
                ? 'bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-soft'
                : 'text-ink-600 hover:bg-surface-100'
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
        {active === 'financial' && <FinancialReport month={month} />}
      </div>
    </div>
  );
}
