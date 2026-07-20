import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { MessageCircle, X, Bot, RotateCcw } from 'lucide-react';

import { useAuthStore } from '@/store/authStore';
import { ChatMessage } from './ChatMessage';
import { ChatComposer } from './ChatComposer';
import { ActionCard } from './ActionCard';
import { SuggestionChips } from './SuggestionChips';
import { useChat } from './useChat';

export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const user = useAuthStore((s) => s.user);
  const { messages, sending, loading, send, markActionDone, reset, bottomRef } =
    useChat(user?.id);

  // Only show for authenticated users (mounted inside DashboardLayout anyway).
  if (!user) return null;

  return (
    <>
      {/* Floating launcher */}
      <motion.button
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', damping: 18, stiffness: 260, delay: 0.2 }}
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? 'Close assistant' : 'Open assistant'}
        className="fixed bottom-5 right-5 z-50 h-14 w-14 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-[0_12px_36px_-8px_rgba(93,82,247,0.6)] flex items-center justify-center hover:-translate-y-0.5 transition-transform"
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={open ? 'close' : 'open'}
            initial={{ rotate: -90, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            exit={{ rotate: 90, opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
          </motion.span>
        </AnimatePresence>
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.96 }}
            transition={{ type: 'spring', damping: 26, stiffness: 260 }}
            className="fixed bottom-24 right-5 z-50 flex h-[min(70vh,560px)] w-[min(92vw,380px)] flex-col overflow-hidden rounded-3xl bg-surface-0 shadow-popover border border-surface-200"
          >
            {/* Header */}
            <div className="flex items-center justify-between bg-gradient-to-br from-brand-500 to-brand-700 px-4 py-3 text-white">
              <div className="flex items-center gap-2.5">
                <span className="h-9 w-9 rounded-xl bg-white/20 flex items-center justify-center">
                  <Bot className="h-5 w-5" />
                </span>
                <div>
                  <p className="font-display font-bold text-sm leading-none">ParkGo Assistant</p>
                  <p className="text-[11px] text-white/80 mt-0.5">Here to help · תמיד כאן לעזור</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {messages.length > 0 && (
                  <button
                    onClick={reset}
                    aria-label="Clear conversation"
                    className="h-8 w-8 rounded-lg hover:bg-white/15 flex items-center justify-center"
                  >
                    <RotateCcw className="h-4 w-4" />
                  </button>
                )}
                <button
                  onClick={() => setOpen(false)}
                  aria-label="Close"
                  className="h-8 w-8 rounded-lg hover:bg-white/15 flex items-center justify-center"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto scrollbar-thin px-3 py-3 space-y-2.5 bg-surface-50">
              {loading && (
                <p className="text-xs text-ink-500 text-center py-2">
                  Loading your conversation…
                </p>
              )}

              {!loading && messages.length === 0 && (
                <div className="mt-2 space-y-3">
                  <p className="text-sm text-ink-600 px-1" dir="auto">
                    שלום {user.first_name}! 👋 אני העוזר של ParkGo. שאל אותי איך להשתמש במערכת,
                    על החניה שלך, ההזמנות או החיוב — בעברית או באנגלית.
                  </p>
                  <SuggestionChips role={user.user_type} onPick={send} />
                </div>
              )}

              {messages.map((m) => (
                <div key={m.id} className="space-y-1.5">
                  <ChatMessage role={m.role} text={m.text} error={m.error} />
                  {m.action && (
                    <ActionCard
                      action={m.action}
                      done={m.actionDone}
                      onDone={() => markActionDone(m.id)}
                    />
                  )}
                </div>
              ))}

              {sending && (
                <div className="flex justify-start">
                  <div className="rounded-2xl rounded-bl-md bg-surface-100 px-3.5 py-3">
                    <span className="flex gap-1">
                      {[0, 1, 2].map((i) => (
                        <motion.span
                          key={i}
                          className="h-1.5 w-1.5 rounded-full bg-ink-400"
                          animate={{ opacity: [0.3, 1, 0.3] }}
                          transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                        />
                      ))}
                    </span>
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            <ChatComposer onSend={send} disabled={sending} />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export default ChatWidget;
