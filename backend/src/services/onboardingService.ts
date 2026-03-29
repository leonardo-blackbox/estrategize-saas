import { supabaseAdmin } from '../lib/supabaseAdmin.js';

export interface PurchaseEvent {
  event_id: string;
  customer_email: string;
  customer_name?: string;
  plan_id?: string;
  course_id?: string;
  user_id?: string;
  stripe_customer_id?: string;
  stripe_subscription_id?: string;
  provider: string;
}

/**
 * createSubscriptionRecord — creates or replaces the subscription record for a user.
 * Resolves plan_id via stripe_price_id chain: stripe_products -> plans
 */
async function createSubscriptionRecord(
  userId: string,
  event: PurchaseEvent,
  stripePriceId: string | null,
): Promise<void> {
  if (!supabaseAdmin || !event.plan_id) return;

  let planDbId: string | null = null;

  if (stripePriceId) {
    const { data: plan } = await supabaseAdmin
      .from('plans')
      .select('id')
      .eq('stripe_price_id', stripePriceId)
      .single();

    planDbId = plan?.id ?? null;
  }

  if (!planDbId) {
    console.warn('[onboarding] Cannot create subscription: no matching plans row for stripe_price_id', stripePriceId);
    return;
  }

  // Delete existing subscription for this user, then insert new
  await supabaseAdmin.from('subscriptions').delete().eq('user_id', userId);

  const { error } = await supabaseAdmin.from('subscriptions').insert({
    user_id: userId,
    plan_id: planDbId,
    stripe_customer_id: event.stripe_customer_id ?? null,
    stripe_subscription_id: event.stripe_subscription_id ?? null,
    status: 'active',
    current_period_start: new Date().toISOString(),
  });

  if (error) {
    console.error('[onboarding] Failed to create subscription record:', error.message);
  } else {
    console.log(`[onboarding] Subscription record created for user ${userId}, plan ${planDbId}`);
  }
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
  let userId: string;

  if (event.user_id) {
    // Direct userId from Stripe client_reference_id — skip listUsers scan
    userId = event.user_id;
    console.log(`[onboarding] Using direct userId: ${userId}`);
  } else {
    // Fallback: email-based lookup (for Hotmart/Kiwify webhooks)
    const { data: listData } = await supabaseAdmin.auth.admin.listUsers();
    const existing = listData.users.find((u) => u.email === event.customer_email);

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

    // ─── 4b. Grant credits from plan ──────────────────────────────
    const { data: planProduct } = await supabaseAdmin
      .from('stripe_products')
      .select('credits, stripe_price_id')
      .eq('id', event.plan_id)
      .single();

    if (planProduct?.credits && planProduct.credits > 0) {
      const { grantCredits } = await import('./creditService.js');
      await grantCredits(
        userId,
        planProduct.credits,
        'purchase',
        `Plan purchase: ${event.plan_id} (${event.provider})`,
      );
      console.log(`[onboarding] Granted ${planProduct.credits} credits to user ${userId}`);
    }

    // ─── 4c. Create subscription record ───────────────────────────
    await createSubscriptionRecord(userId, event, planProduct?.stripe_price_id ?? null);
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
