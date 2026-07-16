import {
  LayoutDashboard,
  PlusSquare,
  MinusSquare,
  BarChart3,
  Users,
  Car,
  Wrench,
  ShieldCheck,
  UserPlus,
} from 'lucide-react';
import type { SidebarItem } from '@/components/layout/Sidebar';

export const managerNavItems: SidebarItem[] = [
  { to: '/manager', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/manager/add-facility', label: 'Add Facility', icon: PlusSquare },
  { to: '/manager/remove-facility', label: 'Remove Facility', icon: MinusSquare },
  { to: '/manager/reports', label: 'Reports', icon: BarChart3 },
  { to: '/manager/subscribers', label: 'All Subscribers', icon: Users },
  { to: '/manager/active-parkings', label: 'Active Parkings', icon: Car },
  { to: '/manager/attendants', label: 'Attendants', icon: ShieldCheck },
  { to: '/manager/add-attendant', label: 'Add Attendant', icon: UserPlus },
  { to: '/manager/maintenance', label: 'Maintenance', icon: Wrench },
];
