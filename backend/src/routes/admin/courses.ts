import { Router } from 'express';
import { z } from 'zod';
import { supabaseAdmin } from '../../lib/supabaseAdmin.js';
import { requireAuth } from '../../middleware/auth.js';
import { requireAdmin } from '../../middleware/admin.js';

const router = Router();
router.use(requireAuth, requireAdmin);

// ─── COURSES CRUD ──────────────────────────────────────────────

const courseSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  cover_url: z.string().url().optional().nullable(),
  status: z.enum(['draft', 'published', 'archived']).optional(),
  sort_order: z.number().int().min(0).optional(),
});

router.get('/', async (_req, res) => {
  const { data, error } = await supabaseAdmin!
    .from('courses')
    .select(`id, title, status, cover_url, sort_order, created_at,
      modules (id, lessons (id))`)
    .order('sort_order');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.post('/', async (req, res) => {
  const parsed = courseSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const { data, error } = await supabaseAdmin!
    .from('courses')
    .insert(parsed.data)
    .select()
    .single();
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

router.get('/:id', async (req, res) => {
  const { data, error } = await supabaseAdmin!
    .from('courses')
    .select(`*, modules (*, lessons (*, lesson_attachments (*)))`)
    .eq('id', req.params.id)
    .single();
  if (error || !data) return res.status(404).json({ error: 'Not found' });
  res.json(data);
});

router.put('/:id', async (req, res) => {
  const parsed = courseSchema.partial().safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const { data, error } = await supabaseAdmin!
    .from('courses')
    .update(parsed.data)
    .eq('id', req.params.id)
    .select()
    .single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.delete('/:id', async (req, res) => {
  const { error } = await supabaseAdmin!
    .from('courses')
    .update({ status: 'archived' })
    .eq('id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ ok: true });
});

router.post('/:id/publish', async (req, res) => {
  const { data, error } = await supabaseAdmin!
    .from('courses')
    .update({ status: 'published' })
    .eq('id', req.params.id)
    .select()
    .single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.post('/:id/archive', async (req, res) => {
  const { data, error } = await supabaseAdmin!
    .from('courses')
    .update({ status: 'archived' })
    .eq('id', req.params.id)
    .select()
    .single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// ─── MODULES CRUD ──────────────────────────────────────────────

const moduleSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  sort_order: z.number().int().min(0).optional(),
  drip_days: z.number().int().min(0).optional(),
});

router.post('/:courseId/modules', async (req, res) => {
  const parsed = moduleSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const { data, error } = await supabaseAdmin!
    .from('modules')
    .insert({ ...parsed.data, course_id: req.params.courseId })
    .select()
    .single();
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

router.put('/modules/:id', async (req, res) => {
  const parsed = moduleSchema.partial().safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const { data, error } = await supabaseAdmin!
    .from('modules')
    .update(parsed.data)
    .eq('id', req.params.id)
    .select()
    .single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.delete('/modules/:id', async (req, res) => {
  const { error } = await supabaseAdmin!.from('modules').delete().eq('id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ ok: true });
});

// ─── LESSONS CRUD ──────────────────────────────────────────────

const lessonSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  video_url: z.string().url().optional().nullable(),
  duration_secs: z.number().int().min(0).optional(),
  sort_order: z.number().int().min(0).optional(),
  drip_days: z.number().int().min(0).optional(),
  is_free_preview: z.boolean().optional(),
});

router.post('/modules/:moduleId/lessons', async (req, res) => {
  const parsed = lessonSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const { data, error } = await supabaseAdmin!
    .from('lessons')
    .insert({ ...parsed.data, module_id: req.params.moduleId })
    .select()
    .single();
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

router.put('/lessons/:id', async (req, res) => {
  const parsed = lessonSchema.partial().safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const { data, error } = await supabaseAdmin!
    .from('lessons')
    .update(parsed.data)
    .eq('id', req.params.id)
    .select()
    .single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.delete('/lessons/:id', async (req, res) => {
  const { error } = await supabaseAdmin!.from('lessons').delete().eq('id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ ok: true });
});

// ─── ATTACHMENTS ───────────────────────────────────────────────

const attachmentSchema = z.object({
  title: z.string().min(1),
  file_url: z.string().url(),
  file_type: z.string().optional(),
  file_size: z.number().int().optional(),
  sort_order: z.number().int().min(0).optional(),
});

router.post('/lessons/:lessonId/attachments', async (req, res) => {
  const parsed = attachmentSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const { data, error } = await supabaseAdmin!
    .from('lesson_attachments')
    .insert({ ...parsed.data, lesson_id: req.params.lessonId })
    .select()
    .single();
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

router.delete('/attachments/:id', async (req, res) => {
  const { error } = await supabaseAdmin!
    .from('lesson_attachments')
    .delete()
    .eq('id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ ok: true });
});

export default router;
