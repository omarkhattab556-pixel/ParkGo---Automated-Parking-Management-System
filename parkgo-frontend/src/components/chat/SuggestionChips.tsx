import type { UserType } from '@/types';

const SUGGESTIONS: Record<UserType, string[]> = {
  subscriber: [
    'איך מזמינים חניה?',
    'כמה זמן נשאר לי בחניה?',
    'מה החיוב שלי החודש?',
    'What are my upcoming reservations?',
  ],
  attendant: [
    'How do I register a new subscriber?',
    'מה מצב התפוסה עכשיו?',
    'How many cars are parked right now?',
  ],
  manager: [
    'What was the revenue this month?',
    'מה אחוז התפוסה הממוצע?',
    'How do I add a new floor?',
  ],
};

interface Props {
  role: UserType;
  onPick: (text: string) => void;
}

export function SuggestionChips({ role, onPick }: Props) {
  const items = SUGGESTIONS[role] || SUGGESTIONS.subscriber;
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((s) => (
        <button
          key={s}
          onClick={() => onPick(s)}
          dir="auto"
          className="rounded-full border border-surface-200 bg-surface-0 px-3 py-1.5 text-xs font-medium text-ink-600 hover:border-brand-300 hover:text-brand-600 transition-colors"
        >
          {s}
        </button>
      ))}
    </div>
  );
}

export default SuggestionChips;
