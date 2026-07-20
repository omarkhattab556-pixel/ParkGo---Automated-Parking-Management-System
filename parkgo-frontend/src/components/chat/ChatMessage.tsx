import { cn } from '@/lib/utils';

/** Detect RTL scripts (Hebrew, Arabic) so bilingual replies render correctly. */
export const isRtl = (text: string): boolean =>
  /[֐-׿؀-ۿ܀-ݏ]/.test(text);

interface Props {
  role: 'user' | 'assistant';
  text: string;
  error?: boolean;
}

export function ChatMessage({ role, text, error }: Props) {
  const rtl = isRtl(text);
  const isUser = role === 'user';

  return (
    <div className={cn('flex w-full', isUser ? 'justify-end' : 'justify-start')}>
      <div
        dir={rtl ? 'rtl' : 'ltr'}
        className={cn(
          'max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap break-words',
          isUser
            ? 'bg-gradient-to-br from-brand-500 to-brand-700 text-white rounded-br-md shadow-soft'
            : error
              ? 'bg-danger-50 text-danger-700 border border-danger-200 rounded-bl-md'
              : 'bg-surface-100 text-ink-800 rounded-bl-md'
        )}
      >
        {text}
      </div>
    </div>
  );
}

export default ChatMessage;
