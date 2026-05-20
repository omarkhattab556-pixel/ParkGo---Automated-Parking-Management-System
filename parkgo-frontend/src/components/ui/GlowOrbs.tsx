import { cn } from '@/lib/utils';

/**
 * Decorative ambient orbs / blobs. Used inside dark/aurora bento cards
 * to create depth without adding noise. Aria-hidden, no interaction.
 */
export function GlowOrbs({
  className,
  variant = 'brand',
}: {
  className?: string;
  variant?: 'brand' | 'accent' | 'success' | 'mixed';
}) {
  return (
    <div
      aria-hidden
      className={cn(
        'pointer-events-none absolute inset-0 overflow-hidden',
        className
      )}
    >
      {variant === 'brand' && (
        <>
          <div className="absolute -top-24 -right-20 h-64 w-64 rounded-full bg-brand-400/40 blur-3xl" />
          <div className="absolute -bottom-24 -left-20 h-56 w-56 rounded-full bg-accent-400/30 blur-3xl" />
        </>
      )}
      {variant === 'accent' && (
        <>
          <div className="absolute -top-20 -right-16 h-56 w-56 rounded-full bg-accent-300/50 blur-3xl" />
          <div className="absolute -bottom-20 -left-16 h-48 w-48 rounded-full bg-danger-400/30 blur-3xl" />
        </>
      )}
      {variant === 'success' && (
        <>
          <div className="absolute -top-20 -right-16 h-56 w-56 rounded-full bg-success-300/50 blur-3xl" />
          <div className="absolute -bottom-20 -left-16 h-48 w-48 rounded-full bg-info-400/30 blur-3xl" />
        </>
      )}
      {variant === 'mixed' && (
        <>
          <div className="absolute -top-24 -right-20 h-64 w-64 rounded-full bg-brand-400/35 blur-3xl" />
          <div className="absolute top-10 -left-20 h-48 w-48 rounded-full bg-accent-300/35 blur-3xl" />
          <div className="absolute -bottom-24 right-10 h-56 w-56 rounded-full bg-success-300/30 blur-3xl" />
        </>
      )}
    </div>
  );
}
