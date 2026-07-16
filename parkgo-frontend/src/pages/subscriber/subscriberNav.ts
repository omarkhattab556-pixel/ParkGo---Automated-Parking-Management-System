import {
  LayoutDashboard,
  History,
  CalendarClock,
  BarChart3,
  Pencil,
  XCircle,
  User as UserIcon,
} from 'lucide-react';
import type { SidebarItem } from '@/components/layout/Sidebar';

export const subscriberNavItems: SidebarItem[] = [
  { to: '/subscriber', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/subscriber/reservation-history', label: 'My Reservations', icon: CalendarClock },
  { to: '/subscriber/parking-history', label: 'Parking History', icon: History },
  { to: '/subscriber/statistics', label: 'Statistics', icon: BarChart3 },
  { to: '/subscriber/profile', label: 'Profile', icon: UserIcon },
  { to: '/subscriber/cancel-reservation', label: 'Cancel Reservation', icon: XCircle },
  { to: '/subscriber/update-details', label: 'Update Details', icon: Pencil },
];
