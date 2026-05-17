import { ClipboardList } from 'lucide-react';
import { PlaceholderDashboard } from '@/components/common/PlaceholderDashboard';

export default function AttendantDashboard() {
  return (
    <PlaceholderDashboard
      title="Attendant Dashboard"
      subtitle="Register subscribers and monitor the facility"
      icon={ClipboardList}
      accent="from-accent-500 to-accent-600"
    />
  );
}
