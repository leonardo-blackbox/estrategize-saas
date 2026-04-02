import { Router } from 'express';
import { z } from 'zod';
import { requireAuth, type AuthenticatedRequest } from '../../middleware/auth.js';
import { requireAdmin } from '../../middleware/admin.js';
import * as userSvc from '../../services/adminUserService.js';
import * as dataSvc from '../../services/adminDataService.js';
import * as entSvc from '../../services/adminEntitlementService.js';

const router = Router();
router.use(requireAuth, requireAdmin);

// ─── LIST USERS ────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const result = await userSvc.listUsers({
      limit: Math.min(Number(req.query.limit) || 50, 100),
      offset: Number(req.query.offset) || 0,
      search: (req.query.q as string | undefined)?.toLowerCase().trim(),
      planId: req.query.plan_id as string | undefined,
      status: req.query.status as string | undefined,
    });
    res.json(result);
  } catch (err: unknown) { const message = err instanceof Error ? err.message : String(err); res.status(500).json({ error: message }); }
});

// ─── PLANS SUMMARY ─────────────────────────────────────────────
router.get('/plans-summary', async (_req, res) => {
  try { res.json(await userSvc.getPlansSummary()); }
  catch (err: unknown) { const message = err instanceof Error ? err.message : String(err); res.status(500).json({ error: message }); }
});

// ─── ADMIN STATS ───────────────────────────────────────────────
router.get('/stats', async (_req, res) => {
  try { res.json(await dataSvc.getAdminStats()); }
  catch (err: unknown) { const message = err instanceof Error ? err.message : String(err); res.status(500).json({ error: message }); }
});

// ─── ENROLLMENTS ───────────────────────────────────────────────
const createEnrollmentSchema = z.object({
  user_id: z.string().uuid(),
  course_id: z.string().uuid(),
});

router.get('/enrollments', async (req, res) => {
  try {
    res.json(await entSvc.listEnrollments(
      Math.min(Number(req.query.limit) || 50, 200),
      Number(req.query.offset) || 0,
      req.query.course_id as string | undefined,
    ));
  } catch (err: unknown) { const message = err instanceof Error ? err.message : String(err); res.status(500).json({ error: message }); }
});

router.post('/enrollments', async (req: AuthenticatedRequest, res) => {
  const parsed = createEnrollmentSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  try {
    const actorId = req.userId as string;
    const { data, conflict } = await entSvc.createEnrollment(parsed.data.user_id, parsed.data.course_id, actorId);
    if (conflict) return res.status(409).json({ error: 'Usuário já matriculado neste curso.' });
    res.status(201).json(data);
  } catch (err: unknown) { const message = err instanceof Error ? err.message : String(err); res.status(500).json({ error: message }); }
});

router.delete('/enrollments/:id', async (req: AuthenticatedRequest, res) => {
  try {
    await entSvc.deleteEnrollment(req.params.id as string, req.userId as string);
    res.json({ ok: true });
  } catch (err: unknown) { const message = err instanceof Error ? err.message : String(err); res.status(500).json({ error: message }); }
});

// ─── AUDIT / WEBHOOKS ──────────────────────────────────────────
router.get('/audit', async (req, res) => {
  try {
    res.json(await dataSvc.getAuditLogs(
      Math.min(Number(req.query.limit) || 50, 200),
      Number(req.query.offset) || 0,
      req.query.target_id as string | undefined,
    ));
  } catch (err: unknown) { const message = err instanceof Error ? err.message : String(err); res.status(500).json({ error: message }); }
});

router.get('/webhooks/events', async (req, res) => {
  try {
    res.json(await dataSvc.getWebhookEvents(
      Math.min(Number(req.query.limit) || 50, 200),
      Number(req.query.offset) || 0,
      req.query.status as string | undefined,
      req.query.provider as string | undefined,
    ));
  } catch (err: unknown) { const message = err instanceof Error ? err.message : String(err); res.status(500).json({ error: message }); }
});

