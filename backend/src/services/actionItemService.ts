import { supabaseAdmin } from '../lib/supabaseAdmin.js';

export interface ActionItem {
  id: string;
  consultancy_id: string;
  user_id: string;
  meeting_id: string | null;
  title: string;
  description: string | null;
  priority: 'low' | 'medium' | 'high' | 'critical';
  responsible: string | null;
  due_date: string | null;
  status: 'todo' | 'in_progress' | 'done' | 'cancelled';
  expected_impact: string | null;
  evidence_url: string | null;
  origin: 'manual' | 'meeting_ai' | 'diagnosis_ai';
  created_at: string;
  updated_at: string;
}

export type CreateActionItemInput = {
  title: string;
  description?: string;
  priority?: ActionItem['priority'];
  responsible?: string;
  due_date?: string;
  expected_impact?: string;
  meeting_id?: string;
  origin?: ActionItem['origin'];
};

export type UpdateActionItemInput = Partial<Omit<ActionItem, 'id' | 'consultancy_id' | 'user_id' | 'created_at' | 'updated_at'>>;

export interface ActionItemFilters {
  status?: ActionItem['status'];
  priority?: ActionItem['priority'];
}

function ensureAdmin() {
  if (!supabaseAdmin) throw new Error('Database service unavailable');
  return supabaseAdmin;
}

export async function listActionItems(
  userId: string,
  consultancyId: string,
  filters?: ActionItemFilters,
): Promise<ActionItem[]> {
  const db = ensureAdmin();

  let query = db
    .from('consultancy_action_items')
    .select('*')
    .eq('consultancy_id', consultancyId)
    .eq('user_id', userId);

  if (filters?.status) query = query.eq('status', filters.status);
  if (filters?.priority) query = query.eq('priority', filters.priority);

  const { data, error } = await query.order('created_at', { ascending: false });

  if (error) throw new Error(`Failed to list action items: ${error.message}`);
  return data as ActionItem[];
}

export async function getActionItem(
  userId: string,
  consultancyId: string,
  itemId: string,
): Promise<ActionItem | null> {
  const db = ensureAdmin();

  const { data, error } = await db
    .from('consultancy_action_items')
    .select('*')
    .eq('id', itemId)
    .eq('consultancy_id', consultancyId)
    .eq('user_id', userId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw new Error(`Failed to get action item: ${error.message}`);
  }
  return data as ActionItem;
}

export async function createActionItem(
  userId: string,
  consultancyId: string,
  input: CreateActionItemInput,
): Promise<ActionItem> {
  const db = ensureAdmin();

  const { data, error } = await db
    .from('consultancy_action_items')
    .insert({ ...input, consultancy_id: consultancyId, user_id: userId })
    .select('*')
    .single();

  if (error || !data) throw new Error(`Failed to create action item: ${error?.message ?? 'Unknown error'}`);
  return data as ActionItem;
}

export async function updateActionItem(
  userId: string,
  consultancyId: string,
  itemId: string,
  input: UpdateActionItemInput,
): Promise<ActionItem | null> {
  const db = ensureAdmin();

  const existing = await getActionItem(userId, consultancyId, itemId);
  if (!existing) return null;

  const { data, error } = await db
    .from('consultancy_action_items')
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq('id', itemId)
    .eq('consultancy_id', consultancyId)
    .eq('user_id', userId)
    .select('*')
    .single();

  if (error || !data) throw new Error(`Failed to update action item: ${error?.message ?? 'Unknown error'}`);
  return data as ActionItem;
}

export async function deleteActionItem(
  userId: string,
  consultancyId: string,
  itemId: string,
): Promise<boolean> {
  const db = ensureAdmin();

  const existing = await getActionItem(userId, consultancyId, itemId);
  if (!existing) return false;

  const { error } = await db
    .from('consultancy_action_items')
    .delete()
    .eq('id', itemId)
    .eq('consultancy_id', consultancyId)
    .eq('user_id', userId);

  if (error) throw new Error(`Failed to delete action item: ${error.message}`);
  return true;
}
