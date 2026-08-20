/**
 * React Query boundary for parking, reservation, and live facility state.
 *
 * Query-key prefixes are domain boundaries: mutations invalidate a prefix so
 * every dashboard or workflow backed by that domain refreshes together.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { parkingApi } from '@/api/parking.api';
import { facilityApi } from '@/api/facility.api';
import { reservationApi } from '@/api/reservation.api';

/** Poll the signed-in subscriber's active session for time-sensitive UI. */
export const useMyActiveParking = () =>
  useQuery({
    queryKey: ['parking', 'my-active'],
    queryFn: () => parkingApi.myActive(),
    refetchInterval: 15_000,                      // מידע מתרעןן כל 15 שניות
  });

export const useMyParkingHistory = () =>
  useQuery({
    queryKey: ['parking', 'my-history'],
    queryFn: () => parkingApi.myHistory(),
  });

/**
 * Poll the facility load at a caller-selected interval; dashboards can choose
 * their required freshness without duplicating the query contract.
 */
export const useFacilityLoad = (refetchMs = 10_000) =>
  useQuery({
    queryKey: ['facility', 'load'],
    queryFn: () => facilityApi.getLoad(),
    refetchInterval: refetchMs,
    staleTime: 5_000,
  });

export const useMyReservations = () =>
  useQuery({
    queryKey: ['reservations', 'my'],
    queryFn: () => reservationApi.my(),
  });

// Reservation changes also affect capacity, while parking lifecycle changes
// affect both the active/history views and the facility's live availability.
export const useCancelReservation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => reservationApi.cancel(id),
    onSuccess: () => {
      toast.success('Reservation cancelled');
      qc.invalidateQueries({ queryKey: ['reservations'] });
      qc.invalidateQueries({ queryKey: ['facility'] });
    },
    onError: (err: { message?: string; error?: string }) => {
      toast.error(err.error || err.message || 'Could not cancel');
    },
  });
};

export const useDropOff = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (confirmation_code?: number) => parkingApi.dropOff(confirmation_code),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['parking'] });
      qc.invalidateQueries({ queryKey: ['facility'] });
      qc.invalidateQueries({ queryKey: ['reservations'] });
    },
    onError: (err: { message?: string; error?: string }) => {
      toast.error(err.error || err.message || 'Drop off failed');
    },
  });
};

export const usePickUp = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (confirmation_code: number) => parkingApi.pickUp(confirmation_code),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['parking'] });
      qc.invalidateQueries({ queryKey: ['facility'] });
    },
    onError: (err: { message?: string; error?: string }) => {
      toast.error(err.error || err.message || 'Pick up failed');
    },
  });
};

export const useExtendParking = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ parkingCode, minutes }: { parkingCode: number; minutes: number }) =>
      parkingApi.extend(parkingCode, minutes),
    onSuccess: (data) => {
      // The server may shorten an extension to protect the next reservation.
      if (data.capped_by_reservation) {
        toast.success(
          `Shortened to ${data.minutes_added} min — another reservation starts soon on this space.`,
          { duration: 5000 }
        );
      } else {
        toast.success(`Extended by ${data.minutes_added} minutes`);
      }
      qc.invalidateQueries({ queryKey: ['parking'] });
    },
    onError: (err: { message?: string; error?: string }) => {
      toast.error(err.error || err.message || 'Could not extend');
    },
  });
};

export const useLostCode = () => {
  return useMutation({
    mutationFn: () => parkingApi.lostCode(),
    onSuccess: (data) => {
      toast.success(data.message);
    },
    onError: (err: { message?: string; error?: string }) => {
      toast.error(err.error || err.message || 'Could not resend code');
    },
  });
};
