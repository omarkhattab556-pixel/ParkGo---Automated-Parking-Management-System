import api from './axios';
import type { Parking, Reservation, Subscriber, User } from '@/types';

export interface SubscriberProfile {
  user: User;
  subscriber: Subscriber | null;
  stats: {
    total_parkings: number;
    total_reservations: number;
    active_reservations: number;
    delay_count: number;
    status: 'active' | 'inactive';
  };
}

export interface UpdateDetailsPayload {
  current_password: string;
  license_plate?: string;
  phone_number?: string;
  new_password?: string;
}

export interface RegisterSubscriberPayload {
  first_name: string;
  last_name: string;
  email: string;
  phone_number?: string;
  license_plate?: string;
  password: string;
}

export interface SubscriberListItem extends User {
  subscriber: Subscriber | null;
}

export interface SubscriberDetail {
  user: User;
  subscriber: Subscriber | null;
  reservations: Reservation[];
  parkings: Parking[];
}

export const subscriberApi = {
  myProfile: async (): Promise<SubscriberProfile> => {
    const { data } = await api.get<SubscriberProfile>('/subscribers/me/profile');
    return data;
  },

  updateMyDetails: async (
    id: number,
    payload: UpdateDetailsPayload
  ): Promise<{ success: true; user: User; subscriber: Subscriber }> => {
    const { data } = await api.patch(`/subscribers/${id}`, payload);
    return data;
  },

  register: async (
    payload: RegisterSubscriberPayload
  ): Promise<{ success: true; user: User; subscriber: Subscriber }> => {
    const { data } = await api.post('/subscribers', payload);
    return data;
  },

  list: async (): Promise<SubscriberListItem[]> => {
    const { data } = await api.get<SubscriberListItem[]>('/subscribers');
    return data;
  },

  detail: async (id: number): Promise<SubscriberDetail> => {
    const { data } = await api.get<SubscriberDetail>(`/subscribers/${id}`);
    return data;
  },

  reactivate: async (id: number): Promise<{ success: true; subscriber: Subscriber }> => {
    const { data } = await api.patch(`/subscribers/${id}/reactivate`);
    return data;
  },
};
