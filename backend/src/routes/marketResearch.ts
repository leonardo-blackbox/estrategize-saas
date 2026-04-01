import { Router } from 'express';
import { z } from 'zod';
import { requireAuth, type AuthenticatedRequest } from '../middleware/auth.js';
import { getSnapshot } from '../services/instagramScanService.js';
import { startResearch, getResearch, indexReportInRAG } from '../services/marketResearchService.js';
import { getConfig } from '../services/marketPluginConfigService.js';
import { reserveCredits, consumeCredits, releaseCredits } from '../services/creditService.js';
import { supabaseAdmin } from '../lib/supabaseAdmin.js';
import type { MarketResearch } from '../types/marketIntelligence.js';

const router = Router();
router.use(requireAuth);

// ============================================================================
// Helpers
// ============================================================================

function ensureDb() {
  if (!supabaseAdmin) throw new Error('Database service unavailable');
  return supabaseAdmin;
}

async function verifyOwnership(consultancyId: string, userId: string): Promise<boolean> {
  const db = ensureDb();
  const { data } = await db
    .from('consultancies')
    .select('id')
    .eq('id', consultancyId)
    .eq('user_id', userId)
    .maybeSingle();
  return !!data;
}

function paramId(p: string | string[]): string {
  return Array.isArray(p) ? p[0] : p;
}

const PROGRESS_LABELS: Record<number, string> = {
  0: 'Aguardando inicio...',
  1: 'Descobrindo concorrentes locais...',
  2: 'Analisando Instagram dos concorrentes...',
  3: 'Analisando sites dos concorrentes...',
  4: 'Gerando relatorio com IA...',
  5: 'Pesquisa concluida',
};

// ============================================================================
// GET /api/market-research/instagram/:consultancyId
// ============================================================================

router.get('/instagram/:consultancyId', async (req: AuthenticatedRequest, res) => {
  const consultancyId = paramId(req.params.consultancyId);
  try {
    const owned = await verifyOwnership(consultancyId, req.userId!);
    if (!owned) { res.status(403).json({ error: 'Access denied' }); return; }

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

// ============================================================================
// GET /api/market-research/:consultancyId
// ============================================================================

router.get('/:consultancyId', async (req: AuthenticatedRequest, res) => {
  const consultancyId = paramId(req.params.consultancyId);
  try {
    const owned = await verifyOwnership(consultancyId, req.userId!);
    if (!owned) { res.status(403).json({ error: 'Access denied' }); return; }

    const research = await getResearch(consultancyId, req.userId!);
    if (!research) {
      res.json({ status: 'not_started', progress_step: 0, progress_label: PROGRESS_LABELS[0], competitors_count: 0, report_markdown: null, key_insights: null, rag_indexed: false, error_message: null, completed_at: null });
      return;
    }

    const competitors = (research.competitors_discovered as unknown as Array<unknown>) ?? [];

    res.json({
      id: research.id,
      status: research.status,
      progress_step: research.progress_step,
      progress_label: research.status === 'done' ? PROGRESS_LABELS[5] : (PROGRESS_LABELS[research.progress_step] ?? 'Processando...'),
      competitors_count: competitors.length,
      competitors_discovered: research.competitors_discovered,
      report_markdown: research.report_markdown,
      key_insights: research.key_insights,
      rag_indexed: research.rag_indexed,
      error_message: research.error_message,
      created_at: research.created_at,
      completed_at: research.completed_at,
    });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Unknown error' });
  }
});

// ============================================================================
// POST /api/market-research/:consultancyId/start
// ============================================================================

const startBodySchema = z.object({}).optional();

router.post('/:consultancyId/start', async (req: AuthenticatedRequest, res) => {
  const consultancyId = paramId(req.params.consultancyId);

  const parsed = startBodySchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: 'Invalid request body' }); return; }

  try {
    const owned = await verifyOwnership(consultancyId, req.userId!);
    if (!owned) { res.status(403).json({ error: 'Access denied' }); return; }

    const config = await getConfig('pesquisa-mercado');
    if (!config.enabled) { res.status(403).json({ error: 'Plugin desabilitado' }); return; }

    // Check for running research
    const db = ensureDb();
    const { data: running } = await db
      .from('market_research')
      .select('id')
      .eq('consultancy_id', consultancyId)
      .in('status', ['pending', 'running_maps', 'running_instagram', 'running_websites', 'running_ai'])
      .maybeSingle();

    if (running) { res.status(409).json({ error: 'Pesquisa ja em andamento' }); return; }

    // Check if first research (for free_first_research)
    let reservationId: string | null = null;
    let creditsToUse = config.credits_cost_deep;

    if (config.free_first_research) {
      const { data: existing } = await db
        .from('market_research')
        .select('id')
        .eq('consultancy_id', consultancyId)
        .eq('user_id', req.userId!)
        .limit(1)
        .maybeSingle();
      if (!existing) creditsToUse = 0;
    }

    if (creditsToUse > 0) {
      reservationId = await reserveCredits(
        req.userId!,
        creditsToUse,
        undefined,
        consultancyId,
        'Pesquisa de mercado profunda',
      );
    }

    // Create research record with config snapshot
    const { data: newResearch, error: insertErr } = await db
      .from('market_research')
      .insert({
        consultancy_id: consultancyId,
        user_id: req.userId!,
        status: 'pending',
        progress_step: 0,
        config_snapshot: config,
        credits_used: 0,
      })
      .select('id')
      .single();

    if (insertErr || !newResearch) {
      if (reservationId) {
        await releaseCredits(req.userId!, reservationId).catch(() => undefined);
      }
      res.status(500).json({ error: insertErr?.message ?? 'Failed to create research' });
      return;
    }

    const researchId = (newResearch as { id: string }).id;

    // Store reservation ID in pipeline context via config snapshot update
    if (reservationId) {
      await db
        .from('market_research')
        .update({ config_snapshot: { ...config, _reservation_id: reservationId, _credits_to_use: creditsToUse } as unknown as MarketResearch['config_snapshot'] })
        .eq('id', researchId);
    }

    startResearch(researchId);

    res.status(202).json({ researchId, status: 'pending' });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const statusCode = (err as Error & { statusCode?: number }).statusCode ?? 500;
    res.status(statusCode).json({ error: message });
  }
});

// ============================================================================
// POST /api/market-research/:consultancyId/rag-index
// ============================================================================

router.post('/:consultancyId/rag-index', async (req: AuthenticatedRequest, res) => {
  const consultancyId = paramId(req.params.consultancyId);

  try {
    const owned = await verifyOwnership(consultancyId, req.userId!);
    if (!owned) { res.status(403).json({ error: 'Access denied' }); return; }

    const db = ensureDb();
    const { data: research, error: fetchErr } = await db
      .from('market_research')
      .select('*')
      .eq('consultancy_id', consultancyId)
      .eq('status', 'done')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (fetchErr || !research) {
      res.status(404).json({ error: 'Pesquisa concluida nao encontrada' });
      return;
    }

    const r = research as MarketResearch;

    if (!r.report_markdown) {
      res.status(400).json({ error: 'Relatorio ainda nao gerado' });
      return;
    }

    if (r.rag_indexed) {
      res.status(409).json({ error: 'Relatorio ja indexado' });
      return;
    }

    const config = await getConfig('pesquisa-mercado');
    await indexReportInRAG(r.id, consultancyId, req.userId!, r.report_markdown, config);

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Unknown error' });
  }
});

export default router;
