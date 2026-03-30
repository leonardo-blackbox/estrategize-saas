import OpenAI from 'openai';
import { supabaseAdmin } from '../lib/supabaseAdmin.js';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ============================================================
// Types
// ============================================================

interface TranscriptSegment {
  id: string;
  session_id: string;
  speaker: string;
  raw_text: string;
  timestamp: string;
}

interface MeetingSession {
  id: string;
  user_id: string;
  consultancy_id: string | null;
}

interface GPTActionItem {
  title: string;
  description: string;
  owner: string;
  priority: string;
  due_date: string | null;
}

interface GPTAnalysisResult {
  summary: string;
  action_items: GPTActionItem[];
  next_steps: string[];
}

// ============================================================
// Helpers
// ============================================================

function ensureAdmin() {
  if (!supabaseAdmin) throw new Error('Database service unavailable');
  return supabaseAdmin;
}

function formatTimestamp(isoTimestamp: string): string {
  try {
    const date = new Date(isoTimestamp);
    const hh = String(date.getUTCHours()).padStart(2, '0');
    const mm = String(date.getUTCMinutes()).padStart(2, '0');
    const ss = String(date.getUTCSeconds()).padStart(2, '0');
    return `${hh}:${mm}:${ss}`;
  } catch {
    return '00:00:00';
  }
}

function buildFormattedTranscript(segments: TranscriptSegment[]): string {
  return segments
    .map((seg) => `[${seg.speaker}] (${formatTimestamp(seg.timestamp)})\n${seg.raw_text}`)
    .join('\n\n');
}

function extractUniqueSpeakers(segments: TranscriptSegment[]): string[] {
  const seen = new Set<string>();
  for (const seg of segments) {
    if (seg.speaker && seg.speaker !== 'unknown') {
      seen.add(seg.speaker);
    }
  }
  return Array.from(seen);
}

// ============================================================
// GPT-4 Analysis
// ============================================================

const ANALYSIS_SYSTEM_PROMPT = `Voce e um assistente especializado em analise de reunioes de consultoria estrategica. Analise a transcricao abaixo e retorne um JSON com a seguinte estrutura exata:

{
  "summary": "Resumo executivo da reuniao em 3-5 paragrafos. Inclua: contexto, principais temas discutidos, decisoes tomadas e proximos passos acordados.",
  "action_items": [
    {
      "title": "Titulo curto e acionavel da tarefa",
      "description": "Descricao detalhada do que precisa ser feito",
      "owner": "Nome da pessoa responsavel (se mencionado) ou 'A definir'",
      "priority": "high|medium|low",
      "due_date": "YYYY-MM-DD se mencionado, ou null"
    }
  ],
  "next_steps": ["Proximo passo 1", "Proximo passo 2"]
}

Regras:
- O resumo deve ser estrategico, nao uma transcricao resumida
- Action items devem ser especificos e acionaveis, nao vagos
- Priorize por impacto no negocio
- Se nenhum action item for identificado, retorne array vazio
- Datas devem ser inferidas do contexto quando possivel`;

async function analyzeWithGPT(formattedTranscript: string): Promise<GPTAnalysisResult> {
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    response_format: { type: 'json_object' },
    max_tokens: 4000,
    temperature: 0.3,
    messages: [
      { role: 'system', content: ANALYSIS_SYSTEM_PROMPT },
      { role: 'user', content: formattedTranscript },
    ],
  });

  const raw = completion.choices[0]?.message?.content ?? '{}';
  const parsed = JSON.parse(raw) as GPTAnalysisResult;

  if (typeof parsed.summary !== 'string') parsed.summary = '';
  if (!Array.isArray(parsed.action_items)) parsed.action_items = [];
  if (!Array.isArray(parsed.next_steps)) parsed.next_steps = [];

  return parsed;
}

// ============================================================
// Main pipeline
// ============================================================

/**
 * Fire-and-forget pipeline: fetches all transcript segments for a session,
 * formats them, calls GPT-4o for structured analysis, then stores results
 * on meeting_sessions and bulk inserts action items into consultancy_action_items.
 *
 * Never throws — sets session status to 'error' on failure.
 */
