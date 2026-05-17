export type UserType = 'subscriber' | 'attendant' | 'manager';
export type StatusEnum = 'active' | 'inactive';
export type ReservationStatus = 'active' | 'cancelled';

export interface User {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string | null;
  user_type: UserType;
}

export interface Subscriber {
  subscriber_num: number;
  registration_date: string;
  delay_count: number;
  status: StatusEnum;
  license_plate_number: string | null;
}

export interface ParkingSpace {
  space_number: number;
  location: string | null;
  is_occupied: boolean;
}

export interface Reservation {
  reservation_id: number;
  subscriber_num: number;
  parking_space: number;
  reservation_start: string;
  reservation_end: string;
  confirmation_code: number;
  status: ReservationStatus;
  created_at: string;
}

export interface Parking {
  parking_code: number;
  parking_space: number;
  parking_date: string;
  retrieval_time: string | null;
  confirmation_code: number;
  subscriber_num: number;
  extension_count: number;
  max_time_minutes: number;
}

export interface Installer {
  installer_id: number;
  installer_name: string;
  is_free: boolean;
  busy_until: string | null;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface ApiError {
  error: string;
  message?: string;
  details?: unknown;
}
