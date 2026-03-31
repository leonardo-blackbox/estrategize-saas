const RECALL_API_URL = 'https://us-west-2.recall.ai/api/v1';

interface CreateBotParams {
  meetingUrl: string;
  botName?: string;
}

interface RecallBot {
  id: string;
  status: string;
}

export async function createBot(params: CreateBotParams): Promise<RecallBot> {
  const apiKey = process.env.RECALL_API_KEY;
  if (!apiKey) throw new Error('RECALL_API_KEY not configured');

  const res = await fetch(`${RECALL_API_URL}/bot`, {
    method: 'POST',
    headers: {
      'Authorization': `Token ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      meeting_url: params.meetingUrl,
      bot_name: params.botName ?? 'Iris AI Notetaker',
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Recall.ai API error ${res.status}: ${text}`);
  }

  return res.json() as Promise<RecallBot>;
}
