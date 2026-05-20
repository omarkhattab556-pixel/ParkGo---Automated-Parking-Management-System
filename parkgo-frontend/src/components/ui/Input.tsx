import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  icon?: ReactNode;
  rightAdornment?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    { className, label, error, hint, icon, rightAdornment, id, ...props },
    ref
  ) => {
    const inputId = id || props.name;
    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-[13px] font-semibold text-ink-700 mb-1.5"
          >
            {label}
          </label>
        )}
        <div className="relative group">
          {icon && (
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400 pointer-events-none transition-colors group-focus-within:text-brand-600">
              {icon}
            </span>
          )}
          <input
            id={inputId}
            ref={ref}
            className={cn(
              'h-12 w-full rounded-2xl border bg-surface-0 px-4 text-sm text-ink-900',
              'shadow-soft transition-all duration-200',
              'placeholder:text-ink-400',
              'focus:outline-none focus:ring-4 focus:ring-brand-100 focus:border-brand-500',
              'hover:border-ink-200',
              icon && 'pl-11',
              rightAdornment && 'pr-11',
              error
                ? 'border-danger-300 focus:ring-danger-100 focus:border-danger-500'
                : 'border-surface-200',
              className
            )}
            {...props}
          />
          {rightAdornment && (
            <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-400">
              {rightAdornment}
            </span>
          )}
        </div>
        {error ? (
          <p className="mt-1.5 text-xs font-medium text-danger-600 flex items-center gap-1">
            <span className="inline-block w-1 h-1 rounded-full bg-danger-500" />
            {error}
          </p>
        ) : hint ? (
          <p className="mt-1.5 text-xs text-ink-500">{hint}</p>
        ) : null}
      </div>
    );
  }
);
Input.displayName = 'Input';
