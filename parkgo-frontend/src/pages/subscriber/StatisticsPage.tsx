import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import {
  Wallet,
  Car,
  Clock,
  ArrowUpRight,
  AlarmClockOff,
  BadgeCheck,
  Receipt,
  Info,
  PieChart as PieChartIcon,
} from 'lucide-react';

import { reportsApi } from '@/api/reports.api';
import { CardSkeleton, StatStripSkeleton } from '@/components/common/Skeleton';
import { Card } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/PageHeader';

// Same palette the manager revenue report uses, so cost sources read
// consistently across the whole app.
const COST_COLORS = {
  parking: '#5d52f7', // brand
  extension: '#22c55e', // green
  late: '#f43f5e', // danger
  subscription: '#f59e0b', // amber
};

const tooltipStyle = {
  borderRadius: 14,
  border: '1px solid var(--color-surface-200)',
  fontSize: 12,
  boxShadow: '0 8px 28px rgba(13,13,24,0.10)',
};

function money(currency: string, amount: number): string {
  const symbol = currency === 'ILS' ? '₪' : '';
  return `${symbol}${amount.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
}

function StatTile({
  icon: Icon,
  label,
  value,
  tone = 'neutral',
}: {
  icon: typeof Car;
  label: string;
  value: string;
  tone?: 'neutral' | 'brand' | 'success' | 'danger' | 'amber';
}) {
  const tones: Record<string, string> = {
    neutral: 'bg-surface-0 border-surface-200 text-ink-900',
    brand: 'bg-brand-50 border-brand-100 text-brand-700',
    success: 'bg-success-50 border-success-100 text-success-700',
    danger: 'bg-danger-50 border-danger-100 text-danger-700',
    amber: 'bg-amber-50 border-amber-100 text-amber-700',
  };
  return (
    <div className={`rounded-3xl border p-5 shadow-card ${tones[tone]}`}>
      <div className="flex items-center gap-2 mb-1">
        <Icon className="h-4 w-4" />
        <p className="text-[11px] uppercase tracking-[0.08em] font-semibold">
          {label}
        </p>
      </div>
      <p className="font-display text-3xl font-bold tabular">{value}</p>
    </div>
  );
}

function BillRow({
  icon: Icon,
  label,
  detail,
  amount,
  strong,
}: {
  icon: typeof Car;
  label: string;
  detail?: string;
  amount: string;
  strong?: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between gap-3 py-3.5 border-b border-surface-200 last:border-0 ${
        strong ? 'pt-4' : ''
      }`}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="h-9 w-9 rounded-2xl bg-surface-100 border border-surface-200 flex items-center justify-center shrink-0">
          <Icon className="h-4 w-4 text-ink-500" />
        </div>
        <div className="min-w-0">
          <p
            className={`truncate ${
              strong ? 'font-bold text-ink-900' : 'font-semibold text-ink-800'
            }`}
          >
            {label}
          </p>
          {detail && <p className="text-xs text-ink-500 mt-0.5">{detail}</p>}
        </div>
      </div>
      <p
        className={`tabular shrink-0 ${
          strong
            ? 'font-display text-xl font-bold text-ink-900'
            : 'font-semibold text-ink-900'
        }`}
      >
        {amount}
      </p>
    </div>
  );
}

