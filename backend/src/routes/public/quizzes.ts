import { Router } from 'express';
import { z } from 'zod';
import rateLimit from 'express-rate-limit';
import { requireAuth, type AuthenticatedRequest } from '../../middleware/auth.js';
import { getPublicClientIp, isBotRequest } from '../../services/formTrackingService.js';
import * as quizSvc from '../../services/quizSubmissionService.js';

const router = Router();
const publicQuizLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please try again later.' },
});
router.use(publicQuizLimit);

const answerItemSchema = z.object({
  field_id: z.string().uuid(),
  field_type: z.string().optional().default(''),
  field_title: z.string().optional().default(''),
  value: z.unknown(),
});
const metaSchema = z.record(z.string(), z.unknown()).optional();
const submitSchema = z.object({ answers: z.array(answerItemSchema), metadata: metaSchema });
const eventSchema = z.object({
  event_type: z.enum(['view', 'start', 'submit']).optional(),
  event: z.enum(['view', 'start', 'submit']).optional(),
  session_token: z.string().optional(),
  event_id: z.string().optional(),
  page_url: z.string().optional(),
  fbc: z.string().optional(),
  fbp: z.string().optional(),
}).refine((body) => body.event_type || body.event, 'event_type é obrigatório');
const leadSchema = z.object({
  answers: z.array(answerItemSchema).optional().default([]),
  session_token: z.string().optional(),
  event_id: z.string().optional(),
  page_url: z.string().optional(),
  fbc: z.string().optional(),
  fbp: z.string().optional(),
});

function userAgent(req: AuthenticatedRequest) {
  return req.headers['user-agent'] as string | undefined;
}

function slugParam(req: AuthenticatedRequest) {
  const slug = req.params.slug;
  return Array.isArray(slug) ? slug[0] : slug;
}

function zodError(error: z.ZodError): string {
  return error.issues[0]?.message ?? 'Dados inválidos';
}

router.post('/:slug/events', async (req, res) => {
  const parsed = eventSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: zodError(parsed.error) });
  res.json({ ok: true });
  if (isBotRequest(req)) return;
  const eventType = parsed.data.event_type ?? parsed.data.event;
  if (!eventType) return;
  try {
    await quizSvc.trackQuizEvent(slugParam(req), eventType, parsed.data, getPublicClientIp(req), userAgent(req));
  } catch { /* fire-and-forget */ }
});

router.post('/:slug/lead-event', async (req, res) => {
  const parsed = leadSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: zodError(parsed.error) });
  res.json({ ok: true });
  if (isBotRequest(req)) return;
  try {
    await quizSvc.fireQuizLeadEvent(slugParam(req), parsed.data.answers, parsed.data, getPublicClientIp(req), userAgent(req));
  } catch { /* fire-and-forget */ }
});

router.get('/:slug/preview', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const result = await quizSvc.getPreviewQuiz(slugParam(req), req.userId as string);
    if (result.notFound) return res.status(404).json({ error: 'Quiz não encontrado' });
    if (result.forbidden) return res.status(403).json({ error: 'Acesso negado' });
    res.json({ data: result.data });
  } catch (err) { res.status(500).json({ error: err instanceof Error ? err.message : String(err) }); }
});

router.get('/:slug', async (req, res) => {
  try {
    const data = await quizSvc.getPublishedQuiz(slugParam(req));
    if (!data) return res.status(404).json({ error: 'Quiz não encontrado' });
    res.json({ data });
  } catch (err) { res.status(500).json({ error: err instanceof Error ? err.message : String(err) }); }
});

router.post('/:slug/responses', async (req, res) => {
  if (isBotRequest(req)) return res.status(400).json({ error: 'Bot request rejected' });
  const parsed = submitSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: zodError(parsed.error) });
  try {
    const result = await quizSvc.submitQuizResponse(
      slugParam(req),
      parsed.data.answers,
      parsed.data.metadata ?? {},
      getPublicClientIp(req),
      userAgent(req),
    );
    if (result.notFound) return res.status(404).json({ error: 'Quiz não encontrado' });
    res.status(201).json({ data: { responseId: result.responseId, score: result.score, outcome: result.outcome } });
  } catch (err) { res.status(500).json({ error: err instanceof Error ? err.message : String(err) }); }
});

export default router;
