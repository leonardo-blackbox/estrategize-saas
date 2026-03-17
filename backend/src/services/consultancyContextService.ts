import { supabaseAdmin } from '../lib/supabaseAdmin.js';

export interface ConsultancyContextBlock {
  // Identidade
  client_name: string | null;
  brand: string | null;
  niche: string | null;
  instagram: string | null;
  city: string | null;
  state: string | null;
  phase: string;

  // Diagnóstico e posicionamento
  real_bottleneck: string | null;
  strategic_summary: string | null;
  diagnosis_summary: string | null;

  // Perfil estratégico
  main_objective: string | null;
  reported_pains: string[];
  main_offer: string | null;
  current_audience: string | null;
  desired_audience: string | null;
  business_type: string | null;

  // Jornada
  current_stage_name: string | null;
  implementation_score: number;
  open_action_items_count: number;

  // Reuniões recentes (resumos dos últimos 5)
  recent_meeting_summaries: string[];

  // Entregáveis já produzidos
  deliverables_summary: string[];

  // Memórias críticas (importance >= 4)
  critical_memories: Array<{ type: string; content: string }>;
}

export interface InsightCards {
  real_bottleneck: string | null;
  week_priorities: string[];
  next_meeting: { title: string; scheduled_at: string; meeting_url: string | null } | null;
  ai_opportunity: string | null;
}

function ensureAdmin() {
  if (!supabaseAdmin) throw new Error('Database service unavailable');
  return supabaseAdmin;
}

export async function buildFullContext(
  userId: string,
  consultancyId: string,
): Promise<ConsultancyContextBlock> {
  const db = ensureAdmin();

  // Fetch all data in parallel
  const [
    consultancyRes,
    profileRes,
    stagesRes,
    meetingsRes,
    actionItemsRes,
    deliverablesRes,
    memoriesRes,
    diagnosisRes,
  ] = await Promise.all([
    db.from('consultancies').select('*').eq('id', consultancyId).eq('user_id', userId).single(),
    db.from('consultancy_profiles').select('*').eq('consultancy_id', consultancyId).eq('user_id', userId).single(),
    db.from('consultancy_stages').select('*').eq('consultancy_id', consultancyId).eq('user_id', userId).order('order_index', { ascending: true }),
    db.from('consultancy_meetings').select('title,summary,scheduled_at,status').eq('consultancy_id', consultancyId).eq('user_id', userId).eq('status', 'completed').order('scheduled_at', { ascending: false }).limit(5),
    db.from('consultancy_action_items').select('title,priority').eq('consultancy_id', consultancyId).eq('user_id', userId).neq('status', 'done').neq('status', 'cancelled'),
    db.from('consultancy_deliverables').select('type,title,status').eq('consultancy_id', consultancyId).eq('user_id', userId).order('created_at', { ascending: false }),
    db.from('consultancy_ai_memory').select('memory_type,content,importance').eq('consultancy_id', consultancyId).eq('user_id', userId).eq('is_active', true).gte('importance', 4),
    db.from('consultancy_diagnostics').select('content').eq('consultancy_id', consultancyId).eq('user_id', userId).order('version', { ascending: false }).limit(1).single(),
  ]);

  const c = consultancyRes.data as Record<string, unknown> | null;
  const p = profileRes.data as Record<string, unknown> | null;
  const stages = (stagesRes.data ?? []) as Array<{ name: string; status: string }>;
  const meetings = (meetingsRes.data ?? []) as Array<{ title: string; summary: string | null }>;
  const actionItems = (actionItemsRes.data ?? []) as Array<{ title: string; priority: string }>;
  const deliverables = (deliverablesRes.data ?? []) as Array<{ type: string; title: string; status: string }>;
  const memories = (memoriesRes.data ?? []) as Array<{ memory_type: string; content: string; importance: number }>;
  const diagnosis = diagnosisRes.data as { content: { executiveSummary?: string } } | null;

  // Current stage
  const currentStage = stages.find((s) => s.status === 'in_progress') ?? stages[0] ?? null;

  // Diagnosis summary
  const diagnosisSummary = diagnosis?.content?.executiveSummary ?? null;

  return {
    client_name: (c?.client_name as string) ?? null,
    brand: (c?.client_name as string) ?? null, // same field for now, profile has more specific
    niche: (c?.niche as string) ?? (p?.sub_niche as string) ?? null,
    instagram: (c?.instagram as string) ?? null,
    city: (p?.city as string) ?? null,
    state: (p?.state as string) ?? null,
    phase: (c?.phase as string) ?? 'onboarding',
    real_bottleneck: (c?.real_bottleneck as string) ?? null,
    strategic_summary: (c?.strategic_summary as string) ?? null,
    diagnosis_summary: diagnosisSummary,
    main_objective: (p?.main_objective as string) ?? null,
    reported_pains: (p?.reported_pains as string[]) ?? [],
    main_offer: (p?.main_offer as string) ?? null,
    current_audience: (p?.current_audience as string) ?? null,
    desired_audience: (p?.desired_audience as string) ?? null,
    business_type: (p?.business_type as string) ?? null,
    current_stage_name: currentStage?.name ?? null,
    implementation_score: (c?.implementation_score as number) ?? 0,
    open_action_items_count: actionItems.length,
    recent_meeting_summaries: meetings
      .filter((m) => m.summary)
      .map((m) => `[${m.title}]: ${m.summary}`),
    deliverables_summary: deliverables.map((d) => `${d.title} (${d.type}, ${d.status})`),
    critical_memories: memories.map((m) => ({ type: m.memory_type, content: m.content })),
  };
}

export async function getInsightCards(
  userId: string,
  consultancyId: string,
): Promise<InsightCards> {
  const db = ensureAdmin();

  const [consultancyRes, meetingRes, memoriesRes, actionItemsRes] = await Promise.all([
    db.from('consultancies').select('real_bottleneck,strategic_summary').eq('id', consultancyId).eq('user_id', userId).single(),
    db.from('consultancy_meetings').select('title,scheduled_at,meeting_url').eq('consultancy_id', consultancyId).eq('user_id', userId).eq('status', 'scheduled').gte('scheduled_at', new Date().toISOString()).order('scheduled_at', { ascending: true }).limit(1).single(),
    db.from('consultancy_ai_memory').select('content').eq('consultancy_id', consultancyId).eq('user_id', userId).eq('memory_type', 'opportunity').eq('is_active', true).order('importance', { ascending: false }).limit(1).single(),
    db.from('consultancy_action_items').select('title').eq('consultancy_id', consultancyId).eq('user_id', userId).in('status', ['todo', 'in_progress']).in('priority', ['high', 'critical']).order('created_at', { ascending: false }).limit(3),
  ]);

  const c = consultancyRes.data as { real_bottleneck: string | null; strategic_summary: string | null } | null;
  const nextMeeting = meetingRes.data as { title: string; scheduled_at: string; meeting_url: string | null } | null;
  const aiOpportunity = memoriesRes.data as { content: string } | null;
  const topActions = (actionItemsRes.data ?? []) as Array<{ title: string }>;

  return {
    real_bottleneck: c?.real_bottleneck ?? null,
    week_priorities: topActions.map((a) => a.title),
    next_meeting: nextMeeting ?? null,
    ai_opportunity: aiOpportunity?.content ?? null,
  };
}
