import { useState, type FormEvent, type KeyboardEvent } from 'react';
import { Send } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  onSend: (text: string) => void;
  disabled?: boolean;
}

export function ChatComposer({ onSend, disabled }: Props) {
  const [value, setValue] = useState('');

  const submit = (e?: FormEvent) => {
    e?.preventDefault();
    const text = value.trim();
    if (!text || disabled) return;
    onSend(text);
    setValue('');
  };

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  return (
    <form
      onSubmit={submit}
      className="flex items-end gap-2 border-t border-surface-200 bg-surface-0 p-2.5"
    >
      <textarea
        rows={1}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder="Ask anything… / שאל אותי כל דבר…"
        disabled={disabled}
        className="flex-1 resize-none max-h-28 rounded-xl bg-surface-100 px-3 py-2 text-sm text-ink-800 placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-brand-400 disabled:opacity-60"
      />
      <button
        type="submit"
        disabled={disabled || !value.trim()}
        aria-label="Send message"
        className={cn(
          'h-10 w-10 shrink-0 rounded-xl flex items-center justify-center text-white transition-all',
          'bg-gradient-to-br from-brand-500 to-brand-700 shadow-soft',
          'disabled:opacity-40 disabled:pointer-events-none hover:-translate-y-0.5'
        )}
      >
        <Send className="h-4 w-4" />
      </button>
    </form>
  );
}

export default ChatComposer;
