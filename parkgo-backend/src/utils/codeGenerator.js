import supabase from '../config/supabase.js';

/**
 * Generate a 6-digit confirmation code (100000–999999) that is unique
 * among active reservations and active parkings (retrieval_time IS NULL).
 *
 * Bounded retry: at most 20 attempts; throws if it cannot find a free code.
 * Both uniqueness checks run in parallel per attempt to halve the latency.
 */
export const generateConfirmationCode = async () => {
  for (let attempt = 0; attempt < 20; attempt++) {
    const code = Math.floor(100000 + Math.random() * 900000);

    const [resCheck, parkCheck] = await Promise.all([
      supabase
        .from('reservation')
        .select('reservation_id')
        .eq('confirmation_code', code)
        .eq('status', 'active')
        .limit(1),
      supabase
        .from('parking')
        .select('parking_code')
        .eq('confirmation_code', code)
        .is('retrieval_time', null)
        .limit(1),
    ]);

    if (resCheck.error) throw resCheck.error;
    if (parkCheck.error) throw parkCheck.error;

    if (
      (resCheck.data?.length || 0) === 0 &&
      (parkCheck.data?.length || 0) === 0
    ) {
      return code;
    }
  }
  const err = new Error('Could not generate a unique confirmation code');
  err.status = 500;
  throw err;
};
