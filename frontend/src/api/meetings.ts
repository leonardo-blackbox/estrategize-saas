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
  all: ['meetings'] as const,
  byConsultancy: (consultancyId: string) => [...meetingKeys.all, consultancyId] as const,
};

// ─── API Functions ────────────────────────────────────────────────

export function listMeetings(consultancyId: string): Promise<{ sessions: MeetingSession[] }> {
  return client.get(`/api/meetings?consultancy_id=${consultancyId}`).json();
}

export function createMeeting(payload: CreateMeetingPayload): Promise<{ session: MeetingSession }> {
  return client.post('/api/meetings', { json: payload }).json();
}

export function deleteMeeting(sessionId: string): Promise<void> {
  return client.delete(`/api/meetings/${sessionId}`).then(() => undefined);
}
