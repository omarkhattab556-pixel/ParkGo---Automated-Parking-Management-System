import { useQuery } from '@tanstack/react-query';
import {
  User as UserIcon,
  Mail,
  Phone,
  Hash,
  Calendar,
  ShieldCheck,
} from 'lucide-react';
import { subscriberApi } from '@/api/subscriber.api';
import { CardSkeleton, StatStripSkeleton } from '@/components/common/Skeleton';
import { formatDate } from '@/utils/formatters';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { PageHeader } from '@/components/ui/PageHeader';

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof UserIcon;
  label: string;
  value: string | number;
}) {
  return (
    <div className="flex items-center gap-3 py-3.5 border-b border-surface-200 last:border-0">
      <div className="h-10 w-10 rounded-2xl bg-surface-100 border border-surface-200 flex items-center justify-center shrink-0">
        <Icon className="h-4 w-4 text-ink-500" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] text-ink-500 uppercase tracking-[0.1em] font-semibold">
          {label}
        </p>
        <p className="font-semibold text-ink-900 truncate">{value}</p>
      </div>
    </div>
  );
}

function StatPill({
  label,
  value,
  tone = 'neutral',
}: {
  label: string;
  value: React.ReactNode;
  tone?: 'neutral' | 'brand' | 'accent' | 'success';
}) {
  const toneClasses = {
    neutral: 'bg-surface-0 border-surface-200',
    brand: 'bg-gradient-to-br from-brand-50 to-surface-0 border-brand-100',
    accent: 'bg-gradient-to-br from-accent-50 to-surface-0 border-accent-100',
    success: 'bg-gradient-to-br from-success-50 to-surface-0 border-success-100',
  };
  return (
    <div
      className={`rounded-2xl border p-4 text-center shadow-soft ${toneClasses[tone]}`}
    >
      <p className="text-[10px] text-ink-500 uppercase tracking-[0.1em] font-semibold">
        {label}
      </p>
      <p className="font-display text-2xl font-bold text-ink-900 tabular mt-1">
        {value}
      </p>
    </div>
  );
}

export default function ProfilePage() {
  const { data, isLoading } = useQuery({
    queryKey: ['subscriber', 'me-profile'],
    queryFn: () => subscriberApi.myProfile(),
  });

  if (isLoading || !data) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <StatStripSkeleton count={4} />
        <CardSkeleton lines={6} />
      </div>
    );
  }

  const { user, subscriber, stats } = data;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <PageHeader
        eyebrow="Account"
        title={
          <span className="inline-flex items-center gap-3">
            <span className="h-10 w-10 rounded-2xl bg-brand-50 border border-brand-100 flex items-center justify-center text-brand-600">
              <UserIcon className="h-5 w-5" />
            </span>
            Profile
          </span>
        }
        description="Account and subscription details"
      />

      <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatPill label="Parkings" value={stats.total_parkings} tone="brand" />
        <StatPill
          label="Reservations"
          value={stats.total_reservations}
          tone="accent"
        />
        <StatPill label="Delays" value={stats.delay_count} />
        <StatPill
          label="Status"
          value={
            <Badge
              tone={stats.status === 'active' ? 'success' : 'danger'}
              dot
              size="md"
            >
              {stats.status}
            </Badge>
          }
          tone="success"
        />
      </section>

      <Card variant="default" padding="xl">
        <h2 className="font-display text-lg font-semibold text-ink-900 mb-2">
          Personal information
        </h2>
        <InfoRow
          icon={UserIcon}
          label="Name"
          value={`${user.first_name} ${user.last_name}`}
        />
        <InfoRow icon={Mail} label="Email" value={user.email} />
        <InfoRow icon={Phone} label="Phone" value={user.phone_number || '—'} />
        <InfoRow
          icon={Hash}
          label="License plate"
          value={subscriber?.license_plate_number || '—'}
        />
        <InfoRow
          icon={Calendar}
          label="Registered"
          value={formatDate(subscriber?.registration_date)}
        />
        <InfoRow
          icon={ShieldCheck}
          label="Subscriber #"
          value={`${user.id}`}
        />
      </Card>
    </div>
  );
}
