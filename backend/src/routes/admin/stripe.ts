import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../../middleware/auth.js';
import { requireAdmin } from '../../middleware/admin.js';
import {
  listProducts,
  createProduct,
  updateProduct,
  archiveProduct,
} from '../../services/stripeProductService.js';

const router = Router();
router.use(requireAuth, requireAdmin);

// ─── Validation schemas ───────────────────────────────────────────

const createProductSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(500).optional(),
  price_cents: z.number().int().min(0),
  credits: z.number().int().min(0),
  billing_interval: z.enum(['month', 'year', 'one_time']),
});

const updateProductSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(500).optional(),
  credits: z.number().int().min(0).optional(),
  status: z.enum(['active', 'archived']).optional(),
});

// ─── GET / — list all products ────────────────────────────────────

router.get('/', async (_req, res) => {
  try {
    const products = await listProducts();
    res.json({ data: products });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unexpected error';
    res.status(500).json({ error: message });
  }
});

// ─── POST / — create product + price in Stripe and DB ────────────

router.post('/', async (req, res) => {
  const parsed = createProductSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  try {
    const product = await createProduct(parsed.data);
    return res.status(201).json({ data: product });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unexpected error';
    return res.status(500).json({ error: message });
  }
});

// ─── PATCH /:id — update name/credits/status ─────────────────────

router.patch('/:id', async (req, res) => {
  const parsed = updateProductSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  try {
    const product = await updateProduct(req.params.id, parsed.data);
    return res.json({ data: product });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unexpected error';
    const status = message.includes('not found') ? 404 : 500;
    return res.status(status).json({ error: message });
  }
});

// ─── DELETE /:id — archive product in Stripe and DB ──────────────

router.delete('/:id', async (req, res) => {
  try {
    const product = await archiveProduct(req.params.id);
    return res.json({ data: product });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unexpected error';
    const status = message.includes('not found') ? 404 : 500;
    return res.status(status).json({ error: message });
  }
});

export default router;
