import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { attendantNavItems } from './attendantNav';

export default function AttendantLayout() {
  return (
    <DashboardLayout
      items={attendantNavItems}
      brandColor="from-accent-500 to-accent-700"
      roleLabel="Attendant"
    />
  );
}
