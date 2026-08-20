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

/**
 * Reservation routes mounted by `server.js` at `/api/reservations`.
 * Creation and availability checks are subscriber-only, personal history is
 * scoped to the caller, and the staff listing is limited to attendants and
 * managers.
 */
const router = Router();

/**
 * Shape validation only. Reservation timing and capacity business rules are
 * evaluated by the controller/service so availability checks can explain why a
 * syntactically valid timestamp cannot be accepted.
 */
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
// Cancellation intentionally uses authentication only: the controller loads
// the reservation and authorizes either its owner or an attendant/manager.
router.patch('/:id/cancel', authenticate, cancelReservation);

export default router;
