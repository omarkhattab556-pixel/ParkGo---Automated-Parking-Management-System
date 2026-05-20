import { motion } from 'framer-motion';
import { Mail, Copy, Check } from 'lucide-react';
import { useState } from 'react';
import { formatCode } from '@/utils/formatters';
import { cn } from '@/lib/utils';

interface Props {
  code: number | string;
  label?: string;
  hint?: string;
  variant?: 'success' | 'info' | 'brand';
}

export function CodeDisplay({
  code,
  label = 'Your Confirmation Code',
  hint = 'Also sent to your email',
  variant = 'success',
}: Props) {
  const formatted = formatCode(code);
  const digits = formatted.split('');
  const [copied, setCopied] = useState(false);

  const palettes = {
    success: {
      bg: 'from-success-50 via-success-100 to-emerald-100',
      ring: 'ring-success-200',
      label: 'text-success-700',
      code: 'text-success-800',
      hint: 'text-success-700',
      glow: '0 18px 48px -18px rgba(16,185,129,0.4)',
    },
    info: {
      bg: 'from-info-50 via-info-100 to-info-100',
      ring: 'ring-info-200',
      label: 'text-info-600',
      code: 'text-info-700',
      hint: 'text-info-600',
      glow: '0 18px 48px -18px rgba(14,165,233,0.4)',
    },
    brand: {
      bg: 'from-brand-50 via-brand-100 to-brand-100',
      ring: 'ring-brand-200',
      label: 'text-brand-700',
      code: 'text-brand-800',
      hint: 'text-brand-700',
      glow: '0 18px 48px -18px rgba(93,82,247,0.45)',
    },
  } as const;
  const p = palettes[variant];

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(formatted);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* noop */
    }
  };

  return (
    <div
      className={cn(
        'relative rounded-3xl bg-gradient-to-br p-8 text-center ring-2',
        p.bg,
        p.ring
      )}
      style={{ boxShadow: p.glow }}
    >
      <button
        type="button"
        onClick={copy}
        className="absolute top-4 right-4 h-9 w-9 rounded-xl bg-surface-0/80 backdrop-blur border border-surface-200 hover:bg-surface-0 flex items-center justify-center text-ink-600 transition-all"
        aria-label="Copy code"
      >
        {copied ? <Check className="h-4 w-4 text-success-600" /> : <Copy className="h-4 w-4" />}
      </button>
      <p className={cn('text-xs font-bold uppercase tracking-[0.12em] mb-3', p.label)}>
        {label}
      </p>
      <div
        className={cn(
          'font-mono font-bold tracking-[0.25em] mb-4 select-all leading-none',
          'text-5xl sm:text-6xl md:text-[68px]',
          p.code
        )}
      >
        {digits.map((d, i) => (
          <motion.span
            key={`${i}-${d}`}
            initial={{ opacity: 0, y: 20, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{
              delay: i * 0.07,
              type: 'spring',
              stiffness: 220,
              damping: 18,
            }}
            className="inline-block"
          >
            {d}
          </motion.span>
        ))}
      </div>
      <p className={cn('text-xs flex items-center justify-center gap-1.5 font-medium', p.hint)}>
        <Mail className="h-3.5 w-3.5" />
        {hint}
      </p>
    </div>
  );
}
