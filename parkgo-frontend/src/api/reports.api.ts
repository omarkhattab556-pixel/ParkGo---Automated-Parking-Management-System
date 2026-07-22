import api from './axios';
import { API_URL, STORAGE_KEYS } from '@/utils/constants';

export interface OccupancyReport {
  month: string;
  total_spaces: number;
  average_occupancy: number;
  peak_hours_occupancy: number;
  off_peak_occupancy: number;
  daily: { date: string; occupancy: number }[];
  hourly_heatmap: number[];
}

export interface BehaviorReport {
  month: string;
  total_parkings: number;
  average_duration_hours: number;
  distribution: {
    up_to_1h: number;
    between_1_and_4h: number;
    over_4h: number;
  };
  distribution_percent: {
    up_to_1h: number;
    between_1_and_4h: number;
    over_4h: number;
  };
  extension_rate: number;
  late_return_rate: number;
}

export interface ReservationsReport {
  month: string;
  total_reservations: number;
  used_reservations: number;
  cancelled_reservations: number;
  used_percent: number;
  cancelled_percent: number;
  reservation_occupancy_share: number;
  daily: { date: string; count: number }[];
}

export interface PricingRates {
  hourly_rate: number;
  late_fine: number;
  subscription_fee: number;
}

export interface RevenueReport {
  month: string;
  currency: string;
  rates: PricingRates;
  total_revenue: number;
  parking_revenue: number;
  extension_revenue: number;
  late_revenue: number;
  subscription_revenue: number;
  total_late_count: number;
  active_subscribers: number;
  average_per_subscriber: number;
  daily: { date: string; revenue: number }[];
  by_subscriber: {
    subscriber_num: number;
    name: string;
    parkings: number;
    revenue: number;
  }[];
}

export interface BillingStatement {
  month: string;
  currency: string;
  rates: PricingRates;
  total_parkings: number;
  total_hours: number;
  parking_cost: number;
  extension_cost: number;
  late_count: number;
  late_fines: number;
  subscription_fee: number;
  total_due: number;
}

export interface ExpenseConfig {
  guard_salary: number;
  manager_salary: number;
  electricity: number;
  facility_upkeep: number;
  technician_fee: number;
  updated_at: string | null;
}

export interface FinancialReport {
  month: string;
  currency: string;
  expenses: ExpenseConfig;
  total_income: number;
  income_breakdown: {
    parking: number;
    extension: number;
    late: number;
    subscription: number;
  };
  fixed_expenses: {
    guard_salary: number;
    manager_salary: number;
    electricity: number;
    facility_upkeep: number;
    total: number;
  };
  variable_expenses: {
    technician_calls: number;
    technician_fee: number;
    total: number;
  };
  total_expenses: number;
  net_profit: number;
  is_profit: boolean;
  break_even: {
    revenue_per_parking: number;
    standard_hours: number;
    min_parkings: number;
    actual_parkings: number;
  };
  daily_income: { date: string; revenue: number }[];
}

export type ReportType =
  | 'occupancy'
  | 'behavior'
  | 'reservations'
  | 'revenue'
  | 'financial';

export const reportsApi = {
  occupancy: async (month?: string): Promise<OccupancyReport> => {
    const { data } = await api.get<OccupancyReport>('/reports/occupancy', {
      params: month ? { month } : undefined,
    });
    return data;
  },

  behavior: async (month?: string): Promise<BehaviorReport> => {
    const { data } = await api.get<BehaviorReport>('/reports/behavior', {
      params: month ? { month } : undefined,
    });
    return data;
  },

  reservations: async (month?: string): Promise<ReservationsReport> => {
    const { data } = await api.get<ReservationsReport>('/reports/reservations', {
      params: month ? { month } : undefined,
    });
    return data;
  },

  revenue: async (month?: string): Promise<RevenueReport> => {
    const { data } = await api.get<RevenueReport>('/reports/revenue', {
      params: month ? { month } : undefined,
    });
    return data;
  },

  financial: async (month?: string): Promise<FinancialReport> => {
    const { data } = await api.get<FinancialReport>('/reports/financial', {
      params: month ? { month } : undefined,
    });
    return data;
  },

  getExpenses: async (): Promise<ExpenseConfig> => {
    const { data } = await api.get<ExpenseConfig>('/reports/expenses');
    return data;
  },

  updateExpenses: async (
    patch: Partial<Omit<ExpenseConfig, 'updated_at'>>
  ): Promise<ExpenseConfig> => {
    const { data } = await api.patch<ExpenseConfig>('/reports/expenses', patch);
    return data;
  },

  myBilling: async (month?: string): Promise<BillingStatement> => {
    const { data } = await api.get<BillingStatement>('/reports/my-billing', {
      params: month ? { month } : undefined,
    });
    return data;
  },

  /**
   * Triggers a CSV download in the browser. Reads the bearer token from
   * localStorage (same approach as the axios interceptor) and uses fetch
   * directly so we can pipe the blob into an <a download> click.
   */
  exportCsv: async (type: ReportType, month?: string) => {
    let token: string | null = null;
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.AUTH);
      if (raw) token = JSON.parse(raw)?.state?.token ?? null;
    } catch {
      /* no-op */
    }

    const qs = month ? `?month=${encodeURIComponent(month)}` : '';
    const res = await fetch(`${API_URL}/reports/export/${type}${qs}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
    if (!res.ok) {
      let msg = 'Export failed';
      try {
        const body = await res.json();
        msg = body.error || msg;
      } catch {
        /* ignore */
      }
      throw new Error(msg);
    }

    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${type}-${month || 'current'}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  },
};
