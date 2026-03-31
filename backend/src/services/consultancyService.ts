import { supabaseAdmin } from '../lib/supabaseAdmin.js';

export type ConsultancyPhase =
  | 'onboarding'
  | 'diagnosis'
  | 'delivery'
  | 'implementation'
  | 'support'
  | 'closed';

export type ConsultancyTemplate =
  | 'none'
  | 'repositioning'
  | 'launch'
  | 'scaling'
  | 'restructuring';

export type ConsultancyPriority = 'low' | 'normal' | 'high' | 'at_risk';

export interface Consultancy {
  id: string;
  user_id: string;
  title: string;
  client_name: string | null;
  status: 'active' | 'archived';
  // New fields (Epic 5)
  phase: ConsultancyPhase;
  instagram: string | null;
  niche: string | null;
  start_date: string | null;
  end_date_estimated: string | null;
  template: ConsultancyTemplate;
  implementation_score: number;
  credits_spent: number;
  strategic_summary: string | null;
  real_bottleneck: string | null;
  next_meeting_at: string | null;
  priority: ConsultancyPriority;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ConsultancyStats {
  total: number;
  active: number;
  onboarding: number;
  meetings_this_week: number;
  at_risk: number;
}

export interface CreateConsultancyInput {
  title: string;
  client_name?: string;
  status?: 'active' | 'archived';
  phase?: ConsultancyPhase;
  instagram?: string;
  niche?: string;
  start_date?: string;
  end_date_estimated?: string;
  template?: ConsultancyTemplate;
  ticket?: number;
  has_team?: boolean;
  has_website?: boolean;
  current_stage?: string;
  priority?: ConsultancyPriority;
}

export interface UpdateConsultancyInput {
  title?: string;
  client_name?: string;
  status?: 'active' | 'archived';
  phase?: ConsultancyPhase;
  instagram?: string;
  niche?: string;
  start_date?: string | null;
  end_date_estimated?: string | null;
  template?: ConsultancyTemplate;
  implementation_score?: number;
  strategic_summary?: string | null;
  real_bottleneck?: string | null;
  next_meeting_at?: string | null;
  priority?: ConsultancyPriority;
  ticket?: number | null;
  has_team?: boolean;
  has_website?: boolean;
  current_stage?: string | null;
}

function ensureAdmin() {
  if (!supabaseAdmin) {
    throw new Error('Database service unavailable');
  }
  return supabaseAdmin;
}

export async function listConsultancies(userId: string): Promise<Consultancy[]> {
  const db = ensureAdmin();

  const { data, error } = await db
    .from('consultancies')
    .select('*')
    .eq('user_id', userId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to list consultancies: ${error.message}`);
  }

  return data as Consultancy[];
}

export async function listConsultanciesWithStats(
  userId: string,
): Promise<{ consultancies: Consultancy[]; stats: ConsultancyStats }> {
  const db = ensureAdmin();

  const { data, error } = await db
    .from('consultancies')
    .select('*')
    .eq('user_id', userId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  if (error) throw new Error(`Failed to list consultancies: ${error.message}`);

  const consultancies = data as Consultancy[];

  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay());
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 7);

  const stats: ConsultancyStats = {
    total: consultancies.length,
    active: consultancies.filter((c) => c.status === 'active').length,
    onboarding: consultancies.filter((c) => c.phase === 'onboarding' && c.status === 'active').length,
    meetings_this_week: consultancies.filter(
      (c) =>
        c.next_meeting_at != null &&
        new Date(c.next_meeting_at) >= weekStart &&
        new Date(c.next_meeting_at) <= weekEnd,
    ).length,
    at_risk: consultancies.filter((c) => c.priority === 'at_risk').length,
  };

  return { consultancies, stats };
}

export async function getConsultancy(
  userId: string,
  consultancyId: string,
): Promise<Consultancy | null> {
  const db = ensureAdmin();

  const { data, error } = await db
    .from('consultancies')
    .select('*')
    .eq('id', consultancyId)
    .eq('user_id', userId)
    .is('deleted_at', null)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw new Error(`Failed to get consultancy: ${error.message}`);
  }

  return data as Consultancy;
}

export async function createConsultancy(
  userId: string,
  input: CreateConsultancyInput,
): Promise<Consultancy> {
  const db = ensureAdmin();

  const { data, error } = await db
    .from('consultancies')
    .insert({
      user_id: userId,
      title: input.title,
      client_name: input.client_name ?? null,
      status: input.status ?? 'active',
      phase: input.phase ?? 'onboarding',
      instagram: input.instagram ?? null,
      niche: input.niche ?? null,
      start_date: input.start_date ?? null,
      end_date_estimated: input.end_date_estimated ?? null,
      template: input.template ?? 'none',
      ticket: input.ticket ?? null,
      has_team: input.has_team ?? false,
      has_website: input.has_website ?? false,
      current_stage: input.current_stage ?? null,
      priority: input.priority ?? 'normal',
    })
    .select('*')
    .single();

  if (error) {
    throw new Error(`Failed to create consultancy: ${error.message}`);
  }

  return data as Consultancy;
}

export async function updateConsultancy(
  userId: string,
  consultancyId: string,
  input: UpdateConsultancyInput,
): Promise<Consultancy | null> {
  const db = ensureAdmin();

  const existing = await getConsultancy(userId, consultancyId);
  if (!existing) return null;

  const { data, error } = await db
    .from('consultancies')
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq('id', consultancyId)
    .eq('user_id', userId)
    .is('deleted_at', null)
    .select('*')
    .single();

  if (error) {
    throw new Error(`Failed to update consultancy: ${error.message}`);
  }

  return data as Consultancy;
}

export async function softDeleteConsultancy(
  userId: string,
  consultancyId: string,
): Promise<boolean> {
  const db = ensureAdmin();

  const existing = await getConsultancy(userId, consultancyId);
  if (!existing) return false;

  const { error } = await db
    .from('consultancies')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', consultancyId)
    .eq('user_id', userId)
    .is('deleted_at', null);

  if (error) {
    throw new Error(`Failed to delete consultancy: ${error.message}`);
  }

  return true;
}
