import { type LucideIcon } from 'lucide-react';

interface Props {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon: Icon, title, description, action }: Props) {
  return (
    <div className="flex flex-col items-center text-center py-14 px-6 rounded-3xl bg-surface-0 border border-dashed border-surface-300">
      <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-surface-100 to-surface-200 border border-surface-200 flex items-center justify-center mb-4 shadow-soft">
        <Icon className="h-7 w-7 text-ink-400" strokeWidth={2} />
      </div>
      <h3 className="font-display text-lg font-bold text-ink-900">{title}</h3>
      {description && (
        <p className="text-sm text-ink-500 mt-1.5 max-w-md">{description}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
