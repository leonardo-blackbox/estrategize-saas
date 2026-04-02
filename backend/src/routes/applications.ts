import { Router } from 'express';
import { z } from 'zod';
import { requireAuth, type AuthenticatedRequest } from '../middleware/auth.js';
import {
  listApplications,
  createApplication,
  getApplicationById,
  updateApplication,
  deleteApplication,
  duplicateApplication,
  bulkReplaceFields,
  listResponses,
  exportResponses,
  deleteResponse,
  type FieldType,
} from '../services/applicationService.js';

const router = Router();

router.use(requireAuth);

// ─── Zod Schemas ─────────────────────────────────────────────────────────────

const createSchema = z.object({
  title: z.string().min(1, 'Título é obrigatório').max(200),
});

const updateSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  status: z.enum(['draft', 'published', 'archived']).optional(),
  theme_config: z.record(z.string(), z.unknown()).optional(),
  settings: z.record(z.string(), z.unknown()).optional(),
});

const fieldItemSchema = z.object({
  id: z.preprocess((v) => (v == null ? undefined : v), z.string().uuid().optional()),
  type: z.enum([
    'welcome', 'message', 'short_text', 'long_text', 'name', 'email',
    'phone', 'multiple_choice', 'number', 'date', 'thank_you',
  ] as [FieldType, ...FieldType[]]),
  title: z.preprocess((v) => (v == null ? '' : v), z.string()),
  description: z.preprocess((v) => (v == null ? undefined : v), z.string().optional()),
  required: z.preprocess((v) => (v == null ? false : v), z.boolean()),
  options: z.unknown().optional(),
  conditional_logic: z.unknown().optional(),
});

const bulkFieldsSchema = z.object({
  fields: z.array(fieldItemSchema).max(100),
});

// ─── Helpers ─────────────────────────────────────────────────────────────────

function paramId(req: AuthenticatedRequest): string {
  const id = req.params.id;
  return Array.isArray(id) ? id[0] : id;
}

function errorMsg(err: unknown): string {
  return err instanceof Error ? err.message : 'Unknown error';
}

// ─── Routes ──────────────────────────────────────────────────────────────────

router.get('/', async (req: AuthenticatedRequest, res) => {
  try {
    const data = await listApplications(req.userId!);
    res.json({ data });
  } catch (err) {
    res.status(500).json({ error: errorMsg(err) });
  }
});

router.post('/', async (req: AuthenticatedRequest, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0].message });
    return;
  }
  try {
    const data = await createApplication(req.userId!, parsed.data);
    res.status(201).json({ data });
  } catch (err) {
    res.status(500).json({ error: errorMsg(err) });
  }
});

router.get('/:id', async (req: AuthenticatedRequest, res) => {
  try {
    const data = await getApplicationById(req.userId!, paramId(req));
    if (!data) { res.status(404).json({ error: 'Aplicação não encontrada' }); return; }
    res.json({ data });
  } catch (err) {
    res.status(500).json({ error: errorMsg(err) });
  }
});

router.put('/:id', async (req: AuthenticatedRequest, res) => {
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0].message });
    return;
  }
  try {
    const data = await updateApplication(req.userId!, paramId(req), parsed.data);
    if (!data) { res.status(404).json({ error: 'Aplicação não encontrada' }); return; }
    res.json({ data });
  } catch (err) {
    res.status(500).json({ error: errorMsg(err) });
  }
});

router.delete('/:id', async (req: AuthenticatedRequest, res) => {
  try {
    const result = await deleteApplication(req.userId!, paramId(req));
    if (!result) { res.status(404).json({ error: 'Aplicação não encontrada' }); return; }
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: errorMsg(err) });
  }
});

router.post('/:id/duplicate', async (req: AuthenticatedRequest, res) => {
  try {
    const data = await duplicateApplication(req.userId!, paramId(req));
    if (!data) { res.status(404).json({ error: 'Aplicação não encontrada' }); return; }
    res.status(201).json({ data });
  } catch (err) {
    res.status(500).json({ error: errorMsg(err) });
  }
});

router.put('/:id/fields', async (req: AuthenticatedRequest, res) => {
  if (Array.isArray(req.body?.fields)) {
    req.body.fields = (req.body.fields as Record<string, unknown>[]).map((f) => ({
      ...f,
      title: f.title ?? '',
      description: f.description ?? undefined,
      required: f.required ?? false,
    }));
  }
  const parsed = bulkFieldsSchema.safeParse(req.body);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    const path = issue.path.length ? ` [${issue.path.join('.')}]` : '';
    res.status(400).json({ error: `${issue.message}${path}` });
    return;
  }
  try {
    const data = await bulkReplaceFields(req.userId!, paramId(req), parsed.data.fields);
    if (data === null) { res.status(404).json({ error: 'Aplicação não encontrada' }); return; }
    res.json({ data });
  } catch (err) {
    res.status(500).json({ error: errorMsg(err) });
  }
});

router.get('/:id/responses', async (req: AuthenticatedRequest, res) => {
  try {
    const page = Math.max(1, parseInt(String(req.query.page ?? '1'), 10));
    const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit ?? '20'), 10)));
    const data = await listResponses(req.userId!, paramId(req), page, limit);
    if (!data) { res.status(404).json({ error: 'Aplicação não encontrada' }); return; }
    res.json({ data });
  } catch (err) {
    res.status(500).json({ error: errorMsg(err) });
  }
});

router.get('/:id/responses/export', async (req: AuthenticatedRequest, res) => {
  try {
    const data = await exportResponses(req.userId!, paramId(req));
    if (data === null) { res.status(404).json({ error: 'Aplicação não encontrada' }); return; }
    res.json({ data });
  } catch (err) {
    res.status(500).json({ error: errorMsg(err) });
  }
});

router.delete('/:id/responses/:responseId', async (req: AuthenticatedRequest, res) => {
  try {
    const responseId = Array.isArray(req.params.responseId)
      ? req.params.responseId[0]
      : req.params.responseId;
    const result = await deleteResponse(req.userId!, paramId(req), responseId);
    if (!result) { res.status(404).json({ error: 'Aplicação não encontrada' }); return; }
    if ('found' in result && !result.found) {
      res.status(404).json({ error: 'Resposta não encontrada' });
      return;
    }
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: errorMsg(err) });
  }
});

export default router;
