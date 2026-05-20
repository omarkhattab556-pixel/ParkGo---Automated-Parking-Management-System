import { forwardRef, type HTMLAttributes } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-full font-medium border whitespace-nowrap',
  {
    variants: {
      tone: {
        neutral: 'bg-surface-100 text-ink-700 border-surface-200',
        brand: 'bg-brand-50 text-brand-700 border-brand-100',
        accent: 'bg-accent-50 text-accent-700 border-accent-100',
        success: 'bg-success-50 text-success-700 border-success-100',
        danger: 'bg-danger-50 text-danger-700 border-danger-100',
        warning: 'bg-warning-50 text-warning-600 border-warning-100',
        info: 'bg-info-50 text-info-600 border-info-100',
        ink: 'bg-ink-900 text-white border-ink-800',
      },
      size: {
        sm: 'h-5 px-2 text-[10px]',
        md: 'h-6 px-2.5 text-[11px]',
        lg: 'h-7 px-3 text-xs',
      },
      dot: {
        true: 'before:content-[""] before:h-1.5 before:w-1.5 before:rounded-full before:bg-current before:opacity-80',
      },
    },
    defaultVariants: { tone: 'neutral', size: 'md' },
  }
);

export interface BadgeProps
  extends HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, tone, size, dot, ...props }, ref) => (
    <span
      ref={ref}
      className={cn(badgeVariants({ tone, size, dot }), className)}
      {...props}
    />
  )
);
Badge.displayName = 'Badge';
