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

// ─── GET /api/courses/sections — seções da formação ───────────
router.get('/sections', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    if (!supabaseAdmin) return res.status(503).json({ error: 'DB unavailable' });

    const userId = req.userId!;

    // Fetch active sections with their courses
    const { data: sections, error: secError } = await supabaseAdmin
      .from('formation_sections')
      .select(`
        id, title, sort_order,
        formation_section_courses (
          sort_order,
          courses (
            id, title, cover_url, status,
            sales_url, offer_badge_enabled, offer_badge_text,
            modules (lessons (id))
          )
        )
      `)
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (secError) return res.status(500).json({ error: secError.message });
    if (!sections || sections.length === 0) return res.json([]);

    // Get user entitlements for access checks
    const { data: entitlements } = await supabaseAdmin
      .from('user_entitlements')
      .select('course_id, module_id, lesson_id, access, expires_at')
      .eq('user_id', userId);

    const entMap = new Map<string, any>();
    for (const e of entitlements ?? []) {
      if (e.course_id && !e.module_id) entMap.set(e.course_id, e);
    }

    // Check if user is admin
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single();

    const isAdmin = profile?.role === 'admin';

    // Get user subscriptions for plan-based access
    const { data: sub } = await supabaseAdmin
      .from('subscriptions')
      .select('plan_id, status')
      .eq('user_id', userId)
      .eq('status', 'active')
      .maybeSingle();

    // Get plan entitlements
    const { data: planEnts } = sub
      ? await supabaseAdmin
          .from('plan_entitlements')
          .select('course_id')
          .eq('plan_id', sub.plan_id)
      : { data: [] };

    const planCourseIds = new Set((planEnts ?? []).map((p: any) => p.course_id));

    function checkAccess(courseId: string): { allowed: boolean; reason: string; expiresAt?: string } {
      if (isAdmin) return { allowed: true, reason: 'admin' };
      const ent = entMap.get(courseId);
      if (ent?.access === 'deny') return { allowed: false, reason: 'denied' };
      if (ent) {
        if (ent.expires_at && new Date(ent.expires_at) < new Date()) {
          return { allowed: false, reason: 'expired' };
        }
        if (ent.access === 'full_access' || ent.access === 'allow') {
          return { allowed: true, reason: 'entitlement', expiresAt: ent.expires_at };
        }
      }
      if (planCourseIds.has(courseId)) return { allowed: true, reason: 'plan' };
      return { allowed: false, reason: 'no_access' };
    }

    const result = (sections as any[]).map((section) => ({
      id: section.id,
      title: section.title,
      sort_order: section.sort_order,
      courses: ((section.formation_section_courses ?? []) as any[])
        .sort((a: any, b: any) => a.sort_order - b.sort_order)
        .map((sc: any) => {
          const c = sc.courses;
          if (!c || c.status !== 'published') return null;
          const totalLessons = (c.modules ?? []).reduce(
            (sum: number, m: any) => sum + (m.lessons?.length ?? 0), 0,
          );
          const access = checkAccess(c.id);
          return {
            id: c.id,
            title: c.title,
            cover_url: c.cover_url,
            status: c.status,
            total_lessons: totalLessons,
            sales_url: c.sales_url ?? null,
            offer_badge_enabled: c.offer_badge_enabled ?? false,
            offer_badge_text: c.offer_badge_text ?? null,
            access,
          };
        })
        .filter(Boolean),
    })).filter((s: any) => s.courses.length > 0);

    res.json(result);
  } catch (err) {
    console.error('GET /api/courses/sections error:', err);
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
        lesson_links (id, type, label, url, sort_order),
        modules!inner (
          id, title, sort_order,
          courses!inner (id, title)
        )
      `)
      .eq('id', lessonId)
      .single();

    if (error || !lesson) return res.status(404).json({ error: 'Lesson not found' });

    // Computar aulas anterior e próxima
    const courseId = (lesson.modules as any).courses.id;
    const { data: allModules } = await supabaseAdmin
      .from('modules')
      .select('id, sort_order, lessons(id, title, sort_order)')
      .eq('course_id', courseId)
      .order('sort_order');

    const allLessons = (allModules ?? [])
      .sort((a: any, b: any) => a.sort_order - b.sort_order)
      .flatMap((m: any) => ((m.lessons as any[]) ?? []).sort((a: any, b: any) => a.sort_order - b.sort_order));

    const idx = allLessons.findIndex((l: any) => l.id === lessonId);
    const prevLesson = idx > 0 ? { id: allLessons[idx - 1].id, title: allLessons[idx - 1].title } : null;
    const nextLesson = idx < allLessons.length - 1 ? { id: allLessons[idx + 1].id, title: allLessons[idx + 1].title } : null;
    const isLast = idx === allLessons.length - 1;

    // Buscar progresso desta aula
    const { data: progress } = await supabaseAdmin
      .from('lesson_progress')
      .select('watched_secs, completed, last_watched')
      .eq('user_id', req.userId!)
      .eq('lesson_id', lessonId)
      .single();

    res.json({ lesson, progress: progress ?? null, prevLesson, nextLesson, isLast });
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

// ─── COMMENTS ─────────────────────────────────────────────────

const commentSchema = z.object({
  content: z.string().min(1).max(2000),
  parent_id: z.string().uuid().optional().nullable(),
});

router.get('/lessons/:lessonId/comments', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    if (!supabaseAdmin) return res.status(503).json({ error: 'DB unavailable' });

    const { lessonId } = req.params;
    const offset = parseInt((req.query.offset as string) ?? '0', 10);
    const limit = 20;

    const { data: comments, error } = await supabaseAdmin
      .from('lesson_comments')
      .select('*')
      .eq('lesson_id', lessonId)
      .is('deleted_at', null)
      .order('created_at', { ascending: true })
      .range(offset, offset + limit);

    if (error) return res.status(500).json({ error: error.message });

    // Fetch profiles for user display
    const userIds = [...new Set((comments ?? []).map((c: any) => c.user_id))];
    let profileMap: Record<string, { email: string; avatar_url?: string }> = {};

    if (userIds.length > 0) {
      const { data: profiles } = await supabaseAdmin
        .from('profiles')
        .select('id, email, avatar_url')
        .in('id', userIds);
      profileMap = Object.fromEntries((profiles ?? []).map((p: any) => [p.id, { email: p.email, avatar_url: p.avatar_url }]));
    }

    const result = (comments ?? []).map((c: any) => ({
      ...c,
      user: profileMap[c.user_id] ?? { email: 'Usuário' },
    }));

    res.json({ comments: result, hasMore: result.length === limit + 1 });
  } catch (err) {
    console.error('GET /api/courses/lessons/:id/comments error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/lessons/:lessonId/comments', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    if (!supabaseAdmin) return res.status(503).json({ error: 'DB unavailable' });

    const parsed = commentSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

    const { data, error } = await supabaseAdmin
      .from('lesson_comments')
      .insert({
        lesson_id: req.params.lessonId,
        user_id: req.userId!,
        content: parsed.data.content,
        parent_id: parsed.data.parent_id ?? null,
      })
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });
    res.status(201).json(data);
  } catch (err) {
    console.error('POST /api/courses/lessons/:id/comments error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/lessons/comments/:commentId', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    if (!supabaseAdmin) return res.status(503).json({ error: 'DB unavailable' });

    // Verify ownership
    const { data: comment } = await supabaseAdmin
      .from('lesson_comments')
      .select('user_id')
      .eq('id', req.params.commentId)
      .single();

    if (!comment) return res.status(404).json({ error: 'Comment not found' });

    // Check if user owns the comment or is admin
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', req.userId!)
      .single();

    if (comment.user_id !== req.userId && profile?.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const { error } = await supabaseAdmin
      .from('lesson_comments')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', req.params.commentId);

    if (error) return res.status(500).json({ error: error.message });
    res.json({ ok: true });
  } catch (err) {
    console.error('DELETE /api/courses/lessons/comments/:id error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
