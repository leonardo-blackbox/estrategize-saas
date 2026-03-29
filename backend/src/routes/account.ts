import { Router } from 'express';
import Stripe from 'stripe';
import { requireAuth, type AuthenticatedRequest } from '../middleware/auth.js';
import { supabaseAdmin } from '../lib/supabaseAdmin.js';
import { getBalance } from '../services/creditService.js';

// ─── Stripe client ────────────────────────────────────────────────
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? '', {
  apiVersion: '2026-01-28.clover',
});

const router = Router();
router.use(requireAuth);

// ============================================================================
// GET /api/account/subscription
// Returns active subscription info (plan name, status, renewal, credits)
// ============================================================================

router.get('/subscription', async (req: AuthenticatedRequest, res) => {
  if (!supabaseAdmin) {
    return res.status(503).json({ error: 'Database service unavailable' });
  }

  try {
    const { data: subscription } = await supabaseAdmin
      .from('subscriptions')
      .select('*, plans(name, credits_per_month)')
      .eq('user_id', req.userId!)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!subscription) {
      return res.json({ data: null });
    }

    const plan = subscription.plans as { name: string; credits_per_month: number } | null;
    const balance = await getBalance(req.userId!);

    // Try to enrich with live Stripe data
    let stripeStatus: string | null = null;
    let stripePeriodEnd: string | null = null;
    let cancelAtPeriodEnd = false;

    if (subscription.stripe_subscription_id) {
      try {
        const stripeSub = await stripe.subscriptions.retrieve(subscription.stripe_subscription_id) as unknown as {
          status: string;
          current_period_end: number;
          cancel_at_period_end: boolean;
        };
        stripeStatus = stripeSub.status;
        stripePeriodEnd = new Date(stripeSub.current_period_end * 1000).toISOString();
        cancelAtPeriodEnd = stripeSub.cancel_at_period_end;
      } catch (stripeErr) {
        console.warn('[account] Failed to fetch Stripe subscription, using DB data:', stripeErr);
      }
    }

    return res.json({
      data: {
        plan_name: plan?.name ?? null,
        status: stripeStatus ?? subscription.status,
        current_period_end: stripePeriodEnd ?? subscription.current_period_end ?? null,
        cancel_at_period_end: cancelAtPeriodEnd,
        credits_available: balance.available,
        credits_per_month: plan?.credits_per_month ?? 0,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return res.status(500).json({ error: message });
  }
});

// ============================================================================
// POST /api/account/billing-portal
// Creates a Stripe Customer Portal session
// ============================================================================

router.post('/billing-portal', async (req: AuthenticatedRequest, res) => {
  if (!supabaseAdmin) {
    return res.status(503).json({ error: 'Database service unavailable' });
  }

  try {
    const { data: subscription } = await supabaseAdmin
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', req.userId!)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!subscription?.stripe_customer_id) {
      return res.status(404).json({ error: 'Nenhuma assinatura Stripe encontrada' });
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: subscription.stripe_customer_id,
      return_url: `${process.env.FRONTEND_URL ?? 'http://localhost:5173'}/conta`,
    });

    return res.json({ data: { url: session.url } });
  } catch (err) {
    console.error('[account] Billing portal error:', err);
    return res.status(502).json({ error: 'Erro ao criar sessao do portal de faturamento' });
  }
});

export default router;
