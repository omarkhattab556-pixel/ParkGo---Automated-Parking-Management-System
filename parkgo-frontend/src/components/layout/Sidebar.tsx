import { NavLink } from 'react-router-dom';
import { LogOut, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { useLogout } from '@/hooks/useAuth';
import { useAuthStore } from '@/store/authStore';
import { ParkGoMark } from './ParkGoMark';

export interface SidebarItem {
  to: string;
  label: string;
  icon: LucideIcon;
  end?: boolean;
}

interface Props {
  items: SidebarItem[];
  /** Tailwind gradient classes (e.g. "from-brand-500 to-brand-700") */
  brandColor: string;
  roleLabel?: string;
}

export function Sidebar({ items, brandColor, roleLabel }: Props) {
  const user = useAuthStore((s) => s.user);
  const logout = useLogout();

  return (
    <aside
      className="hidden md:flex md:flex-col md:w-60 lg:w-72 shrink-0 h-screen sticky top-0 border-r border-surface-200/80 bg-surface-0/60 backdrop-blur-xl"
    >
      <div className="px-5 py-5 border-b border-surface-200/80">
        <div className="flex items-center gap-3">
          <ParkGoMark size={40} gradient={brandColor} />
          <div className="min-w-0">
            <p className="text-[15px] font-display font-bold text-ink-900 tracking-tight leading-none">
              ParkGo
            </p>
            <p className="text-[11px] font-semibold text-ink-500 uppercase tracking-wider mt-1">
              {roleLabel || user?.user_type}
            </p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 overflow-y-auto scrollbar-thin">
        <ul className="space-y-0.5">
          {items.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  cn(
                    'group relative flex items-center gap-3 px-3 py-2.5 rounded-2xl text-sm font-semibold transition-all duration-200 no-tap-highlight',
                    isActive
                      ? 'text-ink-900 bg-surface-0 shadow-soft border border-surface-200'
                      : 'text-ink-500 hover:text-ink-900 hover:bg-surface-100'
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <span
                      className={cn(
                        'h-8 w-8 shrink-0 rounded-xl flex items-center justify-center transition-all',
                        isActive
                          ? `bg-gradient-to-br ${brandColor} text-white shadow-[0_6px_16px_-6px_rgba(93,82,247,0.55)]`
                          : 'bg-surface-100 text-ink-500 group-hover:bg-surface-200'
                      )}
                    >
                      <item.icon className="h-4 w-4" strokeWidth={2.2} />
                    </span>
                    <span className="truncate">{item.label}</span>
                    {isActive && (
                      <span className="ml-auto h-1.5 w-1.5 rounded-full bg-brand-500" />
                    )}
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className="p-3 border-t border-surface-200/80">
        {user && (
          <div className="flex items-center gap-3 px-2 py-2 mb-2 rounded-2xl">
            <div className="h-9 w-9 rounded-full bg-gradient-to-br from-ink-700 to-ink-900 text-white flex items-center justify-center text-sm font-bold shadow-soft">
              {user.first_name?.[0]?.toUpperCase()}
              {user.last_name?.[0]?.toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-ink-900 truncate leading-tight">
                {user.first_name} {user.last_name}
              </p>
              <p className="text-xs text-ink-500 truncate">{user.email}</p>
            </div>
          </div>
        )}
        <Button
          variant="ghost"
          fullWidth
          onClick={() => logout.mutate()}
          loading={logout.isPending}
          className="justify-start text-ink-600 hover:text-danger-600 hover:bg-danger-50"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </Button>
      </div>
    </aside>
  );
}
