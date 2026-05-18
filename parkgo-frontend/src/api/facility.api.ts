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

export const facilityApi = {
  getLoad: async (): Promise<FacilityLoad> => {
    const { data } = await api.get<FacilityLoad>('/facility/load');
    return data;
  },

  getStatus: async (): Promise<FacilityStatus> => {
    const { data } = await api.get<FacilityStatus>('/facility/status');
    return data;
  },
};
