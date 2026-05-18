import { Router } from 'express';
import { z } from 'zod';

import {
  createReservation,
  myReservations,
  listReservations,
  cancelReservation,
  checkAvailability,
} from '../controllers/reservation.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/role.middleware.js';
import { validate } from '../middleware/validate.middleware.js';

const router = Router();

const startSchema = z.object({
  reservation_start: z.string().min(1, 'reservation_start is required'),
});

router.post(
  '/check-availability',
  authenticate,
  requireRole('subscriber'),
  validate(startSchema),
  checkAvailability
);

router.post(
  '/',
  authenticate,
  requireRole('subscriber'),
  validate(startSchema),
  createReservation
);

router.get('/my', authenticate, requireRole('subscriber'), myReservations);
router.get('/', authenticate, requireRole('attendant', 'manager'), listReservations);
router.patch('/:id/cancel', authenticate, cancelReservation);

export default router;
