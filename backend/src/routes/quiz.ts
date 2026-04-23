import { Router } from 'express';
import { z } from 'zod';
import { requireAuth, type AuthenticatedRequest } from '../middleware/auth.js';
import {
  bulkReplaceFields,
  createApplication,
  deleteApplication,
  duplicateApplication,
  getApplicationById,
  listApplications,
  updateApplication,
  type FieldType,
} from '../services/applicationService.js';

const router = Router();
router.use(requireAuth);

const quizFieldTypes = [
  'welcome', 'message', 'short_text', 'long_text', 'name', 'email', 'phone',
  'multiple_choice', 'number', 'date', 'thank_you', 'image_choice', 'rating',
  'opinion_scale', 'yes_no', 'ranking', 'slider',
] as const satisfies readonly FieldType[];

const createSchema = z.object({ title: z.string().min(1, 'Título é obrigatório').max(200) });
const updateSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  status: z.enum(['draft', 'published', 'archived']).optional(),
  theme_config: z.record(z.string(), z.unknown()).optional(),
  settings: z.record(z.string(), z.unknown()).optional(),
  quiz_config: z.record(z.string(), z.unknown()).nullable().optional(),
});
const fieldItemSchema = z.object({
  id: z.preprocess((v) => (v == null ? undefined : v), z.string().uuid().optional()),
  type: z.enum(quizFieldTypes),
  title: z.preprocess((v) => (v == null ? '' : v), z.string()),
  description: z.preprocess((v) => (v == null ? undefined : v), z.string().optional()),
  required: z.preprocess((v) => (v == null ? false : v), z.boolean()),
  options: z.unknown().optional(),
  conditional_logic: z.unknown().optional(),
});
const bulkFieldsSchema = z.object({ fields: z.array(fieldItemSchema).max(100) });

type QuizData = Awaited<ReturnType<typeof getApplicationById>>;

function paramId(req: AuthenticatedRequest): string {
  const id = req.params.id;
  return Array.isArray(id) ? id[0] : id;
}

function errorMsg(err: unknown): string {
  return err instanceof Error ? err.message : 'Unknown error';
}

function zodError(error: z.ZodError): string {
  const issue = error.issues[0];
  const path = issue.path.length ? ` [${issue.path.join('.')}]` : '';
  return `${issue.message}${path}`;
}

async function getOwnedQuiz(userId: string, id: string): Promise<QuizData> {
  const quiz = await getApplicationById(userId, id);
  if (!quiz || quiz.tool_type !== 'quiz') return null;
  return quiz;
}

router.get('/', async (req: AuthenticatedRequest, res) => {
  try {
    const data = await listApplications(req.userId!, 'quiz');
    res.json({ data });
  } catch (err) { res.status(500).json({ error: errorMsg(err) }); }
});

router.post('/', async (req: AuthenticatedRequest, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: zodError(parsed.error) });
  try {
    const data = await createApplication(req.userId!, parsed.data, 'quiz');
    res.status(201).json({ data });
  } catch (err) { res.status(500).json({ error: errorMsg(err) }); }
});

router.get('/:id', async (req: AuthenticatedRequest, res) => {
  try {
    const data = await getOwnedQuiz(req.userId!, paramId(req));
    if (!data) return res.status(403).json({ error: 'Acesso negado' });
    res.json({ data });
  } catch (err) { res.status(500).json({ error: errorMsg(err) }); }
});

router.put('/:id', async (req: AuthenticatedRequest, res) => {
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: zodError(parsed.error) });
  try {
    const existing = await getOwnedQuiz(req.userId!, paramId(req));
    if (!existing) return res.status(403).json({ error: 'Acesso negado' });
    const data = await updateApplication(req.userId!, paramId(req), parsed.data);
    res.json({ data });
  } catch (err) { res.status(500).json({ error: errorMsg(err) }); }
});

router.delete('/:id', async (req: AuthenticatedRequest, res) => {
  try {
    const existing = await getOwnedQuiz(req.userId!, paramId(req));
    if (!existing) return res.status(403).json({ error: 'Acesso negado' });
    await deleteApplication(req.userId!, paramId(req));
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: errorMsg(err) }); }
});

router.post('/:id/duplicate', async (req: AuthenticatedRequest, res) => {
  try {
    const existing = await getOwnedQuiz(req.userId!, paramId(req));
    if (!existing) return res.status(403).json({ error: 'Acesso negado' });
    const data = await duplicateApplication(req.userId!, paramId(req));
    res.status(201).json({ data });
  } catch (err) { res.status(500).json({ error: errorMsg(err) }); }
});

router.put('/:id/fields', async (req: AuthenticatedRequest, res) => {
  const body = Array.isArray(req.body?.fields) ? {
    fields: (req.body.fields as Record<string, unknown>[]).map((field) => ({
      ...field,
      title: field.title ?? '',
      description: field.description ?? undefined,
      required: field.required ?? false,
    })),
  } : req.body;
  const parsed = bulkFieldsSchema.safeParse(body);
  if (!parsed.success) return res.status(400).json({ error: zodError(parsed.error) });
  try {
    const existing = await getOwnedQuiz(req.userId!, paramId(req));
    if (!existing) return res.status(403).json({ error: 'Acesso negado' });
    const data = await bulkReplaceFields(req.userId!, paramId(req), parsed.data.fields);
    res.json({ data });
  } catch (err) { res.status(500).json({ error: errorMsg(err) }); }
});

export default router;
