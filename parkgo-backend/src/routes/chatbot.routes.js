import { Router } from 'express';
import { z } from 'zod';

import { sendMessage } from '../controllers/chatbot.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { rateLimit } from '../middleware/rateLimit.middleware.js';

const router = Router();

const chatSchema = z.object({
  message: z.string().min(1, 'message is required').max(2000, 'message too long'),
  history: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant', 'model']),
        text: z.string().max(4000),
      })
    )
    .max(40)
    .optional(),
});

// Available to every authenticated role — only `authenticate`, no requireRole.
router.post(
  '/',
  authenticate,
  rateLimit({ max: 20, windowMs: 60_000 }),
  validate(chatSchema),
  sendMessage
);

export default router;
