import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  PieChart,
  Pie,
  Legend,
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  Receipt,
  ShieldCheck,
  UserCog,
  Zap,
  Wrench,
  Hammer,
  Pencil,
  Check,
  X,
  Target,
} from 'lucide-react';
import toast from 'react-hot-toast';

import { ChartSkeleton, StatStripSkeleton } from '@/components/common/Skeleton';
import { reportsApi, type ExpenseConfig } from '@/api/reports.api';

// Income green / expense red — the two sides of the P&L read at a glance.
const INCOME_COLOR = '#22c55e';
const EXPENSE_COLOR = '#f43f5e';
const FIXED_COLOR = '#5d52f7'; // brand
const VARIABLE_COLOR = '#f59e0b'; // amber

const tooltipStyle = {
  borderRadius: 14,
  border: '1px solid var(--color-surface-200)',
  fontSize: 12,
  boxShadow: '0 8px 28px rgba(13,13,24,0.10)',
};

function money(currency: string, amount: number): string {
  const symbol = currency === 'ILS' ? '₪' : '';
  const sign = amount < 0 ? '-' : '';
  return `${sign}${symbol}${Math.abs(amount).toLocaleString(undefined, {
    maximumFractionDigits: 0,
  })}`;
}

function Stat({
  label,
  value,
  hint,
  accent,
}: {
  label: string;
  value: string;
  hint?: string;
  accent?: string;
}) {
  return (
    <div className="rounded-3xl bg-surface-0 border border-surface-200 p-5 shadow-card">
      <p className="text-[11px] uppercase tracking-[0.08em] text-ink-500 font-semibold">
        {label}
      </p>
      <p
        className="font-display text-3xl font-bold tabular mt-1"
        style={{ color: accent || 'var(--color-ink-900)' }}
      >
        {value}
      </p>
      {hint && <p className="text-xs text-ink-500 mt-1">{hint}</p>}
    </div>
  );
}

// ─── Editable expense line item ─────────────────────────────────────────────
// Each fixed / variable expense the manager may adjust inline.
const EXPENSE_META: {
  key: keyof Omit<ExpenseConfig, 'updated_at'>;
  label: string;
  detail: string;
  icon: typeof ShieldCheck;
}[] = [
  { key: 'guard_salary', label: 'Guard salary', detail: 'Monthly, fixed', icon: ShieldCheck },
  { key: 'manager_salary', label: 'Manager salary', detail: 'Monthly, fixed', icon: UserCog },
  { key: 'electricity', label: 'Electricity', detail: 'Monthly, fixed', icon: Zap },
  { key: 'facility_upkeep', label: 'Facility upkeep', detail: 'Monthly, fixed', icon: Hammer },
  { key: 'technician_fee', label: 'Technician fee', detail: 'Per call, variable', icon: Wrench },
];

