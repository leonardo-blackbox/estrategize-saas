import { supabaseAdmin } from '../lib/supabaseAdmin.js';

export type AccessReason =
  | 'plan_entitlement'
  | 'user_override_allow'
  | 'user_override_full_access'
  | 'free_preview'
  | 'admin'
  | 'not_enrolled'
  | 'user_override_deny'
  | 'drip_locked'
  | 'expired'
  | 'no_entitlement';

export interface AccessResult {
  allowed: boolean;
  reason: AccessReason;
  expiresAt?: Date;
  unlocksAt?: Date;
}

/**
 * Resolve se um usuário tem acesso a um curso.
 * Cascata: admin → free_preview → user override → plan entitlement → drip → expiration
 */
export async function resolveCourseAccess(
  userId: string,
  courseId: string,
): Promise<AccessResult> {
  if (!supabaseAdmin) return { allowed: false, reason: 'no_entitlement' };

  // 1. Verificar se é admin → acesso total
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single();

  if (profile?.role === 'admin') {
    return { allowed: true, reason: 'admin' };
  }

  // 2. Verificar user_entitlements override individual
  const { data: override } = await supabaseAdmin
    .from('user_entitlements')
    .select('access, expires_at')
    .eq('user_id', userId)
    .eq('course_id', courseId)
    .is('module_id', null)
    .is('lesson_id', null)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (override) {
    if (override.expires_at && new Date(override.expires_at) < new Date()) {
      return { allowed: false, reason: 'expired' };
    }
    if (override.access === 'deny') {
      return { allowed: false, reason: 'user_override_deny' };
    }
    if (override.access === 'full_access' || override.access === 'allow') {
      return {
        allowed: true,
        reason: override.access === 'full_access' ? 'user_override_full_access' : 'user_override_allow',
        expiresAt: override.expires_at ? new Date(override.expires_at) : undefined,
      };
    }
  }

  // 3. Verificar plan_entitlements via subscription ativa
  const { data: planEntitlement } = await supabaseAdmin
    .from('subscriptions')
    .select(`
      plan_id,
      status,
      current_period_end,
      plan_entitlements!inner (course_id)
    `)
    .eq('user_id', userId)
    .eq('status', 'active')
    .eq('plan_entitlements.course_id', courseId)
    .limit(1)
    .single();

  if (planEntitlement) {
    const expiresAt = planEntitlement.current_period_end
      ? new Date(planEntitlement.current_period_end)
      : undefined;

    // 4. Verificar drip: existe matrícula? Dias suficientes?
    const { data: enrollment } = await supabaseAdmin
      .from('enrollments')
      .select('enrolled_at, expires_at')
      .eq('user_id', userId)
      .eq('course_id', courseId)
      .single();

    if (!enrollment) {
      // Tem entitlement via plano mas não está matriculado ainda
      return { allowed: true, reason: 'plan_entitlement', expiresAt };
    }

    if (enrollment.expires_at && new Date(enrollment.expires_at) < new Date()) {
      return { allowed: false, reason: 'expired' };
    }

    return { allowed: true, reason: 'plan_entitlement', expiresAt };
  }

  return { allowed: false, reason: 'no_entitlement' };
}

/**
 * Resolve se um usuário tem acesso a uma aula específica.
 * Considera drip_days do módulo e da aula, e override full_access.
 */
export async function resolveLessonAccess(
  userId: string,
  lessonId: string,
): Promise<AccessResult> {
  if (!supabaseAdmin) return { allowed: false, reason: 'no_entitlement' };

  // Buscar aula com módulo e curso
  const { data: lesson } = await supabaseAdmin
    .from('lessons')
    .select(`
      id, drip_days, is_free_preview,
      modules!inner (
        id, drip_days,
        courses!inner (id)
      )
    `)
    .eq('id', lessonId)
    .single();

  if (!lesson) return { allowed: false, reason: 'no_entitlement' };

  const module = lesson.modules as any;
  const courseId = module.courses.id;
  const moduleId = module.id;

  // 1. Admin → acesso total
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single();

  if (profile?.role === 'admin') return { allowed: true, reason: 'admin' };

  // 2. Free preview
  if (lesson.is_free_preview) return { allowed: true, reason: 'free_preview' };

  // 3. Override full_access em qualquer nível (curso ou módulo)
  const { data: fullOverride } = await supabaseAdmin
    .from('user_entitlements')
    .select('access')
    .eq('user_id', userId)
    .eq('access', 'full_access')
    .or(`course_id.eq.${courseId},module_id.eq.${moduleId},lesson_id.eq.${lessonId}`)
    .limit(1)
    .single();

  if (fullOverride) {
    return { allowed: true, reason: 'user_override_full_access' };
  }

  // 4. Override deny na aula
  const { data: lessonDeny } = await supabaseAdmin
    .from('user_entitlements')
    .select('access')
    .eq('user_id', userId)
    .eq('lesson_id', lessonId)
    .eq('access', 'deny')
    .single();

  if (lessonDeny) return { allowed: false, reason: 'user_override_deny' };

  // 5. Verificar acesso ao curso
  const courseAccess = await resolveCourseAccess(userId, courseId);
  if (!courseAccess.allowed) return courseAccess;

  // 6. Verificar drip (módulo ou aula)
  const { data: enrollment } = await supabaseAdmin
    .from('enrollments')
    .select('enrolled_at')
    .eq('user_id', userId)
    .eq('course_id', courseId)
    .single();

  if (!enrollment) {
    // Sem matrícula formal, mas tem acesso ao curso → conceder (drip = 0)
    return courseAccess;
  }

  const enrolledAt = new Date(enrollment.enrolled_at);
  const now = new Date();
  const daysSinceEnrollment = Math.floor(
    (now.getTime() - enrolledAt.getTime()) / (1000 * 60 * 60 * 24),
  );

  const effectiveDrip = Math.max(lesson.drip_days ?? 0, module.drip_days ?? 0);

  if (daysSinceEnrollment < effectiveDrip) {
    const unlocksAt = new Date(enrolledAt);
    unlocksAt.setDate(unlocksAt.getDate() + effectiveDrip);
    return { allowed: false, reason: 'drip_locked', unlocksAt };
  }

  return { allowed: true, reason: 'plan_entitlement', expiresAt: courseAccess.expiresAt };
}

/**
 * Busca todos os cursos com status de acesso para um usuário.
 * Usado para montar o catálogo na FormacaoPage.
 */
export async function getUserCoursesCatalog(userId: string) {
  if (!supabaseAdmin) return [];

  const { data: courses } = await supabaseAdmin
    .from('courses')
    .select(`
      id, title, description, cover_url, status, sort_order,
      modules (
        id,
        lessons (id)
      )
    `)
    .eq('status', 'published')
    .order('sort_order');

  if (!courses) return [];

  const catalogWithAccess = await Promise.all(
    courses.map(async (course) => {
      const access = await resolveCourseAccess(userId, course.id);
      const totalLessons = course.modules?.reduce(
        (sum: number, m: any) => sum + (m.lessons?.length ?? 0),
        0,
      ) ?? 0;

      return {
        id: course.id,
        title: course.title,
        description: course.description,
        cover_url: course.cover_url,
        sort_order: course.sort_order,
        total_lessons: totalLessons,
        access,
      };
    }),
  );

  return catalogWithAccess;
}
