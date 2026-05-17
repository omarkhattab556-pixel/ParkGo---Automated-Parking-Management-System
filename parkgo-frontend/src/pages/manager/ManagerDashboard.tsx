import { BarChart3 } from 'lucide-react';
import { PlaceholderDashboard } from '@/components/common/PlaceholderDashboard';

export default function ManagerDashboard() {
  return (
    <PlaceholderDashboard
      title="Manager Dashboard"
      subtitle="Manage facilities and view analytics"
      icon={BarChart3}
      accent="from-success-500 to-success-700"
    />
  );
}
