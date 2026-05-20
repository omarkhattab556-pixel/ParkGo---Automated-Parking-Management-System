import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { managerNavItems } from './managerNav';

export default function ManagerLayout() {
  return (
    <DashboardLayout
      items={managerNavItems}
      brandColor="from-success-500 to-success-700"
      roleLabel="Manager"
    />
  );
}
