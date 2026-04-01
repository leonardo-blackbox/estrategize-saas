import OpenAI from 'openai';
import { supabaseAdmin } from '../lib/supabaseAdmin.js';
import { buildFullContext } from './consultancyContextService.js';
import { generateEmbeddings } from './embeddingService.js';
import { helenaEmitter } from './helenaSSE.js';
import {
  getBuffer,
  getClientSpeech,
  hasClosingLanguage,
  hasObjectionLanguage,
  type BufferEntry,
} from './liveTranscriptBuffer.js';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// --- Types ---

export interface HelenaReport {
  tipo: 'abertura' | 'meio' | 'fechamento' | 'objecao';
  sugestao_principal: string;
  frase_sugerida: string | null;
  ponto_atencao: string | null;
  urgencia: 'baixa' | 'media' | 'alta';
}

type WindowType = 'opening' | 'mid' | 'closing' | 'objection';

// --- Helena RAG (raw chunks, not full GPT answer) ---

async function getHelenaRAGContext(query: string): Promise<string> {
  if (!supabaseAdmin) return '';
  try {
    const embeddings = await generateEmbeddings([query]);
    const vector = embeddings[0];
    if (!vector || vector.length === 0) return '';
    const vectorString = '[' + vector.join(',') + ']';

    const { data, error } = await supabaseAdmin.rpc('match_knowledge_chunks', {
      query_embedding: vectorString,
      match_threshold: 0.5,
      match_count: 5,
      filter_scope: 'plugin',
      filter_plugin_slug: 'helena',
    });

    if (error || !data) return '';
    const chunks = data as Array<{ content: string }>;
    return chunks.map((c, i) => `[${i + 1}] ${c.content}`).join('\n\n');
  } catch {
    return '';
  }
}

// --- Prompt builder ---

function buildPrompt(
  contextMarkdown: string,
  ragChunks: string,
  clientSpeech: string,
  windowType: WindowType,
): string {
  const windowLabel: Record<WindowType, string> = {
    opening: 'abertura',
    mid: 'meio',
    closing: 'fechamento',
    objection: 'objecao',
  };

  return `Voce e Helena, parceira de reuniao especializada em consultoria estrategica e fechamento de vendas.
Seja direta e acionavel. Maximo 3 frases.

CONTEXTO DA CLIENTE:
${contextMarkdown}

BASE DE CONHECIMENTO (RAG - Helena):
${ragChunks || 'Nenhum documento indexado ainda.'}

TRANSCRICAO (falas da CLIENTE - ultimos 10 min):
${clientSpeech || 'Nenhuma fala capturada ainda.'}

JANELA: ${windowLabel[windowType]}

Retorne SOMENTE JSON valido:
{"tipo":"${windowLabel[windowType]}","sugestao_principal":"string","frase_sugerida":"string ou null","ponto_atencao":"string ou null","urgencia":"baixa|media|alta"}`;
}

// --- Generate and emit report ---

async function generateAndEmit(
  botId: string,
  buffer: BufferEntry,
  windowType: WindowType,
): Promise<void> {
  try {
    const [contextBlock, ragChunks] = await Promise.all([
      buildFullContext(buffer.userId, buffer.consultancyId),
      getHelenaRAGContext(getClientSpeech(botId, 10)),
    ]);

    // Format context block as markdown string
    const contextMarkdown = JSON.stringify(contextBlock, null, 2);
    const clientSpeech = getClientSpeech(botId, 10);

    const prompt = buildPrompt(contextMarkdown, ragChunks, clientSpeech, windowType);

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'system', content: prompt }],
      temperature: 0.7,
      max_tokens: 300,
      response_format: { type: 'json_object' },
    });

    const raw = completion.choices[0]?.message?.content ?? '{}';
    let report: HelenaReport;
    try {
      report = JSON.parse(raw) as HelenaReport;
    } catch {
      console.error('[helena] Failed to parse GPT response:', raw);
      return;
    }

    // Emit to SSE listeners
    helenaEmitter.emit(buffer.meetingSessionId, report);

    // Persist for analytics (fire-and-forget)
    if (supabaseAdmin) {
      supabaseAdmin
        .from('helena_events')
        .insert({
          meeting_session_id: buffer.meetingSessionId,
          consultancy_id: buffer.consultancyId,
          event_type: windowType,
          payload: report,
          urgencia: report.urgencia,
        })
        .then(({ error }) => {
          if (error) console.error('[helena] Failed to persist event:', error.message);
        });
    }
  } catch (err) {
    console.error('[helena] generateAndEmit failed:', err);
  }
}

// --- Window engine ---

/**
 * Called after each transcript.partial_data webhook.
 * Determines if a Helena window should fire based on elapsed time and language detection.
 * Calls generateAndEmit fire-and-forget — never blocks the webhook response.
 */
export function maybeProcess(botId: string): void {
  const buffer = getBuffer(botId);
  if (!buffer) return;
  if (!buffer.consultancyId) return;

  const elapsedMinutes = Math.floor(buffer.durationSeconds / 60);
  const clientSpeech = getClientSpeech(botId, 5);

  // --- Objection detection (highest priority, anti-spam per minute) ---
  if (clientSpeech && hasObjectionLanguage(clientSpeech) && elapsedMinutes > buffer.lastObjectionMinute) {
    buffer.lastObjectionMinute = elapsedMinutes;
    generateAndEmit(botId, buffer, 'objection');
    return;
  }

  // --- Closing language detection ---
  if (clientSpeech && hasClosingLanguage(clientSpeech) && elapsedMinutes > buffer.lastProcessedMinute) {
    buffer.lastProcessedMinute = elapsedMinutes;
    generateAndEmit(botId, buffer, 'closing');
    return;
  }

  // --- Opening window: fires once at ~5 min elapsed ---
  if (elapsedMinutes >= 5 && !buffer.openingReportDone) {
    buffer.openingReportDone = true;
    buffer.lastProcessedMinute = elapsedMinutes;
    generateAndEmit(botId, buffer, 'opening');
    return;
  }

  // --- Mid window: fires every 10 min after opening ---
  if (elapsedMinutes > 5 && elapsedMinutes % 10 === 0 && elapsedMinutes > buffer.lastProcessedMinute) {
    buffer.lastProcessedMinute = elapsedMinutes;
    generateAndEmit(botId, buffer, 'mid');
    return;
  }
}
