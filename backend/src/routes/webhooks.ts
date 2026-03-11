import { Router, type Request, type Response } from 'express';
import crypto from 'crypto';
import { supabaseAdmin } from '../lib/supabaseAdmin.js';
import { processPurchase, processCancellation } from '../services/onboardingService.js';

const router = Router();

// ─── HMAC verification ────────────────────────────────────────

function verifyStripeSignature(payload: string, signature: string, secret: string): boolean {
  try {
    const parts = Object.fromEntries(signature.split(',').map((p) => p.split('=')));
    const timestamp = parts['t'];
    const sig = parts['v1'];
    if (!timestamp || !sig) return false;
    const signed = `${timestamp}.${payload}`;
    const expected = crypto.createHmac('sha256', secret).update(signed).digest('hex');
    return crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
  } catch {
    return false;
  }
}

function verifyHotmartSignature(payload: string, signature: string, secret: string): boolean {
  try {
    const expected = crypto.createHmac('sha256', secret).update(payload).digest('hex');
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  } catch {
    return false;
  }
}

function verifyKiwifySignature(payload: string, signature: string, secret: string): boolean {
  try {
    const expected = crypto.createHmac('sha256', secret).update(payload).digest('hex');
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  } catch {
    return false;
  }
}

// ─── Event normalization ───────────────────────────────────────

interface NormalizedEvent {
  event_id: string;
  event_type: 'purchase_approved' | 'subscription_active' | 'payment_failed' | 'canceled' | 'refunded' | 'other';
  customer_email: string;
  customer_name?: string;
  plan_id?: string;
  course_id?: string;
  raw: Record<string, unknown>;
}

function normalizeStripe(body: Record<string, unknown>): NormalizedEvent {
  const typeMap: Record<string, NormalizedEvent['event_type']> = {
    'checkout.session.completed': 'purchase_approved',
    'customer.subscription.created': 'subscription_active',
    'customer.subscription.updated': 'subscription_active',
    'invoice.payment_failed': 'payment_failed',
    'customer.subscription.deleted': 'canceled',
    'charge.refunded': 'refunded',
  };

  const data = (body.data as any)?.object ?? {};
  return {
    event_id: body.id as string,
    event_type: typeMap[body.type as string] ?? 'other',
    customer_email: data.customer_email ?? data.customer_details?.email ?? '',
    customer_name: data.customer_details?.name,
    plan_id: data.metadata?.plan_id,
    raw: body,
  };
}

function normalizeHotmart(body: Record<string, unknown>): NormalizedEvent {
  const typeMap: Record<string, NormalizedEvent['event_type']> = {
    'PURCHASE_APPROVED': 'purchase_approved',
    'PURCHASE_CANCELED': 'canceled',
    'PURCHASE_REFUNDED': 'refunded',
    'SUBSCRIPTION_CANCELLATION': 'canceled',
  };

  const data = (body.data as any) ?? {};
  return {
    event_id: body.id as string ?? `hotmart-${Date.now()}`,
    event_type: typeMap[body.event as string] ?? 'other',
    customer_email: data.buyer?.email ?? '',
    customer_name: data.buyer?.name,
    plan_id: data.product?.id?.toString(),
    raw: body,
  };
}

function normalizeKiwify(body: Record<string, unknown>): NormalizedEvent {
  const typeMap: Record<string, NormalizedEvent['event_type']> = {
    'order.paid': 'purchase_approved',
    'order.refunded': 'refunded',
    'subscription.cancelled': 'canceled',
  };

  return {
    event_id: body.order_id as string ?? `kiwify-${Date.now()}`,
    event_type: typeMap[body.webhook_event_type as string] ?? 'other',
    customer_email: (body.Customer as any)?.email ?? '',
    customer_name: (body.Customer as any)?.full_name,
    raw: body,
  };
}

// ─── Onboarding handler ───────────────────────────────────────

