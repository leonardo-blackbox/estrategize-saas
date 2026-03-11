import { Router } from 'express';
import { z } from 'zod';
import { supabaseAdmin } from '../../lib/supabaseAdmin.js';
import { requireAuth, type AuthenticatedRequest } from '../../middleware/auth.js';
import { requireAdmin } from '../../middleware/admin.js';

const router = Router();
router.use(requireAuth, requireAdmin);

// ─── LIST USERS ────────────────────────────────────────────────
router.get('/', async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 50, 100);
  const offset = Number(req.query.offset) || 0;
  const search = req.query.q as string | undefined;

  let query = supabaseAdmin!
    .from('profiles')
    .select(`
      id, full_name, role, created_at,
      subscriptions (plan_id, status, current_period_end, plans (name))
    `, { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (search) {
    query = query.ilike('full_name', `%${search}%`);
  }

  const { data, error, count } = await query;
  if (error) return res.status(500).json({ error: error.message });

  // Enrich with emails from auth (batch fetch for the current page)
  const { data: { users: authUsers } = { users: [] } } =
    await supabaseAdmin!.auth.admin.listUsers({ perPage: limit });
  const emailMap: Record<string, string> = {};
  for (const au of authUsers ?? []) {
    if (au.email) emailMap[au.id] = au.email;
  }

  const users = (data ?? []).map((u: any) => ({ ...u, email: emailMap[u.id] ?? null }));
  res.json({ users, total: count ?? 0, limit, offset });
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

  res.json({ profile, entitlements: entitlements ?? [], enrollments: enrollments ?? [] });
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

  // Audit log
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
  // Buscar subscription ativa e reaplicar
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

// ─── MONITORING (webhook events + audit) ───────────────────────
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

router.get('/audit', async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 50, 200);
  const offset = Number(req.query.offset) || 0;

  const { data, error, count } = await supabaseAdmin!
    .from('audit_logs')
    .select('*, profiles!actor_id (full_name)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) return res.status(500).json({ error: error.message });
  res.json({ data, count, limit, offset });
});

// ─── ENROLLMENTS LIST ──────────────────────────────────────────
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

// ─── ADMIN STATS ───────────────────────────────────────────────
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

export default router;
