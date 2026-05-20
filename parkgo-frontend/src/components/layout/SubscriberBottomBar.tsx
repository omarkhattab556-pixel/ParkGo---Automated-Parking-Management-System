import { NavLink } from 'react-router-dom';
import { Home, CalendarPlus, Car, KeyRound } from 'lucide-react';
import { motion } from 'framer-motion';
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
      className="md:hidden fixed bottom-0 inset-x-0 z-30 px-3 pb-3"
      style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 0.75rem)' }}
    >
      <div className="glass rounded-3xl shadow-popover border border-white/60 overflow-hidden">
        <ul className="grid grid-cols-4">
          {items.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                end={item.end}
                className="block"
              >
                {({ isActive }) => (
                  <div
                    className={cn(
                      'flex flex-col items-center justify-center gap-1 py-2.5 text-[11px] font-semibold transition-colors no-tap-highlight',
                      isActive ? 'text-brand-700' : 'text-ink-500'
                    )}
                  >
                    <div className="relative h-9 w-12 flex items-center justify-center">
                      {isActive && (
                        <motion.span
                          layoutId="bottom-bar-pill"
                          className="absolute inset-0 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 shadow-[0_8px_18px_-6px_rgba(93,82,247,0.6)]"
                          transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                        />
                      )}
                      <item.icon
                        className={cn(
                          'h-5 w-5 relative z-10',
                          isActive ? 'text-white' : 'text-ink-500'
                        )}
                        strokeWidth={2.3}
                      />
                    </div>
                    <span>{item.label}</span>
                  </div>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}
