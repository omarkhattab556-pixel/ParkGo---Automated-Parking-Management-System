import {
  LayoutDashboard,
  History,
  CalendarClock,
  Pencil,
  XCircle,
  User as UserIcon,
} from 'lucide-react';
import type { SidebarItem } from '@/components/layout/Sidebar';

export const subscriberNavItems: SidebarItem[] = [
  { to: '/subscriber', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/subscriber/parking-history', label: 'Parking History', icon: History },
  { to: '/subscriber/reservation-history', label: 'Reservation History', icon: CalendarClock },
  { to: '/subscriber/cancel-reservation', label: 'Cancel Reservation', icon: XCircle },
  { to: '/subscriber/update-details', label: 'Update Details', icon: Pencil },
  { to: '/subscriber/profile', label: 'Profile', icon: UserIcon },
];
