import { supabaseAdmin } from '../lib/supabaseAdmin.js';

export interface ConsultancyStage {
  id: string;
  consultancy_id: string;
  user_id: string;
  name: string;
  order_index: number;
  status: 'pending' | 'in_progress' | 'completed' | 'skipped';
  checklist: ChecklistItem[];
  started_at: string | null;
  completed_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface ChecklistItem {
  item: string;
  done: boolean;
}

export type UpdateStageInput = {
  status?: ConsultancyStage['status'];
  checklist?: ChecklistItem[];
  notes?: string;
  started_at?: string | null;
  completed_at?: string | null;
};

const DEFAULT_STAGES = [
  'Contrato',
  'Briefing',
  'Diagnóstico',
  'Entrega Estratégica',
  'Implementação',
  'Suporte',
  'Encerramento',
] as const;

function ensureAdmin() {
  if (!supabaseAdmin) throw new Error('Database service unavailable');
  return supabaseAdmin;
}

export async function getOrCreateStages(
  userId: string,
  consultancyId: string,
): Promise<ConsultancyStage[]> {
  const db = ensureAdmin();

  const { data: existing, error } = await db
    .from('consultancy_stages')
    .select('*')
    .eq('consultancy_id', consultancyId)
    .eq('user_id', userId)
    .order('order_index', { ascending: true });

  if (error) throw new Error(`Failed to fetch stages: ${error.message}`);

  if (existing && existing.length > 0) return existing as ConsultancyStage[];

  // Create default stages
  const toInsert = DEFAULT_STAGES.map((name, i) => ({
    consultancy_id: consultancyId,
    user_id: userId,
    name,
    order_index: i,
    status: i === 0 ? 'in_progress' : 'pending',
    checklist: [],
  }));

  const { data: created, error: createErr } = await db
    .from('consultancy_stages')
    .insert(toInsert)
    .select('*')
    .order('order_index', { ascending: true });

  if (createErr || !created) {
    throw new Error(`Failed to create stages: ${createErr?.message ?? 'Unknown error'}`);
  }

  return created as ConsultancyStage[];
}

export async function updateStage(
  userId: string,
  consultancyId: string,
  stageId: string,
  input: UpdateStageInput,
): Promise<ConsultancyStage> {
  const db = ensureAdmin();

  const { data, error } = await db
    .from('consultancy_stages')
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq('id', stageId)
    .eq('consultancy_id', consultancyId)
    .eq('user_id', userId)
    .select('*')
    .single();

  if (error || !data) {
    throw new Error(`Failed to update stage: ${error?.message ?? 'Unknown error'}`);
  }

  return data as ConsultancyStage;
}