async function handlePurchaseApproved(event: NormalizedEvent): Promise<void> {
  if (!supabaseAdmin || !event.customer_email) return;

  // Verificar se usuário existe no Supabase Auth
  const { data: users } = await supabaseAdmin.auth.admin.listUsers();
  const existing = users.users.find((u) => u.email === event.customer_email);

  let userId: string;

  if (!existing) {
    // Criar novo usuário via invite
    const { data: newUser, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(
      event.customer_email,
      { data: { full_name: event.customer_name ?? '' } },
    );
    if (error || !newUser.user) {
      console.error('Failed to create user:', error?.message);
      return;
    }
    userId = newUser.user.id;
    console.log(`[webhook] New user created: ${userId} (${event.customer_email})`);
  } else {
    userId = existing.id;
    console.log(`[webhook] Existing user found: ${userId}`);
  }

  // Criar enrollment se tiver course_id
  if (event.course_id) {
    await supabaseAdmin.from('enrollments').upsert({
      user_id: userId,
      course_id: event.course_id,
      source: 'webhook',
      webhook_event_id: event.event_id as unknown as string,
    }, { onConflict: 'user_id,course_id' });
  }

  // Audit log
  await supabaseAdmin.from('audit_logs').insert({
    actor_email: 'system',
    action: 'purchase_onboarding_completed',
    target_type: 'user',
    target_id: userId,
    metadata: {
      event_id: event.event_id,
      provider: 'webhook',
      customer_email: event.customer_email,
      plan_id: event.plan_id,
    },
  });
}

async function handleCanceled(event: NormalizedEvent): Promise<void> {
  if (!supabaseAdmin || !event.customer_email) return;

  const { data: users } = await supabaseAdmin.auth.admin.listUsers();
  const existing = users.users.find((u) => u.email === event.customer_email);
  if (!existing) return;

  await supabaseAdmin.from('audit_logs').insert({
    actor_email: 'system',
    action: 'subscription_canceled',
    target_type: 'user',
    target_id: existing.id,
    metadata: { event_id: event.event_id, customer_email: event.customer_email },
  });
}

// ─── Webhook endpoint ─────────────────────────────────────────

router.post('/:provider', async (req: Request, res: Response) => {
  const provider = req.params.provider as 'stripe' | 'hotmart' | 'kiwify';
  const rawBody = JSON.stringify(req.body);

  // 1. Verificar assinatura
  const secrets: Record<string, string | undefined> = {
    stripe: process.env.WEBHOOK_SECRET_STRIPE,
    hotmart: process.env.WEBHOOK_SECRET_HOTMART,
    kiwify: process.env.WEBHOOK_SECRET_KIWIFY,
  };

  const secret = secrets[provider];
  if (!secret) {
    return res.status(400).json({ error: `Unknown provider: ${provider}` });
  }

  const sig =
    req.headers['stripe-signature'] as string ||
    req.headers['x-hotmart-signature'] as string ||
    req.headers['x-kiwify-signature'] as string ||
    '';

  let signatureValid = false;
  if (provider === 'stripe') signatureValid = verifyStripeSignature(rawBody, sig, secret);
  else if (provider === 'hotmart') signatureValid = verifyHotmartSignature(rawBody, sig, secret);
  else if (provider === 'kiwify') signatureValid = verifyKiwifySignature(rawBody, sig, secret);

  if (!signatureValid && process.env.NODE_ENV === 'production') {
    return res.status(401).json({ error: 'Invalid signature' });
  }

  // 2. Normalizar evento
  let event: NormalizedEvent;
  try {
    if (provider === 'stripe') event = normalizeStripe(req.body);
    else if (provider === 'hotmart') event = normalizeHotmart(req.body);
    else event = normalizeKiwify(req.body);
  } catch (err) {
    return res.status(400).json({ error: 'Failed to parse webhook body' });
  }

  if (!supabaseAdmin) return res.status(503).json({ error: 'DB unavailable' });

  // 3. Idempotência: verificar se já existe
  const { data: existing } = await supabaseAdmin
    .from('webhook_events')
    .select('id, status')
    .eq('provider', provider)
    .eq('event_id', event.event_id)
    .single();

  if (existing?.status === 'processed') {
    console.log(`[webhook] Skipping duplicate event: ${event.event_id}`);
    return res.json({ ok: true, skipped: true });
  }

  // 4. Salvar evento
  const { data: savedEvent, error: saveError } = await supabaseAdmin
    .from('webhook_events')
    .upsert({
      provider,
      event_type: event.event_type,
      event_id: event.event_id,
      payload: event.raw,
      status: 'processing',
    }, { onConflict: 'provider,event_id' })
    .select()
    .single();

  if (saveError) {
    console.error('[webhook] Failed to save event:', saveError.message);
    return res.status(500).json({ error: 'Failed to persist event' });
  }

  // 5. Processar via onboardingService
  try {
    const purchasePayload = {
      event_id: event.event_id,
      customer_email: event.customer_email,
      customer_name: event.customer_name,
      plan_id: event.plan_id,
      course_id: event.course_id,
      provider,
    };

    if (event.event_type === 'purchase_approved' || event.event_type === 'subscription_active') {
      await processPurchase(purchasePayload);
    } else if (event.event_type === 'canceled') {
      await processCancellation(purchasePayload);
    }

    await supabaseAdmin
      .from('webhook_events')
      .update({ status: 'processed', processed_at: new Date().toISOString() })
      .eq('id', savedEvent.id);

    res.json({ ok: true });
  } catch (err: any) {
    await supabaseAdmin
      .from('webhook_events')
      .update({ status: 'failed', error: err?.message ?? 'Unknown error' })
      .eq('id', savedEvent.id);

    console.error('[webhook] Processing failed:', err);
    res.status(500).json({ error: 'Processing failed' });
  }
});

export default router;
