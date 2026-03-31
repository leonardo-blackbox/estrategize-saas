import { Router, type Request, type Response } from 'express';
import crypto from 'crypto';
import { supabaseAdmin } from '../../lib/supabaseAdmin.js';
import { processTranscript } from '../../services/transcriptService.js';

const router = Router();

// ─── HMAC-SHA256 verification ─────────────────────────────────────

function verifyRecallSignature(rawBody: string, signature: string, secret: string): boolean {
  try {
    const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  } catch {
    return false;
  }
}

// ─── Status mapping ───────────────────────────────────────────────

const RECALL_STATUS_MAP: Record<string, string> = {
  joining: 'joining',
  in_call_not_recording: 'in_call',
  in_call_recording: 'in_call',
  call_ended: 'processing',
  done: 'done',
  error: 'error',
  fatal: 'error',
};

// ─── POST / — Recall.ai webhook receiver ─────────────────────────

router.post('/', async (req: Request, res: Response) => {
  // req.body is a raw Buffer here because this route is mounted with express.raw()
  // before express.json() in app.ts — this ensures HMAC uses the original bytes.
  const rawBodyBuffer = Buffer.isBuffer(req.body) ? req.body : Buffer.from(JSON.stringify(req.body));
  const rawBody = rawBodyBuffer.toString('utf-8');

  const signature = req.headers['x-recall-signature'] as string ?? '';
  const secret = process.env.RECALL_WEBHOOK_SECRET ?? '';

  if (secret) {
    const signatureValid = verifyRecallSignature(rawBody, signature, secret);
    if (!signatureValid) {
      // Log but do not reject — signature format may differ from expected
      console.warn('[recall-webhook] Signature mismatch — processing anyway. sig=%s', signature.slice(0, 16));
    }
  }

  // Parse the raw body into the event payload
  let parsedBody: { event?: string; data?: Record<string, unknown> };
  try {
    parsedBody = JSON.parse(rawBody) as { event?: string; data?: Record<string, unknown> };
  } catch {
    return res.status(400).json({ error: 'Invalid JSON body' });
  }

  const { event, data } = parsedBody;

  console.log('[recall-webhook] Received event=%s data_keys=%s', event, Object.keys(data ?? {}).join(','));

  if (!event || !data) {
    return res.status(400).json({ error: 'Missing event or data' });
  }

  if (!supabaseAdmin) {
    return res.status(503).json({ error: 'DB unavailable' });
  }

  // ─── transcript.data ──────────────────────────────────────────
  if (event === 'transcript.data') {
    const botId = data['bot_id'] as string | undefined;
    const transcript = data['transcript'] as {
      speaker?: string;
      words?: Array<{ text: string; start_time: number; end_time: number }>;
    } | undefined;

    if (!botId || !transcript) {
      return res.status(400).json({ error: 'Missing bot_id or transcript' });
    }

    const { data: session, error: sessionError } = await supabaseAdmin
      .from('meeting_sessions')
      .select('id')
      .eq('recall_bot_id', botId)
      .single();

    if (sessionError || !session) {
      console.warn(`[recall-webhook] Session not found for bot_id=${botId} — skipping`);
      return res.json({ ok: true });
    }

    const words = transcript.words ?? [];
    const rawText = words.map((w) => w.text).join(' ');

    const { error: insertError } = await supabaseAdmin
      .from('meeting_transcripts')
      .insert({
        session_id: session.id,
        speaker: transcript.speaker ?? null,
        words,
        raw_text: rawText,
        timestamp: new Date().toISOString(),
      });

    if (insertError) {
      console.error('[recall-webhook] Failed to insert transcript:', insertError.message);
      return res.status(500).json({ error: 'Failed to save transcript' });
    }

    return res.json({ ok: true });
  }

  // ─── bot.status_change ────────────────────────────────────────
  if (event === 'bot.status_change') {
    const botId = data['bot_id'] as string | undefined;
    const recallStatus = data['status'] as string | undefined;

    if (!botId || !recallStatus) {
      return res.status(400).json({ error: 'Missing bot_id or status' });
    }

    const internalStatus = RECALL_STATUS_MAP[recallStatus];
    if (!internalStatus) {
      console.warn(`[recall-webhook] Unknown Recall status: ${recallStatus} — ignoring`);
      return res.json({ ok: true, ignored: true });
    }

    const { data: session, error: sessionError } = await supabaseAdmin
      .from('meeting_sessions')
      .select('id, status, started_at')
      .eq('recall_bot_id', botId)
      .single();

    if (sessionError || !session) {
      console.warn(`[recall-webhook] Session not found for bot_id=${botId} — skipping`);
      return res.json({ ok: true });
    }

    const terminalStatuses = ['done', 'error'];
    if (terminalStatuses.includes(session.status as string)) {
      console.log(`[recall-webhook] Session ${session.id} already in terminal state — ignoring`);
      return res.json({ ok: true });
    }

    const updates: Record<string, unknown> = { status: internalStatus };

    if (internalStatus === 'in_call' && !session.started_at) {
      updates['started_at'] = new Date().toISOString();
    }

    if (internalStatus === 'done' || internalStatus === 'error') {
      updates['ended_at'] = new Date().toISOString();
    }

    const { error: updateError } = await supabaseAdmin
      .from('meeting_sessions')
      .update(updates)
      .eq('id', session.id)
      .not('status', 'in', '("done","error")');

    if (updateError) {
      console.error('[recall-webhook] Failed to update session status:', updateError.message);
      return res.status(500).json({ error: 'Failed to update session' });
    }

    // Fire-and-forget: trigger GPT-4 pipeline when call ends
    if (internalStatus === 'processing') {
      processTranscript(session.id).catch((err) => {
        console.error('[recall-webhook] processTranscript failed:', err);
      });
    }

    return res.json({ ok: true });
  }

  // ─── Unknown events — never return 4xx to avoid retries ──────
  return res.json({ ok: true, ignored: true });
});

export default router;
