import { Router } from 'express';
import { z } from 'zod';
import rateLimit from 'express-rate-limit';
import { supabaseAdmin } from '../../lib/supabaseAdmin.js';

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
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
});

export default router;
