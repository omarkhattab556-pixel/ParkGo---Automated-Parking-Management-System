import { useCallback, useEffect, useRef, useState } from 'react';
import { chatApi, type ActionSuggestion, type ChatTurn } from '@/api/chat.api';

export interface ChatMessageItem {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  action?: ActionSuggestion | null;
  /** Set once an action card has been resolved so it can't be re-triggered. */
  actionDone?: boolean;
  error?: boolean;
}

const STORAGE_KEY = 'parkgo-chat';
const MAX_STORED = 30;

const uid = () => Math.random().toString(36).slice(2) + Date.now().toString(36);

const load = (): ChatMessageItem[] => {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as ChatMessageItem[];
  } catch {
    /* ignore */
  }
  return [];
};

export function useChat() {
  const [messages, setMessages] = useState<ChatMessageItem[]>(load);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    try {
      sessionStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(messages.slice(-MAX_STORED))
      );
    } catch {
      /* ignore quota */
    }
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || sending) return;

      const userMsg: ChatMessageItem = { id: uid(), role: 'user', text: trimmed };
      setMessages((prev) => [...prev, userMsg]);
      setSending(true);

      // Build history from what we had BEFORE this new message.
      const history: ChatTurn[] = messages
        .slice(-12)
        .map((m) => ({ role: m.role, text: m.text }));

      try {
        const res = await chatApi.send(trimmed, history);
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
    [messages, sending]
  );

  const markActionDone = useCallback((id: string) => {
    setMessages((prev) =>
      prev.map((m) => (m.id === id ? { ...m, actionDone: true } : m))
    );
  }, []);

  const reset = useCallback(() => {
    setMessages([]);
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
  }, []);

  return { messages, sending, send, markActionDone, reset, bottomRef };
}

export default useChat;
