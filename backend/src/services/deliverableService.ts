import { supabaseAdmin } from '../lib/supabaseAdmin.js';

export type DeliverableType =
  | 'executive_summary'
  | 'action_plan'
  | 'strategic_diagnosis'
  | 'competition_analysis'
  | 'positioning_doc'
  | 'content_bank'
  | 'offer_structure'
  | 'contract'
  | 'client_manual'
  | 'presentation'
  | 'meeting_summary'
  | 'custom';

export const DELIVERABLE_CREDIT_COSTS: Record<DeliverableType, number> = {
  executive_summary: 2,
  meeting_summary: 2,
  action_plan: 4,
  strategic_diagnosis: 6,
  positioning_doc: 6,
  content_bank: 6,
  competition_analysis: 8,
  presentation: 10,
  offer_structure: 6,
  contract: 4,
  client_manual: 4,
  custom: 2,
};

export interface Deliverable {
  id: string;
  consultancy_id: string;
  user_id: string;
  type: DeliverableType;
  title: string;
  description: string | null;
  content: Record<string, unknown> | null;
  file_url: string | null;
  status: 'draft' | 'ready' | 'delivered';
  generated_by: 'manual' | 'ai';
  credits_spent: number;
  version: number;
  created_at: string;
  updated_at: string;
}

export type CreateDeliverableInput = {
  type: DeliverableType;
  title: string;
  description?: string;
  content?: Record<string, unknown>;
  file_url?: string;
};

export type UpdateDeliverableInput = Partial<Pick<Deliverable, 'title' | 'description' | 'content' | 'file_url' | 'status'>>;

function ensureAdmin() {
  if (!supabaseAdmin) throw new Error('Database service unavailable');
  return supabaseAdmin;
}

export async function listDeliverables(
  userId: string,
  consultancyId: string,
): Promise<Deliverable[]> {
  const db = ensureAdmin();

  const { data, error } = await db
    .from('consultancy_deliverables')
    .select('*')
    .eq('consultancy_id', consultancyId)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(`Failed to list deliverables: ${error.message}`);
  return data as Deliverable[];
}

export async function getDeliverable(
  userId: string,
  consultancyId: string,
  deliverableId: string,
): Promise<Deliverable | null> {
  const db = ensureAdmin();

  const { data, error } = await db
    .from('consultancy_deliverables')
    .select('*')
    .eq('id', deliverableId)
    .eq('consultancy_id', consultancyId)
    .eq('user_id', userId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw new Error(`Failed to get deliverable: ${error.message}`);
  }
  return data as Deliverable;
}

export async function createManualDeliverable(
  userId: string,
  consultancyId: string,
  input: CreateDeliverableInput,
): Promise<Deliverable> {
  const db = ensureAdmin();

  const { data, error } = await db
    .from('consultancy_deliverables')
    .insert({
      ...input,
      consultancy_id: consultancyId,
      user_id: userId,
      generated_by: 'manual',
      credits_spent: 0,
    })
    .select('*')
    .single();

  if (error || !data) throw new Error(`Failed to create deliverable: ${error?.message ?? 'Unknown error'}`);
  return data as Deliverable;
}

export async function saveAIDeliverable(
  userId: string,
  consultancyId: string,
  type: DeliverableType,
  title: string,
  content: Record<string, unknown>,
  creditsSpent: number,
): Promise<Deliverable> {
  const db = ensureAdmin();

  const { data, error } = await db
    .from('consultancy_deliverables')
    .insert({
      type,
      title,
      content,
      consultancy_id: consultancyId,
      user_id: userId,
      generated_by: 'ai',
      status: 'ready',
      credits_spent: creditsSpent,
    })
    .select('*')
    .single();

  if (error || !data) throw new Error(`Failed to save AI deliverable: ${error?.message ?? 'Unknown error'}`);
  return data as Deliverable;
}

export async function updateDeliverable(
  userId: string,
  consultancyId: string,
  deliverableId: string,
  input: UpdateDeliverableInput,
): Promise<Deliverable | null> {
  const db = ensureAdmin();

  const existing = await getDeliverable(userId, consultancyId, deliverableId);
  if (!existing) return null;

  const { data, error } = await db
    .from('consultancy_deliverables')
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq('id', deliverableId)
    .eq('consultancy_id', consultancyId)
    .eq('user_id', userId)
    .select('*')
    .single();

  if (error || !data) throw new Error(`Failed to update deliverable: ${error?.message ?? 'Unknown error'}`);
  return data as Deliverable;
}

export async function deleteDeliverable(
  userId: string,
  consultancyId: string,
  deliverableId: string,
): Promise<boolean> {
  const db = ensureAdmin();

  const existing = await getDeliverable(userId, consultancyId, deliverableId);
  if (!existing) return false;

  const { error } = await db
    .from('consultancy_deliverables')
    .delete()
    .eq('id', deliverableId)
    .eq('consultancy_id', consultancyId)
    .eq('user_id', userId);

  if (error) throw new Error(`Failed to delete deliverable: ${error.message}`);
  return true;
}
