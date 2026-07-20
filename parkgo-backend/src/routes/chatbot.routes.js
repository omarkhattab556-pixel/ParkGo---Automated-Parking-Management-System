import { Router } from 'express';
import { z } from 'zod';

import {
  sendMessage,
  getHistory,
  deleteHistory,
} from '../controllers/chatbot.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { rateLimit } from '../middleware/rateLimit.middleware.js';

const router = Router();

// Only the new message is accepted. Conversation history lives server-side,
// keyed by user + role, so it cannot be forged by the client.
const chatSchema = z.object({
  message: z.string().min(1, 'message is required').max(2000, 'message too long'),
});

// Available to every authenticated role — only `authenticate`, no requireRole.
router.post(
  '/',
  authenticate,
  rateLimit({ max: 20, windowMs: 60_000 }),
  validate(chatSchema),
  sendMessage
);

router.get('/history', authenticate, getHistory);
router.delete('/history', authenticate, deleteHistory);

export default router;
