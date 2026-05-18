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

export type ReportType = 'occupancy' | 'behavior' | 'reservations';

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
