import { Router } from 'express';
import { z } from 'zod';
import rateLimit from 'express-rate-limit';
import { requireAuth, type AuthenticatedRequest } from '../../middleware/auth.js';
import * as formSvc from '../../services/formSubmissionService.js';

const router = Router();

const publicFormLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please try again later.' },
});
router.use(publicFormLimit);

const answerItemSchema = z.object({
  field_id:    z.string().uuid(),
  field_type:  z.string().optional().default(''),
  field_title: z.string().optional().default(''),
  value:       z.unknown(),
});

const submitSchema = z.object({
  answers:  z.array(answerItemSchema).min(0),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

// POST /api/forms/:slug/events
router.post('/:slug/events', async (req, res) => {
  res.json({ ok: true });
  if (formSvc.isBotRequest(req)) return;
  try {
    const { event, session_token, event_id, page_url, fbc, fbp } = req.body;
    await formSvc.trackEvent(
      req.params.slug, event,
      { session_token, event_id, page_url, fbc, fbp },
      formSvc.getPublicClientIp(req), req.headers['user-agent'] as string | undefined,
    );
  } catch { /* fire-and-forget */ }
});

// GET /api/forms/:slug/preview
router.get('/:slug/preview', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const result = await formSvc.getPreviewForm(req.params.slug as string, req.userId as string);
    if (result.notFound) return res.status(404).json({ error: 'Formulário não encontrado' });
    if (result.forbidden) return res.status(403).json({ error: 'Acesso negado' });
    res.json({ data: result.data });
  } catch (err: unknown) { const message = err instanceof Error ? err.message : String(err); res.status(500).json({ error: message }); }
});

// GET /api/forms/:slug
router.get('/:slug', async (req, res) => {
  try {
    const data = await formSvc.getPublishedForm(req.params.slug);
    if (!data) return res.status(404).json({ error: 'Formulário não encontrado' });
    res.json({ data });
  } catch (err: unknown) { const message = err instanceof Error ? err.message : String(err); res.status(500).json({ error: message }); }
});

// POST /api/forms/:slug/responses
router.post('/:slug/responses', async (req, res) => {
  if (formSvc.isBotRequest(req)) return res.status(200).json({ data: { response_id: null } });
  const parsed = submitSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message });
  try {
    const { answers, metadata } = parsed.data;
    const result = await formSvc.submitResponse(
      req.params.slug,
      answers as formSvc.AnswerItem[],
      metadata ?? {},
      formSvc.getPublicClientIp(req),
      req.headers['user-agent'] as string | undefined,
    );
    if (result.notFound) return res.status(404).json({ error: 'Formulário não encontrado' });
    res.status(201).json({ data: { response_id: result.responseId } });
  } catch (err: unknown) { const message = err instanceof Error ? err.message : String(err); res.status(500).json({ error: message }); }
});

// GET /api/forms/:slug/capi-test
router.get('/:slug/capi-test', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const result = await formSvc.testCapi(req.params.slug as string, req.userId as string, req.headers['user-agent'] as string | undefined);
    if ('forbidden' in result && result.forbidden) return res.status(403).json({ error: 'Acesso negado' });
    res.json(result);
  } catch (err: unknown) { const message = err instanceof Error ? err.message : String(err); res.status(500).json({ error: message }); }
});

export default router;
