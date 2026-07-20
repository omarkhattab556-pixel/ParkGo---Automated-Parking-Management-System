import supabase from '../../config/supabase.js';

const TABLE = 'chat_message';

/** How many past turns are replayed into the model prompt. */
export const HISTORY_LIMIT = 20;
/** How many turns the UI loads when the widget opens. */
export const UI_HISTORY_LIMIT = 50;

/**
 * Load a user's conversation, scoped to BOTH the user id and their current
 * role. Scoping by user_type as well means that if someone's role ever
 * changes, the conversation they had under the old role is not replayed into
 * the new role's context (which has different data permissions).
 *
 * Returns oldest → newest.
 */
export const loadHistory = async (userId, userType, limit = HISTORY_LIMIT) => {
  const { data, error } = await supabase
    .from(TABLE)
    .select('role, content, action_type, created_at')
    .eq('user_id', userId)
    .eq('user_type', userType)
    .order('created_at', { ascending: false })
    .order('message_id', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data || []).reverse();
};

/**
 * Persist one turn. Never throws into the request path — a history write
 * failure must not break an otherwise-good chat reply.
 */
export const saveTurn = async (userId, userType, role, content, actionType = null) => {
  const { error } = await supabase.from(TABLE).insert({
    user_id: userId,
    user_type: userType,
    role,
    content,
    action_type: actionType,
  });
  if (error) console.error('[chat history] save failed:', error.message);
};

/** Save the user message + assistant reply for one exchange. */
export const saveExchange = async (user, message, reply, actionType = null) => {
  await saveTurn(user.id, user.user_type, 'user', message);
  await saveTurn(user.id, user.user_type, 'assistant', reply, actionType);
};

/** Delete this user's conversation (only their own rows, only their role). */
export const clearHistory = async (userId, userType) => {
  const { error } = await supabase
    .from(TABLE)
    .delete()
    .eq('user_id', userId)
    .eq('user_type', userType);
  if (error) throw error;
};

export default { loadHistory, saveExchange, saveTurn, clearHistory };
