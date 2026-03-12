import { Router } from 'express';
import { z } from 'zod';
import { supabaseAdmin } from '../../lib/supabaseAdmin.js';
import { requireAuth, type AuthenticatedRequest } from '../../middleware/auth.js';
import { requireAdmin } from '../../middleware/admin.js';
import { getBalance } from '../../services/creditService.js';

const router = Router();
router.use(requireAuth, requireAdmin);

// ─── LIST USERS ────────────────────────────────────────────────
router.get('/', async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 50, 100);
  const offset = Number(req.query.offset) || 0;
  const search = (req.query.q as string | undefined)?.toLowerCase().trim();

  const { data: { users: authUsers } = { users: [] } } =
    await supabaseAdmin!.auth.admin.listUsers({ perPage: 1000 });

  const emailMap: Record<string, string> = {};
  for (const au of authUsers ?? []) {
    if (au.email) emailMap[au.id] = au.email;
  }

  let filteredAuthIds: string[] | null = null;
  if (search && search.includes('@')) {
    filteredAuthIds = (authUsers ?? [])
      .filter((u) => u.email?.toLowerCase().includes(search))
      .map((u) => u.id);
  }

  let query = supabaseAdmin!
    .from('profiles')
    .select('id, full_name, role, created_at', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (search) {
    if (filteredAuthIds !== null) {
      if (filteredAuthIds.length > 0) {
        query = query.in('id', filteredAuthIds);
      } else {
        return res.json({ users: [], total: 0, limit, offset });
      }
    } else {
      query = query.ilike('full_name', `%${search}%`);
    }
  }

  const { data, error, count } = await query;
  if (error) return res.status(500).json({ error: error.message });

  const users = (data ?? []).map((u: any) => ({ ...u, email: emailMap[u.id] ?? null }));
  res.json({ users, total: count ?? 0, limit, offset });
});

// ─── STATIC ROUTES (must be before /:id to avoid param capture) ─

// ADMIN STATS
router.get('/stats', async (_req, res) => {
  const [
    { count: totalUsers },
    { count: totalCourses },
    { count: totalEnrollments },
    { count: totalWebhookEvents },
    { count: failedWebhooks },
    { count: totalAuditActions },
  ] = await Promise.all([
    supabaseAdmin!.from('profiles').select('*', { count: 'exact', head: true }),
    supabaseAdmin!.from('courses').select('*', { count: 'exact', head: true }).eq('status', 'published'),
    supabaseAdmin!.from('enrollments').select('*', { count: 'exact', head: true }),
    supabaseAdmin!.from('webhook_events').select('*', { count: 'exact', head: true }),
    supabaseAdmin!.from('webhook_events').select('*', { count: 'exact', head: true }).eq('status', 'failed'),
    supabaseAdmin!.from('audit_logs').select('*', { count: 'exact', head: true }),
  ]);

  res.json({
    totalUsers: totalUsers ?? 0,
    totalCourses: totalCourses ?? 0,
    totalEnrollments: totalEnrollments ?? 0,
    totalWebhookEvents: totalWebhookEvents ?? 0,
    failedWebhooks: failedWebhooks ?? 0,
    totalAuditActions: totalAuditActions ?? 0,
  });
});

// ENROLLMENTS LIST
router.get('/enrollments', async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 50, 200);
  const offset = Number(req.query.offset) || 0;
  const courseId = req.query.course_id as string | undefined;

  let query = supabaseAdmin!
    .from('enrollments')
    .select('*, profiles (full_name), courses (title)', { count: 'exact' })
    .order('enrolled_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (courseId) query = query.eq('course_id', courseId);

  const { data, error, count } = await query;
  if (error) return res.status(500).json({ error: error.message });
  res.json({ enrollments: data ?? [], total: count ?? 0 });
});

// CREATE ENROLLMENT
const createEnrollmentSchema = z.object({
  user_id: z.string().uuid(),
  course_id: z.string().uuid(),
});

