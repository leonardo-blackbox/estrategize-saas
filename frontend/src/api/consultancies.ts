import { apiFetch } from './client.ts';

// ─── Enums ───────────────────────────────────────────────────────────────────

export type ConsultancyPhase =
  | 'onboarding'
  | 'diagnosis'
  | 'delivery'
  | 'implementation'
  | 'support'
  | 'closed';

export type ConsultancyTemplate =
  | 'repositioning'
  | 'launch'
  | 'scaling'
  | 'restructuring';

/** Prioridade da consultoria (tabela consultancies) */
export type ConsultancyPriority = 'low' | 'normal' | 'high' | 'at_risk';

/** Prioridade de tarefas/action items (tabela consultancy_action_items) */
export type ActionPriority = 'low' | 'medium' | 'high' | 'critical';

// ─── Core Types ──────────────────────────────────────────────────────────────

export interface Consultancy {
  id: string;
  user_id: string;
  title: string;
  client_name: string | null;
  status: 'active' | 'archived';
  // Epic 5 fields
  phase: ConsultancyPhase | null;
  niche: string | null;
  instagram: string | null;
  start_date: string | null;
  end_date_estimated: string | null;
  template: ConsultancyTemplate | null;
  implementation_score: number | null;
  credits_spent: number;
  strategic_summary: string | null;
  real_bottleneck: string | null;
  next_meeting_at: string | null;
  priority: ConsultancyPriority | null;
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

// ─── Phase Config ─────────────────────────────────────────────────────────────

export const phaseConfig: Record<ConsultancyPhase, { label: string; colorVar: string; bgVar: string }> = {
  onboarding:      { label: 'Onboarding',    colorVar: '--phase-onboarding',      bgVar: '--phase-onboarding-bg' },
  diagnosis:       { label: 'Diagnóstico',   colorVar: '--phase-diagnosis',       bgVar: '--phase-diagnosis-bg' },
  delivery:        { label: 'Entrega',       colorVar: '--phase-delivery',        bgVar: '--phase-delivery-bg' },
  implementation:  { label: 'Implementação', colorVar: '--phase-implementation',  bgVar: '--phase-implementation-bg' },
  support:         { label: 'Suporte',       colorVar: '--phase-support',         bgVar: '--phase-support-bg' },
  closed:          { label: 'Encerrada',     colorVar: '--phase-closed',          bgVar: '--phase-closed-bg' },
};

export const templateConfig: Record<ConsultancyTemplate, { label: string; description: string; icon: string }> = {
  repositioning:  { label: 'Reposicionamento', description: 'Redefinir marca e posição de mercado', icon: '◎' },
  launch:         { label: 'Lançamento',        description: 'Estruturar o go-to-market do negócio', icon: '▲' },
  scaling:        { label: 'Escala',            description: 'Crescer receita e time com consistência', icon: '⬆' },
  restructuring:  { label: 'Reestruturação',    description: 'Recuperar negócio em dificuldade', icon: '◉' },
};

// ─── API Payloads ─────────────────────────────────────────────────────────────

export interface CreateConsultancyPayload {
  title: string;
  client_name?: string;
  phase?: ConsultancyPhase;
  niche?: string;
  instagram?: string;
  template?: ConsultancyTemplate;
  priority?: ConsultancyPriority;
}

export interface UpdateConsultancyPayload {
  title?: string;
  client_name?: string;
  status?: 'active' | 'archived';
  phase?: ConsultancyPhase;
  niche?: string;
  instagram?: string;
  priority?: ConsultancyPriority;
  strategic_summary?: string;
  real_bottleneck?: string;
  next_meeting_at?: string | null;
  implementation_score?: number;
}

// ─── Meeting Types ────────────────────────────────────────────────────────────

export interface Meeting {
  id: string;
  consultancy_id: string;
  user_id: string;
  title: string;
  scheduled_at: string;
  duration_minutes: number | null;
  meeting_type: 'kickoff' | 'diagnostic' | 'delivery' | 'checkpoint' | 'followup' | 'closing';
  status: 'scheduled' | 'done' | 'cancelled';
  notes: string | null;
  summary: Record<string, unknown> | null;
  recording_url: string | null;
  created_at: string;
  updated_at: string;
}

// ─── Action Item Types ────────────────────────────────────────────────────────

export interface ActionItem {
  id: string;
  consultancy_id: string;
  user_id: string;
  title: string;
  description: string | null;
  status: 'pending' | 'in_progress' | 'done' | 'cancelled';
  priority: ActionPriority;
  responsible: string | null;
  due_date: string | null;
  created_at: string;
  updated_at: string;
}

// ─── Deliverable Types ────────────────────────────────────────────────────────

export type DeliverableType =
  | 'executive_summary'
  | 'meeting_summary'
  | 'action_plan'
  | 'strategic_diagnosis'
  | 'positioning_doc'
  | 'content_bank'
  | 'competition_analysis'
  | 'presentation'
  | 'financial_projection'
  | 'market_research'
  | 'brand_guide'
  | 'custom';

export interface Deliverable {
  id: string;
  consultancy_id: string;
  user_id: string;
  type: DeliverableType;
  title: string;
  content: Record<string, unknown>;
  ai_generated: boolean;
  credits_used: number;
  version: number;
  created_at: string;
  updated_at: string;
}

// ─── AI Types ─────────────────────────────────────────────────────────────────

export interface AIMessage {
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

export interface AIMemoryItem {
  id: string;
  consultancy_id: string;
  user_id: string;
  category: 'personal' | 'business' | 'goals' | 'obstacles' | 'context' | 'custom';
  title: string;
  content: string;
  created_at: string;
}

export interface AIContextBlock {
  consultancy: Consultancy;
  profile: Record<string, unknown> | null;
  stages: Record<string, unknown>[];
  meetings: Meeting[];
  action_items: ActionItem[];
  deliverables: Deliverable[];
  memory: AIMemoryItem[];
}

export interface InsightCards {
  bottleneck: string | null;
  week_priorities: string[];
  next_meeting: { title: string; scheduled_at: string } | null;
  ai_opportunity: string | null;
}

// ─── API Functions ────────────────────────────────────────────────────────────

export function fetchConsultancies(): Promise<{ data: Consultancy[]; stats: ConsultancyStats }> {
  return apiFetch('/api/consultancies');
}

export function fetchConsultancy(id: string): Promise<{ data: Consultancy }> {
  return apiFetch(`/api/consultancies/${id}`);
}

export function createConsultancy(
  payload: CreateConsultancyPayload,
): Promise<{ data: Consultancy }> {
  return apiFetch('/api/consultancies', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function updateConsultancy(
  id: string,
  payload: UpdateConsultancyPayload,
): Promise<{ data: Consultancy }> {
  return apiFetch(`/api/consultancies/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export function deleteConsultancy(id: string): Promise<{ ok: boolean }> {
  return apiFetch(`/api/consultancies/${id}`, { method: 'DELETE' });
}

// ─── Profile ──────────────────────────────────────────────────────────────────

export function fetchConsultancyProfile(id: string): Promise<{ data: Record<string, unknown> }> {
  return apiFetch(`/api/consultancies/${id}/profile`);
}

export function upsertConsultancyProfile(
  id: string,
  payload: Record<string, unknown>,
): Promise<{ data: Record<string, unknown> }> {
  return apiFetch(`/api/consultancies/${id}/profile`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

// ─── Stages ───────────────────────────────────────────────────────────────────

export function fetchConsultancyStages(id: string): Promise<{ data: Record<string, unknown>[] }> {
  return apiFetch(`/api/consultancies/${id}/stages`);
}

// ─── Meetings ─────────────────────────────────────────────────────────────────

export function fetchMeetings(consultancyId: string): Promise<{ data: Meeting[] }> {
  return apiFetch(`/api/consultancies/${consultancyId}/meetings`);
}

export function createMeeting(
  consultancyId: string,
  payload: Partial<Meeting>,
): Promise<{ data: Meeting }> {
  return apiFetch(`/api/consultancies/${consultancyId}/meetings`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function summarizeMeeting(
  consultancyId: string,
  meetingId: string,
): Promise<{ data: Meeting }> {
  return apiFetch(`/api/consultancies/${consultancyId}/meetings/${meetingId}/summarize`, {
    method: 'POST',
  });
}

// ─── Action Items ─────────────────────────────────────────────────────────────

export function fetchActionItems(consultancyId: string): Promise<{ data: ActionItem[] }> {
  return apiFetch(`/api/consultancies/${consultancyId}/actions`);
}

export function createActionItem(
  consultancyId: string,
  payload: Partial<ActionItem>,
): Promise<{ data: ActionItem }> {
  return apiFetch(`/api/consultancies/${consultancyId}/actions`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function updateActionItem(
  consultancyId: string,
  actionId: string,
  payload: Partial<ActionItem>,
): Promise<{ data: ActionItem }> {
  return apiFetch(`/api/consultancies/${consultancyId}/actions/${actionId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

// ─── Deliverables ─────────────────────────────────────────────────────────────

export function fetchDeliverables(consultancyId: string): Promise<{ data: Deliverable[] }> {
  return apiFetch(`/api/consultancies/${consultancyId}/deliverables`);
}

export function generateDeliverable(
  consultancyId: string,
  type: DeliverableType,
  extra?: Record<string, unknown>,
): Promise<{ data: Deliverable }> {
  return apiFetch(`/api/consultancies/${consultancyId}/deliverables/generate`, {
    method: 'POST',
    body: JSON.stringify({ type, ...extra }),
  });
}

// ─── AI Dedicated ─────────────────────────────────────────────────────────────

export function fetchAIContext(consultancyId: string): Promise<{ data: AIContextBlock; insights: InsightCards }> {
  return apiFetch(`/api/consultancies/${consultancyId}/ai/context`);
}

export function chatWithAI(
  consultancyId: string,
  message: string,
  history: AIMessage[],
): Promise<{ reply: string; credits_used: number }> {
  return apiFetch(`/api/consultancies/${consultancyId}/ai/chat`, {
    method: 'POST',
    body: JSON.stringify({ message, history }),
  });
}

export function fetchAIMemory(consultancyId: string): Promise<{ data: AIMemoryItem[] }> {
  return apiFetch(`/api/consultancies/${consultancyId}/ai/memory`);
}

export function addAIMemory(
  consultancyId: string,
  payload: Omit<AIMemoryItem, 'id' | 'consultancy_id' | 'user_id' | 'created_at'>,
): Promise<{ data: AIMemoryItem }> {
  return apiFetch(`/api/consultancies/${consultancyId}/ai/memory`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function deleteAIMemory(
  consultancyId: string,
  memoryId: string,
): Promise<{ ok: boolean }> {
  return apiFetch(`/api/consultancies/${consultancyId}/ai/memory/${memoryId}`, {
    method: 'DELETE',
  });
}

// ─── React Query Keys ─────────────────────────────────────────────────────────

export const consultancyKeys = {
  all: ['consultancies'] as const,
  list: () => [...consultancyKeys.all, 'list'] as const,
  detail: (id: string) => [...consultancyKeys.all, id] as const,
  meetings: (id: string) => [...consultancyKeys.all, id, 'meetings'] as const,
  actions: (id: string) => [...consultancyKeys.all, id, 'actions'] as const,
  deliverables: (id: string) => [...consultancyKeys.all, id, 'deliverables'] as const,
  aiContext: (id: string) => [...consultancyKeys.all, id, 'ai-context'] as const,
  aiMemory: (id: string) => [...consultancyKeys.all, id, 'ai-memory'] as const,
};
