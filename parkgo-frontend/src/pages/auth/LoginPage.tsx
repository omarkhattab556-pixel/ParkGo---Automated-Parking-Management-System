import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, ArrowRight, ShieldCheck, Sparkles, Zap } from 'lucide-react';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { ParkGoMark } from '@/components/layout/ParkGoMark';
import { ParkingLot3D, type ParkingSpot3D } from '@/components/3d/ParkingLot3D';
import { loginSchema, type LoginInput } from '@/utils/validators';
import { useLogin } from '@/hooks/useAuth';
import { useAuthStore } from '@/store/authStore';
import { ROLE_LANDING, APP_NAME } from '@/utils/constants';

export function LoginPage() {
  const { isAuthenticated, user } = useAuthStore();
  const login = useLogin();

  const {
    register,
    handleSubmit,
    setFocus,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  useEffect(() => {
    setFocus('email');
  }, [setFocus]);

  // Decorative 3D scene — random spot states for visual richness
  const demoSpots = useMemo<ParkingSpot3D[]>(() => {
    const total = 40;
    return Array.from({ length: total }, (_, i) => {
      const r = (i * 9301 + 49297) % 233280;
      const v = (r / 233280) * 10;
      return {
        space_number: i + 1,
        is_occupied: v < 5,
        is_reserved: v >= 5 && v < 6.5,
        is_mine: i === 12,
      };
    });
  }, []);

  if (isAuthenticated && user) {
    return <Navigate to={ROLE_LANDING[user.user_type] || '/'} replace />;
  }

  const onSubmit = (values: LoginInput) => login.mutate(values);

  return (
    <div className="min-h-screen w-full bg-aurora-soft relative overflow-hidden">
      {/* Ambient blobs */}
      <div
        aria-hidden
        className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-brand-400/30 blur-[120px]"
      />
      <div
        aria-hidden
        className="absolute top-1/3 -right-32 h-96 w-96 rounded-full bg-accent-400/25 blur-[120px]"
      />

      <div className="relative grid lg:grid-cols-2 min-h-screen">
        {/* LEFT: Auth form */}
        <div className="flex items-center justify-center p-6 md:p-10">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-md"
          >
            <div className="flex items-center gap-3 mb-10">
              <ParkGoMark size={48} />
              <div>
                <p className="font-display text-xl font-bold text-ink-900 tracking-tight leading-none">
                  {APP_NAME}
                </p>
                <p className="text-xs text-ink-500 mt-1">Automated parking, reimagined.</p>
              </div>
            </div>

            <div className="mb-7">
              <Badge tone="brand" dot size="lg" className="mb-4">
                Welcome back
              </Badge>
              <h1 className="font-display text-3xl md:text-[40px] font-bold text-ink-900 tracking-tight leading-[1.05] text-balance">
                Sign in to your <span className="text-gradient-brand">ParkGo</span> account
              </h1>
              <p className="text-[15px] text-ink-500 mt-3">
                Reserve, drop off and retrieve your vehicle — all without leaving your seat.
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5" noValidate>
              <Input
                type="email"
                label="Email"
                placeholder="you@example.com"
                autoComplete="email"
                icon={<Mail className="h-4 w-4" />}
                error={errors.email?.message}
                {...register('email')}
              />

              <Input
                type="password"
                label="Password"
                placeholder="••••••••"
                autoComplete="current-password"
                icon={<Lock className="h-4 w-4" />}
                error={errors.password?.message}
                {...register('password')}
              />

              <Button
                type="submit"
                fullWidth
                size="lg"
                loading={login.isPending}
                className="mt-3"
              >
                {login.isPending ? 'Signing in…' : 'Sign in'}
                {!login.isPending && <ArrowRight className="h-4 w-4" />}
              </Button>
            </form>

            <div className="mt-7 pt-6 border-t border-surface-200">
              <p className="text-xs text-center text-ink-500 flex items-center justify-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-success-600" />
                Subscribers are registered by an attendant on-site.
              </p>
            </div>

            <p className="text-center text-xs text-ink-400 mt-10">
              © {new Date().getFullYear()} {APP_NAME}. All rights reserved.
            </p>
          </motion.div>
        </div>

        {/* RIGHT: 3D hero (desktop only) */}
        <div className="hidden lg:flex relative items-center justify-center p-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full max-w-xl aspect-[5/6] rounded-[2.5rem] overflow-hidden bg-gradient-to-br from-ink-900 via-brand-900 to-ink-900 border border-white/10 shadow-popover"
          >
            <div className="absolute inset-0">
              <ParkingLot3D spots={demoSpots} cols={8} showcase autoRotate />
            </div>

            {/* Floating glass info chips */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              className="absolute top-6 left-6 right-6 flex items-center justify-between"
            >
              <Badge tone="ink" size="lg" className="bg-white/10 text-white border-white/15 backdrop-blur-md">
                <Sparkles className="h-3 w-3" /> Live demo
              </Badge>
              <Badge tone="ink" size="lg" className="bg-white/10 text-white border-white/15 backdrop-blur-md">
                <Zap className="h-3 w-3 text-accent-400" /> Real-time
              </Badge>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.65, duration: 0.5 }}
              className="absolute bottom-6 left-6 right-6 glass-dark rounded-2xl p-4 text-white"
            >
              <p className="text-xs uppercase tracking-wider text-white/60 font-semibold">
                Smart Parking Network
              </p>
              <p className="font-display text-xl font-bold mt-1 leading-tight">
                Reserve a spot from anywhere. <br />
                Your car parks itself.
              </p>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