router.post('/enrollments', async (req: AuthenticatedRequest, res) => {
  const parsed = createEnrollmentSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const { data, error } = await supabaseAdmin!
    .from('enrollments')
    .insert(parsed.data)
    .select('*, profiles (full_name), courses (title)')
    .single();

  if (error) {
    if (error.code === '23505') return res.status(409).json({ error: 'Usuário já matriculado neste curso.' });
    return res.status(500).json({ error: error.message });
  }

  await supabaseAdmin!.from('audit_logs').insert({
    actor_id: req.userId,
    action: 'admin_create_enrollment',
    target_type: 'user',
    target_id: parsed.data.user_id,
    metadata: { course_id: parsed.data.course_id, enrollment_id: data.id },
  });

  res.status(201).json(data);
});

// DELETE ENROLLMENT
router.delete('/enrollments/:id', async (req: AuthenticatedRequest, res) => {
  const { data: enrollment } = await supabaseAdmin!
    .from('enrollments')
    .select('user_id, course_id')
    .eq('id', req.params.id)
    .single();

  const { error } = await supabaseAdmin!
    .from('enrollments')
    .delete()
    .eq('id', req.params.id);

  if (error) return res.status(500).json({ error: error.message });

  if (enrollment) {
    await supabaseAdmin!.from('audit_logs').insert({
      actor_id: req.userId,
      action: 'admin_delete_enrollment',
      target_type: 'user',
      target_id: (enrollment as any).user_id,
      metadata: { course_id: (enrollment as any).course_id, enrollment_id: req.params.id },
    });
  }

  res.json({ ok: true });
});

// AUDIT LOGS (supports ?target_id= for filtering by user)
router.get('/audit', async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 50, 200);
  const offset = Number(req.query.offset) || 0;
  const targetId = req.query.target_id as string | undefined;

  let query = supabaseAdmin!
    .from('audit_logs')
    .select('*, profiles!actor_id (full_name)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (targetId) query = query.eq('target_id', targetId);

  const { data, error, count } = await query;
  if (error) return res.status(500).json({ error: error.message });
  res.json({ data, count, limit, offset });
});

// WEBHOOK EVENTS
router.get('/webhooks/events', async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 50, 200);
  const offset = Number(req.query.offset) || 0;
  const status = req.query.status as string | undefined;
  const provider = req.query.provider as string | undefined;

  let query = supabaseAdmin!
    .from('webhook_events')
    .select('id, provider, event_type, event_id, status, error, processed_at, created_at', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (status) query = query.eq('status', status);
  if (provider) query = query.eq('provider', provider);

  const { data, error, count } = await query;
  if (error) return res.status(500).json({ error: error.message });
  res.json({ data, count, limit, offset });
});

router.get('/webhooks/events/:id', async (req, res) => {
  const { data, error } = await supabaseAdmin!
    .from('webhook_events')
    .select('*')
    .eq('id', req.params.id)
    .single();
  if (error || !data) return res.status(404).json({ error: 'Not found' });
  res.json(data);
});

// ─── USER DETAIL ───────────────────────────────────────────────
router.get('/:id', async (req, res) => {
  const { data: profile, error: pe } = await supabaseAdmin!
    .from('profiles')
    .select(`
      id, full_name, role, created_at,
      subscriptions (plan_id, status, current_period_end, plans (name, credits_per_month))
    `)
    .eq('id', req.params.id)
    .single();

  if (pe || !profile) return res.status(404).json({ error: 'User not found' });

  const { data: entitlements } = await supabaseAdmin!
    .from('user_entitlements')
    .select('*, courses (title), modules (title), lessons (title)')
    .eq('user_id', req.params.id)
    .order('created_at', { ascending: false });

  const { data: enrollments } = await supabaseAdmin!
    .from('enrollments')
    .select('*, courses (title)')
    .eq('user_id', req.params.id)
    .order('enrolled_at', { ascending: false });

  // Auth user info (last login, email verification)
  const { data: authData } = await supabaseAdmin!.auth.admin.getUserById(req.params.id);
  const authUser = authData.user ? {
    email: authData.user.email,
    last_sign_in_at: authData.user.last_sign_in_at,
    email_confirmed_at: authData.user.email_confirmed_at,
    created_at: authData.user.created_at,
  } : null;

  res.json({
    profile,
    entitlements: entitlements ?? [],
    enrollments: enrollments ?? [],
    authUser,
  });
});

