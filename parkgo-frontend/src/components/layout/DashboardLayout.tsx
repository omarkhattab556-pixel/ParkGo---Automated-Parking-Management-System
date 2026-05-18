import { useEffect, useState, type ReactNode } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { Menu, X, Car, LogOut } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { Sidebar, type SidebarItem } from './Sidebar';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';
import { useLogout } from '@/hooks/useAuth';

interface Props {
  items: SidebarItem[];
  brandColor: string;
  topBar?: ReactNode;
}

export function DashboardLayout({ items, brandColor, topBar }: Props) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const user = useAuthStore((s) => s.user);
  const logout = useLogout();

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex bg-surface-50">
      <Sidebar items={items} brandColor={brandColor} />

      {/* mobile top bar */}
      <div className="md:hidden fixed top-0 inset-x-0 z-30 h-14 bg-white/95 backdrop-blur-md border-b border-slate-100 flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <div className={cn('h-8 w-8 rounded-lg flex items-center justify-center', `bg-gradient-to-br ${brandColor}`)}>
            <Car className="h-4 w-4 text-white" />
          </div>
          <span className="font-bold text-slate-900">ParkGo</span>
        </div>
        <button
          onClick={() => setMobileOpen(true)}
          className="p-2 rounded-lg text-slate-600 hover:bg-slate-100"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm md:hidden"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="fixed left-0 top-0 bottom-0 z-50 w-72 bg-white shadow-2xl md:hidden flex flex-col"
            >
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={cn('h-9 w-9 rounded-xl flex items-center justify-center', `bg-gradient-to-br ${brandColor}`)}>
                    <Car className="h-4 w-4 text-white" />
                  </div>
                  <span className="font-bold text-slate-900">ParkGo</span>
                </div>
                <button
                  onClick={() => setMobileOpen(false)}
                  className="p-2 rounded-lg text-slate-600 hover:bg-slate-100"
                  aria-label="Close menu"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <nav className="flex-1 px-3 py-4 overflow-y-auto">
                <ul className="space-y-1">
                  {items.map((item) => (
                    <li key={item.to}>
                      <NavLink
                        to={item.to}
                        end={item.end}
                        onClick={() => setMobileOpen(false)}
                        className={({ isActive }) =>
                          cn(
                            'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium',
                            isActive
                              ? 'bg-primary-50 text-primary-700'
                              : 'text-slate-600 hover:bg-slate-50'
                          )
                        }
                      >
                        <item.icon className="h-5 w-5" />
                        {item.label}
                      </NavLink>
                    </li>
                  ))}
                </ul>
              </nav>
              <div className="p-4 border-t border-slate-100">
                {user && (
                  <p className="text-sm font-semibold text-slate-900 mb-2">
                    {user.first_name} {user.last_name}
                  </p>
                )}
                <Button
                  variant="ghost"
                  fullWidth
                  onClick={() => logout.mutate()}
                  className="justify-start text-danger-600 hover:bg-danger-50"
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
        {topBar}
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="p-4 md:p-8 max-w-7xl mx-auto"
        >
          <Outlet />
        </motion.div>
      </main>
    </div>
  );
}