function ExpenseRow({
  meta,
  value,
  currency,
  onSave,
}: {
  meta: (typeof EXPENSE_META)[number];
  value: number;
  currency: string;
  onSave: (val: number) => Promise<void>;
}) {
  const Icon = meta.icon;
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(value));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!editing) setDraft(String(value));
  }, [value, editing]);

  const commit = async () => {
    const n = Number(draft);
    if (!Number.isFinite(n) || n < 0) {
      toast.error('Enter a valid non-negative amount');
      return;
    }
    setSaving(true);
    try {
      await onSave(n);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex items-center justify-between gap-3 py-3.5 border-b border-surface-200 last:border-0">
      <div className="flex items-center gap-3 min-w-0">
        <div className="h-9 w-9 rounded-2xl bg-surface-100 border border-surface-200 flex items-center justify-center shrink-0">
          <Icon className="h-4 w-4 text-ink-500" />
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-ink-800 truncate">{meta.label}</p>
          <p className="text-xs text-ink-500 mt-0.5">{meta.detail}</p>
        </div>
      </div>

      {editing ? (
        <div className="flex items-center gap-1.5 shrink-0">
          <input
            autoFocus
            type="number"
            min={0}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commit();
              if (e.key === 'Escape') setEditing(false);
            }}
            className="w-28 h-10 rounded-xl border border-brand-300 bg-surface-0 px-3 text-sm tabular text-right focus:outline-none focus:ring-4 focus:ring-brand-100 focus:border-brand-500"
          />
          <button
            onClick={commit}
            disabled={saving}
            className="h-10 w-10 rounded-xl bg-success-500 text-white flex items-center justify-center hover:bg-success-600 disabled:opacity-50"
            title="Save"
          >
            <Check className="h-4 w-4" />
          </button>
          <button
            onClick={() => setEditing(false)}
            disabled={saving}
            className="h-10 w-10 rounded-xl bg-surface-100 border border-surface-200 text-ink-600 flex items-center justify-center hover:bg-surface-200"
            title="Cancel"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <button
          onClick={() => setEditing(true)}
          className="group flex items-center gap-2 shrink-0 rounded-xl px-2.5 py-1.5 hover:bg-surface-100 transition-colors"
          title="Click to edit"
        >
          <span className="font-display text-lg font-bold text-ink-900 tabular">
            {money(currency, value)}
          </span>
          <Pencil className="h-3.5 w-3.5 text-ink-400 group-hover:text-brand-600" />
        </button>
      )}
    </div>
  );
}

