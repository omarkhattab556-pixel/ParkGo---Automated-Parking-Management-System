import { motion } from 'framer-motion';
import { Mail } from 'lucide-react';
import { formatCode } from '@/utils/formatters';

interface Props {
  code: number | string;
  label?: string;
  hint?: string;
  variant?: 'success' | 'info';
}

export function CodeDisplay({
  code,
  label = 'Your Confirmation Code',
  hint = 'Also sent to your email',
  variant = 'success',
}: Props) {
  const formatted = formatCode(code);
  const digits = formatted.split('');

  const palettes = {
    success: {
      bg: 'from-emerald-50 to-emerald-100',
      border: 'border-emerald-300',
      label: 'text-emerald-700',
      code: 'text-emerald-900',
      hint: 'text-emerald-700',
    },
    info: {
      bg: 'from-primary-50 to-primary-100',
      border: 'border-primary-300',
      label: 'text-primary-700',
      code: 'text-primary-900',
      hint: 'text-primary-700',
    },
  } as const;
  const p = palettes[variant];

  return (
    <div
      className={`rounded-3xl bg-gradient-to-br ${p.bg} border-2 ${p.border} p-8 text-center shadow-lg`}
    >
      <p className={`text-sm font-semibold ${p.label} mb-3 tracking-wide`}>
        {label}
      </p>
      <div
        className={`text-5xl sm:text-6xl md:text-7xl font-mono font-bold ${p.code} tracking-[0.25em] mb-4 select-all`}
      >
        {digits.map((d, i) => (
          <motion.span
            key={`${i}-${d}`}
            initial={{ opacity: 0, y: 20, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{
              delay: i * 0.08,
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
      <p className={`text-xs ${p.hint} flex items-center justify-center gap-1.5`}>
        <Mail className="h-3.5 w-3.5" />
        {hint}
      </p>
    </div>
  );
}
