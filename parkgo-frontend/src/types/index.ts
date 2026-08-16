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
  /**
   * Spaces are retired (is_active = false), never deleted — historical parking
   * and reservation rows keep referencing them. List endpoints only ever return
   * active spaces, so this is `true` for anything the UI receives.
   */
  is_active?: boolean;
  retired_at?: string | null;
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

export interface Parking {   // זה יהיה בתוך  PROMISE של ה-API
  parking_code: number;
  parking_space: number;
  parking_date: string;
  retrieval_time: string | null;
  confirmation_code: number;
  subscriber_num: number;
  extension_count: number;
  max_time_minutes: number;
}

export const MANUFACTURERS = [
  'ELECTRA',
  'PARKOMAT',
  'PROMOTE',
  'URBAN PARKING',
] as const;

export type Manufacturer = (typeof MANUFACTURERS)[number];

export interface Installer {
  installer_id: number;
  installer_name: string;
  Manufacturer: Manufacturer | null;
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
