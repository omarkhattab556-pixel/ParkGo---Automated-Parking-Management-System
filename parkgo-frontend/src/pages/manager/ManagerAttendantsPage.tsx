import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ShieldCheck, Search, Mail, Phone, Hash, UserPlus } from 'lucide-react';

import { cn } from '@/lib/utils';
import { subscriberApi } from '@/api/subscriber.api';
import { TableSkeleton } from '@/components/common/Skeleton';
import { EmptyState } from '@/components/common/EmptyState';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { PageHeader } from '@/components/ui/PageHeader';

export default function ManagerAttendantsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['attendants', 'list'],
    queryFn: () => subscriberApi.listAttendants(),
  });

  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!data) return [];
    const q = search.trim().toLowerCase();
    if (!q) return data;
    return data.filter(
      (u) =>
        u.first_name.toLowerCase().includes(q) ||
        u.last_name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.phone_number || '').includes(q) ||
        String(u.id).includes(q)
    );
  }, [data, search]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Directory"
        title={
          <span className="inline-flex items-center gap-3">
            <span className="h-10 w-10 rounded-2xl bg-brand-50 border border-brand-100 flex items-center justify-center text-brand-600">
              <ShieldCheck className="h-5 w-5" />
            </span>
            Attendants
          </span>
        }
        description="All facility attendants (שומרים)"
        actions={
          <Link to="/manager/add-attendant">
            <Button>
              <UserPlus className="h-4 w-4" />
              Add attendant
            </Button>
          </Link>
        }
      />

      <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
        <div className="flex-1">
          <Input
            placeholder="Search by name, email, phone, or ID…"
            icon={<Search className="h-4 w-4" />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        {!isLoading && (
          <Badge tone="neutral" size="md">
            {data?.length ?? 0} total
          </Badge>
        )}
      </div>

      {isLoading && <TableSkeleton columns={5} rows={6} />}

      {!isLoading && filtered.length === 0 && (
        <EmptyState
          icon={ShieldCheck}
          title="No attendants match"
          description={
            data && data.length === 0
              ? 'Add your first attendant from the button above.'
              : 'Try a different search.'
          }
        />
      )}

      {!isLoading && filtered.length > 0 && (
        <Card padding="none" className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-surface-50 text-ink-500 text-xs uppercase tracking-wider border-b border-surface-200">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">ID</th>
                  <th className="px-4 py-3 text-left font-semibold">Name</th>
                  <th className="px-4 py-3 text-left font-semibold">Email</th>
                  <th className="px-4 py-3 text-left font-semibold">Phone</th>
                  <th className="px-4 py-3 text-left font-semibold">Role</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-200">
                {filtered.map((u, i) => (
                  <tr
                    key={u.id}
                    className={cn(
                      'hover:bg-surface-50 transition-colors',
                      i % 2 === 1 && 'bg-surface-50/40'
                    )}
                  >
                    <td className="px-4 py-3 font-mono font-semibold text-ink-900 tabular">
                      <span className="inline-flex items-center gap-1.5 text-ink-600">
                        <Hash className="h-3.5 w-3.5" />
                        {u.id}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-semibold text-ink-900">
                      {u.first_name} {u.last_name}
                    </td>
                    <td className="px-4 py-3 text-ink-600">
                      <span className="inline-flex items-center gap-1.5">
                        <Mail className="h-3.5 w-3.5 text-ink-400" />
                        {u.email}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-ink-600">
                      {u.phone_number ? (
                        <span className="inline-flex items-center gap-1.5">
                          <Phone className="h-3.5 w-3.5 text-ink-400" />
                          {u.phone_number}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone="brand" dot size="md">
                        Attendant
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
