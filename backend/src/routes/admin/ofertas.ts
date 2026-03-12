import { Router } from 'express';
import { z } from 'zod';
import { supabaseAdmin } from '../../lib/supabaseAdmin.js';
import { requireAuth } from '../../middleware/auth.js';
import { requireAdmin } from '../../middleware/admin.js';

const router = Router();
router.use(requireAuth, requireAdmin);

const ofertaSchema = z.object({
  name: z.string().min(1).max(200),
  type: z.enum(['one-time', 'subscription']).optional(),
  price_display: z.string().max(50).optional().nullable(),
  status: z.enum(['active', 'archived']).optional(),
});

// GET / — list all ofertas with turmas
router.get('/', async (_req, res) => {
  const { data, error } = await supabaseAdmin!
    .from('ofertas')
    .select(`id, name, type, price_display, status, created_at,
      oferta_turmas (sort_order, turmas (id, name, course_id, courses (id, title)))`)
    .order('created_at', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  res.json({ ofertas: data ?? [] });
});

// POST / — create oferta
router.post('/', async (req, res) => {
  const parsed = ofertaSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const { data, error } = await supabaseAdmin!
    .from('ofertas')
    .insert(parsed.data)
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

// GET /:id — detail
router.get('/:id', async (req, res) => {
  const { data, error } = await supabaseAdmin!
    .from('ofertas')
    .select(`*, oferta_turmas (sort_order, turmas (id, name, course_id, courses (id, title)))`)
    .eq('id', req.params.id)
    .single();

  if (error || !data) return res.status(404).json({ error: 'Not found' });
  res.json(data);
});

// PUT /:id — update oferta
router.put('/:id', async (req, res) => {
  const parsed = ofertaSchema.partial().safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const { data, error } = await supabaseAdmin!
    .from('ofertas')
    .update(parsed.data)
    .eq('id', req.params.id)
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// DELETE /:id — soft delete
router.delete('/:id', async (req, res) => {
  const { error } = await supabaseAdmin!
    .from('ofertas')
    .update({ status: 'archived' })
    .eq('id', req.params.id);

  if (error) return res.status(500).json({ error: error.message });
  res.json({ ok: true });
});

// PUT /:id/turmas — replace turma list for an offer
router.put('/:id/turmas', async (req, res) => {
  const { turma_ids } = req.body as { turma_ids: string[] };
  if (!Array.isArray(turma_ids)) return res.status(400).json({ error: 'turma_ids must be an array' });

  // Delete existing
  const { error: delError } = await supabaseAdmin!
    .from('oferta_turmas')
    .delete()
    .eq('oferta_id', req.params.id);

  if (delError) return res.status(500).json({ error: delError.message });

  if (turma_ids.length > 0) {
    const rows = turma_ids.map((turma_id, idx) => ({
      oferta_id: req.params.id,
      turma_id,
      sort_order: idx,
    }));

    const { error: insertError } = await supabaseAdmin!
      .from('oferta_turmas')
      .insert(rows);

    if (insertError) return res.status(500).json({ error: insertError.message });
  }

  res.json({ ok: true });
});

export default router;
