import { Router } from 'express';
import { z } from 'zod';

import {
  myProfile,
  updateOwnDetails,
  registerSubscriber,
  listSubscribers,
  listAttendants,
  getSubscriberDetail,
  reactivateSubscriber,
  deactivateSubscriber,
  registerAttendant,
} from '../controllers/subscriber.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/role.middleware.js';
import { validate } from '../middleware/validate.middleware.js';

const router = Router();

const registerSchema = z.object({
  first_name: z.string().min(2).max(50),
  last_name: z.string().min(2).max(50),
  email: z.string().email(),
  phone_number: z
    .string()
    .regex(/^0\d{8,9}$/, 'Israeli phone format (e.g., 0501234567)')
    .optional()
    .or(z.literal('')),
  license_plate: z
    .string()
    .regex(/^\d{2,3}-\d{2,3}-\d{2,3}$/, 'Format: 12-345-67')
    .optional()
    .or(z.literal('')),
  password: z.string().min(8, 'At least 8 characters'),
});

const updateSchema = z.object({
  current_password: z.string().min(6, 'Current password required'),
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
  new_password: z
    .string()
    .min(8, 'At least 8 characters')
    .optional()
    .or(z.literal('')),
});

router.get('/me/profile', authenticate, requireRole('subscriber'), myProfile);

router.post(
  '/',
  authenticate,
  requireRole('attendant'),
  validate(registerSchema),
  registerSubscriber
);

router.get(
  '/',
  authenticate,
  requireRole('attendant', 'manager'),
  listSubscribers
);

// Must be declared before '/:id' so "attendants" isn't captured as an id.
router.get(
  '/attendants',
  authenticate,
  requireRole('manager'),
  listAttendants
);

router.get(
  '/:id',
  authenticate,
  requireRole('attendant', 'manager'),
  getSubscriberDetail
);

router.patch(
  '/:id/reactivate',
  authenticate,
  requireRole('attendant'),
  reactivateSubscriber
);

router.patch(
  '/:id/deactivate',
  authenticate,
  requireRole('manager'),
  deactivateSubscriber
);

const attendantRegisterSchema = z.object({
  first_name: z.string().min(2).max(50),
  last_name: z.string().min(2).max(50),
  email: z.string().email(),
  phone_number: z
    .string()
    .regex(/^0\d{8,9}$/, 'Israeli phone format (e.g., 0501234567)')
    .optional()
    .or(z.literal('')),
  password: z.string().min(8, 'At least 8 characters'),
});

router.post(
  '/attendant',
  authenticate,
  requireRole('manager'),
  validate(attendantRegisterSchema),
  registerAttendant
);

router.patch('/:id', authenticate, validate(updateSchema), updateOwnDetails);

export default router;
