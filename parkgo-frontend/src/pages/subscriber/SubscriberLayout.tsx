import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { subscriberNavItems } from './subscriberNav';

export default function SubscriberLayout() {
  return (
    <DashboardLayout
      items={subscriberNavItems}
      brandColor="from-primary-500 to-primary-700"
    />
  );
}
