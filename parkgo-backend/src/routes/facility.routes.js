import { Router } from 'express';
import { z } from 'zod';

import {
  getLoad,
  getStatus,
  getHourly,
  callMaintenance,
  listSpaces,
  addSpace,
  removeSpace,
  listInstallers,
  addInstaller,
  removeInstaller,
} from '../controllers/facility.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/role.middleware.js';
import { validate } from '../middleware/validate.middleware.js';

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

/* ----- Manager CRUD ----- */

const addSpaceSchema = z.object({
  space_number: z.number().int().positive().optional(),
  location: z.string().min(1).max(50).optional(),
});

const addInstallerSchema = z.object({
  installer_name: z.string().min(2).max(50),
});

router.get('/spaces', authenticate, requireRole('manager'), listSpaces);
router.post(
  '/spaces',
  authenticate,
  requireRole('manager'),
  validate(addSpaceSchema),
  addSpace
);
router.delete(
  '/spaces/:num',
  authenticate,
  requireRole('manager'),
  removeSpace
);

router.get('/installers', authenticate, requireRole('manager'), listInstallers);
router.post(
  '/installers',
  authenticate,
  requireRole('manager'),
  validate(addInstallerSchema),
  addInstaller
);
router.delete(
  '/installers/:id',
  authenticate,
  requireRole('manager'),
  removeInstaller
);

export default router;
