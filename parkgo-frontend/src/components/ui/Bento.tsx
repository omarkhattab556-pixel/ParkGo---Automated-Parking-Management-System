import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';
import { motion, type HTMLMotionProps } from 'framer-motion';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

/* ============================================================
   BentoGrid — responsive 12-col grid with rich children variants
   ============================================================ */
export const BentoGrid = forwardRef<
  HTMLDivElement,
  HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'grid grid-cols-2 md:grid-cols-6 lg:grid-cols-12 gap-3 md:gap-4',
      className
    )}
    {...props}
  >
    {children}
  </div>
));
BentoGrid.displayName = 'BentoGrid';

/* ============================================================
   BentoCard — span-aware, animated, tone-aware
   ============================================================ */
const bentoCardVariants = cva(
  'relative overflow-hidden rounded-3xl border transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]',
  {
    variants: {
      tone: {
        surface: 'bg-surface-0 border-surface-200 shadow-card',
        soft: 'bg-surface-100 border-surface-200',
        glass: 'glass',
        ink: 'bg-ink-900 text-white border-ink-800 shadow-elevated',
        brand:
          'text-white border-brand-700 shadow-[0_18px_48px_-18px_rgba(93,82,247,0.55)] bg-gradient-to-br from-brand-500 via-brand-600 to-brand-800',
        accent:
          'text-white border-accent-700 shadow-[0_18px_48px_-18px_rgba(249,115,22,0.5)] bg-gradient-to-br from-accent-400 via-accent-500 to-accent-700',
        success:
          'text-white border-success-700 shadow-[0_18px_48px_-18px_rgba(16,185,129,0.5)] bg-gradient-to-br from-success-400 via-success-500 to-success-700',
        danger:
          'text-white border-danger-700 shadow-[0_18px_48px_-18px_rgba(244,63,94,0.5)] bg-gradient-to-br from-danger-400 via-danger-500 to-danger-700',
        aurora:
          'text-white border-brand-700 shadow-[0_20px_52px_-18px_rgba(93,82,247,0.55)] bg-aurora',
      },
      padding: {
        none: '',
        sm: 'p-4',
        md: 'p-5',
        lg: 'p-6',
        xl: 'p-8',
      },
      interactive: {
        true: 'hover:-translate-y-1 hover:shadow-elevated',
      },
    },
    defaultVariants: { tone: 'surface', padding: 'lg' },
  }
);

export interface BentoCardProps
  extends Omit<HTMLMotionProps<'div'>, 'children'>,
    VariantProps<typeof bentoCardVariants> {
  span?: string;
  rowSpan?: 'row-span-1' | 'row-span-2' | 'row-span-3';
  delay?: number;
  children?: ReactNode;
}

export function BentoCard({
  className,
  tone,
  padding,
  interactive,
  span = 'col-span-2 md:col-span-3 lg:col-span-4',
  rowSpan,
  delay = 0,
  children,
  ...props
}: BentoCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        bentoCardVariants({ tone, padding, interactive }),
        span,
        rowSpan,
        className
      )}
      {...props}
    >
      {children}
    </motion.div>
  );
}
