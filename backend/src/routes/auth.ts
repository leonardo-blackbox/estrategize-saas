import { Router } from 'express';
import { z } from 'zod';
import { supabaseAdmin } from '../lib/supabaseAdmin.js';

const router = Router();

const emailPasswordSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const signupSchema = emailPasswordSchema.extend({
  full_name: z.string().optional(),
});

function ensureSupabase(): boolean {
  return supabaseAdmin !== null;
}

// POST /auth/signup
router.post('/signup', async (req, res) => {
  if (!ensureSupabase()) {
    res.status(503).json({ error: 'Auth service unavailable' });
    return;
  }

  const parsed = signupSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0].message });
    return;
  }
  const { email, password, full_name } = parsed.data;

  const { data, error } = await supabaseAdmin!.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: full_name ?? '' },
  });

  if (error) {
    res.status(400).json({ error: error.message });
    return;
  }

  // Return a session by signing in immediately
  const { data: session, error: signInError } =
    await supabaseAdmin!.auth.signInWithPassword({ email, password });

  if (signInError) {
    // User created but sign-in failed — user can login manually
    res.status(201).json({ user: data.user, session: null });
    return;
  }

  res.status(201).json({
    user: session.user,
    session: {
      access_token: session.session.access_token,
      refresh_token: session.session.refresh_token,
      expires_at: session.session.expires_at,
    },
  });
});

// POST /auth/login
router.post('/login', async (req, res) => {
  if (!ensureSupabase()) {
    res.status(503).json({ error: 'Auth service unavailable' });
    return;
  }

  const parsed = emailPasswordSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0].message });
    return;
  }
  const { email, password } = parsed.data;

  const { data, error } = await supabaseAdmin!.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    res.status(401).json({ error: error.message });
    return;
  }

  res.json({
    user: data.user,
    session: {
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      expires_at: data.session.expires_at,
    },
  });
});

// POST /auth/refresh
router.post('/refresh', async (req, res) => {
  if (!ensureSupabase()) {
    res.status(503).json({ error: 'Auth service unavailable' });
    return;
  }

  const { refresh_token } = req.body as { refresh_token?: string };

  if (!refresh_token) {
    res.status(400).json({ error: 'refresh_token is required' });
    return;
  }

  const { data, error } = await supabaseAdmin!.auth.refreshSession({
    refresh_token,
  });

  if (error || !data.session) {
    res.status(401).json({ error: error?.message ?? 'Failed to refresh session' });
    return;
  }

  res.json({
    session: {
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      expires_at: data.session.expires_at,
    },
  });
});

// POST /auth/logout
router.post('/logout', async (req, res) => {
  if (!ensureSupabase()) {
    res.status(503).json({ error: 'Auth service unavailable' });
    return;
  }

  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing Authorization header' });
    return;
  }

  const token = header.slice(7);
  const { data: userData } = await supabaseAdmin!.auth.getUser(token);

  if (!userData.user) {
    res.status(401).json({ error: 'Invalid token' });
    return;
  }

  // Sign out the user server-side
  const { error } = await supabaseAdmin!.auth.admin.signOut(token);

  if (error) {
    res.status(400).json({ error: error.message });
    return;
  }

  res.json({ message: 'Logged out successfully' });
});

export default router;
