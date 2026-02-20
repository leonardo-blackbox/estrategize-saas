import { Router } from 'express';
import { z } from 'zod';
import { requireAuth, type AuthenticatedRequest } from '../middleware/auth.js';
import {
  getBalance,
  reserveCredits,
  consumeCredits,
  releaseCredits,
  grantCredits,
  listTransactions,
} from '../services/creditService.js';

const router = Router();

// All routes require authentication
router.use(requireAuth);

// ============================================================================
// Validation Schemas
// ============================================================================

const reserveSchema = z.object({
  amount: z.number().int().positive('Amount must be a positive integer'),
  idempotency_key: z.string().min(1).max(255).optional(),
  reference_id: z.string().max(255).optional(),
  description: z.string().max(500).optional(),
});

const consumeSchema = z.object({
  reservation_id: z.string().uuid('Invalid reservation ID'),
});

const releaseSchema = z.object({
  reservation_id: z.string().uuid('Invalid reservation ID'),
});

const grantSchema = z.object({
  amount: z.number().int().positive('Amount must be a positive integer'),
  type: z.enum(['purchase', 'monthly_grant']).default('purchase'),
  description: z.string().max(500).optional(),
});

// ============================================================================
// GET /api/credits/balance
// Returns current credit balance and usage stats
// ============================================================================

router.get('/balance', async (req: AuthenticatedRequest, res) => {
  try {
    const balance = await getBalance(req.userId!);
    res.json({ data: balance });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
});

// ============================================================================
// POST /api/credits/reserve
// Reserve credits before an operation (e.g. AI diagnosis)
// ============================================================================

router.post('/reserve', async (req: AuthenticatedRequest, res) => {
  const parsed = reserveSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0].message });
    return;
  }

  try {
    const reservationId = await reserveCredits(
      req.userId!,
      parsed.data.amount,
      parsed.data.idempotency_key,
      parsed.data.reference_id,
      parsed.data.description,
    );

    res.status(201).json({
      data: { reservation_id: reservationId },
    });
  } catch (err) {
    const error = err as Error & { statusCode?: number };
    const statusCode = error.statusCode ?? 500;
    res.status(statusCode).json({ error: error.message });
  }
});

// ============================================================================
// POST /api/credits/consume
// Confirm a reservation (converts reserve → consume)
// ============================================================================

router.post('/consume', async (req: AuthenticatedRequest, res) => {
  const parsed = consumeSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0].message });
    return;
  }

  try {
    await consumeCredits(req.userId!, parsed.data.reservation_id);
    res.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    // Distinguish not-found vs already-processed
    if (message.includes('not found')) {
      res.status(404).json({ error: message });
    } else if (message.includes('already processed')) {
      res.status(409).json({ error: message });
    } else {
      res.status(500).json({ error: message });
    }
  }
});

// ============================================================================
// POST /api/credits/release
// Cancel a reservation (returns credits to available balance)
// ============================================================================

router.post('/release', async (req: AuthenticatedRequest, res) => {
  const parsed = releaseSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0].message });
    return;
  }

  try {
    await releaseCredits(req.userId!, parsed.data.reservation_id);
    res.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    if (message.includes('not found')) {
      res.status(404).json({ error: message });
    } else if (message.includes('already processed')) {
      res.status(409).json({ error: message });
    } else {
      res.status(500).json({ error: message });
    }
  }
});

// ============================================================================
// POST /api/credits/grant
// Add credits to user (for purchases, monthly grants, testing)
// ============================================================================

router.post('/grant', async (req: AuthenticatedRequest, res) => {
  const parsed = grantSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0].message });
    return;
  }

  try {
    const transactionId = await grantCredits(
      req.userId!,
      parsed.data.amount,
      parsed.data.type,
      parsed.data.description,
    );

    res.status(201).json({
      data: { transaction_id: transactionId },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
});

// ============================================================================
// GET /api/credits/transactions
// List recent credit transactions (paginated)
// ============================================================================

router.get('/transactions', async (req: AuthenticatedRequest, res) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 50, 100);
    const offset = Math.max(Number(req.query.offset) || 0, 0);

    const transactions = await listTransactions(req.userId!, limit, offset);
    res.json({ data: transactions });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
});

export default router;
