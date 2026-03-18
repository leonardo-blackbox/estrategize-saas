import { Router } from 'express';
import { z } from 'zod';
import { randomUUID } from 'crypto';
import { requireAuth, type AuthenticatedRequest } from '../middleware/auth.js';
import { supabaseAdmin } from '../lib/supabaseAdmin.js';

const router = Router();

// All routes require authentication
router.use(requireAuth);

// ─── Types ───────────────────────────────────────────────────────────────────

type FieldType =
  | 'welcome'
  | 'message'
  | 'short_text'
  | 'long_text'
  | 'name'
  | 'email'
  | 'phone'
  | 'multiple_choice'
  | 'number'
  | 'date'
  | 'thank_you';

// ─── Defaults ────────────────────────────────────────────────────────────────

const DEFAULT_THEME = {
  backgroundColor: '#000000',
  questionColor: '#f5f5f7',
  answerColor: '#f5f5f7',
  buttonColor: '#7c5cfc',
  buttonTextColor: '#ffffff',
  fontFamily: 'Inter',
  borderRadius: 12,
  logoPosition: 'left' as const,
};

const DEFAULT_SETTINGS = {
  limitOneResponsePerSession: false,
  showProgressBar: true,
  showQuestionNumbers: true,
  thankYouTitle: 'Obrigado!',
  thankYouMessage: 'Suas respostas foram recebidas.',
};

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
  // null id = new field, will get a new UUID
  id: z.preprocess((v) => (v == null ? undefined : v), z.string().uuid().optional()),
  type: z.enum([
    'welcome',
    'message',
    'short_text',
    'long_text',
    'name',
    'email',
    'phone',
    'multiple_choice',
    'number',
    'date',
    'thank_you',
  ] as [FieldType, ...FieldType[]]),
  // Supabase returns null for unset columns — preprocess to safe defaults
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

/** Verify ownership and return the application row, or null if not found. */
async function getOwnedApplication(userId: string, applicationId: string) {
  if (!supabaseAdmin) return null;

  const { data, error } = await supabaseAdmin
    .from('applications')
    .select('*')
    .eq('id', applicationId)
    .eq('user_id', userId)
    .single();

  if (error || !data) return null;
  return data;
}

/** Call the generate_application_slug DB function. */
async function generateSlug(title: string, excludeId?: string): Promise<string> {
  if (!supabaseAdmin) throw new Error('Database unavailable');

  const { data, error } = await supabaseAdmin.rpc('generate_application_slug', {
    title,
    exclude_id: excludeId ?? null,
  });

  if (error) throw new Error(error.message);
  return data as string;
}

// ─── Routes ──────────────────────────────────────────────────────────────────

// GET /api/applications
router.get('/', async (req: AuthenticatedRequest, res) => {
  try {
    if (!supabaseAdmin) {
      res.status(503).json({ error: 'Database unavailable' });
      return;
    }

    const { data: applications, error } = await supabaseAdmin
      .from('applications')
      .select('*, application_fields(count)')
      .eq('user_id', req.userId!)
      .order('created_at', { ascending: false });

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    // Normalise the count shape returned by PostgREST (array with one {count} object)
    const normalised = (applications ?? []).map((app) => {
      const raw = app.application_fields as unknown;
      let fieldCount = 0;
      if (Array.isArray(raw) && raw.length > 0 && typeof raw[0].count === 'number') {
        fieldCount = raw[0].count;
      }
      const { application_fields: _dropped, ...rest } = app as typeof app & {
        application_fields: unknown;
      };
      return { ...rest, field_count: fieldCount };
    });

    res.json({ data: normalised });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
});

// POST /api/applications
router.post('/', async (req: AuthenticatedRequest, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0].message });
    return;
  }

  try {
    if (!supabaseAdmin) {
      res.status(503).json({ error: 'Database unavailable' });
      return;
    }

    const { title } = parsed.data;
    const slug = await generateSlug(title);

    // Insert application
    const { data: application, error: appError } = await supabaseAdmin
      .from('applications')
      .insert({
        user_id: req.userId!,
        title,
        slug,
        status: 'draft',
        theme_config: DEFAULT_THEME,
        settings: DEFAULT_SETTINGS,
      })
      .select()
      .single();

    if (appError || !application) {
      res.status(500).json({ error: appError?.message ?? 'Failed to create application' });
      return;
    }

    // Insert default welcome + thank_you fields
    const defaultFields = [
      {
        id: randomUUID(),
        application_id: application.id,
        position: 0,
        type: 'welcome' as FieldType,
        title: 'Bem-vindo(a)!',
        required: false,
        options: { buttonText: 'Começar →', description: '' },
        conditional_logic: {},
      },
      {
        id: randomUUID(),
        application_id: application.id,
        position: 9999,
        type: 'thank_you' as FieldType,
        title: 'Obrigado pela resposta!',
        required: false,
        options: {},
        conditional_logic: {},
      },
    ];

    const { error: fieldsError } = await supabaseAdmin
      .from('application_fields')
      .insert(defaultFields);

    if (fieldsError) {
      // Application was created; log and continue — fields can be added later
      console.error('[applications] Failed to insert default fields:', fieldsError.message);
    }

    res.status(201).json({ data: application });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
});

