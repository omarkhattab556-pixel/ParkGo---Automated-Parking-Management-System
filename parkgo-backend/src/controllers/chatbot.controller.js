import { GEMINI } from '../config/constants.js';
import { runChat } from '../services/chatbot/chatbot.service.js';
import {
  loadHistory,
  saveExchange,
  clearHistory,
  UI_HISTORY_LIMIT,
} from '../services/chatbot/chatbot.history.js';

/**
 * POST /api/chat
 * Body: { message: string }
 * Auth: any authenticated user (subscriber | attendant | manager).
 *
 * The conversation history is loaded from the database, scoped to this user
 * and their role — it is never taken from the request body, so a client cannot
 * forge prior assistant turns to steer the model.
 */
export const sendMessage = async (req, res, next) => {
  try {
    if (!GEMINI.ENABLED) {
      return res.status(503).json({
        error: 'The assistant is not configured on this server.',
        code: 'CHATBOT_DISABLED',
      });
    }

    const { message } = req.body;

    const history = await loadHistory(req.user.id, req.user.user_type);

    const { reply, actionSuggestion } = await runChat({
      user: req.user,
      history,
      message,
    });

    // Persist the exchange; failures are logged, not surfaced.
    await saveExchange(req.user, message, reply, actionSuggestion?.type || null);

    return res.json({ reply, actionSuggestion });
  } catch (err) {
    if (!err.status) err.status = 502;
    if (!err.message) err.message = 'The assistant is temporarily unavailable.';
    return next(err);
  }
};

/**
 * GET /api/chat/history
 * The signed-in user's own conversation (their role only).
 */
export const getHistory = async (req, res, next) => {
  try {
    const rows = await loadHistory(
      req.user.id,
      req.user.user_type,
      UI_HISTORY_LIMIT
    );
    return res.json(
      rows.map((r) => ({
        role: r.role,
        text: r.content,
        created_at: r.created_at,
      }))
    );
  } catch (err) {
    return next(err);
  }
};

/**
 * DELETE /api/chat/history
 * Clears only the signed-in user's own conversation.
 */
export const deleteHistory = async (req, res, next) => {
  try {
    await clearHistory(req.user.id, req.user.user_type);
    return res.json({ success: true });
  } catch (err) {
    return next(err);
  }
};

export default sendMessage;
