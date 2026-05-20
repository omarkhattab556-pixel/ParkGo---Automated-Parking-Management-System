import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';

import { Button } from '@/components/ui/Button';
import { ParkGoMark } from '@/components/layout/ParkGoMark';
import { useAuthStore } from '@/store/authStore';
import { ROLE_LANDING } from '@/utils/constants';

export default function NotFoundPage() {
  const user = useAuthStore((s) => s.user);
  const target = user ? ROLE_LANDING[user.user_type] || '/' : '/login';

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-aurora-soft p-6 relative overflow-hidden">
      <div aria-hidden className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-brand-400/25 blur-[120px]" />
      <div aria-hidden className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-accent-400/25 blur-[120px]" />
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative w-full max-w-md text-center"
      >
        <motion.div
          initial={{ scale: 0.7, rotate: -8 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 180, damping: 12 }}
          className="mx-auto mb-6 w-fit"
        >
          <ParkGoMark size={72} />
        </motion.div>

        <p className="font-display text-[120px] font-extrabold tracking-tighter leading-none text-gradient-brand">
          404
        </p>
        <h1 className="font-display text-2xl font-bold text-ink-900 tracking-tight mt-2">
          We can't find that page
        </h1>
        <p className="text-ink-500 mt-2 mb-7">
          The link may be broken, or the page may have moved. Let's get you back
          somewhere useful.
        </p>

        <Link to={target} className="inline-block">
          <Button size="lg">
            <ArrowLeft className="h-5 w-5" />
            {user ? 'Back to dashboard' : 'Back to sign in'}
          </Button>
        </Link>
      </motion.div>
    </div>
  );
}
