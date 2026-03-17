import { supabaseAdmin } from '../lib/supabaseAdmin.js';

export interface Meeting {
  id: string;
  consultancy_id: string;
  user_id: string;
  title: string;
  scheduled_at: string | null;
  duration_minutes: number | null;
  meeting_url: string | null;
  recording_url: string | null;
  participants: string[];
  agenda: string | null;
  transcript: string | null;
  summary: string | null;
  decisions: string[];
  next_steps: string[];
  open_questions: string[];
  status: 'scheduled' | 'completed' | 'cancelled';
  credits_spent: number;
  created_at: string;
  updated_at: string;
}

export type CreateMeetingInput = {
  title: string;
  scheduled_at?: string;
  duration_minutes?: number;
  meeting_url?: string;
  participants?: string[];
  agenda?: string;
};

export type UpdateMeetingInput = Partial<Omit<Meeting, 'id' | 'consultancy_id' | 'user_id' | 'created_at' | 'updated_at' | 'credits_spent'>>;

function ensureAdmin() {
  if (!supabaseAdmin) throw new Error('Database service unavailable');
  return supabaseAdmin;
}

export async function listMeetings(
  userId: string,
  consultancyId: string,
): Promise<Meeting[]> {
  const db = ensureAdmin();

  const { data, error } = await db
    .from('consultancy_meetings')
    .select('*')
    .eq('consultancy_id', consultancyId)
    .eq('user_id', userId)
    .order('scheduled_at', { ascending: false, nullsFirst: false });

  if (error) throw new Error(`Failed to list meetings: ${error.message}`);
  return data as Meeting[];
}

export async function getMeeting(
  userId: string,
  consultancyId: string,
  meetingId: string,
): Promise<Meeting | null> {
  const db = ensureAdmin();

  const { data, error } = await db
    .from('consultancy_meetings')
    .select('*')
    .eq('id', meetingId)
    .eq('consultancy_id', consultancyId)
    .eq('user_id', userId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw new Error(`Failed to get meeting: ${error.message}`);
  }
  return data as Meeting;
}

export async function createMeeting(
  userId: string,
  consultancyId: string,
  input: CreateMeetingInput,
): Promise<Meeting> {
  const db = ensureAdmin();

  const { data, error } = await db
    .from('consultancy_meetings')
    .insert({ ...input, consultancy_id: consultancyId, user_id: userId })
    .select('*')
    .single();

  if (error || !data) throw new Error(`Failed to create meeting: ${error?.message ?? 'Unknown error'}`);
  return data as Meeting;
}

export async function updateMeeting(
  userId: string,
  consultancyId: string,
  meetingId: string,
  input: UpdateMeetingInput,
): Promise<Meeting | null> {
  const db = ensureAdmin();

  const existing = await getMeeting(userId, consultancyId, meetingId);
  if (!existing) return null;

  const { data, error } = await db
    .from('consultancy_meetings')
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq('id', meetingId)
    .eq('consultancy_id', consultancyId)
    .eq('user_id', userId)
    .select('*')
    .single();

  if (error || !data) throw new Error(`Failed to update meeting: ${error?.message ?? 'Unknown error'}`);
  return data as Meeting;
}

export async function deleteMeeting(
  userId: string,
  consultancyId: string,
  meetingId: string,
): Promise<boolean> {
  const db = ensureAdmin();

  const existing = await getMeeting(userId, consultancyId, meetingId);
  if (!existing) return false;

  const { error } = await db
    .from('consultancy_meetings')
    .delete()
    .eq('id', meetingId)
    .eq('consultancy_id', consultancyId)
    .eq('user_id', userId);

  if (error) throw new Error(`Failed to delete meeting: ${error.message}`);
  return true;
}
