import { Router } from 'express';
import { z } from 'zod';

import {
  myProfile,
  updateOwnDetails,
} from '../controllers/subscriber.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/role.middleware.js';
import { validate } from '../middleware/validate.middleware.js';

const router = Router();

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
router.patch('/:id', authenticate, validate(updateSchema), updateOwnDetails);

export default router;
