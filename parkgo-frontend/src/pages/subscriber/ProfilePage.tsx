import { useQuery } from '@tanstack/react-query';
import { User as UserIcon, Mail, Phone, Hash, Calendar, ShieldCheck } from 'lucide-react';
import { subscriberApi } from '@/api/subscriber.api';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { formatDate } from '@/utils/formatters';
import { cn } from '@/lib/utils';

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
    <div className="flex items-center gap-3 py-3 border-b border-slate-100 last:border-0">
      <div className="h-9 w-9 rounded-xl bg-slate-50 flex items-center justify-center shrink-0">
        <Icon className="h-4 w-4 text-slate-500" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-slate-500 uppercase tracking-wider">{label}</p>
        <p className="font-medium text-slate-900 truncate">{value}</p>
      </div>
    </div>
  );
}

function StatPill({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl bg-white border border-slate-100 p-4 text-center">
      <p className="text-xs text-slate-500 uppercase tracking-wider">{label}</p>
      <p className="text-2xl font-bold text-slate-900 tabular-nums">{value}</p>
    </div>
  );
}

export default function ProfilePage() {
  const { data, isLoading } = useQuery({
    queryKey: ['subscriber', 'me-profile'],
    queryFn: () => subscriberApi.myProfile(),
  });

  if (isLoading || !data) {
    return <LoadingSpinner />;
  }

  const { user, subscriber, stats } = data;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <header className="flex items-center gap-3">
        <div className="h-11 w-11 rounded-xl bg-primary-50 flex items-center justify-center">
          <UserIcon className="h-5 w-5 text-primary-600" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
            Profile
          </h1>
          <p className="text-slate-500 text-sm">Account and subscription details</p>
        </div>
      </header>

      <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatPill label="Parkings" value={stats.total_parkings} />
        <StatPill label="Reservations" value={stats.total_reservations} />
        <StatPill label="Delays" value={stats.delay_count} />
        <StatPill
          label="Status"
          value={
            <span
              className={cn(
                'inline-block text-base px-2 py-0.5 rounded-full',
                stats.status === 'active'
                  ? 'text-emerald-700 bg-emerald-100'
                  : 'text-danger-700 bg-danger-100'
              )}
            >
              {stats.status}
            </span> as unknown as string
          }
        />
      </section>

      <div className="rounded-3xl bg-white border border-slate-100 p-6 md:p-7 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
        <h2 className="text-lg font-semibold text-slate-900 mb-3">
          Personal information
        </h2>
        <div>
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
          <InfoRow icon={ShieldCheck} label="Subscriber #" value={`${user.id}`} />
        </div>
      </div>
    </div>
  );
}
