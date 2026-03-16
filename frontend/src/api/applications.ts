import { client } from './client.ts';

// ─────────────────────────────────────────────
// Shared Types
// ─────────────────────────────────────────────

export type FieldType =
  | 'welcome'
  | 'message'
  | 'short_text'
  | 'long_text'
  | 'name'
  | 'email'
  | 'phone'
  | 'multiple_choice'
  | 'number'
  | 'date'
  | 'thank_you';

export interface ThemeConfig {
  backgroundColor: string;
  questionColor: string;
  answerColor: string;
  buttonColor: string;
  buttonTextColor: string;
  fontFamily: string;
  borderRadius: number;
  logoUrl?: string;
  logoPosition: 'left' | 'center' | 'right';
  backgroundImageUrl?: string;
}

export interface FormSettings {
  closeAfterResponses?: number;
  limitOneResponsePerSession: boolean;
  showProgressBar: boolean;
  showQuestionNumbers: boolean;
  redirectUrl?: string;
  thankYouTitle: string;
  thankYouMessage: string;
  estimatedTime?: number;
}

export interface FieldOption {
  id: string;
  label: string;
}

export interface ConditionalLogic {
  enabled: boolean;
  conditions: Array<{
    fieldId: string;
    operator: string;
    value: string;
    action: string;
    targetFieldId: string;
  }>;
}

export interface ApplicationField {
  id: string;
  application_id: string;
  position: number;
  type: FieldType;
  title: string;
  description?: string;
  required: boolean;
  options: FieldOption[] | Record<string, unknown>;
  conditional_logic: ConditionalLogic;
  created_at: string;
  updated_at: string;
}

export interface Application {
  id: string;
  user_id: string;
  title: string;
  slug: string;
  status: 'draft' | 'published' | 'archived';
  theme_config: ThemeConfig;
  settings: FormSettings;
  response_count: number;
  fields?: ApplicationField[];
  created_at: string;
  updated_at: string;
}

export interface ResponseWithAnswers {
  id: string;
  application_id: string;
  status: string;
  submitted_at: string;
  metadata: Record<string, string>;
  created_at: string;
  answers: Array<{
    field_id: string;
    field_type: string;
    field_title: string;
    value: unknown;
  }>;
}

// ─────────────────────────────────────────────
// Defaults
// ─────────────────────────────────────────────

export const DEFAULT_THEME: ThemeConfig = {
  backgroundColor: '#000000',
  questionColor: '#f5f5f7',
  answerColor: '#f5f5f7',
  buttonColor: '#7c5cfc',
  buttonTextColor: '#ffffff',
  fontFamily: 'Inter',
  borderRadius: 12,
  logoPosition: 'left',
};

export const DEFAULT_SETTINGS: FormSettings = {
  limitOneResponsePerSession: false,
  showProgressBar: true,
  showQuestionNumbers: true,
  thankYouTitle: 'Obrigado!',
  thankYouMessage: 'Suas respostas foram recebidas.',
};

// ─────────────────────────────────────────────
// Query Key Factory
// ─────────────────────────────────────────────

export const applicationKeys = {
  all: ['applications'] as const,
  lists: () => [...applicationKeys.all, 'list'] as const,
  detail: (id: string) => [...applicationKeys.all, 'detail', id] as const,
  responses: (id: string) => [...applicationKeys.all, 'responses', id] as const,
  public: (slug: string) => ['public-form', slug] as const,
};

// ─────────────────────────────────────────────
// API Response shapes
// ─────────────────────────────────────────────

interface ApplicationsListResponse {
  data: Application[];
}

interface ApplicationResponse {
  data: Application;
}

interface FieldsResponse {
  data: ApplicationField[];
}

interface ResponsesResponse {
  data: {
    responses: ResponseWithAnswers[];
    pagination: { page: number; limit: number; total: number; pages: number };
  };
}

interface PublicFormResponse {
  application: Application;
  fields: ApplicationField[];
}

interface SubmitResponseResult {
  response_id: string;
}

// ─────────────────────────────────────────────
// API Functions
// ─────────────────────────────────────────────

export async function fetchApplications(): Promise<Application[]> {
  const res = await client.get('/api/applications').json<ApplicationsListResponse>();
  return res.data;
}

export async function fetchApplication(id: string): Promise<Application> {
  const res = await client.get(`/api/applications/${id}`).json<ApplicationResponse>();
  return res.data;
}

export async function createApplication(title: string): Promise<Application> {
  const res = await client
    .post('/api/applications', { json: { title } })
    .json<ApplicationResponse>();
  return res.data;
}

export async function updateApplication(
  id: string,
  updates: Partial<Pick<Application, 'title' | 'status' | 'theme_config' | 'settings'>>,
): Promise<Application> {
  const res = await client
    .put(`/api/applications/${id}`, { json: updates })
    .json<ApplicationResponse>();
  return res.data;
}

export async function deleteApplication(id: string): Promise<void> {
  await client.delete(`/api/applications/${id}`).json<void>();
}

export async function duplicateApplication(id: string): Promise<Application> {
  const res = await client
    .post(`/api/applications/${id}/duplicate`)
    .json<ApplicationResponse>();
  return res.data;
}

export async function updateApplicationFields(
  id: string,
  fields: Array<Omit<ApplicationField, 'application_id' | 'created_at' | 'updated_at'>>,
): Promise<ApplicationField[]> {
  const res = await client
    .put(`/api/applications/${id}/fields`, { json: { fields } })
    .json<FieldsResponse>();
  return res.data;
}

export async function fetchResponses(
  id: string,
  page = 1,
  limit = 20,
): Promise<{ data: ResponseWithAnswers[]; total: number }> {
  const res = await client
    .get(`/api/applications/${id}/responses?page=${page}&limit=${limit}`)
    .json<ResponsesResponse>();
  return { data: res.data.responses, total: res.data.pagination.total };
}

export async function exportResponses(id: string): Promise<ResponseWithAnswers[]> {
  const res = await client
    .get(`/api/applications/${id}/responses/export`)
    .json<{ data: ResponseWithAnswers[] }>();
  return res.data;
}

export async function fetchPublicForm(
  slug: string,
): Promise<{ application: Application; fields: ApplicationField[] }> {
  const res = await client.get(`/api/forms/${slug}`).json<PublicFormResponse>();
  return res;
}

export async function submitFormResponse(
  slug: string,
  answers: Array<{ field_id: string; value: unknown }>,
  metadata?: Record<string, string>,
): Promise<{ response_id: string }> {
  const res = await client
    .post(`/api/forms/${slug}/responses`, { json: { answers, metadata } })
    .json<SubmitResponseResult>();
  return res;
}
