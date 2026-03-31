import { Router } from 'express';
import { z } from 'zod';
import { supabaseAdmin } from '../lib/supabaseAdmin.js';
import { requireAuth, type AuthenticatedRequest } from '../middleware/auth.js';
import { createBot } from '../services/recallService.js';

const router = Router();
router.use(requireAuth);

// ─── Schemas ─────────────────────────────────────────────────────

const createBotSchema = z.object({
  meeting_url: z.string().url(),
  consultancy_id: z.string().uuid().optional(),
});

const listQuerySchema = z.object({
  consultancy_id: z.string().uuid().optional(),
});

// ─── POST / — create Recall.ai bot and persist session ───────────

router.post('/', async (req: AuthenticatedRequest, res) => {
  const parsed = createBotSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const { meeting_url, consultancy_id } = parsed.data;
  const userId = req.userId as string;

  let bot;
  try {
    bot = await createBot({ meetingUrl: meeting_url, botName: 'Iris AI Notetaker' });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[meetings] createBot failed:', msg);
    return res.status(502).json({ error: 'Failed to create meeting bot', detail: msg });
  }

  const { data: session, error } = await supabaseAdmin!
    .from('meeting_sessions')
    .insert({
      user_id: userId,
      consultancy_id: consultancy_id ?? null,
      recall_bot_id: bot.id,
      meeting_url,
      bot_name: 'Iris AI Notetaker',
      status: 'pending',
    })
    .select()
    .single();

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  return res.status(201).json({ session });
});

// ─── GET / — list user meeting sessions ──────────────────────────

router.get('/', async (req: AuthenticatedRequest, res) => {
  const parsed = listQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const { consultancy_id } = parsed.data;
  const userId = req.userId as string;

  let query = supabaseAdmin!
    .from('meeting_sessions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (consultancy_id) {
    query = query.eq('consultancy_id', consultancy_id);
  }

  const { data: sessions, error } = await query;

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  return res.json({ sessions });
});

// ─── DELETE /:id — remove a meeting session ───────────────────────

router.delete('/:id', async (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const userId = req.userId as string;

  // Delete only own session — meeting_transcripts cascade automatically (FK ON DELETE CASCADE)
  const { error: deleteError, count } = await supabaseAdmin!
    .from('meeting_sessions')
    .delete({ count: 'exact' })
    .eq('id', id)
    .eq('user_id', userId);

  if (deleteError) return res.status(500).json({ error: deleteError.message });
  if (!count || count === 0) return res.status(404).json({ error: 'Session not found' });

  return res.status(204).send();
});

export default router;
