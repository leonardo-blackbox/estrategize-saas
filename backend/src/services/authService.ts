import { supabaseAdmin } from '../lib/supabaseAdmin.js';

// ============================================================================
// Types
// ============================================================================

export interface SessionResult {
  access_token: string;
  refresh_token: string;
  expires_at: number | undefined;
}

export interface SignupResult {
  user: Record<string, unknown>;
  session: SessionResult | null;
}

export interface LoginResult {
  user: Record<string, unknown>;
  session: SessionResult;
}

export interface ProfileResult {
  id: string;
  full_name: string | null;
  role: string;
  created_at: string;
  avatar_url: string | null;
  email: string | null;
}

// ============================================================================
// Helpers
// ============================================================================

function ensureDb() {
  if (!supabaseAdmin) throw new Error('Auth service unavailable');
  return supabaseAdmin;
}

// ============================================================================
// Service Functions
// ============================================================================

export async function signup(
  email: string,
  password: string,
  fullName?: string,
): Promise<SignupResult> {
  const db = ensureDb();

  const { data, error } = await db.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName ?? '' },
  });

  if (error) throw new Error(error.message);

  const { data: session, error: signInError } =
    await db.auth.signInWithPassword({ email, password });

  if (signInError) {
    return { user: data.user as unknown as Record<string, unknown>, session: null };
  }

  return {
    user: session.user as unknown as Record<string, unknown>,
    session: {
      access_token: session.session.access_token,
      refresh_token: session.session.refresh_token,
      expires_at: session.session.expires_at,
    },
  };
}

export async function login(email: string, password: string): Promise<LoginResult> {
  const db = ensureDb();

  const { data, error } = await db.auth.signInWithPassword({ email, password });

  if (error) throw Object.assign(new Error(error.message), { status: 401 });

  return {
    user: data.user as unknown as Record<string, unknown>,
    session: {
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      expires_at: data.session.expires_at,
    },
  };
}

export async function refreshSession(refreshToken: string): Promise<SessionResult> {
  const db = ensureDb();

  const { data, error } = await db.auth.refreshSession({ refresh_token: refreshToken });

  if (error || !data.session) {
    throw Object.assign(
      new Error(error?.message ?? 'Failed to refresh session'),
      { status: 401 },
    );
  }

  return {
    access_token: data.session.access_token,
    refresh_token: data.session.refresh_token,
    expires_at: data.session.expires_at,
  };
}

export async function logout(token: string): Promise<void> {
  const db = ensureDb();

  const { data: userData } = await db.auth.getUser(token);
  if (!userData.user) {
    throw Object.assign(new Error('Invalid token'), { status: 401 });
  }

  const { error } = await db.auth.admin.signOut(token);
  if (error) throw new Error(error.message);
}

export async function getProfile(userId: string): Promise<ProfileResult> {
  const db = ensureDb();

  const { data: profile, error } = await db
    .from('profiles')
    .select('id, full_name, role, created_at, avatar_url')
    .eq('id', userId)
    .single();

  if (error || !profile) throw Object.assign(new Error('Profile not found'), { status: 404 });

  const { data: authUser } = await db.auth.admin.getUserById(userId);

  return {
    ...profile,
    email: authUser?.user?.email ?? null,
  };
}

export async function updateProfile(
  userId: string,
  updates: { full_name?: string; avatar_url?: string | null },
): Promise<Record<string, unknown>> {
  const db = ensureDb();

  const { data: profile, error } = await db
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select('id, full_name, role, created_at, avatar_url')
    .single();

  if (error) throw new Error('Failed to update profile');

  return profile as unknown as Record<string, unknown>;
}
