import { Router } from 'express';
import {
  getLoad,
  getStatus,
  getHourly,
  callMaintenance,
} from '../controllers/facility.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/role.middleware.js';

const router = Router();

router.get('/load', authenticate, getLoad);
router.get('/status', authenticate, getStatus);
router.get(
  '/hourly',
  authenticate,
  requireRole('attendant', 'manager'),
  getHourly
);
router.post(
  '/maintenance',
  authenticate,
  requireRole('attendant', 'manager'),
  callMaintenance
);

export default router;
