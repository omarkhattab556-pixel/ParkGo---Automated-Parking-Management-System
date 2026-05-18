import api from './axios';
import type { Subscriber, User } from '@/types';

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
};
