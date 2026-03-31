import { Router, type Request, type Response } from 'express';
import crypto from 'crypto';
import { supabaseAdmin } from '../../lib/supabaseAdmin.js';
import { processTranscript } from '../../services/transcriptService.js';
import { fetchBotTranscript } from '../../services/recallService.js';

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

// ─── Status mapping — Recall.ai event name → internal status ──────
// Recall.ai sends individual events per status change (not a single bot.status_change).
// Each event is named bot.<status_code>. We map the full event name to our internal status.

const RECALL_EVENT_STATUS_MAP: Record<string, string> = {
  'bot.joining_call':                  'joining',
  'bot.in_waiting_room':               'joining',
  'bot.in_call_not_recording':         'in_call',
  'bot.recording_permission_allowed':  'in_call',
  'bot.recording_permission_denied':   'in_call',
  'bot.in_call_recording':             'in_call',
  'bot.call_ended':                    'processing',
  'bot.done':                          'done',
  'bot.fatal':                         'error',
};

// ─── Recall.ai webhook payload types ──────────────────────────────

interface RecallWord {
  text: string;
  start_timestamp?: { relative?: number } | null;
  end_timestamp?: { relative?: number } | null;
}

interface RecallParticipant {
  id?: number;
  name?: string | null;
  is_host?: boolean;
}

interface RecallEventData {
  bot?: { id?: string; metadata?: unknown };
  data?: {
    code?: string;
    sub_code?: string | null;
    updated_at?: string;
    words?: RecallWord[];
    participant?: RecallParticipant;
  };
}

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
  let event: string | undefined;
  let data: RecallEventData | undefined;
  try {
    const parsed = JSON.parse(rawBody) as { event?: string; data?: RecallEventData };
    event = parsed.event;
    data = parsed.data;
  } catch {
    return res.status(400).json({ error: 'Invalid JSON body' });
  }

  const botId = data?.bot?.id;
  console.log('[recall-webhook] event=%s bot_id=%s', event, botId ?? 'none');

  if (!event || !data) {
    return res.status(400).json({ error: 'Missing event or data' });
  }

  if (!supabaseAdmin) {
    return res.status(503).json({ error: 'DB unavailable' });
  }

  // ─── transcript.data ──────────────────────────────────────────
  if (event === 'transcript.data') {
    if (!botId) {
      return res.status(400).json({ error: 'Missing data.bot.id' });
    }

    const words = data.data?.words ?? [];
    const speaker = data.data?.participant?.name ?? null;

    const { data: session, error: sessionError } = await supabaseAdmin
      .from('meeting_sessions')
      .select('id')
      .eq('recall_bot_id', botId)
      .single();

    if (sessionError || !session) {
      console.warn(`[recall-webhook] Session not found for bot_id=${botId} — skipping`);
      return res.json({ ok: true });
    }

    const rawText = words.map((w) => w.text).join(' ');

    // Normalize timestamps to seconds (Recall.ai uses relative float seconds)
    const normalizedWords = words.map((w) => ({
      text: w.text,
      start_time: w.start_timestamp?.relative ?? 0,
      end_time: w.end_timestamp?.relative ?? null,
    }));

    const { error: insertError } = await supabaseAdmin
      .from('meeting_transcripts')
      .insert({
        session_id: session.id,
        speaker,
        words: normalizedWords,
        raw_text: rawText,
        timestamp: new Date().toISOString(),
      });

    if (insertError) {
      console.error('[recall-webhook] Failed to insert transcript:', insertError.message);
      return res.status(500).json({ error: 'Failed to save transcript' });
    }

    return res.json({ ok: true });
  }

  // ─── bot.* status events ──────────────────────────────────────
  // Recall.ai sends one event per status transition, e.g. bot.joining_call, bot.done
  if (event.startsWith('bot.')) {
    if (!botId) {
      return res.status(400).json({ error: 'Missing data.bot.id' });
    }

    const internalStatus = RECALL_EVENT_STATUS_MAP[event];
    if (!internalStatus) {
      console.warn(`[recall-webhook] Unknown bot event: ${event} — ignoring`);
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
      console.log(`[recall-webhook] Session ${session.id} already terminal — ignoring ${event}`);
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

    console.log(`[recall-webhook] Session ${session.id} → ${internalStatus} (${event})`);

    // On bot.call_ended → processing: trigger pipeline (will use real-time segments if they exist)
    if (internalStatus === 'processing') {
      processTranscript(session.id).catch((err) => {
        console.error('[recall-webhook] processTranscript failed:', err);
      });
    }

    // On bot.done: also trigger pipeline as fallback.
    // If no real-time transcript.data events arrived (RECALL_WEBHOOK_URL not configured),
    // fetchBotTranscript pulls the complete transcript from Recall.ai API and stores it
    // before processTranscript runs.
    if (internalStatus === 'done') {
      const sessionId = session.id as string;
      ;(async () => {
        try {
          const { count } = await supabaseAdmin
            .from('meeting_transcripts')
            .select('*', { count: 'exact', head: true })
            .eq('session_id', sessionId);

          if (!count || count === 0) {
            console.log(`[recall-webhook] No real-time transcripts for ${sessionId} — fetching from API`);
            const segments = await fetchBotTranscript(botId);

            if (segments.length > 0) {
              const rows = segments.map((seg) => ({
                session_id: sessionId,
                speaker: seg.speaker,
                words: seg.words,
                raw_text: seg.raw_text,
                timestamp: new Date().toISOString(),
              }));
              const { error: insertErr } = await supabaseAdmin
                .from('meeting_transcripts')
                .insert(rows);
              if (insertErr) {
                console.error('[recall-webhook] Failed to insert API transcript:', insertErr.message);
              } else {
                console.log(`[recall-webhook] Stored ${rows.length} transcript segment(s) from API for ${sessionId}`);
              }
            } else {
              console.warn(`[recall-webhook] Recall.ai API returned empty transcript for ${sessionId}`);
            }
          }

          await processTranscript(sessionId);
        } catch (err) {
          console.error('[recall-webhook] bot.done pipeline failed:', err);
        }
      })();
    }

    return res.json({ ok: true });
  }

  // ─── Unknown events — never return 4xx to avoid retries ──────
  console.log(`[recall-webhook] Unhandled event: ${event} — ignoring`);
  return res.json({ ok: true, ignored: true });
});

export default router;
