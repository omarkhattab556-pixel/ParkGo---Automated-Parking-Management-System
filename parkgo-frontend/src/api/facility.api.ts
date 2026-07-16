import api from './axios';
import type { Installer, ParkingSpace } from '@/types';

export interface SpaceWithStatus extends ParkingSpace {
  in_use: boolean;
  reserved: boolean;
  is_mine?: boolean;
  occupant_name?: string;
  /** Subscriber id of the occupant (staff view only) — links to their profile. */
  occupant_id?: number;
}

export interface AddSpacePayload {
  space_number?: number;
  location?: string;
}

export interface FloorSummary {
  location: string;
  total: number;
  occupied: number;
}

export interface AddFloorPayload {
  location: string;
  spaces: number;
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

  listFloors: async (): Promise<FloorSummary[]> => {
    const { data } = await api.get<FloorSummary[]>('/facility/floors');
    return data;
  },

  addFloor: async (
    payload: AddFloorPayload
  ): Promise<{ location: string; created_count: number; spaces: ParkingSpace[] }> => {
    const { data } = await api.post('/facility/floors', payload);
    return data;
  },

  removeFloor: async (
    location: string
  ): Promise<{ success: true; removed_location: string; removed_spaces: number }> => {
    const { data } = await api.delete(
      `/facility/floors/${encodeURIComponent(location)}`
    );
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
