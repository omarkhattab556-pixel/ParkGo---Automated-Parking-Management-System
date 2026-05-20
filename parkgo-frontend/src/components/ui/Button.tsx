import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  [
    'relative inline-flex items-center justify-center gap-2 rounded-2xl font-semibold whitespace-nowrap',
    'transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)]',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2',
    'disabled:opacity-50 disabled:pointer-events-none no-tap-highlight select-none',
  ],
  {
    variants: {
      variant: {
        primary: [
          'text-white bg-gradient-to-br from-brand-500 to-brand-700',
          'shadow-[0_8px_24px_-8px_rgba(93,82,247,0.55)]',
          'hover:shadow-[0_14px_36px_-10px_rgba(93,82,247,0.7)] hover:-translate-y-0.5',
          'active:translate-y-0 active:shadow-[0_4px_12px_-4px_rgba(93,82,247,0.5)]',
        ],
        secondary: [
          'text-ink-800 bg-surface-0 border border-surface-200',
          'shadow-soft hover:bg-surface-50 hover:border-surface-300',
        ],
        ghost: 'text-ink-700 hover:bg-surface-100',
        outline:
          'text-ink-800 border border-ink-200 hover:bg-surface-100 hover:border-ink-400',
        danger: [
          'text-white bg-gradient-to-br from-danger-500 to-danger-700',
          'shadow-[0_8px_24px_-8px_rgba(244,63,94,0.5)] hover:shadow-[0_14px_36px_-10px_rgba(244,63,94,0.6)] hover:-translate-y-0.5',
        ],
        success: [
          'text-white bg-gradient-to-br from-success-500 to-success-700',
          'shadow-[0_8px_24px_-8px_rgba(16,185,129,0.5)] hover:shadow-[0_14px_36px_-10px_rgba(16,185,129,0.6)] hover:-translate-y-0.5',
        ],
        accent: [
          'text-white bg-gradient-to-br from-accent-500 to-accent-700',
          'shadow-[0_8px_24px_-8px_rgba(249,115,22,0.5)] hover:shadow-[0_14px_36px_-10px_rgba(249,115,22,0.6)] hover:-translate-y-0.5',
        ],
        glass: [
          'glass text-ink-800 hover:bg-white/85',
        ],
      },
      size: {
        sm: 'h-9 px-3.5 text-xs',
        md: 'h-11 px-5 text-sm',
        lg: 'h-13 px-7 text-[15px]',
        xl: 'h-15 px-8 text-base',
        icon: 'h-10 w-10',
      },
      fullWidth: { true: 'w-full' },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  }
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, fullWidth, loading, children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(buttonVariants({ variant, size, fullWidth }), className)}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <svg
            className="h-4 w-4 animate-spin"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 0 1 8-8v4a4 4 0 0 0-4 4H4z"
            />
          </svg>
        )}
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';
