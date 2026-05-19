import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { SubscriberBottomBar } from '@/components/layout/SubscriberBottomBar';
import { subscriberNavItems } from './subscriberNav';

export default function SubscriberLayout() {
  return (
    <>
      <DashboardLayout
        items={subscriberNavItems}
        brandColor="from-primary-500 to-primary-700"
      />
      <SubscriberBottomBar />
      {/* Spacer so content doesn't sit underneath the fixed mobile bottom bar */}
      <div className="md:hidden h-20" />
    </>
  );
}
