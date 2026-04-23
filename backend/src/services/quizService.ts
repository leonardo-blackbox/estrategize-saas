import { supabaseAdmin } from '../lib/supabaseAdmin.js';
import { getOwnedApplication } from './applicationService.js';

export interface QuizOutcome {
  id: string;
  application_id: string;
  outcome_key: string;
  title: string;
  description: string | null;
  score_min: number;
  score_max: number;
  cta_type: 'url' | 'whatsapp' | 'none';
  cta_url: string | null;
  cta_label: string | null;
  image_url: string | null;
  background_color: string | null;
  order: number;
  pixel_event_name: string | null;
  created_at: string;
}

export interface QuizOutcomeInput {
  outcome_key: string;
  title: string;
  description?: string | null;
  score_min: number;
  score_max: number;
  cta_type: 'url' | 'whatsapp' | 'none';
  cta_url?: string | null;
  cta_label?: string | null;
  image_url?: string | null;
  background_color?: string | null;
  order?: number;
  pixel_event_name?: string | null;
}

function ensureDb() {
  if (!supabaseAdmin) throw new Error('Database unavailable');
  return supabaseAdmin;
}

async function ensureQuizOwner(userId: string, applicationId: string): Promise<boolean> {
  const application = await getOwnedApplication(userId, applicationId);
  return application?.tool_type === 'quiz';
}

export async function listOutcomes(userId: string, applicationId: string) {
  const db = ensureDb();
  if (!(await ensureQuizOwner(userId, applicationId))) return null;

  const { data, error } = await db
    .from('quiz_outcomes')
    .select('*')
    .eq('application_id', applicationId)
    .order('order', { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []) as QuizOutcome[];
}

function buildOutcomeRows(applicationId: string, outcomes: QuizOutcomeInput[]) {
  return outcomes.map((outcome, index) => ({
    application_id: applicationId,
    outcome_key: outcome.outcome_key,
    title: outcome.title,
    description: outcome.description ?? null,
    score_min: outcome.score_min,
    score_max: outcome.score_max,
    cta_type: outcome.cta_type,
    cta_url: outcome.cta_url ?? null,
    cta_label: outcome.cta_label ?? null,
    image_url: outcome.image_url ?? null,
    background_color: outcome.background_color ?? null,
    order: outcome.order ?? index * 10,
    pixel_event_name: outcome.pixel_event_name ?? null,
  }));
}

export async function upsertOutcomes(
  userId: string,
  applicationId: string,
  outcomes: QuizOutcomeInput[],
) {
  const db = ensureDb();
  if (!(await ensureQuizOwner(userId, applicationId))) return null;

  const { error: deleteError } = await db
    .from('quiz_outcomes')
    .delete()
    .eq('application_id', applicationId);
  if (deleteError) throw new Error(deleteError.message);
  if (outcomes.length === 0) return [];

  const { data, error } = await db
    .from('quiz_outcomes')
    .insert(buildOutcomeRows(applicationId, outcomes))
    .select()
    .order('order', { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []) as QuizOutcome[];
}

export async function duplicateOutcomes(
  userId: string,
  sourceApplicationId: string,
  targetApplicationId: string,
) {
  const sourceOutcomes = await listOutcomes(userId, sourceApplicationId);
  if (!sourceOutcomes || sourceOutcomes.length === 0) return [];
  return upsertOutcomes(userId, targetApplicationId, sourceOutcomes.map((outcome) => ({
    outcome_key: outcome.outcome_key,
    title: outcome.title,
    description: outcome.description,
    score_min: outcome.score_min,
    score_max: outcome.score_max,
    cta_type: outcome.cta_type,
    cta_url: outcome.cta_url,
    cta_label: outcome.cta_label,
    image_url: outcome.image_url,
    background_color: outcome.background_color,
    order: outcome.order,
    pixel_event_name: outcome.pixel_event_name,
  })));
}
