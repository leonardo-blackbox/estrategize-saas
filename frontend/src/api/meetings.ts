import { client } from './client';

// ─── Types ───────────────────────────────────────────────────────

export interface MeetingSession {
  id: string;
  user_id: string;
  consultancy_id: string | null;
  recall_bot_id: string;
  meeting_url: string;
  bot_name: string;
  status: 'pending' | 'joining' | 'in_call' | 'processing' | 'done' | 'error';
  started_at: string | null;
  ended_at: string | null;
  formatted_transcript: string | null;
  summary: string | null;
  speakers: string[];
  created_at: string;
  updated_at: string;
}

export interface CreateMeetingPayload {
  meeting_url: string;
  consultancy_id?: string;
}

// ─── React Query Keys ─────────────────────────────────────────────

export const meetingKeys = {
  all: ['meetings', 'all'] as const,
  byConsultancy: (consultancyId: string) => ['meetings', consultancyId] as const,
};

// ─── API Functions ────────────────────────────────────────────────

export function listMeetings(consultancyId: string): Promise<{ sessions: MeetingSession[] }> {
  return client.get(`/api/meetings?consultancy_id=${consultancyId}`).json();
}

export async function listAllMeetings(): Promise<{ sessions: MeetingSession[] }> {
  return client.get('/api/meetings').json<{ sessions: MeetingSession[] }>();
}

export function createMeeting(payload: CreateMeetingPayload): Promise<{ session: MeetingSession }> {
  return client.post('/api/meetings', { json: payload }).json();
}

export async function deleteMeeting(sessionId: string): Promise<void> {
  await client.delete(`/api/meetings/${sessionId}`).json();
}
