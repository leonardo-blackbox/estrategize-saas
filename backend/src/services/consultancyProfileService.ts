import { supabaseAdmin } from '../lib/supabaseAdmin.js';

export interface ConsultancyProfile {
  id: string;
  consultancy_id: string;
  user_id: string;
  whatsapp: string | null;
  city: string | null;
  state: string | null;
  business_type: string | null;
  sub_niche: string | null;
  main_objective: string | null;
  reported_pains: string[];
  current_stage: string | null;
  has_team: boolean;
  has_physical_space: boolean;
  has_local_presence: boolean;
  has_google_mybusiness: boolean;
  has_website: boolean;
  main_offer: string | null;
  ticket_range: string | null;
  current_audience: string | null;
  desired_audience: string | null;
  acquisition_channels: string[];
  consulting_value: number | null;
  payment_status: 'pending' | 'partial' | 'paid';
  payment_installments: number | null;
  internal_notes: string | null;
  created_at: string;
  updated_at: string;
}

export type UpsertProfileInput = Partial<Omit<ConsultancyProfile, 'id' | 'consultancy_id' | 'user_id' | 'created_at' | 'updated_at'>>;

function ensureAdmin() {
  if (!supabaseAdmin) throw new Error('Database service unavailable');
  return supabaseAdmin;
}

export async function getOrCreateProfile(
  userId: string,
  consultancyId: string,
): Promise<ConsultancyProfile> {
  const db = ensureAdmin();

  const { data: existing, error: fetchErr } = await db
    .from('consultancy_profiles')
    .select('*')
    .eq('consultancy_id', consultancyId)
    .eq('user_id', userId)
    .single();

  if (!fetchErr && existing) return existing as ConsultancyProfile;

  if (fetchErr && fetchErr.code !== 'PGRST116') {
    throw new Error(`Failed to fetch profile: ${fetchErr.message}`);
  }

  const { data: created, error: createErr } = await db
    .from('consultancy_profiles')
    .insert({ consultancy_id: consultancyId, user_id: userId })
    .select('*')
    .single();

  if (createErr || !created) {
    throw new Error(`Failed to create profile: ${createErr?.message ?? 'Unknown error'}`);
  }

  return created as ConsultancyProfile;
}

export async function upsertProfile(
  userId: string,
  consultancyId: string,
  input: UpsertProfileInput,
): Promise<ConsultancyProfile> {
  const db = ensureAdmin();

  const { data, error } = await db
    .from('consultancy_profiles')
    .upsert(
      { ...input, consultancy_id: consultancyId, user_id: userId, updated_at: new Date().toISOString() },
      { onConflict: 'consultancy_id' },
    )
    .select('*')
    .single();

  if (error || !data) {
    throw new Error(`Failed to upsert profile: ${error?.message ?? 'Unknown error'}`);
  }

  return data as ConsultancyProfile;
}
