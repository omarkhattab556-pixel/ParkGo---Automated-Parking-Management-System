import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const subscriberRegistrationSchema = z.object({
  first_name: z.string().min(2, 'At least 2 characters').max(50),
  last_name: z.string().min(2, 'At least 2 characters').max(50),
  email: z.string().email('Invalid email'),
  phone_number: z
    .string()
    .regex(/^0\d{8,9}$/, 'Israeli phone format (e.g., 0501234567)'),
  license_plate: z
    .string()
    .regex(/^\d{2,3}-\d{2,3}-\d{2,3}$/, 'Format: 12-345-67'),
  password: z.string().min(8, 'At least 8 characters'),
});
export type SubscriberRegistrationInput = z.infer<
  typeof subscriberRegistrationSchema
>;

export const attendantRegistrationSchema = z.object({
  first_name: z.string().min(2, 'At least 2 characters').max(50),
  last_name: z.string().min(2, 'At least 2 characters').max(50),
  email: z.string().email('Invalid email'),
  phone_number: z
    .string()
    .regex(/^0\d{8,9}$/, 'Israeli phone format (e.g., 0501234567)'),
  password: z.string().min(8, 'At least 8 characters'),
});
export type AttendantRegistrationInput = z.infer<
  typeof attendantRegistrationSchema
>;

export const reservationSchema = z.object({
  reservation_start: z
    .string()
    .refine((val) => {
      const start = new Date(val);
      const now = new Date();
      const hours = (start.getTime() - now.getTime()) / 3600000;
      return hours >= 24 && hours <= 168;
    }, 'Reservation must be between 24 hours and 7 days from now'),
});
export type ReservationInput = z.infer<typeof reservationSchema>;

export const updateDetailsSchema = z
  .object({
    license_plate: z
      .string()
      .regex(/^\d{2,3}-\d{2,3}-\d{2,3}$/, 'Format: 12-345-67')
      .optional()
      .or(z.literal('')),
    phone_number: z
      .string()
      .regex(/^0\d{8,9}$/, 'Israeli phone format')
      .optional()
      .or(z.literal('')),
    current_password: z.string().min(6, 'Current password required'),
    new_password: z
      .string()
      .min(8, 'At least 8 characters')
      .optional()
      .or(z.literal('')),
  });
export type UpdateDetailsInput = z.infer<typeof updateDetailsSchema>;

export const confirmationCodeSchema = z.object({
  confirmation_code: z
    .number({ message: 'Code is required' })
    .int()
    .min(100000, 'Must be 6 digits')
    .max(999999, 'Must be 6 digits'),
});
export type ConfirmationCodeInput = z.infer<typeof confirmationCodeSchema>;
