import { Router } from 'express';
import {
  occupancyReport,
  behaviorReport,
  reservationsReport,
  revenueReport,
  financialReport,
  getExpenses,
  patchExpenses,
  myBilling,
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
router.get('/revenue', authenticate, requireRole('manager'), revenueReport);
router.get('/financial', authenticate, requireRole('manager'), financialReport);
router.get('/expenses', authenticate, requireRole('manager'), getExpenses);
router.patch('/expenses', authenticate, requireRole('manager'), patchExpenses);
router.get(
  '/my-billing',
  authenticate,
  requireRole('subscriber'),
  myBilling
);
router.get(
  '/export/:type',
  authenticate,
  requireRole('manager'),
  exportReport
);

export default router;
