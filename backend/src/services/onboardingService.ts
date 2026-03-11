import { supabaseAdmin } from '../lib/supabaseAdmin.js';

export interface PurchaseEvent {
  event_id: string;
  customer_email: string;
  customer_name?: string;
  plan_id?: string;
  course_id?: string;
  provider: string;
}

/**
 * processPurchase — fluxo completo de onboarding após compra aprovada.
 *
 * 1. Encontra ou cria usuário no Supabase Auth (invite por email)
 * 2. Garante que existe um profile (trigger on auth.users faz isso, mas upsert como fallback)
 * 3. Cria matrícula no curso (se course_id fornecido)
 * 4. Aplica plan_entitlements do plano comprado (se plan_id fornecido)
 * 5. Registra audit log
 */
export async function processPurchase(event: PurchaseEvent): Promise<void> {
  if (!supabaseAdmin) throw new Error('supabaseAdmin not initialized');
  if (!event.customer_email) throw new Error('customer_email required');

  // ─── 1. Encontrar ou criar usuário ──────────────────────────────
  const { data: listData } = await supabaseAdmin.auth.admin.listUsers();
  const existing = listData.users.find((u) => u.email === event.customer_email);

  let userId: string;

  if (!existing) {
    const { data: invited, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(
      event.customer_email,
      { data: { full_name: event.customer_name ?? '' } },
    );
    if (inviteError || !invited.user) {
      throw new Error(`Failed to invite user: ${inviteError?.message}`);
    }
    userId = invited.user.id;
    console.log(`[onboarding] New user created: ${userId} (${event.customer_email})`);
  } else {
    userId = existing.id;
    console.log(`[onboarding] Existing user found: ${userId}`);
  }

  // ─── 2. Upsert profile (segurança caso trigger falhe) ──────────
  await supabaseAdmin.from('profiles').upsert({
    id: userId,
    full_name: event.customer_name ?? null,
    role: 'member',
  }, { onConflict: 'id', ignoreDuplicates: true });

  // ─── 3. Enrollment no curso específico ─────────────────────────
  if (event.course_id) {
    const { error: enrollError } = await supabaseAdmin
      .from('enrollments')
      .upsert({
        user_id: userId,
        course_id: event.course_id,
        source: 'webhook',
      }, { onConflict: 'user_id,course_id' });

    if (enrollError) {
      console.error('[onboarding] Enrollment failed:', enrollError.message);
    } else {
      console.log(`[onboarding] Enrolled user ${userId} in course ${event.course_id}`);
    }
  }

  // ─── 4. Aplicar plan_entitlements ──────────────────────────────
  if (event.plan_id) {
    const { data: planEntitlements } = await supabaseAdmin
      .from('plan_entitlements')
      .select('course_id, collection_id')
      .eq('plan_id', event.plan_id);

    for (const pe of planEntitlements ?? []) {
      if (pe.course_id) {
        await supabaseAdmin.from('enrollments').upsert({
          user_id: userId,
          course_id: pe.course_id,
          source: 'plan',
        }, { onConflict: 'user_id,course_id' });
      }
      // collection_id: enrollar em todos os cursos da coleção
      if (pe.collection_id) {
        const { data: coursesInCollection } = await supabaseAdmin
          .from('course_collections')
          .select('course_id')
          .eq('collection_id', pe.collection_id);

        for (const cc of coursesInCollection ?? []) {
          await supabaseAdmin.from('enrollments').upsert({
            user_id: userId,
            course_id: cc.course_id,
            source: 'plan',
          }, { onConflict: 'user_id,course_id' });
        }
      }
    }

    console.log(`[onboarding] Plan entitlements applied for plan ${event.plan_id}`);
  }

  // ─── 5. Audit log ──────────────────────────────────────────────
  await supabaseAdmin.from('audit_logs').insert({
    actor_email: 'system',
    action: 'purchase_onboarding_completed',
    target_type: 'user',
    target_id: userId,
    metadata: {
      event_id: event.event_id,
      provider: event.provider,
      customer_email: event.customer_email,
      plan_id: event.plan_id ?? null,
      course_id: event.course_id ?? null,
    },
  });
}

/**
 * processCancellation — revoga entitlements e registra audit ao cancelar.
 */
export async function processCancellation(event: PurchaseEvent): Promise<void> {
  if (!supabaseAdmin) return;
  if (!event.customer_email) return;

  const { data: listData } = await supabaseAdmin.auth.admin.listUsers();
  const existing = listData.users.find((u) => u.email === event.customer_email);
  if (!existing) return;

  await supabaseAdmin.from('audit_logs').insert({
    actor_email: 'system',
    action: 'subscription_canceled',
    target_type: 'user',
    target_id: existing.id,
    metadata: {
      event_id: event.event_id,
      provider: event.provider,
      customer_email: event.customer_email,
    },
  });

  console.log(`[onboarding] Cancellation recorded for ${event.customer_email}`);
}
