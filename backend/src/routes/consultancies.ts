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
import {
  createDiagnosis,
  getDiagnosisByConsultancy,
  updateDiagnosis,
  getDiagnosisHistory,
} from '../services/diagnosisService.js';

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

const diagnosisUpdateSchema = z.object({
  content: z.object({
    executiveSummary: z.string().min(1),
    sections: z.array(
      z.object({
        name: z.string().min(1),
        insights: z.array(z.string()),
      }),
    ),
  }),
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

// ============================================================================
// DIAGNOSIS ENDPOINTS (Story 1.8)
// ============================================================================

// POST /api/consultancies/:id/diagnose
// Generate a new diagnosis for a consultancy
router.post('/:id/diagnose', async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.userId!;
    const consultancyId = paramId(req);

    // Verify consultancy exists and belongs to user
    const consultancy = await getConsultancy(userId, consultancyId);
    if (!consultancy) {
      res.status(404).json({ error: 'Consultancy not found' });
      return;
    }

    // Check if diagnosis already exists
    const existing = await getDiagnosisByConsultancy(userId, consultancyId);
    if (existing) {
      res.status(409).json({
        error: 'Diagnosis already exists for this consultancy. Use PUT to update.',
      });
      return;
    }

    // Generate diagnosis
    const diagnosis = await createDiagnosis(
      userId,
      consultancyId,
      consultancy.title,
      consultancy.client_name,
    );

    res.status(201).json({ data: diagnosis });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Diagnosis generation error:', err);
    res.status(500).json({ error: message });
  }
});

// GET /api/consultancies/:id/diagnose
// Get the latest diagnosis for a consultancy
router.get('/:id/diagnose', async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.userId!;
    const consultancyId = paramId(req);

    const diagnosis = await getDiagnosisByConsultancy(userId, consultancyId);

    if (!diagnosis) {
      res.status(404).json({ error: 'No diagnosis found for this consultancy' });
      return;
    }

    res.json({ data: diagnosis });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
});

// PUT /api/consultancies/:id/diagnose
// Update diagnosis content (creates new version)
router.put('/:id/diagnose', async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.userId!;
    const consultancyId = paramId(req);

    // Validate request body
    const validation = diagnosisUpdateSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({
        error: 'Invalid diagnosis content',
        details: validation.error.issues,
      });
      return;
    }

    const { content } = validation.data;

    // Update diagnosis
    const updated = await updateDiagnosis(userId, consultancyId, content);

    res.json({ data: updated });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
});

// GET /api/consultancies/:id/diagnose/history
// Get all diagnosis versions for a consultancy
router.get('/:id/diagnose/history', async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.userId!;
    const consultancyId = paramId(req);

    const history = await getDiagnosisHistory(userId, consultancyId);

    res.json({ data: history });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
});

export default router;
