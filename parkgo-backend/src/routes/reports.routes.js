import { Router } from 'express';
import {
  occupancyReport,
  behaviorReport,
  reservationsReport,
  exportReport,
} from '../controllers/reports.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/role.middleware.js';

const router = Router();

router.get('/occupancy', authenticate, requireRole('manager'), occupancyReport);
router.get('/behavior', authenticate, requireRole('manager'), behaviorReport);
router.get(
  '/reservations',
  authenticate,
  requireRole('manager'),
  reservationsReport
);
router.get(
  '/export/:type',
  authenticate,
  requireRole('manager'),
  exportReport
);

export default router;
