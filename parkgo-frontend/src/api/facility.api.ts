import api from './axios';
import type { Installer, ParkingSpace } from '@/types';

export interface SpaceWithStatus extends ParkingSpace {
  in_use: boolean;
  reserved: boolean;
}

export interface AddSpacePayload {
  space_number?: number;
  location?: string;
}

export interface AddInstallerPayload {
  installer_name: string;
}

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

  /* Manager CRUD */
  listSpaces: async (): Promise<SpaceWithStatus[]> => {
    const { data } = await api.get<SpaceWithStatus[]>('/facility/spaces');
    return data;
  },

  addSpace: async (payload: AddSpacePayload): Promise<ParkingSpace> => {
    const { data } = await api.post<ParkingSpace>('/facility/spaces', payload);
    return data;
  },

  removeSpace: async (num: number): Promise<{ success: true; removed: number }> => {
    const { data } = await api.delete(`/facility/spaces/${num}`);
    return data;
  },

  listInstallers: async (): Promise<Installer[]> => {
    const { data } = await api.get<Installer[]>('/facility/installers');
    return data;
  },

  addInstaller: async (payload: AddInstallerPayload): Promise<Installer> => {
    const { data } = await api.post<Installer>('/facility/installers', payload);
    return data;
  },

  removeInstaller: async (id: number): Promise<{ success: true; removed: number }> => {
    const { data } = await api.delete(`/facility/installers/${id}`);
    return data;
  },
};
