import api from './axios';
import type { Parking, Subscriber, User } from '@/types';

export interface InstallerInfo {
  id: number;
  name: string;
  completes_at: string;
}

export interface DropOffResult {
  success: true;
  parking_code: number;
  space_number: number;
  confirmation_code: number;
  installer: InstallerInfo;
  operation_seconds: number;
  parked_at: string;
  max_time_minutes: number;
  had_reservation: boolean;
}

export interface PickUpResult {
  success: true;
  parking_code: number;
  space_number: number;
  retrieved_at: string;
  installer: InstallerInfo;
  operation_seconds: number;
  elapsed_minutes: number;
  overtime_minutes: number;
}

export interface ExtendResult {
  success: true;
  parking: Parking;
  minutes_added: number;
  remaining_extension_minutes: number;
  /** True when the requested duration was shortened because a reservation
   *  on the same space starts before the requested end time. */
  capped_by_reservation?: boolean;
  next_reservation_start?: string | null;
}

export interface ActiveParking extends Parking {
  user: Pick<User, 'id' | 'first_name' | 'last_name' | 'email' | 'phone_number'> | null;
  subscriber: Pick<Subscriber, 'subscriber_num' | 'license_plate_number' | 'status'> | null;
}

export const parkingApi = {
  dropOff: async (confirmation_code?: number): Promise<DropOffResult> => {
    const body = confirmation_code != null ? { confirmation_code } : {};
    const { data } = await api.post<DropOffResult>('/parking/drop-off', body);
    return data;
  },

  pickUp: async (confirmation_code: number): Promise<PickUpResult> => {
    const { data } = await api.post<PickUpResult>('/parking/pick-up', {
      confirmation_code,
    });
    return data;
  },

  extend: async (parkingCode: number, extra_minutes = 60): Promise<ExtendResult> => {
    const { data } = await api.post<ExtendResult>(
      `/parking/extend/${parkingCode}`,
      { extra_minutes }
    );
    return data;
  },

  lostCode: async (): Promise<{ success: true; message: string; space_number: number }> => {
    const { data } = await api.post('/parking/lost-code');
    return data;
  },

  myHistory: async (): Promise<Parking[]> => {
    const { data } = await api.get<Parking[]>('/parking/my-history');
    return data;
  },

  myActive: async (): Promise<Parking | null> => {
    const { data } = await api.get<Parking | null>('/parking/my-active');
    return data;
  },

  active: async (): Promise<ActiveParking[]> => {
    const { data } = await api.get<ActiveParking[]>('/parking/active');
    return data;
  },
};