export default function StatisticsPage() {
  const [month, setMonth] = useState(() => format(new Date(), 'yyyy-MM'));

  const { data, isLoading } = useQuery({
    queryKey: ['reports', 'my-billing', month],
    queryFn: () => reportsApi.myBilling(month),
  });

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <PageHeader
        eyebrow="Billing"
        title={
          <span className="inline-flex items-center gap-3">
            <span className="h-10 w-10 rounded-2xl bg-brand-50 border border-brand-100 flex items-center justify-center text-brand-600">
              <Wallet className="h-5 w-5" />
            </span>
            My billing
          </span>
        }
        description="Your monthly parking activity and billing"
        actions={
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="h-11 rounded-2xl border border-surface-200 bg-surface-0 px-3 text-sm shadow-soft focus:outline-none focus:ring-4 focus:ring-brand-100 focus:border-brand-500"
          />
        }
      />

      {/* Explanation of how billing works */}
      <div className="rounded-2xl bg-info-50 border border-info-100 p-4 flex items-start gap-3">
        <Info className="h-5 w-5 text-info-600 shrink-0 mt-0.5" />
        <div className="text-sm text-info-600">
          <p className="font-semibold">How your bill is calculated</p>
          <p className="mt-0.5">
            {data
              ? `Each started parking hour is charged at ${money(
                  data.currency,
                  data.rates.hourly_rate
                )}. Hours beyond your standard limit are shown as extensions. Every late return adds a ${money(
                  data.currency,
                  data.rates.late_fine
                )} fine, and a fixed ${money(
                  data.currency,
                  data.rates.subscription_fee
                )} monthly subscription fee applies. Totals reset at the start of every month.`
              : 'Each started parking hour is billed at a fixed rate; extensions, late fines and a monthly subscription fee are added on top. Totals reset every month.'}
          </p>
        </div>
      </div>

      {isLoading || !data ? (
        <div className="space-y-6">
          <StatStripSkeleton count={3} />
          <CardSkeleton lines={6} />
        </div>
      ) : (
        <>
          {/* Activity tiles */}
          <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatTile
              icon={Car}
              label="Parkings"
              value={String(data.total_parkings)}
              tone="brand"
            />
            <StatTile
              icon={Clock}
              label="Total hours"
              value={`${data.total_hours.toFixed(1)}h`}
            />
            <StatTile
              icon={AlarmClockOff}
              label="Late returns"
              value={String(data.late_count)}
              tone={data.late_count > 0 ? 'danger' : 'success'}
            />
          </section>

          {/* Where your money goes — cost breakdown donut */}
          {(() => {
            const slices = [
              { key: 'parking', label: 'Parking', value: data.parking_cost, color: COST_COLORS.parking },
              { key: 'extension', label: 'Extensions', value: data.extension_cost, color: COST_COLORS.extension },
              { key: 'late', label: 'Late fines', value: data.late_fines, color: COST_COLORS.late },
              { key: 'subscription', label: 'Subscription', value: data.subscription_fee, color: COST_COLORS.subscription },
            ].filter((s) => s.value > 0);
            const total = slices.reduce((sum, s) => sum + s.value, 0);

            return (
              <Card variant="default" padding="xl">
                <div className="flex items-center gap-2 mb-4">
                  <PieChartIcon className="h-5 w-5 text-ink-500" />
                  <h2 className="font-display text-lg font-semibold text-ink-900">
                    Where your money goes
                  </h2>
                </div>

                {total === 0 ? (
                  <p className="text-sm text-ink-500 py-8 text-center">
                    No charges yet this month — nothing to break down.
                  </p>
                ) : (
                  <div className="flex flex-col sm:flex-row items-center gap-6">
                    <div className="relative h-52 w-52 shrink-0">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={slices}
                            dataKey="value"
                            nameKey="label"
                            cx="50%"
                            cy="50%"
                            innerRadius={58}
                            outerRadius={84}
                            paddingAngle={2}
                            stroke="none"
                          >
                            {slices.map((s) => (
                              <Cell key={s.key} fill={s.color} />
                            ))}
                          </Pie>
                          <Tooltip
                            contentStyle={tooltipStyle}
                            formatter={(v) => money(data.currency, Number(v))}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <span className="text-[11px] uppercase tracking-[0.08em] font-semibold text-ink-500">
                          Total
                        </span>
                        <span className="font-display text-2xl font-bold tabular text-ink-900">
                          {money(data.currency, total)}
                        </span>
                      </div>
                    </div>

                    {/* Legend with share of total */}
                    <ul className="flex-1 w-full space-y-2.5">
                      {slices.map((s) => (
                        <li
                          key={s.key}
                          className="flex items-center justify-between gap-3"
                        >
                          <span className="flex items-center gap-2.5 min-w-0">
                            <span
                              className="h-3 w-3 rounded-full shrink-0"
                              style={{ backgroundColor: s.color }}
                            />
                            <span className="text-sm font-semibold text-ink-800 truncate">
                              {s.label}
                            </span>
                          </span>
                          <span className="flex items-center gap-2 shrink-0">
                            <span className="text-xs text-ink-500 tabular">
                              {Math.round((s.value / total) * 100)}%
                            </span>
                            <span className="text-sm font-semibold text-ink-900 tabular">
                              {money(data.currency, s.value)}
                            </span>
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </Card>
            );
          })()}

          {/* Itemised bill */}
          <Card variant="default" padding="xl">
            <div className="flex items-center gap-2 mb-2">
              <Receipt className="h-5 w-5 text-ink-500" />
              <h2 className="font-display text-lg font-semibold text-ink-900">
                Billing summary · {format(new Date(`${month}-01`), 'MMMM yyyy')}
              </h2>
            </div>

            <BillRow
              icon={Car}
              label="Parking cost"
              detail={`${data.total_parkings} parkings · ${money(
                data.currency,
                data.rates.hourly_rate
              )} / hour`}
              amount={money(data.currency, data.parking_cost)}
            />
            <BillRow
              icon={ArrowUpRight}
              label="Extension cost"
              detail="Hours beyond your standard limit"
              amount={money(data.currency, data.extension_cost)}
            />
            <BillRow
              icon={AlarmClockOff}
              label="Late fines"
              detail={`${data.late_count} × ${money(
                data.currency,
                data.rates.late_fine
              )}`}
              amount={money(data.currency, data.late_fines)}
            />
            <BillRow
              icon={BadgeCheck}
              label="Subscription fee"
              detail="Fixed monthly membership"
              amount={money(data.currency, data.subscription_fee)}
            />
            <BillRow
              icon={Receipt}
              label="Total due"
              amount={money(data.currency, data.total_due)}
              strong
            />
          </Card>
        </>
      )}
    </div>
  );
}
