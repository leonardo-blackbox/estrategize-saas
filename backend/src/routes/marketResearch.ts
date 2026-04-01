import { Router } from 'express';
import { requireAuth, type AuthenticatedRequest } from '../middleware/auth.js';
import { getSnapshot } from '../services/instagramScanService.js';
import { supabaseAdmin } from '../lib/supabaseAdmin.js';

const router = Router();
router.use(requireAuth);

// ============================================================================
// Helpers
// ============================================================================

function ensureAdmin() {
  if (!supabaseAdmin) throw new Error('Database service unavailable');
  return supabaseAdmin;
}

async function verifyOwnership(
  consultancyId: string,
  userId: string,
): Promise<boolean> {
  const db = ensureAdmin();
  const { data } = await db
    .from('consultancies')
    .select('id')
    .eq('id', consultancyId)
    .eq('user_id', userId)
    .maybeSingle();
  return !!data;
}

// ============================================================================
// GET /api/market-research/instagram/:consultancyId
// ============================================================================

router.get('/instagram/:consultancyId', async (req: AuthenticatedRequest, res) => {
  const consultancyId = Array.isArray(req.params.consultancyId)
    ? req.params.consultancyId[0]
    : req.params.consultancyId;
  try {
    const owned = await verifyOwnership(consultancyId, req.userId!);
    if (!owned) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    const snapshot = await getSnapshot(consultancyId, req.userId!);

    if (!snapshot) {
      res.json({ status: 'not_started', handle: null, data: null, scraped_at: null });
      return;
    }

    res.json({
      status: snapshot.status,
      handle: snapshot.handle,
      data: snapshot.raw_data,
      scraped_at: snapshot.scraped_at,
    });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Unknown error' });
  }
});

export default router;
