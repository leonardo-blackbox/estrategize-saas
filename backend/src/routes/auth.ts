import { Router } from 'express';
import { z } from 'zod';
import { requireAuth, type AuthenticatedRequest } from '../middleware/auth.js';
import {
  signup,
  login,
  refreshSession,
  logout,
  getProfile,
  updateProfile,
} from '../services/authService.js';

const router = Router();

// ─── Zod Schemas ─────────────────────────────────────────────────────────────

const emailPasswordSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const signupSchema = emailPasswordSchema.extend({
  full_name: z.string().optional(),
});

const updateProfileSchema = z.object({
  full_name: z.string().min(1).max(100).optional(),
  avatar_url: z.string().url().nullable().optional(),
}).refine((d) => Object.keys(d).length > 0, { message: 'At least one field required' });

// ─── Helpers ─────────────────────────────────────────────────────────────────

type ErrorWithStatus = Error & { status?: number };

function errorStatus(err: unknown, fallback = 500): number {
  return (err as ErrorWithStatus).status ?? fallback;
}

function errorMsg(err: unknown): string {
  return err instanceof Error ? err.message : 'Unknown error';
}

// ─── Routes ──────────────────────────────────────────────────────────────────

router.post('/signup', async (req, res) => {
  const parsed = signupSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.issues[0].message }); return; }
  try {
    const result = await signup(parsed.data.email, parsed.data.password, parsed.data.full_name);
    res.status(201).json(result);
  } catch (err) {
    res.status(errorStatus(err, 400)).json({ error: errorMsg(err) });
  }
});

router.post('/login', async (req, res) => {
  const parsed = emailPasswordSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.issues[0].message }); return; }
  try {
    const result = await login(parsed.data.email, parsed.data.password);
    res.json(result);
  } catch (err) {
    res.status(errorStatus(err, 401)).json({ error: errorMsg(err) });
  }
});

router.post('/refresh', async (req, res) => {
  const { refresh_token } = req.body as { refresh_token?: string };
  if (!refresh_token) { res.status(400).json({ error: 'refresh_token is required' }); return; }
  try {
    const session = await refreshSession(refresh_token);
    res.json({ session });
  } catch (err) {
    res.status(errorStatus(err, 401)).json({ error: errorMsg(err) });
  }
});

router.post('/logout', async (req, res) => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing Authorization header' }); return;
  }
  try {
    await logout(header.slice(7));
    res.json({ message: 'Logged out successfully' });
  } catch (err) {
    res.status(errorStatus(err, 400)).json({ error: errorMsg(err) });
  }
});

router.get('/profile', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const profile = await getProfile(req.userId!);
    res.json(profile);
  } catch (err) {
    res.status(errorStatus(err, 500)).json({ error: errorMsg(err) });
  }
});

router.patch('/profile', requireAuth, async (req: AuthenticatedRequest, res) => {
  const parsed = updateProfileSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.issues[0].message }); return; }
  try {
    const profile = await updateProfile(req.userId!, parsed.data);
    res.json(profile);
  } catch (err) {
    res.status(500).json({ error: errorMsg(err) });
  }
});

export default router;
