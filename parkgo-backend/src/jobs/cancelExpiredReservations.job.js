import cron from 'node-cron';
import supabase from '../config/supabase.js';
import { BUSINESS } from '../config/constants.js';
import { sendReservationCancelledEmail } from '../services/email.service.js';

const GRACE_MS = BUSINESS.NO_SHOW_GRACE_MINUTES * 60_000;

/**
 * Cancels reservations whose start time has passed the grace window AND
 * no parking session was created for that confirmation_code.
 *
 * The reservation's parking_space is then freed (is_occupied=false), so it
 * becomes bookable again.
 */
export const cancelExpiredReservations = async () => {
  const cutoff = new Date(Date.now() - GRACE_MS).toISOString();

  const { data: expired, error } = await supabase
    .from('reservation')
    .select('*')
    .eq('status', 'active')
    .lt('reservation_start', cutoff);
  if (error) {
    console.error('[cron:cancelExpired] fetch error:', error);
    return;
  }
  if (!expired || expired.length === 0) return;

  for (const r of expired) {
    const { data: parking } = await supabase
      .from('parking')
      .select('parking_code')
      .eq('confirmation_code', r.confirmation_code)
      .maybeSingle();
    if (parking) continue; // user did show up — leave reservation as-is

    const { error: cancelErr } = await supabase
      .from('reservation')
      .update({ status: 'cancelled' })
      .eq('reservation_id', r.reservation_id);
    if (cancelErr) {
      console.error('[cron:cancelExpired] cancel error:', cancelErr);
      continue;
    }

    // Free the space (only if no _other_ active session is using it)
    const { data: activeUse } = await supabase
      .from('parking')
      .select('parking_code')
      .eq('parking_space', r.parking_space)
      .is('retrieval_time', null)
      .limit(1);
    if (!activeUse || activeUse.length === 0) {
      await supabase
        .from('parking_space')
        .update({ is_occupied: false })
        .eq('space_number', r.parking_space);
    }

    // Best-effort email
    const { data: user } = await supabase
      .from('user')
      .select('id, first_name, email')
      .eq('id', r.subscriber_num)
      .maybeSingle();
    if (user) {
      sendReservationCancelledEmail(user, {
        reason: `You did not arrive within ${BUSINESS.NO_SHOW_GRACE_MINUTES} minutes of your reservation time.`,
      }).catch((e) => console.error('[email] reservation cancelled:', e));
    }

    console.log(
      `[cron:cancelExpired] cancelled reservation ${r.reservation_id} (no-show)`
    );
  }
};

export const startCancelExpiredJob = () => {
  // Every minute
  cron.schedule('* * * * *', async () => {
    try {
      await cancelExpiredReservations();
    } catch (err) {
      console.error('[cron:cancelExpired] uncaught:', err);
    }
  });
  console.log('[cron] cancelExpiredReservations scheduled (every minute)');
};
