import { type LucideIcon } from 'lucide-react';

interface Props {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon: Icon, title, description, action }: Props) {
  return (
    <div className="flex flex-col items-center text-center py-14 px-6 rounded-2xl bg-white border border-dashed border-slate-200">
      <div className="h-14 w-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
        <Icon className="h-7 w-7 text-slate-400" />
      </div>
      <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
      {description && (
        <p className="text-sm text-slate-500 mt-1 max-w-md">{description}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
