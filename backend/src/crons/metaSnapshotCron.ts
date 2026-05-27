/**
 * metaSnapshotCron — agenda runDailySnapshot @ 03:00 BRT + runStoriesSnapshot @ a cada 6h.
 * Epic 10, Story 10.4.
 */
import cron from 'node-cron';
import { logger } from '../lib/logger.js';
import { runDailySnapshot, runStoriesSnapshot, setLastReport } from '../services/metaSnapshotService.js';

const TIMEZONE = 'America/Sao_Paulo';

export function registerMetaSnapshotCron(): void {
  // Cron 1: daily snapshot @ 03:00 BRT
  cron.schedule(
    '0 3 * * *',
    async () => {
      logger.info('[metaSnapshot:cron] daily fire @ 03:00 BRT');
      try {
        const report = await runDailySnapshot();
        setLastReport('daily', report);
      } catch (err) {
        logger.error('[metaSnapshot:cron] daily run threw', { err: (err as Error).message });
      }
    },
    { timezone: TIMEZONE },
  );

  // Cron 2: stories @ a cada 6h
  cron.schedule(
    '0 */6 * * *',
    async () => {
      logger.info('[metaSnapshot:cron] stories fire @ */6h');
      try {
        const report = await runStoriesSnapshot();
        setLastReport('stories', report);
      } catch (err) {
        logger.error('[metaSnapshot:cron] stories run threw', { err: (err as Error).message });
      }
    },
    { timezone: TIMEZONE },
  );

  logger.info('[metaSnapshot:cron] registered: daily=03:00 BRT, stories=every 6h', { timezone: TIMEZONE });
}
