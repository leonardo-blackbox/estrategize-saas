import { Router } from 'express';
import { z } from 'zod';
import { requireAuth, type AuthenticatedRequest } from '../middleware/auth.js';
import { getConsultancy } from '../services/consultancyService.js';
import {
  applyTemplate,
  createPage,
  deletePage,
  getPage,
  listPages,
  reorderPages,
  updatePage,
} from '../services/centralService.js';
import { IRIS_TEMPLATES, type CentralTemplateKey } from '../services/centralTemplates.js';

const router = Router({ mergeParams: true });
router.use(requireAuth);

// ─── Schemas ─────────────────────────────────────────────────────
const createSchema = z.object({
  title: z.string().trim().max(200).optional(),
  emoji: z.string().trim().max(8).nullable().optional(),
  parent_id: z.string().uuid().nullable().optional(),
  blocks: z.unknown().optional(),
  template_key: z.string().trim().max(64).nullable().optional(),
});

const updateSchema = z.object({
  title: z.string().trim().max(200).optional(),
  emoji: z.string().trim().max(8).nullable().optional(),
  parent_id: z.string().uuid().nullable().optional(),
  blocks: z.unknown().optional(),
  position: z.number().int().min(0).optional(),
});

const reorderSchema = z.object({
  items: z.array(
    z.object({
      id: z.string().uuid(),
      parent_id: z.string().uuid().nullable(),
      position: z.number().int().min(0),
    }),
  ).min(1).max(500),
});

// ─── Helpers ─────────────────────────────────────────────────────
async function ensureOwnership(userId: string, consultancyId: string) {
  const consultancy = await getConsultancy(userId, consultancyId);
  if (!consultancy) {
    return { ok: false, status: 404, error: 'Consultancy not found' } as const;
  }
  return { ok: true, consultancy } as const;
}

// ─── Routes ──────────────────────────────────────────────────────

// GET / — list all pages (tree, no blocks)
router.get('/pages', async (req: AuthenticatedRequest, res) => {
  const consultancyId = req.params['consultancyId'] as string;
  const userId = req.userId as string;
  const guard = await ensureOwnership(userId, consultancyId);
  if (!guard.ok) return res.status(guard.status).json({ error: guard.error });

  try {
    const pages = await listPages(consultancyId);
    res.json(pages);
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

// POST /pages — create new page
router.post('/pages', async (req: AuthenticatedRequest, res) => {
  const consultancyId = req.params['consultancyId'] as string;
  const userId = req.userId as string;
  const guard = await ensureOwnership(userId, consultancyId);
  if (!guard.ok) return res.status(guard.status).json({ error: guard.error });

  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid payload', details: parsed.error.flatten() });

  try {
    const page = await createPage({
      consultancyId,
      userId,
      title: parsed.data.title,
      emoji: parsed.data.emoji ?? null,
      parentId: parsed.data.parent_id ?? null,
      blocks: parsed.data.blocks,
      templateKey: parsed.data.template_key ?? null,
    });
    res.status(201).json(page);
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

// POST /pages/reorder — bulk reorder (must precede :pageId)
router.post('/pages/reorder', async (req: AuthenticatedRequest, res) => {
  const consultancyId = req.params['consultancyId'] as string;
  const userId = req.userId as string;
  const guard = await ensureOwnership(userId, consultancyId);
  if (!guard.ok) return res.status(guard.status).json({ error: guard.error });

  const parsed = reorderSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid payload', details: parsed.error.flatten() });

  try {
    await reorderPages(
      consultancyId,
      parsed.data.items.map((it) => ({ id: it.id, parentId: it.parent_id, position: it.position })),
    );
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

// GET /pages/:pageId — single page with blocks
router.get('/pages/:pageId', async (req: AuthenticatedRequest, res) => {
  const consultancyId = req.params['consultancyId'] as string;
  const pageId = req.params['pageId'] as string;
  const userId = req.userId as string;
  const guard = await ensureOwnership(userId, consultancyId);
  if (!guard.ok) return res.status(guard.status).json({ error: guard.error });

  try {
    const page = await getPage(pageId, consultancyId);
    if (!page) return res.status(404).json({ error: 'Page not found' });
    res.json(page);
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

// PATCH /pages/:pageId — partial update
router.patch('/pages/:pageId', async (req: AuthenticatedRequest, res) => {
  const consultancyId = req.params['consultancyId'] as string;
  const pageId = req.params['pageId'] as string;
  const userId = req.userId as string;
  const guard = await ensureOwnership(userId, consultancyId);
  if (!guard.ok) return res.status(guard.status).json({ error: guard.error });

  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid payload', details: parsed.error.flatten() });

  try {
    const page = await updatePage(pageId, consultancyId, {
      title: parsed.data.title,
      emoji: parsed.data.emoji,
      blocks: parsed.data.blocks,
      parentId: parsed.data.parent_id,
      position: parsed.data.position,
    });
    res.json(page);
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

// DELETE /pages/:pageId
router.delete('/pages/:pageId', async (req: AuthenticatedRequest, res) => {
  const consultancyId = req.params['consultancyId'] as string;
  const pageId = req.params['pageId'] as string;
  const userId = req.userId as string;
  const guard = await ensureOwnership(userId, consultancyId);
  if (!guard.ok) return res.status(guard.status).json({ error: guard.error });

  try {
    await deletePage(pageId, consultancyId);
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

// GET /templates — list available templates (no auth needed beyond requireAuth)
router.get('/templates', (_req, res) => {
  res.json(IRIS_TEMPLATES.map((t) => ({
    key: t.key,
    icon: t.icon,
    name: t.name,
    description: t.description,
    pageCount: t.pages.length,
  })));
});

// POST /templates/:key/apply — instantiate template under consultancy
router.post('/templates/:key/apply', async (req: AuthenticatedRequest, res) => {
  const consultancyId = req.params['consultancyId'] as string;
  const key = req.params['key'] as CentralTemplateKey;
  const userId = req.userId as string;
  const guard = await ensureOwnership(userId, consultancyId);
  if (!guard.ok) return res.status(guard.status).json({ error: guard.error });

  if (!IRIS_TEMPLATES.find((t) => t.key === key)) {
    return res.status(404).json({ error: 'Template not found' });
  }

  try {
    const created = await applyTemplate(consultancyId, userId, key);
    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

export default router;