export function FinancialReport({ month }: { month: string }) {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['reports', 'financial', month],
    queryFn: () => reportsApi.financial(month),
  });

  const updateExpense = useMutation({
    mutationFn: (patch: Partial<Omit<ExpenseConfig, 'updated_at'>>) =>
      reportsApi.updateExpenses(patch),
    onSuccess: () => {
      // The expense change ripples into every month's financial report.
      qc.invalidateQueries({ queryKey: ['reports', 'financial'] });
      toast.success('Expense updated');
    },
    onError: (err) => {
      toast.error((err as Error).message || 'Update failed');
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <StatStripSkeleton count={4} />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <ChartSkeleton height={320} />
          <ChartSkeleton height={320} />
        </div>
      </div>
    );
  }
  if (!data) return null;

  const cur = data.currency;
  const profit = data.is_profit;

  // Income vs. expenses comparison bars.
  const ieData = [
    { name: 'Income', value: Math.round(data.total_income), color: INCOME_COLOR },
    {
      name: 'Expenses',
      value: Math.round(data.total_expenses),
      color: EXPENSE_COLOR,
    },
  ];

  // Expense composition (fixed line items + variable).
  const expenseSlices = [
    { name: 'Guard salary', value: data.fixed_expenses.guard_salary, color: FIXED_COLOR },
    { name: 'Manager salary', value: data.fixed_expenses.manager_salary, color: '#7c73f9' },
    { name: 'Electricity', value: data.fixed_expenses.electricity, color: '#a5a0fb' },
    { name: 'Facility upkeep', value: data.fixed_expenses.facility_upkeep, color: '#c4c1fc' },
    { name: 'Technician calls', value: data.variable_expenses.total, color: VARIABLE_COLOR },
  ].filter((s) => s.value > 0);

  const breakEvenGap = data.break_even.min_parkings - data.break_even.actual_parkings;

  return (
    <div className="space-y-6">
      {/* ── PROFIT / LOSS HERO ── */}
      <section
        className={`relative overflow-hidden rounded-3xl border p-6 shadow-card ${
          profit
            ? 'bg-success-50 border-success-200'
            : 'bg-danger-50 border-danger-200'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div
              className={`h-14 w-14 rounded-2xl flex items-center justify-center text-white shrink-0 ${
                profit ? 'bg-success-500' : 'bg-danger-500'
              }`}
            >
              {profit ? (
                <TrendingUp className="h-7 w-7" />
              ) : (
                <TrendingDown className="h-7 w-7" />
              )}
            </div>
            <div>
              <p
                className={`text-[11px] uppercase tracking-[0.1em] font-bold ${
                  profit ? 'text-success-700' : 'text-danger-700'
                }`}
              >
                {profit ? 'Net profit' : 'Net loss'}
              </p>
              <p
                className={`font-display text-4xl font-bold tabular leading-none mt-1 ${
                  profit ? 'text-success-700' : 'text-danger-700'
                }`}
              >
                {money(cur, data.net_profit)}
              </p>
              <p className="text-sm text-ink-600 mt-1.5">
                {money(cur, data.total_income)} income −{' '}
                {money(cur, data.total_expenses)} expenses
              </p>
            </div>
          </div>

          {/* Break-even callout */}
          <div className="rounded-2xl bg-surface-0/80 border border-surface-200 p-4 backdrop-blur-sm sm:max-w-xs">
            <div className="flex items-center gap-2 mb-1">
              <Target className="h-4 w-4 text-ink-500" />
              <p className="text-[11px] uppercase tracking-[0.08em] text-ink-500 font-semibold">
                Break-even point
              </p>
            </div>
            <p className="font-display text-2xl font-bold tabular text-ink-900">
              {data.break_even.min_parkings.toLocaleString()} parkings
            </p>
            <p className="text-xs text-ink-500 mt-1">
              Minimum monthly parkings to cover all expenses (at{' '}
              {money(cur, data.break_even.revenue_per_parking)} each).{' '}
              {breakEvenGap <= 0 ? (
                <span className="text-success-700 font-semibold">
                  Reached — keeping the facility open pays off.
                </span>
              ) : (
                <span className="text-danger-700 font-semibold">
                  {breakEvenGap.toLocaleString()} more needed this month.
                </span>
              )}
            </p>
          </div>
        </div>
      </section>

      {/* ── KPI STRIP ── */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat
          label="Total income"
          value={money(cur, data.total_income)}
          hint="this month"
          accent={INCOME_COLOR}
        />
        <Stat
          label="Fixed expenses"
          value={money(cur, data.fixed_expenses.total)}
          hint="salaries · power · upkeep"
          accent={FIXED_COLOR}
        />
        <Stat
          label="Variable expenses"
          value={money(cur, data.variable_expenses.total)}
          hint={`${data.variable_expenses.technician_calls} technician call${
            data.variable_expenses.technician_calls === 1 ? '' : 's'
          }`}
          accent={VARIABLE_COLOR}
        />
        <Stat
          label="Total expenses"
          value={money(cur, data.total_expenses)}
          hint="fixed + variable"
          accent={EXPENSE_COLOR}
        />
      </section>

      {/* ── CHARTS: income vs expenses + expense composition ── */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="rounded-3xl bg-surface-0 border border-surface-200 p-6 shadow-card">
          <h3 className="font-display text-base font-semibold text-ink-900 mb-3">
            Income vs. expenses
          </h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ieData} margin={{ left: 8, right: 8 }}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="var(--color-surface-200)"
                  vertical={false}
                />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 12, fill: 'var(--color-ink-500)' }}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: 'var(--color-ink-500)' }}
                  width={56}
                  tickFormatter={(v) => money(cur, Number(v))}
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  cursor={{ fill: 'var(--color-surface-100)' }}
                  formatter={(v) => money(cur, Number(v))}
                />
                <Bar dataKey="value" radius={[10, 10, 0, 0]} maxBarSize={120}>
                  {ieData.map((d) => (
                    <Cell key={d.name} fill={d.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-3xl bg-surface-0 border border-surface-200 p-6 shadow-card">
          <h3 className="font-display text-base font-semibold text-ink-900 mb-3">
            Expense breakdown
          </h3>
          {expenseSlices.length === 0 ? (
            <p className="text-sm text-ink-500 py-10 text-center">
              No expenses configured.
            </p>
          ) : (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={expenseSlices}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={58}
                    outerRadius={98}
                    paddingAngle={3}
                    stroke="none"
                  >
                    {expenseSlices.map((s) => (
                      <Cell key={s.name} fill={s.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={tooltipStyle}
                    formatter={(v) => money(cur, Number(v))}
                  />
                  <Legend verticalAlign="bottom" wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </section>

      {/* ── EDITABLE EXPENSES ── */}
      <section className="rounded-3xl bg-surface-0 border border-surface-200 p-6 shadow-card">
        <div className="flex items-center gap-2 mb-1">
          <Wallet className="h-5 w-5 text-ink-500" />
          <h3 className="font-display text-lg font-semibold text-ink-900">
            Monthly expenses — editable
          </h3>
        </div>
        <p className="text-sm text-ink-500 mb-3">
          Click any amount to adjust it. Changes apply facility-wide and update
          the profit calculation instantly.
        </p>

        {EXPENSE_META.map((meta) => (
          <ExpenseRow
            key={meta.key}
            meta={meta}
            currency={cur}
            value={data.expenses[meta.key]}
            onSave={async (val) => {
              await updateExpense.mutateAsync({ [meta.key]: val });
            }}
          />
        ))}

        {/* Variable expense summary line */}
        <div className="mt-4 flex items-center justify-between gap-3 rounded-2xl bg-amber-50 border border-amber-100 px-4 py-3">
          <div className="flex items-center gap-2 text-amber-700">
            <Wrench className="h-4 w-4" />
            <span className="text-sm font-semibold">
              {data.variable_expenses.technician_calls} technician call
              {data.variable_expenses.technician_calls === 1 ? '' : 's'} ×{' '}
              {money(cur, data.variable_expenses.technician_fee)}
            </span>
          </div>
          <span className="font-display text-lg font-bold tabular text-amber-700">
            {money(cur, data.variable_expenses.total)}
          </span>
        </div>
      </section>

      {/* ── ITEMISED P&L ── */}
      <section className="rounded-3xl bg-surface-0 border border-surface-200 p-6 shadow-card">
        <div className="flex items-center gap-2 mb-2">
          <Receipt className="h-5 w-5 text-ink-500" />
          <h3 className="font-display text-lg font-semibold text-ink-900">
            Profit &amp; loss summary
          </h3>
        </div>

        <PLRow label="Total income" amount={money(cur, data.total_income)} tone="income" />
        <PLRow
          label="Fixed expenses"
          detail="Salaries, electricity, upkeep"
          amount={`− ${money(cur, data.fixed_expenses.total)}`}
          tone="expense"
        />
        <PLRow
          label="Variable expenses"
          detail={`${data.variable_expenses.technician_calls} technician calls`}
          amount={`− ${money(cur, data.variable_expenses.total)}`}
          tone="expense"
        />
        <div
          className={`flex items-center justify-between gap-3 pt-4 mt-1 border-t-2 ${
            profit ? 'border-success-200' : 'border-danger-200'
          }`}
        >
          <p className="font-bold text-ink-900">
            {profit ? 'Net profit' : 'Net loss'}
          </p>
          <p
            className={`font-display text-2xl font-bold tabular ${
              profit ? 'text-success-700' : 'text-danger-700'
            }`}
          >
            {money(cur, data.net_profit)}
          </p>
        </div>
      </section>
    </div>
  );
}

function PLRow({
  label,
  detail,
  amount,
  tone,
}: {
  label: string;
  detail?: string;
  amount: string;
  tone: 'income' | 'expense';
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-3.5 border-b border-surface-200 last:border-0">
      <div className="min-w-0">
        <p className="font-semibold text-ink-800 truncate">{label}</p>
        {detail && <p className="text-xs text-ink-500 mt-0.5">{detail}</p>}
      </div>
      <p
        className={`font-semibold tabular shrink-0 ${
          tone === 'income' ? 'text-success-700' : 'text-danger-700'
        }`}
      >
        {amount}
      </p>
    </div>
  );
}
