import { Router } from 'express';
import { z } from 'zod';
import { requireAuth, type AuthenticatedRequest } from '../middleware/auth.js';
import {
  listConsultancies,
  getConsultancy,
  createConsultancy,
  updateConsultancy,
  softDeleteConsultancy,
} from '../services/consultancyService.js';

const router = Router();

// All routes require authentication
router.use(requireAuth);

function paramId(req: AuthenticatedRequest): string {
  const id = req.params.id;
  return Array.isArray(id) ? id[0] : id;
}

const createSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255),
  client_name: z.string().max(255).optional(),
  status: z.enum(['active', 'archived']).optional(),
});

const updateSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  client_name: z.string().max(255).optional(),
  status: z.enum(['active', 'archived']).optional(),
});

// GET /api/consultancies
router.get('/', async (req: AuthenticatedRequest, res) => {
  try {
    const data = await listConsultancies(req.userId!);
    res.json({ data });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
});

// GET /api/consultancies/:id
router.get('/:id', async (req: AuthenticatedRequest, res) => {
  try {
    const consultancy = await getConsultancy(req.userId!, paramId(req));
    if (!consultancy) {
      res.status(404).json({ error: 'Consultancy not found' });
      return;
    }
    res.json({ data: consultancy });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
});

// POST /api/consultancies
router.post('/', async (req: AuthenticatedRequest, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0].message });
    return;
  }

  try {
    const consultancy = await createConsultancy(req.userId!, parsed.data);
    res.status(201).json({ data: consultancy });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
});

// PUT /api/consultancies/:id
router.put('/:id', async (req: AuthenticatedRequest, res) => {
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0].message });
    return;
  }

  try {
    const consultancy = await updateConsultancy(
      req.userId!,
      paramId(req),
      parsed.data,
    );
    if (!consultancy) {
      res.status(404).json({ error: 'Consultancy not found' });
      return;
    }
    res.json({ data: consultancy });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
});

// DELETE /api/consultancies/:id (soft delete)
router.delete('/:id', async (req: AuthenticatedRequest, res) => {
  try {
    const deleted = await softDeleteConsultancy(req.userId!, paramId(req));
    if (!deleted) {
      res.status(404).json({ error: 'Consultancy not found' });
      return;
    }
    res.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
});

export default router;
