import { Router } from 'express';
import { z } from 'zod';
import { supabaseAdmin } from '../lib/supabaseAdmin.js';
import { requireAuth, type AuthenticatedRequest } from '../middleware/auth.js';
import {
  getUserCoursesCatalog,
  resolveCourseAccess,
  resolveLessonAccess,
} from '../services/entitlementsService.js';

const router = Router();

// ─── GET /api/courses — catálogo com entitlements ─────────────
router.get('/', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const catalog = await getUserCoursesCatalog(req.userId!);
    res.json(catalog);
  } catch (err) {
    console.error('GET /api/courses error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── GET /api/courses/:id — detalhe do curso ──────────────────
router.get('/:id', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    if (!supabaseAdmin) return res.status(503).json({ error: 'DB unavailable' });

    const id = req.params.id as string;

    const { data: course, error } = await supabaseAdmin
      .from('courses')
      .select(`
        id, title, description, cover_url, status, sort_order,
        modules (
          id, title, description, sort_order, drip_days,
          lessons (
            id, title, description, duration_secs, sort_order, drip_days, is_free_preview,
            lesson_attachments (id, title, file_type, file_size)
          )
        )
      `)
      .eq('id', id)
      .eq('status', 'published')
      .single();

    if (error || !course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    // Verificar acesso
    const access = await resolveCourseAccess(req.userId!, id);

    // Buscar progresso das aulas
    const { data: progress } = await supabaseAdmin
      .from('lesson_progress')
      .select('lesson_id, watched_secs, completed, last_watched')
      .eq('user_id', req.userId!);

    const progressMap = Object.fromEntries(
      (progress ?? []).map((p) => [p.lesson_id, p]),
    );

    res.json({ course, access, progress: progressMap });
  } catch (err) {
    console.error('GET /api/courses/:id error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── GET /api/courses/lessons/:lessonId — acesso à aula ───────
router.get('/lessons/:lessonId', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    if (!supabaseAdmin) return res.status(503).json({ error: 'DB unavailable' });

    const lessonId = req.params.lessonId as string;

    const access = await resolveLessonAccess(req.userId!, lessonId);

    if (!access.allowed) {
      return res.status(403).json({ error: 'Access denied', reason: access.reason, unlocksAt: access.unlocksAt });
    }

    const { data: lesson, error } = await supabaseAdmin
      .from('lessons')
      .select(`
        id, title, description, video_url, duration_secs, sort_order,
        lesson_attachments (id, title, file_url, file_type, file_size, sort_order),
        modules!inner (
          id, title, sort_order,
          courses!inner (id, title)
        )
      `)
      .eq('id', lessonId)
      .single();

    if (error || !lesson) return res.status(404).json({ error: 'Lesson not found' });

    // Buscar progresso desta aula
    const { data: progress } = await supabaseAdmin
      .from('lesson_progress')
      .select('watched_secs, completed, last_watched')
      .eq('user_id', req.userId!)
      .eq('lesson_id', lessonId)
      .single();

    res.json({ lesson, progress: progress ?? null });
  } catch (err) {
    console.error('GET /api/courses/lessons/:id error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── PATCH /api/courses/lessons/:lessonId/progress ────────────
const progressSchema = z.object({
  watched_secs: z.number().int().min(0),
  completed: z.boolean().optional(),
});

router.patch('/lessons/:lessonId/progress', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    if (!supabaseAdmin) return res.status(503).json({ error: 'DB unavailable' });

    const parsed = progressSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

    const { lessonId } = req.params;
    const { watched_secs, completed } = parsed.data;

    const upsertData: Record<string, unknown> = {
      user_id: req.userId!,
      lesson_id: lessonId,
      watched_secs,
      last_watched: new Date().toISOString(),
    };

    if (completed !== undefined) {
      upsertData.completed = completed;
      if (completed) upsertData.completed_at = new Date().toISOString();
    }

    const { data, error } = await supabaseAdmin
      .from('lesson_progress')
      .upsert(upsertData, { onConflict: 'user_id,lesson_id' })
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });

    res.json(data);
  } catch (err) {
    console.error('PATCH /api/courses/lessons/:id/progress error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── GET /api/courses/continue-watching ───────────────────────
router.get('/me/continue-watching', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    if (!supabaseAdmin) return res.status(503).json({ error: 'DB unavailable' });

    const { data, error } = await supabaseAdmin
      .from('lesson_progress')
      .select(`
        watched_secs, last_watched,
        lessons!inner (
          id, title, duration_secs,
          modules!inner (
            id, title,
            courses!inner (id, title, cover_url)
          )
        )
      `)
      .eq('user_id', req.userId!)
      .eq('completed', false)
      .order('last_watched', { ascending: false })
      .limit(10);

    if (error) return res.status(500).json({ error: error.message });

    res.json(data ?? []);
  } catch (err) {
    console.error('GET /api/courses/me/continue-watching error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
