import { Router } from 'express';
import { getLoad, getStatus } from '../controllers/facility.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

router.get('/load', authenticate, getLoad);
router.get('/status', authenticate, getStatus);

export default router;
