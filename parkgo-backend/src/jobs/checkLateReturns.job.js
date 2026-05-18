import cron from 'node-cron';
import supabase from '../config/supabase.js';
import { BUSINESS } from '../config/constants.js';
import { sendLateReturnEmail } from '../services/email.service.js';

const MAX_DELAYS = BUSINESS.MAX_DELAYS_BEFORE_CANCEL;

/**
 * Schema constraint: we may NOT add a `late_notified` column to `parking`.
 * To avoid double-counting strikes when this job runs every 5 minutes, we
 * keep an in-memory set of parking_codes we've already struck. Restarting the
 * server may produce one duplicate strike per overdue session — acceptable
 * for an academic project.
 */
const struckParkings = new Set();

export const checkLateReturns = async () => {
  const { data: activeParkings, error } = await supabase
    .from('parking')
    .select('parking_code, parking_date, max_time_minutes, subscriber_num')
    .is('retrieval_time', null);
  if (error) {
    console.error('[cron:lateReturns] fetch error:', error);
    return;
  }

  for (const p of activeParkings || []) {
    if (struckParkings.has(p.parking_code)) continue;

    const start = new Date(p.parking_date).getTime();
    const maxMinutes = p.max_time_minutes || BUSINESS.MAX_PARKING_HOURS * 60;
    const elapsedMin = (Date.now() - start) / 60_000;
    if (elapsedMin <= maxMinutes) continue;

    // Fetch subscriber + user
    const [{ data: sub }, { data: user }] = await Promise.all([
      supabase
        .from('subscriber')
        .select('subscriber_num, delay_count, status')
        .eq('subscriber_num', p.subscriber_num)
        .maybeSingle(),
      supabase
        .from('user')
        .select('id, first_name, last_name, email')
        .eq('id', p.subscriber_num)
        .maybeSingle(),
    ]);

    if (!sub || !user) {
      struckParkings.add(p.parking_code);
      continue;
    }

    // Skip if subscriber is already inactive (don't keep punishing)
    if (sub.status === 'inactive') {
      struckParkings.add(p.parking_code);
      continue;
    }

    const newCount = (sub.delay_count || 0) + 1;
    const shouldCancel = newCount >= MAX_DELAYS;

    const { error: updateErr } = await supabase
      .from('subscriber')
      .update({
        delay_count: newCount,
        status: shouldCancel ? 'inactive' : 'active',
      })
      .eq('subscriber_num', p.subscriber_num);
    if (updateErr) {
      console.error('[cron:lateReturns] subscriber update error:', updateErr);
      continue;
    }

    struckParkings.add(p.parking_code);

    const minutesLate = Math.floor(elapsedMin - maxMinutes);
    sendLateReturnEmail(user, {
      minutesLate,
      delayCount: newCount,
      cancelled: shouldCancel,
    }).catch((e) => console.error('[email] late return:', e));

    console.log(
      `[cron:lateReturns] strike subscriber=${p.subscriber_num} delays=${newCount}${
        shouldCancel ? ' → INACTIVE' : ''
      }`
    );
  }

  // Garbage-collect: drop parking_codes that are no longer active (retrieved).
  if (struckParkings.size > 0) {
    const activeCodes = new Set((activeParkings || []).map((p) => p.parking_code));
    for (const code of struckParkings) {
      if (!activeCodes.has(code)) struckParkings.delete(code);
    }
  }
};

export const startCheckLateReturnsJob = () => {
  // Every 5 minutes
  cron.schedule('*/5 * * * *', async () => {
    try {
      await checkLateReturns();
    } catch (err) {
      console.error('[cron:lateReturns] uncaught:', err);
    }
  });
  console.log('[cron] checkLateReturns scheduled (every 5 minutes)');
};
