import { useCallback, useEffect, useRef, useState } from 'react';
import { chatApi, type ActionSuggestion } from '@/api/chat.api';

export interface ChatMessageItem {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  action?: ActionSuggestion | null;
  /** Set once an action card has been resolved so it can't be re-triggered. */
  actionDone?: boolean;
  error?: boolean;
}

const uid = () => Math.random().toString(36).slice(2) + Date.now().toString(36);

/**
 * Chat state for the signed-in user.
 *
 * The conversation is owned by the server and scoped to the user + role, so
 * nothing is cached in localStorage/sessionStorage — otherwise a second user
 * signing in on the same browser would see the previous user's conversation.
 * `userId` re-loads the thread whenever the signed-in user changes.
 */
export function useChat(userId: number | undefined) {
  const [messages, setMessages] = useState<ChatMessageItem[]>([]);
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  // Load this user's stored conversation; reset hard when the user changes.
  useEffect(() => {
    let cancelled = false;
    setMessages([]);

    if (!userId) return;

    setLoading(true);
    chatApi
      .history()
      .then((turns) => {
        if (cancelled) return;
        setMessages(
          turns.map((t) => ({ id: uid(), role: t.role, text: t.text }))
        );
      })
      .catch(() => {
        /* history is a nicety — a failure just starts an empty thread */
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [userId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || sending) return;

      setMessages((prev) => [
        ...prev,
        { id: uid(), role: 'user', text: trimmed },
      ]);
      setSending(true);

      try {
        const res = await chatApi.send(trimmed);
        setMessages((prev) => [
          ...prev,
          {
            id: uid(),
            role: 'assistant',
            text: res.reply,
            action: res.actionSuggestion,
          },
        ]);
      } catch (err) {
        const msg =
          (err as { message?: string })?.message ||
          'Something went wrong. Please try again.';
        setMessages((prev) => [
          ...prev,
          { id: uid(), role: 'assistant', text: msg, error: true },
        ]);
      } finally {
        setSending(false);
      }
    },
    [sending]
  );

  const markActionDone = useCallback((id: string) => {
    setMessages((prev) =>
      prev.map((m) => (m.id === id ? { ...m, actionDone: true } : m))
    );
  }, []);

  const reset = useCallback(async () => {
    setMessages([]);
    try {
      await chatApi.clear();
    } catch {
      /* the thread is already cleared locally */
    }
  }, []);

  return { messages, sending, loading, send, markActionDone, reset, bottomRef };
}

export default useChat;
