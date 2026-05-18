import { NavLink } from 'react-router-dom';
import { Car, LogOut, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { useLogout } from '@/hooks/useAuth';
import { useAuthStore } from '@/store/authStore';

export interface SidebarItem {
  to: string;
  label: string;
  icon: LucideIcon;
  end?: boolean;
}

interface Props {
  items: SidebarItem[];
  brandColor: string; // tailwind gradient classes
}

export function Sidebar({ items, brandColor }: Props) {
  const user = useAuthStore((s) => s.user);
  const logout = useLogout();

  return (
    <aside className="hidden md:flex md:flex-col md:w-64 lg:w-72 shrink-0 h-screen sticky top-0 border-r border-slate-100 bg-white">
      <div className="px-6 py-6 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className={cn('h-10 w-10 rounded-xl flex items-center justify-center shadow-md', `bg-gradient-to-br ${brandColor}`)}>
            <Car className="h-5 w-5 text-white" strokeWidth={2.4} />
          </div>
          <div>
            <p className="text-lg font-bold text-slate-900 tracking-tight">ParkGo</p>
            <p className="text-xs text-slate-500 capitalize">{user?.user_type}</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 overflow-y-auto scrollbar-thin">
        <ul className="space-y-1">
          {items.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
                    isActive
                      ? 'bg-primary-50 text-primary-700 shadow-sm'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  )
                }
              >
                <item.icon className="h-5 w-5 shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className="px-3 py-4 border-t border-slate-100">
        {user && (
          <div className="px-3 mb-3">
            <p className="text-sm font-semibold text-slate-900 truncate">
              {user.first_name} {user.last_name}
            </p>
            <p className="text-xs text-slate-500 truncate">{user.email}</p>
          </div>
        )}
        <Button
          variant="ghost"
          fullWidth
          onClick={() => logout.mutate()}
          loading={logout.isPending}
          className="justify-start text-slate-600 hover:text-danger-600 hover:bg-danger-50"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </Button>
      </div>
    </aside>
  );
}
