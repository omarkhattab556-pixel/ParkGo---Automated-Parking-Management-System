import api from './axios';
import type { Reservation } from '@/types';

export interface AvailabilityResult {
  ok: boolean;
  reason?: string;
  totalSpaces?: number;
  occupiedAtWindow?: number;
  freeAtWindow?: number;
  freePercent?: number;
  minFreePercent?: number;
}

export interface CreateReservationResult {
  reservation: Reservation;
  confirmation_code: number;
  space_number: number;
  reservation_start: string;
  reservation_end: string;
}

export const reservationApi = {
  create: async (reservation_start: string): Promise<CreateReservationResult> => {
    const { data } = await api.post<CreateReservationResult>('/reservations', {
      reservation_start,
    });
    return data;
  },

  checkAvailability: async (reservation_start: string): Promise<AvailabilityResult> => {
    const { data } = await api.post<AvailabilityResult>(
      '/reservations/check-availability',
      { reservation_start }
    );
    return data;
  },

  my: async (): Promise<Reservation[]> => {
    const { data } = await api.get<Reservation[]>('/reservations/my');
    return data;
  },

  cancel: async (id: number): Promise<Reservation> => {
    const { data } = await api.patch<Reservation>(`/reservations/${id}/cancel`);
    return data;
  },
};
