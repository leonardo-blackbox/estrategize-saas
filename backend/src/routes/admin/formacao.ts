import { Router } from 'express';
import { z } from 'zod';
import { supabaseAdmin } from '../../lib/supabaseAdmin.js';
import { requireAuth } from '../../middleware/auth.js';
import { requireAdmin } from '../../middleware/admin.js';

const router = Router();
router.use(requireAuth, requireAdmin);

// ─── LIST SECTIONS (with nested courses) ───────────────────────
router.get('/sections', async (_req, res) => {
  const { data, error } = await supabaseAdmin!
    .from('formation_sections')
    .select(`
      id, title, sort_order, is_active, created_at,
      formation_section_courses (
        sort_order,
        courses (id, title, cover_url, status)
      )
    `)
    .order('sort_order', { ascending: true });

  if (error) return res.status(500).json({ error: error.message });
  res.json(data ?? []);
});

// ─── CREATE SECTION ─────────────────────────────────────────────
const createSectionSchema = z.object({
  title: z.string().min(1).max(100),
  sort_order: z.number().int().optional(),
});

router.post('/sections', async (req, res) => {
  const parsed = createSectionSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const { data, error } = await supabaseAdmin!
    .from('formation_sections')
    .insert(parsed.data)
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

// ─── BATCH REORDER (must be before /:id) ────────────────────────
const reorderSchema = z.object({
  items: z.array(z.object({
    id: z.string().uuid(),
    sort_order: z.number().int(),
  })).min(1),
});

router.patch('/sections/reorder', async (req, res) => {
  const parsed = reorderSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const updates = parsed.data.items.map(({ id, sort_order }) =>
    supabaseAdmin!
      .from('formation_sections')
      .update({ sort_order })
      .eq('id', id),
  );

  const results = await Promise.all(updates);
  const failed = results.find((r) => r.error);
  if (failed) return res.status(500).json({ error: failed.error!.message });

  res.json({ ok: true });
});

// ─── UPDATE SECTION ─────────────────────────────────────────────
const updateSectionSchema = z.object({
  title: z.string().min(1).max(100).optional(),
  sort_order: z.number().int().optional(),
  is_active: z.boolean().optional(),
}).refine((d) => Object.values(d).some((v) => v !== undefined), {
  message: 'At least one field required',
});

router.patch('/sections/:id', async (req, res) => {
  const parsed = updateSectionSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const { data, error } = await supabaseAdmin!
    .from('formation_sections')
    .update(parsed.data)
    .eq('id', req.params.id)
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  if (!data) return res.status(404).json({ error: 'Section not found' });
  res.json(data);
});

// ─── DELETE SECTION ─────────────────────────────────────────────
router.delete('/sections/:id', async (req, res) => {
  const force = req.query.force === 'true';

  if (!force) {
    const { count } = await supabaseAdmin!
      .from('formation_section_courses')
      .select('*', { count: 'exact', head: true })
      .eq('section_id', req.params.id);

    if ((count ?? 0) > 0) {
      return res.status(409).json({
        error: 'Section has courses. Use ?force=true to delete anyway.',
        course_count: count,
      });
    }
  }

  const { error } = await supabaseAdmin!
    .from('formation_sections')
    .delete()
    .eq('id', req.params.id);

  if (error) return res.status(500).json({ error: error.message });
  res.json({ ok: true });
});

// ─── REPLACE SECTION COURSES ────────────────────────────────────
const sectionCoursesSchema = z.object({
  courses: z.array(z.object({
    course_id: z.string().uuid(),
    sort_order: z.number().int(),
  })),
});

router.put('/sections/:id/courses', async (req, res) => {
  const parsed = sectionCoursesSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  // Delete existing associations for this section
  const { error: delError } = await supabaseAdmin!
    .from('formation_section_courses')
    .delete()
    .eq('section_id', req.params.id);

  if (delError) return res.status(500).json({ error: delError.message });

  if (parsed.data.courses.length === 0) {
    return res.json({ ok: true, count: 0 });
  }

  const rows = parsed.data.courses.map((c) => ({
    section_id: req.params.id,
    course_id: c.course_id,
    sort_order: c.sort_order,
  }));

  const { error: insError } = await supabaseAdmin!
    .from('formation_section_courses')
    .insert(rows);

  if (insError) return res.status(500).json({ error: insError.message });
  res.json({ ok: true, count: rows.length });
});

export default router;
