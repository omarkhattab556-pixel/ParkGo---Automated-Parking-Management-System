import { motion } from 'framer-motion';
import { LogOut, type LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/store/authStore';
import { useLogout } from '@/hooks/useAuth';

interface Props {
  title: string;
  subtitle: string;
  icon: LucideIcon;
  accent: string;
}

export function PlaceholderDashboard({ title, subtitle, icon: Icon, accent }: Props) {
  const user = useAuthStore((s) => s.user);
  const logout = useLogout();

  return (
    <div className="min-h-screen bg-aurora-soft p-6 md:p-10">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-6xl mx-auto"
      >
        <header className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-4">
            <div
              className={`h-14 w-14 rounded-2xl bg-gradient-to-br ${accent} flex items-center justify-center shadow-elevated`}
            >
              <Icon className="h-7 w-7 text-white" strokeWidth={2.2} />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.12em] font-semibold text-ink-500">
                {subtitle}
              </p>
              <h1 className="font-display text-2xl font-bold text-ink-900 tracking-tight">
                {title}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {user && (
              <div className="text-right hidden sm:block">
                <p className="text-sm font-semibold text-ink-900">
                  {user.first_name} {user.last_name}
                </p>
                <p className="text-xs text-ink-500 capitalize">{user.user_type}</p>
              </div>
            )}
            <Button
              variant="secondary"
              onClick={() => logout.mutate()}
              loading={logout.isPending}
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Sign out</span>
            </Button>
          </div>
        </header>

        <div className="rounded-3xl bg-surface-0 border border-surface-200 p-12 text-center shadow-card">
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 180 }}
            className={`mx-auto h-20 w-20 rounded-3xl bg-gradient-to-br ${accent} flex items-center justify-center shadow-elevated mb-6`}
          >
            <Icon className="h-10 w-10 text-white" strokeWidth={2.2} />
          </motion.div>
          <h2 className="font-display text-3xl font-bold text-ink-900 mb-2">
            Phase 1 & 2 complete
          </h2>
          <p className="text-ink-500 max-w-md mx-auto">
            Authentication is wired up and you reached this {user?.user_type}{' '}
            area. The full module will be built in upcoming phases.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
