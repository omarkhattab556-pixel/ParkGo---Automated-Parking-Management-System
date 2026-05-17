import { User } from 'lucide-react';
import { PlaceholderDashboard } from '@/components/common/PlaceholderDashboard';

export default function SubscriberDashboard() {
  return (
    <PlaceholderDashboard
      title="Subscriber Dashboard"
      subtitle="Park, reserve, and manage your sessions"
      icon={User}
      accent="from-primary-500 to-primary-700"
    />
  );
}
