// ============================================================================
// File: backend/src/cron/recurring.js
// Description: Recurring task automation scheduler (0 2 * * *)
// ============================================================================

import cron from 'node-cron';
import { generateNextPeriod } from '../services/recurring.service.js';

export function initCron() {
  // Schedule daily run at 02:00 UTC (0 2 * * *)
  const task = cron.schedule('0 2 * * *', async () => {
    console.log('[Cron] Executing scheduled daily recurring engagement generation...');
    try {
      const summary = await generateNextPeriod();
      console.log('[Cron] Generation finished:', summary);
    } catch (err) {
      console.error('[Cron] Generation error:', err);
    }
  });

  return task;
}

export default {
  initCron
};
