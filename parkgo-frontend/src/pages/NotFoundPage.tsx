import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Car, ArrowLeft } from 'lucide-react';

import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/store/authStore';
import { ROLE_LANDING } from '@/utils/constants';

export default function NotFoundPage() {
  const user = useAuthStore((s) => s.user);
  const target = user ? ROLE_LANDING[user.user_type] || '/' : '/login';

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-primary-100 p-6">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md text-center"
      >
        <motion.div
          initial={{ scale: 0.7, rotate: -8 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 180, damping: 12 }}
          className="mx-auto h-24 w-24 rounded-3xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-xl mb-6"
        >
          <Car className="h-12 w-12 text-white" strokeWidth={2.2} />
        </motion.div>

        <p className="text-7xl font-extrabold tracking-tighter bg-clip-text text-transparent bg-gradient-to-br from-primary-600 to-primary-800">
          404
        </p>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight mt-2">
          We can't find that page
        </h1>
        <p className="text-slate-500 mt-2 mb-6">
          The link may be broken, or the page may have moved. Let's get you
          back somewhere useful.
        </p>

        <Link to={target}>
          <Button size="lg">
            <ArrowLeft className="h-5 w-5" />
            {user ? 'Back to dashboard' : 'Back to sign in'}
          </Button>
        </Link>
      </motion.div>
    </div>
  );
}
