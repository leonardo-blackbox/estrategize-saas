import { supabaseAdmin } from '../lib/supabaseAdmin.js';

// ============================================================================
// Audit Helper
// ============================================================================

export async function logAudit(
  actorId: string,
  action: string,
  targetId: string,
  metadata: Record<string, unknown>,
) {
  await supabaseAdmin!.from('audit_logs').insert({
    actor_id: actorId,
    action,
    target_type: 'user',
    target_id: targetId,
    metadata,
  });
}

// ============================================================================
// Enrollments
// ============================================================================

export async function listEnrollments(limit: number, offset: number, courseId?: string) {
  let query = supabaseAdmin!
    .from('enrollments')
    .select('*, profiles (full_name), courses (title)', { count: 'exact' })
    .order('enrolled_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (courseId) query = query.eq('course_id', courseId);

  const { data, error, count } = await query;
  if (error) throw new Error(error.message);
  return { enrollments: data ?? [], total: count ?? 0 };
}

export async function createEnrollment(
  userId: string,
  courseId: string,
  actorId: string,
) {
  const { data, error } = await supabaseAdmin!
    .from('enrollments')
    .insert({ user_id: userId, course_id: courseId })
    .select('*, profiles (full_name), courses (title)')
    .single();

  if (error) {
    if (error.code === '23505') {
      return { data: null, conflict: true };
    }
    throw new Error(error.message);
  }

  await logAudit(actorId, 'admin_create_enrollment', userId, {
    course_id: courseId,
    enrollment_id: data.id,
  });

  return { data, conflict: false };
}

export async function deleteEnrollment(
  enrollmentId: string,
  actorId: string,
) {
  const { data: enrollment } = await supabaseAdmin!
    .from('enrollments')
    .select('user_id, course_id')
    .eq('id', enrollmentId)
    .single();

  const { error } = await supabaseAdmin!
    .from('enrollments')
    .delete()
    .eq('id', enrollmentId);

  if (error) throw new Error(error.message);

  if (enrollment) {
    await logAudit(actorId, 'admin_delete_enrollment', enrollment.user_id, {
      course_id: enrollment.course_id,
      enrollment_id: enrollmentId,
    });
  }
}

// ============================================================================
// Entitlements
// ============================================================================

export interface GrantEntitlementInput {
  course_id?: string;
  module_id?: string;
  lesson_id?: string;
  access: 'allow' | 'deny' | 'full_access';
  expires_at?: string | null;
  reason?: string;
}

export async function grantEntitlement(
  userId: string,
  actorId: string,
  input: GrantEntitlementInput,
) {
  const { data, error } = await supabaseAdmin!
    .from('user_entitlements')
    .insert({ ...input, user_id: userId, granted_by: actorId })
    .select()
    .single();

  if (error) throw new Error(error.message);

  await logAudit(actorId, 'grant_entitlement', userId, {
    entitlement_id: data.id,
    access: input.access,
  });

  return data;
}

export async function revokeEntitlement(
  userId: string,
  entitlementId: string,
  actorId: string,
) {
  const { error } = await supabaseAdmin!
    .from('user_entitlements')
    .delete()
    .eq('id', entitlementId)
    .eq('user_id', userId);

  if (error) throw new Error(error.message);

  await logAudit(actorId, 'revoke_entitlement', userId, {
    entitlement_id: entitlementId,
  });
}

export async function grantFullAccess(
  userId: string,
  courseId: string,
  actorId: string,
) {
  const { data, error } = await supabaseAdmin!
    .from('user_entitlements')
    .upsert(
      {
        user_id: userId,
        course_id: courseId,
        access: 'full_access',
        granted_by: actorId,
        reason: 'admin_grant_full_access',
      },
      { onConflict: 'user_id,course_id' },
    )
    .select()
    .single();

  if (error) throw new Error(error.message);

  await logAudit(actorId, 'grant_full_access', userId, { course_id: courseId });

  return data;
}

export async function reprocessEntitlements(userId: string, actorId: string) {
  const { data: sub } = await supabaseAdmin!
    .from('subscriptions')
    .select('plan_id, status')
    .eq('user_id', userId)
    .eq('status', 'active')
    .single();

  await logAudit(actorId, 'reprocess_entitlements', userId, {
    plan_id: sub?.plan_id ?? null,
  });

  return { ok: true, subscription: sub ?? null };
}
