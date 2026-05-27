/**
 * Routes — Meta Insights (Account / Media / Audience)
 * Epic 10, Story 10.3
 */
import { Router } from 'express';
import { requireAuth, type AuthenticatedRequest } from '../middleware/auth.js';
import { getConsultancy } from '../services/consultancyService.js';
import {
  fetchAccountInsightsAggregate28d,
  fetchMediaWithInsights,
  fetchAudienceResponse,
} from '../services/metaInsightsService.js';
import { MetaApiError } from '../types/metaApi.js';
import { logger } from '../lib/logger.js';

const router = Router();

router.use(requireAuth);

async function ensureOwnership(userId: string, consultancyId: string): Promise<boolean> {
  const c = await getConsultancy(userId, consultancyId);
  return Boolean(c);
}

function handleError(res: import('express').Response, err: unknown) {
  if (err instanceof MetaApiError) {
    if (err.isRateLimited()) {
      res.status(503).set('Retry-After', '60').json({ error: 'Rate limited by Meta', code: err.code });
      return;
    }
    if (err.isTokenExpired()) {
      res.status(401).json({ error: 'Token expired — reconnect Instagram', code: err.code });
      return;
    }
    res.status(400).json({ error: err.message, code: err.code });
    return;
  }
  if (err instanceof Error && err.message === 'NO_CONNECTION') {
    res.status(404).json({ error: 'No active Meta connection for this consultancy' });
    return;
  }
  if (err instanceof Error && err.message.startsWith('CONNECTION_')) {
    res.status(409).json({ error: err.message });
    return;
  }
  logger.error('[meta-insights] unexpected error', { err: (err as Error).message });
  res.status(500).json({ error: 'Internal error' });
}

// GET /api/meta/insights/:consultancyId/account
router.get('/:consultancyId/account', async (req: AuthenticatedRequest, res) => {
  const consultancyId = req.params['consultancyId'] as string;
  const userId = req.userId as string;
  if (!(await ensureOwnership(userId, consultancyId))) {
    res.status(404).json({ error: 'Consultancy not found' });
    return;
  }
  try {
    const data = await fetchAccountInsightsAggregate28d(consultancyId);
    res.json(data);
  } catch (err) {
    handleError(res, err);
  }
});

// GET /api/meta/insights/:consultancyId/media?limit=25
router.get('/:consultancyId/media', async (req: AuthenticatedRequest, res) => {
  const consultancyId = req.params['consultancyId'] as string;
  const userId = req.userId as string;
  if (!(await ensureOwnership(userId, consultancyId))) {
    res.status(404).json({ error: 'Consultancy not found' });
    return;
  }
  const limit = Math.min(Number(req.query['limit'] ?? 25), 50);
  try {
    const data = await fetchMediaWithInsights(consultancyId, limit);
    res.json(data);
  } catch (err) {
    handleError(res, err);
  }
});

// GET /api/meta/insights/:consultancyId/audience
router.get('/:consultancyId/audience', async (req: AuthenticatedRequest, res) => {
  const consultancyId = req.params['consultancyId'] as string;
  const userId = req.userId as string;
  if (!(await ensureOwnership(userId, consultancyId))) {
    res.status(404).json({ error: 'Consultancy not found' });
    return;
  }
  try {
    const data = await fetchAudienceResponse(consultancyId);
    res.json(data);
  } catch (err) {
    handleError(res, err);
  }
});

export default router;
