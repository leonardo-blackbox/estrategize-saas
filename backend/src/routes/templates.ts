import { Router } from 'express';
import { supabaseAdmin } from '../lib/supabaseAdmin.js';
import { requireAuth, type AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();

// GET /api/templates
router.get('/', async (_req, res) => {
  if (!supabaseAdmin) {
    res.status(503).json({ error: 'Not configured' });
    return;
  }
  const { data, error } = await supabaseAdmin
    .from('application_templates')
    .select('id, name, description, category, thumbnail_color')
    .eq('is_active', true)
    .order('created_at');

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }
  res.json({ data });
});

// POST /api/templates/:tid/create (auth'd — create application from template)
router.post('/:tid/create', requireAuth, async (req: AuthenticatedRequest, res) => {
  if (!supabaseAdmin) {
    res.status(503).json({ error: 'Not configured' });
    return;
  }

  const { data: template, error: tmplErr } = await supabaseAdmin
    .from('application_templates')
    .select('*')
    .eq('id', req.params.tid)
    .eq('is_active', true)
    .single();

  if (tmplErr || !template) {
    res.status(404).json({ error: 'Template not found' });
    return;
  }

  // Generate slug
  const { data: slugData } = await supabaseAdmin.rpc('generate_application_slug', {
    p_title: template.name,
  });

  const { data: app, error: appErr } = await supabaseAdmin
    .from('applications')
    .insert({
      user_id: req.userId,
      title: template.name,
      slug: slugData,
      status: 'draft',
      theme_config: template.theme_config || {
        backgroundColor: '#000000',
        questionColor: '#f5f5f7',
        answerColor: '#f5f5f7',
        buttonColor: '#7c5cfc',
        buttonTextColor: '#ffffff',
        fontFamily: 'Inter',
        borderRadius: 12,
        logoPosition: 'left',
      },
      settings: template.settings || {
        limitOneResponsePerSession: false,
        showProgressBar: true,
        showQuestionNumbers: true,
        thankYouTitle: 'Obrigado!',
        thankYouMessage: 'Suas respostas foram recebidas.',
      },
    })
    .select()
    .single();

  if (appErr || !app) {
    res.status(500).json({ error: 'Failed to create application' });
    return;
  }

  // Insert fields from template
  const fields = (template.fields as Array<Record<string, unknown>>) || [];
  if (fields.length > 0) {
    const fieldInserts = fields.map((f, i) => ({
      application_id: app.id,
      position: typeof f.position === 'number' ? f.position : i,
      type: f.type,
      title: f.title || '',
      description: f.description || null,
      required: f.required ?? false,
      options: f.options ?? {},
      conditional_logic: f.conditional_logic ?? { enabled: false, conditions: [] },
    }));

    await supabaseAdmin.from('application_fields').insert(fieldInserts);
  }

  res.status(201).json({ data: app });
});

export default router;
