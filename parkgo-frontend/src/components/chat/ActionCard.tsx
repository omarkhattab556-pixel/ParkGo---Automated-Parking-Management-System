import { useState } from 'react';
import toast from 'react-hot-toast';
import { CalendarClock, XCircle, Clock, Check } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import type { ActionSuggestion } from '@/api/chat.api';
import { reservationApi } from '@/api/reservation.api';
import { parkingApi } from '@/api/parking.api';
import { Button } from '@/components/ui/Button';
import { formatDateTime, formatDuration } from '@/utils/formatters';

interface Props {
  action: ActionSuggestion;
  done?: boolean;
  onDone: () => void;
}

const META: Record<
  ActionSuggestion['type'],
  { icon: LucideIcon; label: (a: ActionSuggestion) => string; cta: string }
> = {
  reservation: {
    icon: CalendarClock,
    label: (a) =>
      a.type === 'reservation'
        ? `Reserve parking for ${formatDateTime(a.params.reservation_start)}`
        : '',
    cta: 'Confirm reservation',
  },
  cancel_reservation: {
    icon: XCircle,
    label: (a) =>
      a.type === 'cancel_reservation'
        ? `Cancel reservation #${a.params.reservation_id}`
        : '',
    cta: 'Confirm cancellation',
  },
  extend_parking: {
    icon: Clock,
    label: (a) =>
      a.type === 'extend_parking'
        ? `Extend parking by ${formatDuration(a.params.extra_minutes)}`
        : '',
    cta: 'Confirm extension',
  },
};

/** Execute the proposed action against the EXISTING, validated endpoints. */
async function runAction(action: ActionSuggestion): Promise<string> {
  switch (action.type) {
    case 'reservation': {
      const r = await reservationApi.create(action.params.reservation_start);
      return `Reserved space #${r.space_number}. Confirmation code ${r.confirmation_code}.`;
    }
    case 'cancel_reservation': {
      await reservationApi.cancel(action.params.reservation_id);
      return `Reservation #${action.params.reservation_id} cancelled.`;
    }
    case 'extend_parking': {
      const r = await parkingApi.extend(
        action.params.parking_code,
        action.params.extra_minutes
      );
      return r.capped_by_reservation
        ? `Extended by ${formatDuration(r.minutes_added)} (shortened — a reservation follows).`
        : `Extended by ${formatDuration(r.minutes_added)}.`;
    }
  }
}

export function ActionCard({ action, done, onDone }: Props) {
  const [loading, setLoading] = useState(false);
  const meta = META[action.type];
  const Icon = meta.icon;

  const confirm = async () => {
    setLoading(true);
    try {
      const msg = await runAction(action);
      toast.success(msg);
      onDone();
    } catch (err) {
      toast.error(
        (err as { message?: string })?.message || 'Action failed. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-1.5 ml-0 max-w-[85%] rounded-2xl border border-brand-200 bg-brand-50/60 p-3">
      <div className="flex items-center gap-2 text-sm font-semibold text-ink-800">
        <span className="h-7 w-7 shrink-0 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 text-white flex items-center justify-center">
          <Icon className="h-4 w-4" />
        </span>
        {meta.label(action)}
      </div>
      {done ? (
        <div className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-success-600">
          <Check className="h-3.5 w-3.5" /> Done
        </div>
      ) : (
        <div className="mt-2.5 flex gap-2">
          <Button
            size="sm"
            variant={action.type === 'cancel_reservation' ? 'danger' : 'primary'}
            loading={loading}
            onClick={confirm}
          >
            {meta.cta}
          </Button>
          <Button size="sm" variant="ghost" disabled={loading} onClick={onDone}>
            Dismiss
          </Button>
        </div>
      )}
    </div>
  );
}

export default ActionCard;
