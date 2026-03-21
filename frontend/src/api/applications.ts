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
  backgroundOverlayOpacity?: number;
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
  showBranding?: boolean;
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
  analytics: (id: string) => [...applicationKeys.all, 'analytics', id] as const,
  templates: () => ['templates'] as const,
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

interface PublicFormResponseWrapper {
  data: PublicFormResponse;
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
): Promise<{ application: Application; fields: ApplicationField[]; isPreview?: boolean }> {
  const res = await client.get(`/api/forms/${slug}`).json<PublicFormResponseWrapper>();
  return res.data;
}

export async function fetchPublicFormPreview(
  slug: string,
): Promise<{ application: Application; fields: ApplicationField[]; isPreview: boolean }> {
  const res = await client.get(`/api/forms/${slug}/preview`).json<PublicFormResponseWrapper>();
  return { ...res.data, isPreview: true };
}

export async function submitFormResponse(
  slug: string,
  answers: Array<{ field_id: string; field_type?: string; field_title?: string; value: unknown }>,
  metadata?: Record<string, string>,
): Promise<{ response_id: string }> {
  const res = await client
    .post(`/api/forms/${slug}/responses`, { json: { answers, metadata } })
    .json<SubmitResponseResult>();
  return res;
}

// ─────────────────────────────────────────────
// Tracking & Notifications Config Types
// ─────────────────────────────────────────────

export interface TrackingConfig {
  metaPixelId?: string;
  metaPixelActive: boolean;
  /** 'pixel' = browser-only (fbevents.js). 'capi' = server-side only (no browser pixel). */
  metaMode?: 'pixel' | 'capi';
  /** When to fire the Meta Lead event. Defaults to 'submit' (end of form). */
  metaLeadEvent?: 'start' | 'submit';
  /** Meta Conversions API access token (System User Token). Stored server-side only. */
  metaAccessToken?: string;
  /** Optional test event code for debugging CAPI events in Meta Events Manager. */
  metaTestEventCode?: string;
  ga4MeasurementId?: string;
  ga4Active: boolean;
  tiktokPixelId?: string;
  tiktokPixelActive: boolean;
}

export interface NotificationConfig {
  emailEnabled: boolean;
  emailTo?: string;
  emailCc?: string;
  digestMode: 'instant' | 'daily';
}

export interface AnalyticsLead {
  name?: string;
  email?: string;
  phone?: string;
  instagram?: string;
  submitted_at: string;
  utm_source?: string;
  utm_campaign?: string;
}

export interface AnalyticsData {
  views: number;
  starts: number;
  submits: number;
  total_responses: number;
  start_rate: number;
  completion_rate: number;
  overall_rate: number;
  period: string;
  from: string;
  to: string;
  timeline: Array<{ date: string; views: number; starts: number; submits: number }>;
  hourly: Array<{ hour: number; views: number; starts: number; submits: number }>;
  leads: AnalyticsLead[];
  utm_breakdown: Array<{ source: string; count: number }>;
  traffic_split: { paid: number; organic: number; total: number };
}

export interface ApplicationTemplate {
  id: string;
  name: string;
  description?: string;
  category: string;
  thumbnail_color: string;
}

// ─────────────────────────────────────────────
// API: Tracking Config
// ─────────────────────────────────────────────

export async function updateTrackingConfig(
  id: string,
  tracking: TrackingConfig,
): Promise<Application> {
  const res = await client.get(`/api/applications/${id}`).json<ApplicationResponse>();
  const current = res.data;
  const updated = await client
    .put(`/api/applications/${id}`, {
      json: {
        settings: {
          ...current.settings,
          tracking,
        },
      },
    })
    .json<ApplicationResponse>();
  return updated.data;
}

export async function updateNotificationConfig(
  id: string,
  notifications: NotificationConfig,
): Promise<Application> {
  const res = await client.get(`/api/applications/${id}`).json<ApplicationResponse>();
  const current = res.data;
  const updated = await client
    .put(`/api/applications/${id}`, {
      json: {
        settings: {
          ...current.settings,
          notifications,
        },
      },
    })
    .json<ApplicationResponse>();
  return updated.data;
}

// ─────────────────────────────────────────────
// API: Analytics
// ─────────────────────────────────────────────

export async function fetchAnalytics(
  id: string,
  period: '7d' | '30d' | '90d' = '30d',
  customRange?: { from: string; to: string },
): Promise<AnalyticsData> {
  let url = `/api/applications/${id}/analytics`;
  if (customRange) {
    url += `?from=${customRange.from}&to=${customRange.to}`;
  } else {
    url += `?period=${period}`;
  }
  const res = await client.get(url).json<{ data: AnalyticsData }>();
  return res.data;
}

// ─────────────────────────────────────────────
// API: Templates
// ─────────────────────────────────────────────

export async function fetchTemplates(): Promise<ApplicationTemplate[]> {
  const res = await client.get('/api/templates').json<{ data: ApplicationTemplate[] }>();
  return res.data;
}

export async function createFromTemplate(templateId: string): Promise<Application> {
  const res = await client
    .post(`/api/templates/${templateId}/create`)
    .json<ApplicationResponse>();
  return res.data;
}

// ─────────────────────────────────────────────
// API: Assets (logo/background upload)
// ─────────────────────────────────────────────

export async function uploadApplicationAsset(
  applicationId: string,
  assetType: 'logo' | 'background',
  file: File,
  opacity?: number,
): Promise<{ url: string }> {
  const formData = new FormData();
  formData.append('file', file);
  if (opacity !== undefined) formData.append('opacity', String(opacity));

  const token = (await import('../lib/supabase.ts')).supabase.auth.getSession().then(
    (s: Awaited<ReturnType<typeof import('../lib/supabase.ts').supabase.auth.getSession>>) => s.data.session?.access_token
  );
  const authToken = await token;

  const response = await fetch(
    `${import.meta.env.VITE_API_URL}/api/applications/${applicationId}/assets/${assetType}`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
      body: formData,
    },
  );

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error || 'Upload failed');
  }

  return response.json();
}

export async function deleteApplicationAsset(
  applicationId: string,
  assetType: 'logo' | 'background',
): Promise<void> {
  await client.delete(`/api/applications/${applicationId}/assets/${assetType}`);
}

export async function deleteResponse(appId: string, responseId: string): Promise<void> {
  await client.delete(`/api/applications/${appId}/responses/${responseId}`).json<void>();
}
