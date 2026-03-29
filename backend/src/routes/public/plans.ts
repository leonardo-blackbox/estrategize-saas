import { Router } from 'express';
import { supabaseAdmin } from '../../lib/supabaseAdmin.js';

const router = Router();

// GET /api/plans — public endpoint, no auth required
router.get('/', async (_req, res) => {
  if (!supabaseAdmin) {
    res.status(503).json({ error: 'Database unavailable' });
    return;
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('stripe_products')
      .select('id, name, description, price_cents, credits, billing_interval')
      .eq('status', 'active')
      .order('price_cents', { ascending: true });

    if (error) {
      res.status(500).json({ error: 'Failed to fetch plans' });
      return;
    }

    res.json({ data: data ?? [] });
  } catch {
    res.status(500).json({ error: 'Failed to fetch plans' });
  }
});

export default router;
