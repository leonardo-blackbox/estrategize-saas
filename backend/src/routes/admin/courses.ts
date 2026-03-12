import { Router } from 'express';
import { z } from 'zod';
import multer from 'multer';
import { supabaseAdmin } from '../../lib/supabaseAdmin.js';
import { requireAuth } from '../../middleware/auth.js';
import { requireAdmin } from '../../middleware/admin.js';

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const BUCKET = process.env.STORAGE_BUCKET_COURSES ?? 'course-covers';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de arquivo inválido. Use JPEG, PNG ou WebP.'));
    }
  },
});

const router = Router();
router.use(requireAuth, requireAdmin);

// ─── COURSES CRUD ──────────────────────────────────────────────

const courseSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  cover_url: z.string().url().optional().nullable(),
  banner_url: z.string().url().optional().nullable(),
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
    .select(`*, modules (*, lessons (*, lesson_attachments (*), lesson_links (*)))`)
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

// ─── COVER IMAGE UPLOAD ────────────────────────────────────────

router.post('/:id/cover', (req, res, next) => {
  upload.single('file')(req, res, (err) => {
    if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'Arquivo muito grande. Tamanho máximo: 5 MB.' });
    }
    if (err) {
      return res.status(400).json({ error: err.message });
    }
    next();
  });
}, async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Nenhum arquivo enviado.' });
  }

  const courseId = req.params.id;

  const ext = req.file.originalname.split('.').pop() ?? 'jpg';
  const storagePath = `courses/${courseId}/${Date.now()}-cover.${ext}`;

  const { error: uploadError } = await supabaseAdmin!.storage
    .from(BUCKET)
    .upload(storagePath, req.file.buffer, {
      contentType: req.file.mimetype,
      upsert: true,
    });

  if (uploadError) {
    return res.status(500).json({ error: uploadError.message });
  }

  const { data: publicData } = supabaseAdmin!.storage
    .from(BUCKET)
    .getPublicUrl(storagePath);

  const coverUrl = publicData.publicUrl;

  // Update DB only if course already exists (create flow uses pendingId before course is saved)
  const { data: existing } = await supabaseAdmin!
    .from('courses')
    .select('id')
    .eq('id', courseId)
    .maybeSingle();

  if (existing) {
    const { error: updateError } = await supabaseAdmin!
      .from('courses')
      .update({ cover_url: coverUrl })
      .eq('id', courseId);

    if (updateError) {
      return res.status(500).json({ error: updateError.message });
    }
  }

  res.json({ cover_url: coverUrl });
});

// ─── BANNER IMAGE UPLOAD ───────────────────────────────────────

router.post('/:id/banner', (req, res, next) => {
  upload.single('file')(req, res, (err) => {
    if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'Arquivo muito grande. Tamanho máximo: 5 MB.' });
    }
    if (err) {
      return res.status(400).json({ error: err.message });
    }
    next();
  });
}, async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Nenhum arquivo enviado.' });
  }

  const courseId = req.params.id;
  const ext = req.file.originalname.split('.').pop() ?? 'jpg';
  const storagePath = `courses/${courseId}/banner-${Date.now()}.${ext}`;

  const { error: uploadError } = await supabaseAdmin!.storage
    .from(BUCKET)
    .upload(storagePath, req.file.buffer, {
      contentType: req.file.mimetype,
      upsert: true,
    });

  if (uploadError) {
    return res.status(500).json({ error: uploadError.message });
  }

  const { data: publicData } = supabaseAdmin!.storage
    .from(BUCKET)
    .getPublicUrl(storagePath);

  const bannerUrl = publicData.publicUrl;

  // Update DB only if course already exists (create flow uses pendingId)
  const { data: existing } = await supabaseAdmin!
    .from('courses')
    .select('id')
    .eq('id', courseId)
    .maybeSingle();

  if (existing) {
    const { error: updateError } = await supabaseAdmin!
      .from('courses')
      .update({ banner_url: bannerUrl })
      .eq('id', courseId);

    if (updateError) {
      return res.status(500).json({ error: updateError.message });
    }
  }

  res.json({ banner_url: bannerUrl });
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

// ─── LESSON LINKS ───────────────────────────────────────────────

const linkSchema = z.object({
  type: z.enum(['link', 'button']),
  label: z.string().min(1).max(200),
  url: z.string().url(),
  sort_order: z.number().int().min(0).optional(),
});

router.post('/lessons/:lessonId/links', async (req, res) => {
  const parsed = linkSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const { data, error } = await supabaseAdmin!
    .from('lesson_links')
    .insert({ ...parsed.data, lesson_id: req.params.lessonId })
    .select()
    .single();
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

router.put('/lessons/links/:linkId', async (req, res) => {
  const parsed = linkSchema.partial().safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const { data, error } = await supabaseAdmin!
    .from('lesson_links')
    .update(parsed.data)
    .eq('id', req.params.linkId)
    .select()
    .single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.delete('/lessons/links/:linkId', async (req, res) => {
  const { error } = await supabaseAdmin!
    .from('lesson_links')
    .delete()
    .eq('id', req.params.linkId);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ ok: true });
});

// ─── COURSE SALES CONFIG ────────────────────────────────────────

const salesSchema = z.object({
  sales_url: z.string().url().optional().nullable(),
  offer_badge_enabled: z.boolean().optional(),
  offer_badge_text: z.string().max(30).optional().nullable(),
});

router.patch('/:id/sales', async (req, res) => {
  const parsed = salesSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const { data, error } = await supabaseAdmin!
    .from('courses')
    .update(parsed.data)
    .eq('id', req.params.id)
    .select('id, sales_url, offer_badge_enabled, offer_badge_text')
    .single();

  if (error) {
    if (error.code === 'PGRST116') return res.status(404).json({ error: 'Course not found' });
    return res.status(500).json({ error: error.message });
  }
  res.json(data);
});

export default router;
