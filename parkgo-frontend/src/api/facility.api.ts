import api from './axios';
import type { Installer } from '@/types';

export interface FacilityLoad {
  total: number;
  occupied: number;
  reserved: number;
  free: number;
  occupancy_percent: number;
}

export interface FacilityStatus {
  installers: {
    installers: Installer[];
    total: number;
    free: number;
    busy: number;
  };
  spaces: {
    total: number;
    occupied: number;
    free: number;
  };
}

export interface HourlyPoint {
  hour: string; // ISO
  occupied: number;
  total: number;
  occupancy_percent: number;
}

export interface MaintenanceCallResult {
  success: true;
  called_at: string;
  called_by: string;
  technician_phone: string;
}

export const facilityApi = {
  getLoad: async (): Promise<FacilityLoad> => {
    const { data } = await api.get<FacilityLoad>('/facility/load');
    return data;
  },

  getStatus: async (): Promise<FacilityStatus> => {
    const { data } = await api.get<FacilityStatus>('/facility/status');
    return data;
  },

  getHourly: async (hours = 24): Promise<HourlyPoint[]> => {
    const { data } = await api.get<HourlyPoint[]>('/facility/hourly', {
      params: { hours },
    });
    return data;
  },

  callMaintenance: async (): Promise<MaintenanceCallResult> => {
    const { data } = await api.post<MaintenanceCallResult>('/facility/maintenance');
    return data;
  },
};