export async function processTranscript(sessionId: string): Promise<void> {
  try {
    const db = ensureAdmin();

    // Step 1 — Fetch session
    const { data: session, error: sessionError } = await db
      .from('meeting_sessions')
      .select('id, user_id, consultancy_id')
      .eq('id', sessionId)
      .single();

    if (sessionError || !session) {
      console.warn(`[transcriptService] Session not found: ${sessionId}`);
      return;
    }

    const typedSession = session as MeetingSession;

    // Step 2 — Fetch transcript segments ordered by timestamp
    const { data: segments, error: segmentsError } = await db
      .from('meeting_transcripts')
      .select('id, session_id, speaker, raw_text, timestamp')
      .eq('session_id', sessionId)
      .order('timestamp', { ascending: true });

    if (segmentsError) {
      console.error(`[transcriptService] Failed to fetch segments for ${sessionId}:`, segmentsError.message);
      await db.from('meeting_sessions').update({ status: 'error' }).eq('id', sessionId);
      return;
    }

    if (!segments || segments.length === 0) {
      console.warn(`[transcriptService] No transcript segments for session ${sessionId} — marking done`);
      await db.from('meeting_sessions').update({ status: 'done' }).eq('id', sessionId);
      return;
    }

    const typedSegments = segments as TranscriptSegment[];

    // Step 3 — Format transcript and extract speakers
    const formattedTranscript = buildFormattedTranscript(typedSegments);
    const uniqueSpeakers = extractUniqueSpeakers(typedSegments);

    // Step 4 — Call GPT-4o for structured analysis
    let parsed: GPTAnalysisResult;
    try {
      parsed = await analyzeWithGPT(formattedTranscript);
    } catch (gptError) {
      console.error(`[transcriptService] GPT-4 analysis failed for ${sessionId}:`, gptError);
      await db.from('meeting_sessions').update({ status: 'error' }).eq('id', sessionId);
      return;
    }

    // Step 5 — Update meeting_sessions with results
    const { error: updateError } = await db
      .from('meeting_sessions')
      .update({
        formatted_transcript: formattedTranscript,
        summary: parsed.summary,
        speakers: uniqueSpeakers,
        status: 'done',
      })
      .eq('id', sessionId);

    if (updateError) {
      console.error(`[transcriptService] Failed to update session ${sessionId}:`, updateError.message);
    }

    // Step 6 — Bulk insert action items (only if consultancy_id is set)
    if (typedSession.consultancy_id && parsed.action_items.length > 0) {
      const validPriorities = ['low', 'medium', 'high'];

      const actionRows = parsed.action_items.map((item) => ({
        consultancy_id: typedSession.consultancy_id,
        user_id: typedSession.user_id,
        title: item.title,
        description: item.description || null,
        priority: validPriorities.includes(item.priority) ? item.priority : 'medium',
        responsible: item.owner !== 'A definir' ? item.owner : null,
        due_date: item.due_date || null,
        origin: 'meeting_ai' as const,
        status: 'todo' as const,
      }));

      const { error: insertError } = await db
        .from('consultancy_action_items')
        .insert(actionRows);

      if (insertError) {
        console.error(`[transcriptService] Failed to insert action items for ${sessionId}:`, insertError.message);
      } else {
        console.log(`[transcriptService] Inserted ${actionRows.length} action item(s) for session ${sessionId}`);
      }
    }

    console.log(`[transcriptService] Pipeline complete for session ${sessionId}`);
  } catch (error) {
    console.error(`[transcriptService] Unhandled error for session ${sessionId}:`, error);
    try {
      const db = supabaseAdmin;
      if (db) {
        await db.from('meeting_sessions').update({ status: 'error' }).eq('id', sessionId);
      }
    } catch (cleanupError) {
      console.error(`[transcriptService] Cleanup also failed for ${sessionId}:`, cleanupError);
    }
  }
}
