import supabase from '../config/supabase.js';
import { BUSINESS } from '../config/constants.js';

const OPERATION_MS = BUSINESS.INSTALLER_OPERATION_SECONDS * 1000;

/**
 * Try to atomically claim a free installer. Returns the installer row,
 * or null if none are free.
 *
 * We use a conditional UPDATE (eq is_free=true) so concurrent calls cannot
 * grab the same row — at most one wins.
 */
export const acquireInstaller = async () => {
  const { data: candidates, error: listErr } = await supabase
    .from('installer')
    .select('installer_id, installer_name')
    .eq('is_free', true)
    .order('installer_id');
  if (listErr) throw listErr;
  if (!candidates || candidates.length === 0) return null;

  const busyUntil = new Date(Date.now() + OPERATION_MS).toISOString();

  for (const candidate of candidates) {
    const { data: claimed, error: claimErr } = await supabase
      .from('installer')
      .update({ is_free: false, busy_until: busyUntil })
      .eq('installer_id', candidate.installer_id)
      .eq('is_free', true)
      .select('installer_id, installer_name, busy_until')
      .maybeSingle();
    if (claimErr) throw claimErr;
    if (claimed) {
      return {
        installer_id: claimed.installer_id,
        installer_name: claimed.installer_name,
        busy_until: claimed.busy_until,
        completes_at: claimed.busy_until,
      };
    }
  }
  return null;
};

export const releaseInstaller = async (installerId) => {
  const { error } = await supabase
    .from('installer')
    .update({ is_free: true, busy_until: null })
    .eq('installer_id', installerId);
  if (error) throw error;
};

export const getQueueStatus = async () => {
  const { data: installers, error } = await supabase
    .from('installer')
    .select('installer_id, installer_name, is_free, busy_until')
    .order('installer_id');
  if (error) throw error;

  const free = installers.filter((i) => i.is_free).length;
  const busy = installers.length - free;
  return { installers, total: installers.length, free, busy };
};

/**
 * Background safety net — release installers whose `busy_until` is in the past.
 * Called from cron job AND opportunistically on each acquire attempt.
 */
export const releaseExpired = async () => {
  const nowIso = new Date().toISOString();
  const { error } = await supabase
    .from('installer')
    .update({ is_free: true, busy_until: null })
    .lt('busy_until', nowIso)
    .eq('is_free', false);
  if (error) console.error('[installer] releaseExpired error:', error);
};