// GET /api/applications/:id
router.get('/:id', async (req: AuthenticatedRequest, res) => {
  try {
    if (!supabaseAdmin) {
      res.status(503).json({ error: 'Database unavailable' });
      return;
    }

    const application = await getOwnedApplication(req.userId!, paramId(req));
    if (!application) {
      res.status(404).json({ error: 'Aplicação não encontrada' });
      return;
    }

    const { data: fields, error: fieldsError } = await supabaseAdmin
      .from('application_fields')
      .select('*')
      .eq('application_id', application.id)
      .order('position', { ascending: true });

    if (fieldsError) {
      res.status(500).json({ error: fieldsError.message });
      return;
    }

    res.json({ data: { ...application, fields: fields ?? [] } });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
});

// PUT /api/applications/:id
router.put('/:id', async (req: AuthenticatedRequest, res) => {
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0].message });
    return;
  }

  try {
    if (!supabaseAdmin) {
      res.status(503).json({ error: 'Database unavailable' });
      return;
    }

    const id = paramId(req);
    const existing = await getOwnedApplication(req.userId!, id);
    if (!existing) {
      res.status(404).json({ error: 'Aplicação não encontrada' });
      return;
    }

    const updates: Record<string, unknown> = { ...parsed.data };

    // If title changed, regenerate slug
    if (parsed.data.title && parsed.data.title !== existing.title) {
      updates.slug = await generateSlug(parsed.data.title, id);
    }

    const { data: updated, error } = await supabaseAdmin
      .from('applications')
      .update(updates)
      .eq('id', id)
      .eq('user_id', req.userId!)
      .select()
      .single();

    if (error || !updated) {
      res.status(500).json({ error: error?.message ?? 'Update failed' });
      return;
    }

    res.json({ data: updated });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
});

