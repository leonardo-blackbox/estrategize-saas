import { supabaseAdmin } from '../lib/supabaseAdmin.js';
import { logAudit } from './adminEntitlementService.js';

// ============================================================================
// Types
// ============================================================================

export interface ListUsersParams {
  limit: number;
  offset: number;
  search?: string;
  planId?: string;
  status?: string;
}

interface AuthEmailMap {
  emailMap: Record<string, string>;
  authUsers: Array<{ id: string; email?: string }>;
}

// ============================================================================
// Helpers
// ============================================================================

function intersect(current: string[] | null, incoming: string[]): string[] {
  return current === null ? incoming : current.filter((id: string) => incoming.includes(id));
}

// ============================================================================
// Service Functions
// ============================================================================

export async function fetchAuthEmailMap(): Promise<AuthEmailMap> {
  const { data: { users: authUsers } = { users: [] } } =
    await supabaseAdmin!.auth.admin.listUsers({ perPage: 1000 });

  const emailMap: Record<string, string> = {};
  for (const au of authUsers ?? []) {
    if (au.email) emailMap[au.id] = au.email;
  }
  return { emailMap, authUsers: (authUsers ?? []) as Array<{ id: string; email?: string }> };
}

export async function listUsers(params: ListUsersParams) {
  const { limit, offset, search, planId, status } = params;

  const { emailMap, authUsers } = await fetchAuthEmailMap();

  let filteredAuthIds: string[] | null = null;
  if (search && search.includes('@')) {
    filteredAuthIds = authUsers
      .filter((u) => u.email?.toLowerCase().includes(search))
      .map((u) => u.id);
  }

  let filterUserIds: string[] | null = null;
  let excludeUserIds: string[] | null = null;

  if (planId) {
    const { data: subRows } = await supabaseAdmin!
      .from('subscriptions').select('user_id').eq('plan_id', planId).eq('status', 'active');
    filterUserIds = intersect(filterUserIds, (subRows ?? []).map((r) => r.user_id));
  }

  if (status === 'active') {
    const { data: subRows } = await supabaseAdmin!
      .from('subscriptions').select('user_id').eq('status', 'active');
    filterUserIds = intersect(filterUserIds, (subRows ?? []).map((r) => r.user_id));
  } else if (status === 'no_plan') {
    const { data: subRows } = await supabaseAdmin!
      .from('subscriptions').select('user_id').eq('status', 'active');
    excludeUserIds = (subRows ?? []).map((r) => r.user_id);
  } else if (status === 'suspended') {
    const { data: entRows } = await supabaseAdmin!
      .from('user_entitlements').select('user_id').eq('access', 'deny').is('course_id', null);
    filterUserIds = intersect(filterUserIds, (entRows ?? []).map((r) => r.user_id));
  }

  if (filterUserIds !== null && filterUserIds.length === 0) {
    return { users: [], total: 0, limit, offset };
  }

  let query = supabaseAdmin!
    .from('profiles')
    .select('id, full_name, role, created_at', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (filterUserIds !== null) query = query.in('id', filterUserIds);
  if (excludeUserIds !== null && excludeUserIds.length > 0) {
    query = query.not('id', 'in', `(${excludeUserIds.join(',')})`);
  }

  if (search) {
    if (filteredAuthIds !== null) {
      if (filteredAuthIds.length > 0) query = query.in('id', filteredAuthIds);
      else return { users: [], total: 0, limit, offset };
    } else {
      query = query.ilike('full_name', `%${search}%`);
    }
  }

  const { data, error, count } = await query;
  if (error) throw new Error(error.message);

  const userIds = (data ?? []).map((u) => u.id);
  let subMap = new Map<string, Record<string, unknown>>();
  if (userIds.length > 0) {
    const { data: subs } = await supabaseAdmin!
      .from('subscriptions').select('user_id, status, plans (name)').in('user_id', userIds).eq('status', 'active');
    subMap = new Map((subs ?? []).map((s) => [s.user_id, s as unknown as Record<string, unknown>]));
  }

  const users = (data ?? []).map((u) => ({
    ...u, email: emailMap[u.id] ?? null, subscription: subMap.get(u.id) ?? null,
  }));

  return { users, total: count ?? 0, limit, offset };
}

export async function getPlansSummary() {
  const { data, error } = await supabaseAdmin!.from('plans').select('id, name').order('name');
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getUserDetail(userId: string) {
  const { data: profile, error: pe } = await supabaseAdmin!
    .from('profiles')
    .select(`id, full_name, role, created_at,
      subscriptions (plan_id, status, current_period_end, plans (name, credits_per_month))`)
    .eq('id', userId)
    .single();

  if (pe || !profile) return null;

  const { data: entitlements } = await supabaseAdmin!
    .from('user_entitlements')
    .select('*, courses (title), modules (title), lessons (title)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  const { data: enrollments } = await supabaseAdmin!
    .from('enrollments').select('*, courses (title)')
    .eq('user_id', userId).order('enrolled_at', { ascending: false });

  const { data: authData } = await supabaseAdmin!.auth.admin.getUserById(userId);
  const authUser = authData.user ? {
    email: authData.user.email,
    last_sign_in_at: authData.user.last_sign_in_at,
    email_confirmed_at: authData.user.email_confirmed_at,
    created_at: authData.user.created_at,
  } : null;

  return { profile, entitlements: entitlements ?? [], enrollments: enrollments ?? [], authUser };
}

export async function updateProfile(userId: string, actorId: string, updates: { role?: string; full_name?: string }) {
  const { data, error } = await supabaseAdmin!
    .from('profiles').update(updates).eq('id', userId).select().single();
  if (error) throw new Error(error.message);
  await logAudit(actorId, 'admin_update_profile', userId, updates);
  return data;
}
