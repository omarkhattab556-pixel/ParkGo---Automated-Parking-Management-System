import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { SubscriberBottomBar } from '@/components/layout/SubscriberBottomBar';
import { subscriberNavItems } from './subscriberNav';

export default function SubscriberLayout() {
  return (
    <>
      <DashboardLayout
        items={subscriberNavItems}
        brandColor="from-brand-500 to-brand-700"
        roleLabel="Member"
      />
      <SubscriberBottomBar />
      <div className="md:hidden h-24" />
    </>
  );
}
