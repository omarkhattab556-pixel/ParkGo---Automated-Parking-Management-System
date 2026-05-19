import { NavLink } from 'react-router-dom';
import { Home, CalendarPlus, Car, KeyRound } from 'lucide-react';
import { cn } from '@/lib/utils';

const items = [
  { to: '/subscriber', label: 'Home', icon: Home, end: true },
  { to: '/subscriber/reserve', label: 'Reserve', icon: CalendarPlus },
  { to: '/subscriber/drop-off', label: 'Drop off', icon: Car },
  { to: '/subscriber/pick-up', label: 'Pick up', icon: KeyRound },
];

export function SubscriberBottomBar() {
  return (
    <nav
      aria-label="Quick actions"
      className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-[0_-2px_12px_rgba(0,0,0,0.06)]"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0)' }}
    >
      <ul className="grid grid-cols-4">
        {items.map((item) => (
          <li key={item.to}>
            <NavLink
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  'flex flex-col items-center justify-center gap-1 py-2.5 text-xs font-medium transition-colors',
                  isActive
                    ? 'text-primary-700'
                    : 'text-slate-500 hover:text-slate-900'
                )
              }
            >
              {({ isActive }) => (
                <>
                  <span
                    className={cn(
                      'h-9 w-9 rounded-xl flex items-center justify-center transition-all',
                      isActive
                        ? 'bg-gradient-to-br from-primary-500 to-primary-700 shadow-md shadow-primary-500/30'
                        : 'bg-transparent'
                    )}
                  >
                    <item.icon
                      className={cn(
                        'h-4 w-4',
                        isActive ? 'text-white' : 'text-slate-500'
                      )}
                      strokeWidth={2.2}
                    />
                  </span>
                  <span>{item.label}</span>
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
