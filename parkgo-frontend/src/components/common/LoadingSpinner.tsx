import { cn } from '@/lib/utils';

interface Props {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  fullScreen?: boolean;
  label?: string;
}

export function LoadingSpinner({
  size = 'md',
  className,
  fullScreen,
  label,
}: Props) {
  const sizes = { sm: 'h-4 w-4', md: 'h-8 w-8', lg: 'h-12 w-12' };

  const spinner = (
    <div className="flex flex-col items-center gap-3">
      <span
        className={cn(
          'inline-block rounded-full border-2 border-surface-200 border-t-brand-500 animate-spin',
          sizes[size],
          className
        )}
        role="status"
        aria-label={label || 'Loading'}
      />
      {label && <p className="text-sm text-ink-500">{label}</p>}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-surface-0/80 backdrop-blur-md">
        {spinner}
      </div>
    );
  }
  return <div className="flex items-center justify-center p-8">{spinner}</div>;
}
