import { useEffect, useState, type ReactNode } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { Menu, X, LogOut, Bell } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { Sidebar, type SidebarItem } from './Sidebar';
import { ParkGoMark } from './ParkGoMark';
import { ChatWidget } from '@/components/chat/ChatWidget';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';
import { useLogout } from '@/hooks/useAuth';

interface Props {
  items: SidebarItem[];
  brandColor: string;
  roleLabel?: string;
  topBar?: ReactNode;
}

export function DashboardLayout({ items, brandColor, roleLabel, topBar }: Props) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const user = useAuthStore((s) => s.user);
  const logout = useLogout();

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex bg-mesh">
      <Sidebar items={items} brandColor={brandColor} roleLabel={roleLabel} />

      {/* Mobile top bar — glass */}
      <div className="md:hidden fixed top-0 inset-x-0 z-30 h-14 glass border-b border-surface-200/80 flex items-center justify-between px-4">
        <div className="flex items-center gap-2.5">
          <ParkGoMark size={32} gradient={brandColor} />
          <div>
            <p className="font-display font-bold text-ink-900 text-sm leading-none">ParkGo</p>
            <p className="text-[10px] font-semibold text-ink-500 uppercase tracking-wider mt-0.5">
              {roleLabel || user?.user_type}
            </p>
          </div>
        </div>
        <button
          onClick={() => setMobileOpen(true)}
          className="h-10 w-10 rounded-xl text-ink-700 hover:bg-surface-100 flex items-center justify-center"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 z-40 bg-ink-900/50 backdrop-blur-sm md:hidden"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 26, stiffness: 240 }}
              className="fixed left-0 top-0 bottom-0 z-50 w-80 bg-surface-0 shadow-popover md:hidden flex flex-col"
            >
              <div className="px-5 py-4 border-b border-surface-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <ParkGoMark size={36} gradient={brandColor} />
                  <div>
                    <p className="font-display font-bold text-ink-900">ParkGo</p>
                    <p className="text-[11px] font-semibold text-ink-500 uppercase tracking-wider">
                      {roleLabel || user?.user_type}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setMobileOpen(false)}
                  className="h-10 w-10 rounded-xl text-ink-600 hover:bg-surface-100 flex items-center justify-center"
                  aria-label="Close menu"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <nav className="flex-1 px-3 py-4 overflow-y-auto scrollbar-thin">
                <ul className="space-y-0.5">
                  {items.map((item) => (
                    <li key={item.to}>
                      <NavLink
                        to={item.to}
                        end={item.end}
                        onClick={() => setMobileOpen(false)}
                        className={({ isActive }) =>
                          cn(
                            'group flex items-center gap-3 px-3 py-2.5 rounded-2xl text-sm font-semibold transition-all',
                            isActive
                              ? 'text-ink-900 bg-surface-100'
                              : 'text-ink-500 hover:bg-surface-100 hover:text-ink-900'
                          )
                        }
                      >
                        {({ isActive }) => (
                          <>
                            <span
                              className={cn(
                                'h-8 w-8 shrink-0 rounded-xl flex items-center justify-center',
                                isActive
                                  ? `bg-gradient-to-br ${brandColor} text-white shadow-soft`
                                  : 'bg-surface-100 text-ink-500'
                              )}
                            >
                              <item.icon className="h-4 w-4" strokeWidth={2.2} />
                            </span>
                            {item.label}
                          </>
                        )}
                      </NavLink>
                    </li>
                  ))}
                </ul>
              </nav>
              <div className="p-4 border-t border-surface-200">
                {user && (
                  <div className="mb-3">
                    <p className="text-sm font-semibold text-ink-900">
                      {user.first_name} {user.last_name}
                    </p>
                    <p className="text-xs text-ink-500 truncate">{user.email}</p>
                  </div>
                )}
                <Button
                  variant="ghost"
                  fullWidth
                  onClick={() => logout.mutate()}
                  className="justify-start text-ink-600 hover:text-danger-600 hover:bg-danger-50"
                >
                  <LogOut className="h-4 w-4" />
                  Sign out
                </Button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <main className="flex-1 min-w-0 pt-14 md:pt-0">
        {/* Desktop top bar — minimal */}
        <div className="hidden md:flex items-center justify-between sticky top-0 z-20 glass border-b border-surface-200/80 h-14 px-6">
          <div className="flex items-center gap-2 text-sm text-ink-500">
            {topBar}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="relative h-9 w-9 rounded-xl bg-surface-100 hover:bg-surface-200 flex items-center justify-center text-ink-700"
              aria-label="Notifications"
            >
              <Bell className="h-4 w-4" />
              <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-accent-500" />
            </button>
          </div>
        </div>

        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="p-4 md:p-8 max-w-7xl mx-auto"
        >
          <Outlet />
        </motion.div>
      </main>

      {/* ParkGo Assistant — floating on every authenticated screen, all roles */}
      <ChatWidget />
    </div>
  );
}
