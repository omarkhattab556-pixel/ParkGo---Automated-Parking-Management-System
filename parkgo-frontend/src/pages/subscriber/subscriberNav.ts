import {
  LayoutDashboard,
  History,
  CalendarClock,
  BarChart3,
  Pencil,
  XCircle,
} from 'lucide-react';
import type { SidebarItem } from '@/components/layout/Sidebar';

// Note: "Profile" is intentionally not listed here — it is reached via the
// user name/email block at the bottom of the sidebar (see DashboardLayout
// `profileTo`).
export const subscriberNavItems: SidebarItem[] = [
  { to: '/subscriber', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/subscriber/reservation-history', label: 'My Reservations', icon: CalendarClock },
  { to: '/subscriber/parking-history', label: 'Parking History', icon: History },
  { to: '/subscriber/statistics', label: 'Statistics', icon: BarChart3 },
  { to: '/subscriber/cancel-reservation', label: 'Cancel Reservation', icon: XCircle },
  { to: '/subscriber/update-details', label: 'Update Details', icon: Pencil },
];
