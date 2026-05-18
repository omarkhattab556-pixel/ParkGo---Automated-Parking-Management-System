import { Router } from 'express';
import { z } from 'zod';

import {
  dropOff,
  pickUp,
  extendParking,
  lostCode,
  myHistory,
  myActiveParking,
  listActiveParkings,
} from '../controllers/parking.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/role.middleware.js';
import { validate } from '../middleware/validate.middleware.js';

const router = Router();

const codeSchema = z.object({
  confirmation_code: z
    .number({ message: 'confirmation_code must be a number' })
    .int()
    .min(100000)
    .max(999999),
});

const dropOffSchema = z.object({
  confirmation_code: z
    .number()
    .int()
    .min(100000)
    .max(999999)
    .optional(),
});

router.post(
  '/drop-off',
  authenticate,
  requireRole('subscriber'),
  validate(dropOffSchema),
  dropOff
);

router.post(
  '/pick-up',
  authenticate,
  requireRole('subscriber'),
  validate(codeSchema),
  pickUp
);

router.post(
  '/extend/:parkingCode',
  authenticate,
  requireRole('subscriber'),
  extendParking
);

router.post(
  '/lost-code',
  authenticate,
  requireRole('subscriber'),
  lostCode
);

router.get('/my-history', authenticate, requireRole('subscriber'), myHistory);
router.get('/my-active', authenticate, requireRole('subscriber'), myActiveParking);
router.get('/active', authenticate, requireRole('attendant', 'manager'), listActiveParkings);

export default router;
