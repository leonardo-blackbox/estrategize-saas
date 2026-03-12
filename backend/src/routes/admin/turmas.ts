import { Router } from 'express';
import { z } from 'zod';
import { supabaseAdmin } from '../../lib/supabaseAdmin.js';
import { requireAuth } from '../../middleware/auth.js';
import { requireAdmin } from '../../middleware/admin.js';

const router = Router();
router.use(requireAuth, requireAdmin);

const turmaSchema = z.object({
  course_id: z.string().uuid(),
  name: z.string().min(1).max(200),
  description: z.string().optional().nullable(),
  drip_type: z.enum(['enrollment_date', 'fixed_date']).optional(),
  access_start_date: z.string().datetime().optional().nullable(),
  status: z.enum(['active', 'archived']).optional(),
});

// GET / — list all turmas with course info + enrollment count
router.get('/', async (_req, res) => {
  const { data, error } = await supabaseAdmin!
    .from('turmas')
    .select(`id, name, description, drip_type, access_start_date, status, created_at, course_id,
      courses (id, title, cover_url),
      enrollments (id)`)
    .order('created_at', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });

  const turmas = (data ?? []).map((t: any) => ({
    ...t,
    enrollment_count: Array.isArray(t.enrollments) ? t.enrollments.length : 0,
    enrollments: undefined,
  }));

  res.json({ turmas });
});

// POST / — create turma
router.post('/', async (req, res) => {
  const parsed = turmaSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const { data, error } = await supabaseAdmin!
    .from('turmas')
    .insert(parsed.data)
    .select(`*, courses (id, title)`)
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

// GET /:id — turma detail
router.get('/:id', async (req, res) => {
  const { data, error } = await supabaseAdmin!
    .from('turmas')
    .select(`*, courses (id, title, cover_url)`)
    .eq('id', req.params.id)
    .single();

  if (error || !data) return res.status(404).json({ error: 'Not found' });
  res.json(data);
});

// PUT /:id — update turma
router.put('/:id', async (req, res) => {
  const parsed = turmaSchema.partial().safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const { data, error } = await supabaseAdmin!
    .from('turmas')
    .update(parsed.data)
    .eq('id', req.params.id)
    .select(`*, courses (id, title)`)
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// DELETE /:id — soft delete (archive)
router.delete('/:id', async (req, res) => {
  const { error } = await supabaseAdmin!
    .from('turmas')
    .update({ status: 'archived' })
    .eq('id', req.params.id);

  if (error) return res.status(500).json({ error: error.message });
  res.json({ ok: true });
});

// GET /:id/enrollments — members in this turma
router.get('/:id/enrollments', async (req, res) => {
  const { data, error } = await supabaseAdmin!
    .from('enrollments')
    .select(`id, enrolled_at, user_id, profiles (full_name, email)`)
    .eq('turma_id', req.params.id)
    .order('enrolled_at', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  res.json({ enrollments: data ?? [] });
});

// POST /:id/enrollments — add user to turma
router.post('/:id/enrollments', async (req, res) => {
  const { user_id, course_id } = req.body as { user_id: string; course_id: string };
  if (!user_id) return res.status(400).json({ error: 'user_id required' });

  // Get turma to confirm course_id
  const { data: turma } = await supabaseAdmin!
    .from('turmas')
    .select('course_id')
    .eq('id', req.params.id)
    .single();

  if (!turma) return res.status(404).json({ error: 'Turma not found' });

  const { data, error } = await supabaseAdmin!
    .from('enrollments')
    .insert({ user_id, course_id: turma.course_id, turma_id: req.params.id })
    .select()
    .single();

  if (error) {
    if (error.code === '23505') return res.status(409).json({ error: 'Usuário já matriculado nesta turma' });
    return res.status(500).json({ error: error.message });
  }
  res.status(201).json(data);
});

// DELETE /:id/enrollments/:enrollmentId — remove member from turma
router.delete('/:id/enrollments/:enrollmentId', async (req, res) => {
  const { error } = await supabaseAdmin!
    .from('enrollments')
    .delete()
    .eq('id', req.params.enrollmentId)
    .eq('turma_id', req.params.id);

  if (error) return res.status(500).json({ error: error.message });
  res.json({ ok: true });
});

export default router;
