import { Router } from 'express';
import { z } from 'zod';
import { supabaseAdmin } from '../../lib/supabaseAdmin.js';
import { requireAuth } from '../../middleware/auth.js';
import { requireAdmin } from '../../middleware/admin.js';

const router = Router();

const settingsSchema = z.object({
  title: z.string().min(1).max(100),
  subtitle: z.string().max(300).nullable().optional(),
});

// ─── PUT /api/admin/home/settings ─────────────────────────────
router.put('/settings', requireAuth, requireAdmin, async (req, res) => {
  try {
    if (!supabaseAdmin) return res.status(503).json({ error: 'DB unavailable' });

    const parsed = settingsSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

    const { title, subtitle } = parsed.data;

    // Fetch existing row id (single-row pattern)
    const { data: existing } = await supabaseAdmin
      .from('home_settings')
      .select('id')
      .limit(1)
      .maybeSingle();

    let result;
    if (existing) {
      const { data, error } = await supabaseAdmin
        .from('home_settings')
        .update({ title, subtitle: subtitle ?? null, updated_at: new Date().toISOString() })
        .eq('id', existing.id)
        .select()
        .single();
      if (error) return res.status(500).json({ error: error.message });
      result = data;
    } else {
      const { data, error } = await supabaseAdmin
        .from('home_settings')
        .insert({ title, subtitle: subtitle ?? null })
        .select()
        .single();
      if (error) return res.status(500).json({ error: error.message });
      result = data;
    }

    res.json(result);
  } catch (err) {
    console.error('PUT /api/admin/home/settings error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
