import { Router } from 'express';
import { z } from 'zod';
import rateLimit from 'express-rate-limit';
import { supabaseAdmin } from '../../lib/supabaseAdmin.js';
import { notifyNewResponse } from '../../services/emailNotificationService.js';

const router = Router();

// ─── Rate limiting ────────────────────────────────────────────────────────────

const publicFormLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please try again later.' },
});

router.use(publicFormLimit);

// ─── Zod Schemas ─────────────────────────────────────────────────────────────

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

// ─── Routes ──────────────────────────────────────────────────────────────────

// POST /api/forms/:slug/events — fire-and-forget event tracking
router.post('/:slug/events', async (req, res) => {
  res.json({ ok: true }); // respond immediately

  if (!supabaseAdmin) return;

  const { event, session_token } = req.body as { event: string; session_token?: string };
  if (!['view', 'start'].includes(event)) return;

  try {
    const { data: app } = await supabaseAdmin
      .from('applications')
      .select('id')
      .eq('slug', req.params.slug)
      .eq('status', 'published')
      .single();

    if (!app) return;

    await supabaseAdmin.from('application_events').insert({
      application_id: app.id,
      event_type: event,
      session_token: session_token || null,
    });
  } catch { /* ignore */ }
});

// GET /public/forms/:slug  — fetch published form + fields
router.get('/:slug', async (req, res) => {
  try {
    if (!supabaseAdmin) {
      res.status(503).json({ error: 'Database unavailable' });
      return;
    }

    const { slug } = req.params;

    const { data: application, error } = await supabaseAdmin
      .from('applications')
      .select('id, title, slug, status, theme_config, settings, response_count, created_at')
      .eq('slug', slug)
      .eq('status', 'published')
      .single();

    if (error || !application) {
      res.status(404).json({ error: 'Formulário não encontrado' });
      return;
    }

    const { data: fields, error: fieldsError } = await supabaseAdmin
      .from('application_fields')
      .select(
        'id, position, type, title, description, required, options, conditional_logic',
      )
      .eq('application_id', application.id)
      .order('position', { ascending: true });

    if (fieldsError) {
      res.status(500).json({ error: fieldsError.message });
      return;
    }

    res.json({ data: { application, fields: fields ?? [] } });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
});

// POST /api/forms/:slug/responses  — submit a completed response
router.post('/:slug/responses', async (req, res) => {
  const parsed = submitSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0].message });
    return;
  }

  try {
    if (!supabaseAdmin) {
      res.status(503).json({ error: 'Database unavailable' });
      return;
    }

    const { slug } = req.params;
    const { answers, metadata } = parsed.data;

    // Verify the form exists and is published
    const { data: application, error: appError } = await supabaseAdmin
      .from('applications')
      .select('id, status, settings')
      .eq('slug', slug)
      .eq('status', 'published')
      .single();

    if (appError || !application) {
      res.status(404).json({ error: 'Formulário não encontrado' });
      return;
    }

    // Insert response
    const { data: response, error: responseError } = await supabaseAdmin
      .from('application_responses')
      .insert({
        application_id: application.id,
        status: 'complete',
        submitted_at: new Date().toISOString(),
        metadata: metadata ?? {},
      })
      .select('id')
      .single();

    if (responseError || !response) {
      res.status(500).json({ error: responseError?.message ?? 'Failed to save response' });
      return;
    }

    // Insert all answers (skip if none provided)
    if (answers.length > 0) {
      const answerRows = answers.map((a) => ({
        response_id: response.id,
        field_id:    a.field_id,
        field_type:  a.field_type,
        field_title: a.field_title,
        value:       a.value ?? null,
      }));

      const { error: answersError } = await supabaseAdmin
        .from('application_response_answers')
        .insert(answerRows);

      if (answersError) {
        console.error('[public/forms] Failed to insert answers:', answersError.message);
        // Response row was already committed; log and continue
      }
    }

    res.status(201).json({ data: { response_id: response.id } });

    // Trigger email notification (async, non-blocking)
    const answersToInsert = answers.map((a) => ({
      field_id:    a.field_id,
      field_type:  a.field_type,
      field_title: a.field_title,
      value:       a.value ?? null,
    }));
    ;(async () => {
      try {
        if (!supabaseAdmin) return;
        const { data: appData } = await supabaseAdmin
          .from('applications')
          .select('id, title, settings, user_id')
          .eq('slug', slug)
          .single();

        if (!appData) return;

        const settings = appData.settings as Record<string, unknown>;
        const notifications = settings?.notifications as Record<string, unknown> | undefined;
        if (!notifications?.emailEnabled) return;

        // Get the user's email
        const { data: { user } } = await supabaseAdmin.auth.admin.getUserById(appData.user_id as string);
        if (!user?.email) return;

        const emailTo = (notifications.emailTo as string) || user.email;
        const emailCc = notifications.emailCc as string | undefined;

        // Format answers for email
        const emailAnswers = answersToInsert.map((a) => ({
          field_title: a.field_title || 'Campo',
          value: a.value,
        }));

        await notifyNewResponse({
          to: emailTo,
          cc: emailCc,
          applicationTitle: appData.title as string,
          applicationId: appData.id as string,
          responseId: response.id,
          answers: emailAnswers,
          submittedAt: new Date().toISOString(),
        });
      } catch (err) {
        console.error('[forms] Email notification failed:', err);
      }
    })();
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
});

export default router;
