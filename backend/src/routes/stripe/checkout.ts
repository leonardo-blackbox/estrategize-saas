import { Router } from 'express';
import Stripe from 'stripe';
import { z } from 'zod';
import { requireAuth, type AuthenticatedRequest } from '../../middleware/auth.js';
import { supabaseAdmin } from '../../lib/supabaseAdmin.js';

// ─── Stripe client ────────────────────────────────────────────────
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? '', {
  apiVersion: '2026-01-28.clover',
});

const router = Router();
router.use(requireAuth);

// ─── Validation schema ────────────────────────────────────────────
const checkoutSchema = z.object({
  price_id: z.string().uuid(),
});

// ─── POST /checkout-session ───────────────────────────────────────
router.post('/checkout-session', async (req: AuthenticatedRequest, res) => {
  const parsed = checkoutSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const { price_id } = parsed.data;

  if (!supabaseAdmin) {
    return res.status(503).json({ error: 'Database service unavailable' });
  }

  const { data: product, error: dbError } = await supabaseAdmin
    .from('stripe_products')
    .select('stripe_price_id, status, billing_interval')
    .eq('id', price_id)
    .single();

  if (dbError || !product) {
    return res.status(404).json({ error: 'Plano nao encontrado ou indisponivel' });
  }

  if (product.status !== 'active') {
    return res.status(404).json({ error: 'Plano nao encontrado ou indisponivel' });
  }

  if (!product.stripe_price_id) {
    return res.status(500).json({ error: 'Plano sem preco configurado no Stripe' });
  }

  const mode: Stripe.Checkout.SessionCreateParams['mode'] =
    product.billing_interval === 'one_time' ? 'payment' : 'subscription';

  try {
    const session = await stripe.checkout.sessions.create({
      mode,
      line_items: [{ price: product.stripe_price_id, quantity: 1 }],
      success_url: `${process.env.FRONTEND_URL}/checkout/sucesso?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/planos`,
      client_reference_id: req.userId,
      metadata: {
        user_id: req.userId ?? '',
        plan_id: price_id,
      },
    });

    return res.json({ url: session.url });
  } catch (err) {
    console.error('Stripe checkout error:', err);
    return res.status(502).json({ error: 'Erro ao criar sessao de checkout' });
  }
});

export default router;
