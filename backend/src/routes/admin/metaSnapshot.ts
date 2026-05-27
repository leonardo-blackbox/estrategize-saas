/**
 * Admin routes — manual trigger e status do snapshot Meta.
 * Epic 10, Story 10.4.
 */
import { Router } from 'express';
import { z } from 'zod';
import { requireAuth, type AuthenticatedRequest } from '../../middleware/auth.js';
import { requireAdmin } from '../../middleware/admin.js';
import { runDailySnapshot, runStoriesSnapshot, getSnapshotStatus, setLastReport } from '../../services/metaSnapshotService.js';
import { logger } from '../../lib/logger.js';

const router = Router();
router.use(requireAuth, requireAdmin);

const triggerSchema = z.object({
  consultancyIds: z.array(z.string().uuid()).optional(),
  dryRun: z.boolean().optional(),
  includeStories: z.boolean().optional(),
});

router.post('/run', async (req: AuthenticatedRequest, res) => {
  const parsed = triggerSchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid body', details: parsed.error.flatten() });
    return;
  }
  const options = parsed.data;
  try {
    const daily = await runDailySnapshot(options);
    setLastReport('daily', daily);
    let stories = null;
    if (options.includeStories) {
      stories = await runStoriesSnapshot(options);
      setLastReport('stories', stories);
    }
    res.json({ daily, stories });
  } catch (err) {
    logger.error('[admin-snapshot] run failed', { err: (err as Error).message });
    res.status(500).json({ error: 'Snapshot failed', message: (err as Error).message });
  }
});

router.get('/status', async (_req: AuthenticatedRequest, res) => {
  res.json(getSnapshotStatus());
});

export default router;
