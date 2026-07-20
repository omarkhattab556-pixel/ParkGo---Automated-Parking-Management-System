import { GEMINI } from '../config/constants.js';
import { runChat } from '../services/chatbot/chatbot.service.js';

/**
 * POST /api/chat
 * Body: { message: string, history?: Array<{role, text}> }
 * Auth: any authenticated user (subscriber | attendant | manager).
 * Returns: { reply: string, actionSuggestion: object|null }
 */
export const sendMessage = async (req, res, next) => {
  try {
    if (!GEMINI.ENABLED) {
      return res.status(503).json({
        error: 'The assistant is not configured on this server.',
        code: 'CHATBOT_DISABLED',
      });
    }

    const { message, history } = req.body;

    const { reply, actionSuggestion } = await runChat({
      user: req.user,
      history,
      message,
    });

    return res.json({ reply, actionSuggestion });
  } catch (err) {
    // Surface a friendly message but keep the details for the error handler/log.
    if (!err.status) err.status = 502;
    if (!err.message) err.message = 'The assistant is temporarily unavailable.';
    return next(err);
  }
};

export default sendMessage;