// DELETE /api/applications/:id (soft delete — archives)
router.delete('/:id', async (req: AuthenticatedRequest, res) => {
  try {
    if (!supabaseAdmin) {
      res.status(503).json({ error: 'Database unavailable' });
      return;
    }

    const id = paramId(req);
    const existing = await getOwnedApplication(req.userId!, id);
    if (!existing) {
      res.status(404).json({ error: 'Aplicação não encontrada' });
      return;
    }

    const { error } = await supabaseAdmin
      .from('applications')
      .update({ status: 'archived' })
      .eq('id', id)
      .eq('user_id', req.userId!);

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    res.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
});

// POST /api/applications/:id/duplicate
router.post('/:id/duplicate', async (req: AuthenticatedRequest, res) => {
  try {
    if (!supabaseAdmin) {
      res.status(503).json({ error: 'Database unavailable' });
      return;
    }

    const id = paramId(req);
    const source = await getOwnedApplication(req.userId!, id);
    if (!source) {
      res.status(404).json({ error: 'Aplicação não encontrada' });
      return;
    }

    const newTitle = `Cópia de ${source.title}`;
    const newSlug = await generateSlug(newTitle);

    // Insert duplicated application
    const { data: copy, error: copyError } = await supabaseAdmin
      .from('applications')
      .insert({
        user_id: req.userId!,
        title: newTitle,
        slug: newSlug,
        status: 'draft',
        theme_config: source.theme_config,
        settings: source.settings,
      })
      .select()
      .single();

    if (copyError || !copy) {
      res.status(500).json({ error: copyError?.message ?? 'Duplication failed' });
      return;
    }

    // Copy fields from source
    const { data: sourceFields, error: fieldsReadError } = await supabaseAdmin
      .from('application_fields')
      .select('*')
      .eq('application_id', id)
      .order('position', { ascending: true });

    if (fieldsReadError) {
      res.status(500).json({ error: fieldsReadError.message });
      return;
    }

    if (sourceFields && sourceFields.length > 0) {
      const fieldCopies = sourceFields.map((f) => ({
        id: randomUUID(),
        application_id: copy.id,
        position: f.position,
        type: f.type,
        title: f.title,
        description: f.description,
        required: f.required,
        options: f.options,
        conditional_logic: f.conditional_logic,
      }));

      const { error: fieldsInsertError } = await supabaseAdmin
        .from('application_fields')
        .insert(fieldCopies);

      if (fieldsInsertError) {
        console.error('[applications] Duplicate fields error:', fieldsInsertError.message);
      }
    }

    res.status(201).json({ data: copy });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
});

// PUT /api/applications/:id/fields  — bulk replace all fields
router.put('/:id/fields', async (req: AuthenticatedRequest, res) => {
  // Normalize nulls from Supabase/frontend before Zod sees them
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
    if (!supabaseAdmin) {
      res.status(503).json({ error: 'Database unavailable' });
      return;
    }

    const id = paramId(req);
    const existing = await getOwnedApplication(req.userId!, id);
    if (!existing) {
      res.status(404).json({ error: 'Aplicação não encontrada' });
      return;
    }

    // Step 1: delete all existing fields for this application
    const { error: deleteError } = await supabaseAdmin
      .from('application_fields')
      .delete()
      .eq('application_id', id);

    if (deleteError) {
      res.status(500).json({ error: deleteError.message });
      return;
    }

    // Step 2: insert new fields (if any)
    const { fields } = parsed.data;

    if (fields.length === 0) {
      res.json({ data: [] });
      return;
    }

    const newFields = fields.map((f, index) => ({
      id: f.id ?? randomUUID(),
      application_id: id,
      position: index * 10,
      type: f.type,
      title: f.title,
      description: f.description ?? null,
      required: f.required,
      options: f.options ?? [],
      conditional_logic: f.conditional_logic ?? {},
    }));

    const { data: inserted, error: insertError } = await supabaseAdmin
      .from('application_fields')
      .insert(newFields)
      .select();

    if (insertError) {
      res.status(500).json({ error: insertError.message });
      return;
    }

    res.json({ data: inserted ?? [] });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
});

// GET /api/applications/:id/responses  — paginated response list
router.get('/:id/responses', async (req: AuthenticatedRequest, res) => {
  try {
    if (!supabaseAdmin) {
      res.status(503).json({ error: 'Database unavailable' });
      return;
    }

    const id = paramId(req);
    const existing = await getOwnedApplication(req.userId!, id);
    if (!existing) {
      res.status(404).json({ error: 'Aplicação não encontrada' });
      return;
    }

    const page  = Math.max(1, parseInt(String(req.query.page  ?? '1'),  10));
    const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit ?? '20'), 10)));
    const from  = (page - 1) * limit;
    const to    = from + limit - 1;

    const { data: responses, error, count } = await supabaseAdmin
      .from('application_responses')
      .select(
        `
        *,
        answers:application_response_answers (field_id, field_type, field_title, value)
        `,
        { count: 'exact' },
      )
      .eq('application_id', id)
      .eq('status', 'complete')
      .order('submitted_at', { ascending: false })
      .range(from, to);

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    res.json({
      data: {
        responses: responses ?? [],
        pagination: {
          page,
          limit,
          total: count ?? 0,
          pages: Math.ceil((count ?? 0) / limit),
        },
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
});

// GET /api/applications/:id/responses/export  — full export for CSV generation
router.get('/:id/responses/export', async (req: AuthenticatedRequest, res) => {
  try {
    if (!supabaseAdmin) {
      res.status(503).json({ error: 'Database unavailable' });
      return;
    }

    const id = paramId(req);
    const existing = await getOwnedApplication(req.userId!, id);
    if (!existing) {
      res.status(404).json({ error: 'Aplicação não encontrada' });
      return;
    }

    const { data: responses, error } = await supabaseAdmin
      .from('application_responses')
      .select(
        `
        *,
        answers:application_response_answers (field_id, field_type, field_title, value)
        `,
      )
      .eq('application_id', id)
      .eq('status', 'complete')
      .order('submitted_at', { ascending: false });

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    res.json({ data: responses ?? [] });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
});

// DELETE /api/applications/:id/responses/:responseId
router.delete('/:id/responses/:responseId', async (req: AuthenticatedRequest, res) => {
  try {
    if (!supabaseAdmin) {
      res.status(503).json({ error: 'Database unavailable' });
      return;
    }

    const id = paramId(req);
    const existing = await getOwnedApplication(req.userId!, id);
    if (!existing) {
      res.status(404).json({ error: 'Aplicação não encontrada' });
      return;
    }

    const responseId = Array.isArray(req.params.responseId)
      ? req.params.responseId[0]
      : req.params.responseId;

    // Verify response belongs to this application
    const { data: responseRow, error: fetchError } = await supabaseAdmin
      .from('application_responses')
      .select('id')
      .eq('id', responseId)
      .eq('application_id', id)
      .single();

    if (fetchError || !responseRow) {
      res.status(404).json({ error: 'Resposta não encontrada' });
      return;
    }

    // Delete answers first (in case no cascade)
    await supabaseAdmin
      .from('application_response_answers')
      .delete()
      .eq('response_id', responseId);

    // Delete response
    const { error } = await supabaseAdmin
      .from('application_responses')
      .delete()
      .eq('id', responseId)
      .eq('application_id', id);

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    res.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
});

export default router;
