import { cn } from '@/lib/utils';

interface Props {
  size?: number;
  gradient?: string; // tailwind gradient class
  className?: string;
}

/**
 * ParkGo brand mark — a stylized "P" inside a gradient tile with a small
 * indicator dot. Replaces the generic Car icon for a stronger product identity.
 */
export function ParkGoMark({ size = 40, gradient = 'from-brand-500 to-brand-700', className }: Props) {
  const inner = size * 0.5;
  return (
    <div
      className={cn(
        'relative rounded-2xl flex items-center justify-center text-white shadow-[0_8px_24px_-8px_rgba(93,82,247,0.55)] bg-gradient-to-br',
        gradient,
        className
      )}
      style={{ width: size, height: size }}
      aria-label="ParkGo"
    >
      <svg
        width={inner}
        height={inner}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden
      >
        <path
          d="M6 4h7a5.5 5.5 0 0 1 0 11H9v5H6V4Zm3 3v5h4a2.5 2.5 0 0 0 0-5H9Z"
          fill="currentColor"
        />
      </svg>
      <span
        className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-success-400 ring-2 ring-white/80"
        aria-hidden
      />
    </div>
  );
}
