import { supabaseAdmin } from '../lib/supabaseAdmin.js';
import { logger } from '../lib/logger.js';
import { notifyNewResponse } from './emailNotificationService.js';
import { fireSubmitCapiEvents } from './formTrackingService.js';

// Re-export tracking utilities so the route can import from a single module
export { isBotRequest, getPublicClientIp, trackEvent, testCapi } from './formTrackingService.js';

// ============================================================================
// Types
// ============================================================================

export interface AnswerItem {
  field_id: string;
  field_type: string;
  field_title: string;
  value: unknown;
}

// ============================================================================
// Form Retrieval
// ============================================================================

export async function getPublishedForm(slug: string) {
  if (!supabaseAdmin) return null;

  const { data: application, error } = await supabaseAdmin
    .from('applications')
    .select('id, title, slug, status, theme_config, settings, response_count, created_at')
    .eq('slug', slug)
    .eq('status', 'published')
    .single();
  if (error || !application) return null;

  const { data: fields, error: fieldsError } = await supabaseAdmin
    .from('application_fields')
    .select('id, position, type, title, description, required, options, conditional_logic')
    .eq('application_id', application.id)
    .order('position', { ascending: true });
  if (fieldsError) throw new Error(fieldsError.message);

  const s = (application.settings ?? {}) as Record<string, unknown>;
  const tracking = s.tracking as Record<string, unknown> | undefined;
  let publicSettings = s;
  if (tracking) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { metaAccessToken: _at, metaTestEventCode: _tc, ...safeTracking } = tracking;
    publicSettings = { ...s, tracking: safeTracking };
  }

  return { application: { ...application, settings: publicSettings }, fields: fields ?? [] };
}

export async function getPreviewForm(slug: string, userId: string) {
  if (!supabaseAdmin) return { notFound: false, forbidden: false, data: null };

  const { data: application, error } = await supabaseAdmin
    .from('applications')
    .select('id, title, slug, status, theme_config, settings, response_count, created_at, user_id')
    .eq('slug', slug)
    .single();

  if (error || !application) return { notFound: true, forbidden: false, data: null };
  if (application.user_id !== userId) return { notFound: false, forbidden: true, data: null };

  const { data: fields, error: fieldsError } = await supabaseAdmin
    .from('application_fields')
    .select('id, position, type, title, description, required, options, conditional_logic')
    .eq('application_id', application.id)
    .order('position', { ascending: true });
  if (fieldsError) throw new Error(fieldsError.message);

  return { notFound: false, forbidden: false, data: { application, fields: fields ?? [], isPreview: true } };
}

// ============================================================================
// Submit Response
// ============================================================================

export async function submitResponse(
  slug: string,
  answers: AnswerItem[],
  metadata: Record<string, unknown>,
  clientIp: string | undefined,
  userAgent: string | undefined,
) {
  if (!supabaseAdmin) throw new Error('Database unavailable');

  const { data: application, error: appError } = await supabaseAdmin
    .from('applications')
    .select('id, status, settings')
    .eq('slug', slug)
    .eq('status', 'published')
    .single();
  if (appError || !application) return { notFound: true, responseId: null };

  const { data: response, error: responseError } = await supabaseAdmin
    .from('application_responses')
    .insert({
      application_id: application.id,
      status: 'complete',
      submitted_at: new Date().toISOString(),
      metadata,
    })
    .select('id')
    .single();
  if (responseError || !response) throw new Error(responseError?.message ?? 'Failed to save response');

  if (answers.length > 0) {
    const answerRows = answers.map((a) => ({
      response_id: response.id,
      field_id: a.field_id,
      field_type: a.field_type,
      field_title: a.field_title,
      value: a.value ?? null,
    }));
    const { error: answersError } = await supabaseAdmin
      .from('application_response_answers')
      .insert(answerRows);
    if (answersError) logger.error('[forms] Failed to insert answers:', answersError.message);
  }

  // Fire CAPI events async (non-blocking)
  fireSubmitCapiEvents(application, answers, metadata, clientIp, userAgent);
  // Fire email notification async (non-blocking)
  fireEmailNotification(slug, response.id, answers);

  return { notFound: false, responseId: response.id };
}

// ============================================================================
// Email Notification (fire-and-forget)
// ============================================================================

function fireEmailNotification(slug: string, responseId: string, answers: AnswerItem[]) {
  (async () => {
    try {
      if (!supabaseAdmin) return;
      const { data: appData } = await supabaseAdmin
        .from('applications')
        .select('id, title, settings, user_id')
        .eq('slug', slug)
        .single();
      if (!appData) return;

      const settings = appData.settings as Record<string, unknown>;
      const notifications = settings?.notifications as Record<string, unknown> | undefined;
      if (!notifications?.emailEnabled) return;

      const { data: { user } } = await supabaseAdmin.auth.admin.getUserById(appData.user_id as string);
      if (!user?.email) return;

      const emailTo = (notifications.emailTo as string) || user.email;
      const emailCc = notifications.emailCc as string | undefined;
      const emailAnswers = answers.map((a) => ({ field_title: a.field_title || 'Campo', value: a.value }));

      await notifyNewResponse({
        to: emailTo, cc: emailCc,
        applicationTitle: appData.title as string,
        applicationId: appData.id as string,
        responseId, answers: emailAnswers,
        submittedAt: new Date().toISOString(),
      });
    } catch (err) { logger.error('[forms] Email notification failed:', err); }
  })();
}
