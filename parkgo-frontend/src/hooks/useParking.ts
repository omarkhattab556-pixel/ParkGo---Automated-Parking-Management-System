import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { parkingApi } from '@/api/parking.api';
import { facilityApi } from '@/api/facility.api';
import { reservationApi } from '@/api/reservation.api';

export const useMyActiveParking = () =>
  useQuery({
    queryKey: ['parking', 'my-active'],
    queryFn: () => parkingApi.myActive(),
    refetchInterval: 15_000,
  });

export const useMyParkingHistory = () =>
  useQuery({
    queryKey: ['parking', 'my-history'],
    queryFn: () => parkingApi.myHistory(),
  });

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
      toast.success(`Extended by ${data.minutes_added} minutes`);
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
