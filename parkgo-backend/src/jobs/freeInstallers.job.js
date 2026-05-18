import cron from 'node-cron';
import { releaseExpired } from '../services/installer.service.js';

/**
 * Safety net: every 5 seconds, free any installer whose `busy_until` has passed
 * but is still marked is_free=false (e.g., server crashed mid-operation).
 */
export const startFreeInstallersJob = () => {
  // node-cron supports seconds when given a 6-field pattern.
  cron.schedule('*/5 * * * * *', async () => {
    try {
      await releaseExpired();
    } catch (err) {
      console.error('[cron:freeInstallers] error:', err);
    }
  });
  console.log('[cron] freeInstallers scheduled (every 5s)');
};
