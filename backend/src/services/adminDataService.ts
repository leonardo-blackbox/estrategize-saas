import { supabaseAdmin } from '../lib/supabaseAdmin.js';
import { getBalance } from './creditService.js';
import { logAudit } from './adminEntitlementService.js';

// ============================================================================
// Admin Stats
// ============================================================================

export async function getAdminStats() {
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

  return {
    totalUsers: totalUsers ?? 0,
    totalCourses: totalCourses ?? 0,
    totalEnrollments: totalEnrollments ?? 0,
    totalWebhookEvents: totalWebhookEvents ?? 0,
    failedWebhooks: failedWebhooks ?? 0,
    totalAuditActions: totalAuditActions ?? 0,
  };
}

// ============================================================================
// User Progress
// ============================================================================

export async function getUserProgress(userId: string) {
  const { data: enrollments } = await supabaseAdmin!
    .from('enrollments')
    .select('course_id, courses (id, title)')
    .eq('user_id', userId);

  if (!enrollments || enrollments.length === 0) return [];

  interface EnrollmentCourse { id: string; title: string }
  return Promise.all(
    enrollments.map(async (enr) => {
      const courseId = enr.course_id;
      const courseData = enr.courses as unknown as EnrollmentCourse | null;
      const { data: modules } = await supabaseAdmin!
        .from('modules')
        .select('id')
        .eq('course_id', courseId);

      const moduleIds = (modules ?? []).map((m) => m.id);
      if (moduleIds.length === 0) {
        return { course_id: courseId, title: courseData?.title ?? courseId, total_lessons: 0, completed_lessons: 0 };
      }

      const { count: totalLessons } = await supabaseAdmin!
        .from('lessons')
        .select('id', { count: 'exact', head: true })
        .in('module_id', moduleIds);

      const { data: lessons } = await supabaseAdmin!
        .from('lessons')
        .select('id')
        .in('module_id', moduleIds);

      const lessonIds = (lessons ?? []).map((l) => l.id);
      const { count: completedLessons } = lessonIds.length > 0
        ? await supabaseAdmin!
            .from('lesson_progress')
            .select('lesson_id', { count: 'exact', head: true })
            .eq('user_id', userId)
            .eq('completed', true)
            .in('lesson_id', lessonIds)
        : { count: 0 };

      return {
        course_id: courseId,
        title: courseData?.title ?? courseId,
        total_lessons: totalLessons ?? 0,
        completed_lessons: completedLessons ?? 0,
      };
    }),
  );
}

// ============================================================================
// Credits
// ============================================================================

export async function getCreditBalance(userId: string) {
  return getBalance(userId);
}

export async function getCreditTransactions(userId: string, limit: number, offset: number) {
  const [{ data, error, count }, balanceResult] = await Promise.all([
    supabaseAdmin!
      .from('credit_transactions')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1),
    getBalance(userId),
  ]);

  if (error) throw new Error(error.message);

  return {
    transactions: data ?? [],
    total: count ?? 0,
    balance: balanceResult.available,
    reserved: balanceResult.reserved,
    consumed_this_month: balanceResult.consumed_this_month,
    total_consumed: balanceResult.total_consumed,
  };
}

export async function adjustCredits(userId: string, actorId: string, amount: number, description: string) {
  const type = amount > 0 ? 'purchase' : 'consume';
  const storedAmount = Math.abs(amount);

  const { data, error } = await supabaseAdmin!
    .from('credit_transactions')
    .insert({
      user_id: userId,
      amount: storedAmount,
      type,
      status: 'confirmed',
      description,
      idempotency_key: `admin_adjust_${actorId}_${Date.now()}`,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  await logAudit(actorId, 'admin_credit_adjustment', userId, {
    amount, description, transaction_id: data.id,
  });

  return data;
}

// ============================================================================
// Audit Logs
// ============================================================================

export async function getAuditLogs(limit: number, offset: number, targetId?: string) {
  let query = supabaseAdmin!
    .from('audit_logs')
    .select('*, profiles!actor_id (full_name)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (targetId) query = query.eq('target_id', targetId);

  const { data, error, count } = await query;
  if (error) throw new Error(error.message);
  return { data, count, limit, offset };
}

// ============================================================================
// Webhook Events
// ============================================================================

export async function getWebhookEvents(limit: number, offset: number, status?: string, provider?: string) {
  let query = supabaseAdmin!
    .from('webhook_events')
    .select('id, provider, event_type, event_id, status, error, processed_at, created_at', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (status) query = query.eq('status', status);
  if (provider) query = query.eq('provider', provider);

  const { data, error, count } = await query;
  if (error) throw new Error(error.message);
  return { data, count, limit, offset };
}

export async function getWebhookEventById(id: string) {
  const { data, error } = await supabaseAdmin!
    .from('webhook_events')
    .select('*')
    .eq('id', id)
    .single();
  if (error || !data) return null;
  return data;
}