router.get('/webhooks/events/:id', async (req, res) => {
  try {
    const data = await dataSvc.getWebhookEventById(req.params.id);
    if (!data) return res.status(404).json({ error: 'Not found' });
    res.json(data);
  } catch (err: unknown) { const message = err instanceof Error ? err.message : String(err); res.status(500).json({ error: message }); }
});

// ─── USER DETAIL ───────────────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const result = await userSvc.getUserDetail(req.params.id);
    if (!result) return res.status(404).json({ error: 'User not found' });
    res.json(result);
  } catch (err: unknown) { const message = err instanceof Error ? err.message : String(err); res.status(500).json({ error: message }); }
});

router.get('/:id/credit-balance', async (req, res) => {
  try { res.json(await dataSvc.getCreditBalance(req.params.id)); }
  catch (err: unknown) { const message = err instanceof Error ? err.message : String(err); res.status(500).json({ error: message }); }
});

router.get('/:id/credit-transactions', async (req, res) => {
  try {
    res.json(await dataSvc.getCreditTransactions(
      req.params.id, Math.min(Number(req.query.limit) || 20, 100), Number(req.query.offset) || 0,
    ));
  } catch (err: unknown) { const message = err instanceof Error ? err.message : String(err); res.status(500).json({ error: message }); }
});

const creditAdjustSchema = z.object({
  amount: z.number().int().refine((n) => n !== 0, { message: 'amount cannot be zero' }),
  description: z.string().min(1).max(255),
});

router.post('/:id/credits', async (req: AuthenticatedRequest, res) => {
  const parsed = creditAdjustSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  try {
    const data = await dataSvc.adjustCredits(
      req.params.id as string, req.userId as string, parsed.data.amount, parsed.data.description,
    );
    res.status(201).json(data);
  } catch (err: unknown) { const message = err instanceof Error ? err.message : String(err); res.status(500).json({ error: message }); }
});

const updateProfileSchema = z.object({
  role: z.enum(['member', 'admin']).optional(),
  full_name: z.string().min(1).max(255).optional(),
}).refine((d) => d.role !== undefined || d.full_name !== undefined, { message: 'At least one field required' });

router.patch('/:id', async (req: AuthenticatedRequest, res) => {
  const parsed = updateProfileSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  try {
    res.json(await userSvc.updateProfile(req.params.id as string, req.userId as string, parsed.data));
  } catch (err: unknown) { const message = err instanceof Error ? err.message : String(err); res.status(500).json({ error: message }); }
});

router.get('/:id/progress', async (req, res) => {
  try { res.json({ progress: await dataSvc.getUserProgress(req.params.id) }); }
  catch (err: unknown) { const message = err instanceof Error ? err.message : String(err); res.status(500).json({ error: message }); }
});

// ─── ENTITLEMENTS ──────────────────────────────────────────────
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
  try {
    res.status(201).json(await entSvc.grantEntitlement(req.params.id as string, req.userId as string, parsed.data));
  } catch (err: unknown) { const message = err instanceof Error ? err.message : String(err); res.status(500).json({ error: message }); }
});

router.delete('/:id/entitlements/:entitlementId', async (req: AuthenticatedRequest, res) => {
  try {
    await entSvc.revokeEntitlement(req.params.id as string, req.params.entitlementId as string, req.userId as string);
    res.json({ ok: true });
  } catch (err: unknown) { const message = err instanceof Error ? err.message : String(err); res.status(500).json({ error: message }); }
});

router.post('/:id/grant-full-access/:courseId', async (req: AuthenticatedRequest, res) => {
  try {
    res.json(await entSvc.grantFullAccess(req.params.id as string, req.params.courseId as string, req.userId as string));
  } catch (err: unknown) { const message = err instanceof Error ? err.message : String(err); res.status(500).json({ error: message }); }
});

router.post('/:id/reprocess-entitlements', async (req: AuthenticatedRequest, res) => {
  try { res.json(await entSvc.reprocessEntitlements(req.params.id as string, req.userId as string)); }
  catch (err: unknown) { const message = err instanceof Error ? err.message : String(err); res.status(500).json({ error: message }); }
});

export default router;
