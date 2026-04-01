// --- Types ---
export interface TranscriptSegment {
  text: string;
  start_time: number;
  end_time: number | null;
  speaker: string; // "Speaker 0", "Speaker 1", participant name, etc.
}

export interface BufferEntry {
  segments: TranscriptSegment[];
  durationSeconds: number;
  consultancyId: string;
  userId: string;
  meetingSessionId: string;
  openingReportDone: boolean;
  lastProcessedMinute: number;
  lastObjectionMinute: number;
  startedAt: number; // Date.now() when buffer was initialized
}

const buffers = new Map<string, BufferEntry>();

// --- Exports ---

export function initBuffer(botId: string, opts: {
  consultancyId: string;
  userId: string;
  meetingSessionId: string;
}): void {
  buffers.set(botId, {
    segments: [],
    durationSeconds: 0,
    consultancyId: opts.consultancyId,
    userId: opts.userId,
    meetingSessionId: opts.meetingSessionId,
    openingReportDone: false,
    lastProcessedMinute: -1,
    lastObjectionMinute: -1,
    startedAt: Date.now(),
  });
}

export function append(botId: string, words: Array<{ text: string; start_time: number; end_time: number | null; speaker: string }>): void {
  const entry = buffers.get(botId);
  if (!entry) return;
  for (const w of words) {
    entry.segments.push({
      text: w.text,
      start_time: w.start_time,
      end_time: w.end_time,
      speaker: w.speaker ?? 'unknown',
    });
  }
  // Update elapsed duration from startedAt
  entry.durationSeconds = Math.floor((Date.now() - entry.startedAt) / 1000);
}

export function getBuffer(botId: string): BufferEntry | undefined {
  return buffers.get(botId);
}

/**
 * Returns concatenated speech from client speakers (not Speaker 0 = consultora).
 * If lastNMinutes provided, filters to segments within that time window.
 */
export function getClientSpeech(botId: string, lastNMinutes?: number): string {
  const entry = buffers.get(botId);
  if (!entry || entry.segments.length === 0) return '';

  let filtered = entry.segments.filter((s) => s.speaker !== 'Speaker 0');

  if (lastNMinutes) {
    const cutoff = entry.durationSeconds - lastNMinutes * 60;
    filtered = filtered.filter((s) => s.start_time >= cutoff);
  }

  return filtered.map((s) => s.text).join(' ');
}

const CLOSING_KEYWORDS = [
  'eu vou fazer', 'quando eu começar', 'combinado', 'vou assinar',
  'vamos marcar', 'pode mandar o link', 'quero fechar', 'bora',
  'me manda', 'vou pagar', 'aceito',
];

const OBJECTION_KEYWORDS = [
  'não tenho dinheiro', 'não tenho tempo', 'preciso pensar',
  'é caro', 'talvez depois', 'vou pensar', 'não sei se vale',
  'não é o momento', 'vou ver', 'tá caro',
];

export function hasClosingLanguage(text: string): boolean {
  const lower = text.toLowerCase();
  return CLOSING_KEYWORDS.some((kw) => lower.includes(kw));
}

export function hasObjectionLanguage(text: string): boolean {
  const lower = text.toLowerCase();
  return OBJECTION_KEYWORDS.some((kw) => lower.includes(kw));
}

export function removeBuffer(botId: string): void {
  buffers.delete(botId);
}
