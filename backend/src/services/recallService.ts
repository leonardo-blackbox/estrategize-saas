const RECALL_API_URL = 'https://us-west-2.recall.ai/api/v1';
const RECALL_API_V2_URL = 'https://us-west-2.recall.ai/api/v2';

interface CreateBotParams {
  meetingUrl: string;
  botName?: string;
}

interface RecallBot {
  id: string;
  status: string;
}

interface RecallTranscriptWord {
  text: string;
  start_timestamp?: { relative?: number; absolute?: string } | null;
  end_timestamp?: { relative?: number; absolute?: string } | null;
}

interface RecallTranscriptSegment {
  speaker?: string | null;
  participant?: { id?: number; name?: string | null; is_host?: boolean } | null;
  words?: RecallTranscriptWord[];
}

export interface NormalizedTranscriptSegment {
  speaker: string | null;
  words: Array<{ text: string; start_time: number; end_time: number | null }>;
  raw_text: string;
}

export async function createBot(params: CreateBotParams): Promise<RecallBot> {
  const apiKey = process.env.RECALL_API_KEY;
  if (!apiKey) throw new Error('RECALL_API_KEY not configured');

  // Build realtime transcription config if webhook URL is configured.
  // Set RECALL_WEBHOOK_URL in Railway to enable real-time transcript streaming.
  // Example: https://your-backend.up.railway.app/api/webhooks/recall
  const webhookUrl = process.env.RECALL_WEBHOOK_URL ?? null;
  const recordingConfig = webhookUrl
    ? {
        transcript: {
          provider: { recallai_streaming: {} },
        },
        realtime_endpoints: [
          {
            type: 'webhook',
            url: webhookUrl,
            events: ['transcript.data'],
          },
        ],
      }
    : undefined;

  const res = await fetch(`${RECALL_API_URL}/bot`, {
    method: 'POST',
    headers: {
      'Authorization': `Token ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      meeting_url: params.meetingUrl,
      bot_name: params.botName ?? 'Iris AI Notetaker',
      ...(recordingConfig && { recording_config: recordingConfig }),
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Recall.ai API error ${res.status}: ${text}`);
  }

  return res.json() as Promise<RecallBot>;
}

/**
 * Fetches the full transcript from Recall.ai API after a meeting ends.
 * Used as fallback when real-time transcript.data events weren't received.
 */
export async function fetchBotTranscript(botId: string): Promise<NormalizedTranscriptSegment[]> {
  const apiKey = process.env.RECALL_API_KEY;
  if (!apiKey) throw new Error('RECALL_API_KEY not configured');

  const res = await fetch(`${RECALL_API_V2_URL}/bot/${botId}/transcript/`, {
    headers: { 'Authorization': `Token ${apiKey}` },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Recall.ai transcript API error ${res.status}: ${text}`);
  }

  const segments = await res.json() as RecallTranscriptSegment[];

  return segments.map((seg) => {
    const words = (seg.words ?? []).map((w) => ({
      text: w.text,
      start_time: w.start_timestamp?.relative ?? 0,
      end_time: w.end_timestamp?.relative ?? null,
    }));
    return {
      speaker: seg.participant?.name ?? seg.speaker ?? null,
      words,
      raw_text: words.map((w) => w.text).join(' '),
    };
  });
}
