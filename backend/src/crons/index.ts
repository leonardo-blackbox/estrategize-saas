/**
 * Cron registry — chamado no startup do backend.
 * Epic 10, Story 10.4.
 */
import { logger } from '../lib/logger.js';
import { registerMetaSnapshotCron } from './metaSnapshotCron.js';

export function registerAllCrons(): void {
  if (process.env['NODE_ENV'] === 'test') {
    logger.info('[crons] skipping registration in test env');
    return;
  }

  const metaEnabled = process.env['META_SNAPSHOT_CRON_ENABLED'] !== 'false';
  if (metaEnabled) {
    registerMetaSnapshotCron();
  } else {
    logger.info('[crons] meta snapshot cron disabled via env');
  }
}
