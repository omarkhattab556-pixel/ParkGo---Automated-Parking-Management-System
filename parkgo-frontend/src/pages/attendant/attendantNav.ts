import {
  LayoutDashboard,
  UserPlus,
  Users,
  Car,
  Wrench,
  Settings,
  Gauge,
} from 'lucide-react';
import type { SidebarItem } from '@/components/layout/Sidebar';

export const attendantNavItems: SidebarItem[] = [
  { to: '/attendant', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/attendant/register', label: 'Register Subscriber', icon: UserPlus },
  { to: '/attendant/subscribers', label: 'Active Subscribers', icon: Users },
  { to: '/attendant/active-parkings', label: 'Active Parkings', icon: Car },
  { to: '/attendant/facility-status', label: 'Facility Status', icon: Settings },
  { to: '/attendant/load-level', label: 'Load Level', icon: Gauge },
  { to: '/attendant/maintenance', label: 'Maintenance', icon: Wrench },
];