// ─── CREDIT BALANCE (dedicated endpoint) ───────────────────────
router.get('/:id/credit-balance', async (req, res) => {
  try {
    const balance = await getBalance(req.params.id);
    res.json(balance);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── CREDIT TRANSACTIONS ───────────────────────────────────────
router.get('/:id/credit-transactions', async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 20, 100);
  const offset = Number(req.query.offset) || 0;

  const [{ data, error, count }, balanceResult] = await Promise.all([
    supabaseAdmin!
      .from('credit_transactions')
      .select('*', { count: 'exact' })
      .eq('user_id', req.params.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1),
    getBalance(req.params.id),
  ]);

  if (error) return res.status(500).json({ error: error.message });

  res.json({
    transactions: data ?? [],
    total: count ?? 0,
    balance: balanceResult.available,
    reserved: balanceResult.reserved,
    consumed_this_month: balanceResult.consumed_this_month,
    total_consumed: balanceResult.total_consumed,
  });
});

// ─── CREDIT ADJUSTMENT ─────────────────────────────────────────
const creditAdjustSchema = z.object({
  amount: z.number().int().refine((n) => n !== 0, { message: 'amount cannot be zero' }),
  description: z.string().min(1).max(255),
});

router.post('/:id/credits', async (req: AuthenticatedRequest, res) => {
  const parsed = creditAdjustSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const { amount, description } = parsed.data;
  const type = amount > 0 ? 'purchase' : 'consume';
  const storedAmount = Math.abs(amount); // DB always stores positive amounts

  const { data, error } = await supabaseAdmin!
    .from('credit_transactions')
    .insert({
      user_id: req.params.id,
      amount: storedAmount,
      type,
      status: 'confirmed',
      description,
      idempotency_key: `admin_adjust_${req.userId}_${Date.now()}`,
    })
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });

  await supabaseAdmin!.from('audit_logs').insert({
    actor_id: req.userId,
    action: 'admin_credit_adjustment',
    target_type: 'user',
    target_id: req.params.id,
    metadata: { amount, description, transaction_id: data.id },
  });

  res.status(201).json(data);
});

// ─── UPDATE PROFILE ────────────────────────────────────────────
const updateProfileSchema = z.object({
  role: z.enum(['member', 'admin']).optional(),
  full_name: z.string().min(1).max(255).optional(),
}).refine((d) => d.role !== undefined || d.full_name !== undefined, {
  message: 'At least one field required',
});

router.patch('/:id', async (req: AuthenticatedRequest, res) => {
  const parsed = updateProfileSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const { data, error } = await supabaseAdmin!
    .from('profiles')
    .update(parsed.data)
    .eq('id', req.params.id)
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });

  await supabaseAdmin!.from('audit_logs').insert({
    actor_id: req.userId,
    action: 'admin_update_profile',
    target_type: 'user',
    target_id: req.params.id,
    metadata: parsed.data,
  });

  res.json(data);
});

// ─── USER PROGRESS ─────────────────────────────────────────────
router.get('/:id/progress', async (req, res) => {
  const { data: enrollments } = await supabaseAdmin!
    .from('enrollments')
    .select('course_id, courses (id, title)')
    .eq('user_id', req.params.id);

  if (!enrollments || enrollments.length === 0) {
    return res.json({ progress: [] });
  }

  const result = await Promise.all(
    (enrollments as any[]).map(async (enr) => {
      const courseId = enr.course_id;

      // Get module IDs for this course
      const { data: modules } = await supabaseAdmin!
        .from('modules')
        .select('id')
        .eq('course_id', courseId);

      const moduleIds = (modules ?? []).map((m: any) => m.id);

      if (moduleIds.length === 0) {
        return { course_id: courseId, title: enr.courses?.title ?? courseId, total_lessons: 0, completed_lessons: 0 };
      }

      // Count all lessons in those modules
      const { count: totalLessons } = await supabaseAdmin!
        .from('lessons')
        .select('id', { count: 'exact', head: true })
        .in('module_id', moduleIds);

      // Get lesson IDs for completed progress check
      const { data: lessons } = await supabaseAdmin!
        .from('lessons')
        .select('id')
        .in('module_id', moduleIds);

      const lessonIds = (lessons ?? []).map((l: any) => l.id);

      const { count: completedLessons } = lessonIds.length > 0
        ? await supabaseAdmin!
            .from('lesson_progress')
            .select('lesson_id', { count: 'exact', head: true })
            .eq('user_id', req.params.id)
            .eq('completed', true)
            .in('lesson_id', lessonIds)
        : { count: 0 };

      return {
        course_id: courseId,
        title: enr.courses?.title ?? courseId,
        total_lessons: totalLessons ?? 0,
        completed_lessons: completedLessons ?? 0,
      };
    }),
  );

  res.json({ progress: result });
});

