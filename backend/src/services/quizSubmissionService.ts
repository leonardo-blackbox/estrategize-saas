import { supabaseAdmin } from '../lib/supabaseAdmin.js';
import { logger } from '../lib/logger.js';
import { notifyNewResponse } from './emailNotificationService.js';
import { buildUserData, sendCapiEvent } from './metaCapiService.js';
import { fireServerMetaPixel, getTracking } from './formTrackingService.js';
import type { QuizOutcome } from './quizService.js';
export interface AnswerItem {
  field_id: string;
  field_type: string;
  field_title: string;
  value: unknown;
}
export interface QuizField {
  id: string;
  position: number;
  type: string;
  title: string;
  description: string | null;
  required: boolean;
  options: unknown;
  conditional_logic: unknown;
}
interface QuizApplication {
  id: string;
  user_id?: string;
  title: string;
  slug: string;
  status: string;
  tool_type: string;
  theme_config: unknown;
  settings: unknown;
  quiz_config: unknown;
  response_count: number;
  created_at: string;
}
function ensureDb() {
  if (!supabaseAdmin) throw new Error('Database unavailable');
  return supabaseAdmin;
}
function sanitizeSettings(settings: unknown) {
  const source = (settings ?? {}) as Record<string, unknown>;
  const tracking = source.tracking as Record<string, unknown> | undefined;
  if (!tracking) return source;
  const { metaAccessToken: _token, metaTestEventCode: _test, ...safeTracking } = tracking;
  void _token; void _test;
  return { ...source, tracking: safeTracking };
}
async function readQuiz(slug: string, publishedOnly: boolean) {
  const db = ensureDb();
  let query = db.from('applications').select('*').eq('slug', slug).eq('tool_type', 'quiz');
  if (publishedOnly) query = query.eq('status', 'published');
  const { data: application, error } = await query.single();
  if (error || !application) return null;
  const { data: fields, error: fieldsError } = await db
    .from('application_fields').select('*').eq('application_id', application.id)
    .order('position', { ascending: true });
  if (fieldsError) throw new Error(fieldsError.message);
  const { data: outcomes, error: outcomesError } = await db
    .from('quiz_outcomes').select('*').eq('application_id', application.id)
    .order('order', { ascending: true });
  if (outcomesError) throw new Error(outcomesError.message);
  const safeApplication = { ...application, settings: sanitizeSettings(application.settings) };
  return { application: safeApplication as QuizApplication, fields: (fields ?? []) as QuizField[], outcomes: (outcomes ?? []) as QuizOutcome[] };
}
export async function getPublishedQuiz(slug: string) {
  return readQuiz(slug, true);
}
export async function getPreviewQuiz(slug: string, userId: string) {
  const data = await readQuiz(slug, false);
  if (!data) return { notFound: true, forbidden: false, data: null };
  if (data.application.user_id !== userId) return { notFound: false, forbidden: true, data: null };
  return { notFound: false, forbidden: false, data: { ...data, isPreview: true } };
}
function scoreFromChoices(field: QuizField, value: unknown) {
  const options = (field.options ?? {}) as { choices?: Array<{ value: unknown; scoreValue?: number }> };
  const choices = options.choices?.filter((choice) => typeof choice.scoreValue === 'number') ?? [];
  if (choices.length === 0) return { earned: 0, max: 0 };
  const values = Array.isArray(value) ? value : [value];
  const earned = choices
    .filter((choice) => values.includes(choice.value))
    .reduce((sum, choice) => sum + (choice.scoreValue ?? 0), 0);
  const max = Math.max(...choices.map((choice) => choice.scoreValue ?? 0));
  return { earned, max };
}
function scoreFromYesNo(field: QuizField, value: unknown) {
  const options = (field.options ?? {}) as { yesScoreValue?: number; noScoreValue?: number };
  if (typeof options.yesScoreValue !== 'number' && typeof options.noScoreValue !== 'number') return { earned: 0, max: 0 };
  const yes = options.yesScoreValue ?? 0;
  const no = options.noScoreValue ?? 0;
  const normalized = String(value).toLowerCase();
  const earned = normalized === 'yes' || normalized === 'true' || normalized === 'sim' ? yes : no;
  return { earned, max: Math.max(yes, no) };
}
export function calculateQuizScore(fields: QuizField[], answers: AnswerItem[]): number {
  const fieldMap = new Map(fields.map((field) => [field.id, field]));
  let earned = 0;
  let max = 0;
  for (const answer of answers) {
    const field = fieldMap.get(answer.field_id);
    if (!field) continue;
    const result = field.type === 'yes_no' ? scoreFromYesNo(field, answer.value) : scoreFromChoices(field, answer.value);
    earned += result.earned;
    max += result.max;
  }
  return max > 0 ? Math.round((earned / max) * 100) : 0;
}
export function getOutcomeByScore(outcomes: QuizOutcome[], score: number): QuizOutcome | null {
  return outcomes.find((outcome) => outcome.score_min <= score && score <= outcome.score_max) ?? null;
}
function extractUserData(answers: AnswerItem[], meta: Record<string, unknown>, ip?: string, userAgent?: string) {
  const email = answers.find((answer) => answer.field_type === 'email')?.value;
  const phone = answers.find((answer) => answer.field_type === 'phone')?.value;
  const name = answers.find((answer) => answer.field_type === 'name')?.value;
  const parts = typeof name === 'string' ? name.trim().split(/\s+/) : [];
  return buildUserData({
    email: typeof email === 'string' ? email : undefined,
    phone: typeof phone === 'string' ? phone : undefined,
    firstName: parts[0],
    lastName: parts.length > 1 ? parts.slice(1).join(' ') : undefined,
    fbc: typeof meta.fbc === 'string' ? meta.fbc : undefined,
    fbp: typeof meta.fbp === 'string' ? meta.fbp : undefined,
    ip,
    userAgent,
  });
}
function fireCapi(application: QuizApplication, eventName: string, answers: AnswerItem[], meta: Record<string, unknown>, customData?: Record<string, unknown>, ip?: string, userAgent?: string) {
  const tracking = getTracking(application.settings as Record<string, unknown> | null);
  if (!tracking?.metaPixelActive || !tracking.metaPixelId) return;
  const eventId = typeof meta.event_id === 'string' ? `${meta.event_id}-${eventName.toLowerCase()}` : undefined;
  if (tracking.metaAccessToken) {
    sendCapiEvent({ pixelId: tracking.metaPixelId, accessToken: tracking.metaAccessToken, eventName, eventId,
      eventSourceUrl: typeof meta.page_url === 'string' ? meta.page_url : undefined,
      userData: extractUserData(answers, meta, ip, userAgent), customData, testEventCode: tracking.metaTestEventCode });
  } else {
    fireServerMetaPixel(tracking.metaPixelId, eventName);
  }
}
export function fireQuizSubmitCapiEvents(application: QuizApplication, score: number, outcome: QuizOutcome | null, answers: AnswerItem[], meta: Record<string, unknown>, ip?: string, userAgent?: string) {
  const customData = { quiz_score: score, quiz_outcome: outcome?.outcome_key ?? null };
  fireCapi(application, 'SubmitApplication', answers, meta, customData, ip, userAgent);
  if (outcome?.pixel_event_name) fireCapi(application, outcome.pixel_event_name, answers, meta, customData, ip, userAgent);
}
export async function fireQuizLeadEvent(slug: string, answers: AnswerItem[], meta: Record<string, unknown>, ip?: string, userAgent?: string) {
  const quiz = await readQuiz(slug, true);
  if (!quiz) return;
  fireCapi(quiz.application, 'Lead', answers, meta, undefined, ip, userAgent);
}
export async function trackQuizEvent(slug: string, eventType: 'view' | 'start' | 'submit', meta: Record<string, unknown>, ip?: string, userAgent?: string) {
  const quiz = await readQuiz(slug, true);
  if (!quiz) return;
  await ensureDb().from('application_events').insert({ application_id: quiz.application.id, event_type: eventType, session_token: meta.session_token ?? null });
  if (eventType === 'view') fireCapi(quiz.application, 'ViewContent', [], meta, undefined, ip, userAgent);
  if (eventType === 'start') fireCapi(quiz.application, 'QuizStarted', [], meta, undefined, ip, userAgent);
}
function fireEmailNotification(slug: string, responseId: string, answers: AnswerItem[]) {
  (async () => {
    try {
      const db = ensureDb();
      const { data: app } = await db.from('applications').select('id, title, settings, user_id').eq('slug', slug).single();
      const notifications = (app?.settings as Record<string, unknown> | undefined)?.notifications as Record<string, unknown> | undefined;
      if (!app || !notifications?.emailEnabled) return;
      const { data: { user } } = await db.auth.admin.getUserById(app.user_id as string);
      const to = (notifications.emailTo as string | undefined) || user?.email;
      if (!to) return;
      await notifyNewResponse({ to, cc: notifications.emailCc as string | undefined, applicationTitle: app.title as string,
        applicationId: app.id as string, responseId, answers, submittedAt: new Date().toISOString() });
    } catch (err) { logger.error('[quiz] Email notification failed:', err); }
  })();
}
export async function submitQuizResponse(slug: string, answers: AnswerItem[], metadata: Record<string, unknown>, ip?: string, userAgent?: string) {
  const quiz = await readQuiz(slug, true);
  if (!quiz) return { notFound: true, responseId: null, score: 0, outcome: null };
  const score = calculateQuizScore(quiz.fields, answers);
  const outcome = getOutcomeByScore(quiz.outcomes, score);
  const responseMetadata = { ...metadata, score, outcomeKey: outcome?.outcome_key ?? null };
  const { data: response, error } = await ensureDb().from('application_responses').insert({
    application_id: quiz.application.id, status: 'complete', submitted_at: new Date().toISOString(), metadata: responseMetadata,
  }).select('id').single();
  if (error || !response) throw new Error(error?.message ?? 'Failed to save response');
  if (answers.length > 0) await ensureDb().from('application_response_answers').insert(answers.map((answer) => ({ response_id: response.id, ...answer, value: answer.value ?? null })));
  fireQuizSubmitCapiEvents(quiz.application, score, outcome, answers, metadata, ip, userAgent);
  fireEmailNotification(slug, response.id, answers);
  return { notFound: false, responseId: response.id as string, score, outcome };
}