// ─── GRANT ENTITLEMENT ─────────────────────────────────────────
const entitlementSchema = z.object({
  course_id: z.string().uuid().optional(),
  module_id: z.string().uuid().optional(),
  lesson_id: z.string().uuid().optional(),
  access: z.enum(['allow', 'deny', 'full_access']),
  expires_at: z.string().datetime().optional().nullable(),
  reason: z.string().optional(),
});

router.post('/:id/entitlements', async (req: AuthenticatedRequest, res) => {
  const parsed = entitlementSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const { data, error } = await supabaseAdmin!
    .from('user_entitlements')
    .insert({
      ...parsed.data,
      user_id: req.params.id,
      granted_by: req.userId,
    })
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });

  await supabaseAdmin!.from('audit_logs').insert({
    actor_id: req.userId,
    action: 'grant_entitlement',
    target_type: 'user',
    target_id: req.params.id,
    metadata: { entitlement_id: data.id, access: parsed.data.access },
  });

  res.status(201).json(data);
});

// ─── REVOKE ENTITLEMENT ────────────────────────────────────────
router.delete('/:id/entitlements/:entitlementId', async (req: AuthenticatedRequest, res) => {
  const { error } = await supabaseAdmin!
    .from('user_entitlements')
    .delete()
    .eq('id', req.params.entitlementId)
    .eq('user_id', req.params.id);

  if (error) return res.status(500).json({ error: error.message });

  await supabaseAdmin!.from('audit_logs').insert({
    actor_id: req.userId,
    action: 'revoke_entitlement',
    target_type: 'user',
    target_id: req.params.id,
    metadata: { entitlement_id: req.params.entitlementId },
  });

  res.json({ ok: true });
});

// ─── GRANT FULL ACCESS ─────────────────────────────────────────
router.post('/:id/grant-full-access/:courseId', async (req: AuthenticatedRequest, res) => {
  const { data, error } = await supabaseAdmin!
    .from('user_entitlements')
    .upsert({
      user_id: req.params.id,
      course_id: req.params.courseId,
      access: 'full_access',
      granted_by: req.userId,
      reason: 'admin_grant_full_access',
    }, { onConflict: 'user_id,course_id' })
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });

  await supabaseAdmin!.from('audit_logs').insert({
    actor_id: req.userId,
    action: 'grant_full_access',
    target_type: 'user',
    target_id: req.params.id,
    metadata: { course_id: req.params.courseId },
  });

  res.json(data);
});

// ─── REPROCESS ENTITLEMENTS ────────────────────────────────────
router.post('/:id/reprocess-entitlements', async (req: AuthenticatedRequest, res) => {
  const { data: sub } = await supabaseAdmin!
    .from('subscriptions')
    .select('plan_id, status')
    .eq('user_id', req.params.id)
    .eq('status', 'active')
    .single();

  await supabaseAdmin!.from('audit_logs').insert({
    actor_id: req.userId,
    action: 'reprocess_entitlements',
    target_type: 'user',
    target_id: req.params.id,
    metadata: { plan_id: sub?.plan_id ?? null },
  });

  res.json({ ok: true, subscription: sub ?? null });
});

export default router;
