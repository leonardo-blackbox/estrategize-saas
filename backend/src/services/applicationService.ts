import { randomUUID } from 'crypto';
import { supabaseAdmin } from '../lib/supabaseAdmin.js';
import { logger } from '../lib/logger.js';

// ─── Types ───────────────────────────────────────────────────────────────────

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
  | 'thank_you'
  | 'image_choice'
  | 'rating'
  | 'opinion_scale'
  | 'yes_no'
  | 'ranking'
  | 'slider';

export type ToolType = 'form' | 'quiz';

export const DEFAULT_THEME = {
  backgroundColor: '#000000',
  questionColor: '#f5f5f7',
  answerColor: '#f5f5f7',
  buttonColor: '#7c5cfc',
  buttonTextColor: '#ffffff',
  fontFamily: 'Inter',
  borderRadius: 12,
  logoPosition: 'left' as const,
};

export const DEFAULT_SETTINGS = {
  limitOneResponsePerSession: false,
  showProgressBar: true,
  showQuestionNumbers: true,
  thankYouTitle: 'Obrigado!',
  thankYouMessage: 'Suas respostas foram recebidas.',
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function ensureDb() {
  if (!supabaseAdmin) throw new Error('Database unavailable');
  return supabaseAdmin;
}

/** Verify ownership and return the application row, or null if not found. */
export async function getOwnedApplication(userId: string, applicationId: string) {
  const db = ensureDb();
  const { data, error } = await db
    .from('applications')
    .select('*')
    .eq('id', applicationId)
    .eq('user_id', userId)
    .single();

  if (error || !data) return null;
  return data;
}

/** Generate a random opaque slug (8 alphanumeric chars) guaranteed unique in the DB. */
async function generateSlug(): Promise<string> {
  const db = ensureDb();
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const randomCode = () =>
    Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');

  for (let i = 0; i < 20; i++) {
    const candidate = randomCode();
    const { data } = await db
      .from('applications')
      .select('id')
      .eq('slug', candidate)
      .maybeSingle();
    if (!data) return candidate;
  }

  throw new Error('Failed to generate unique slug after 20 attempts');
}

// ─── Service Functions ───────────────────────────────────────────────────────

export async function listApplications(userId: string, toolType: ToolType = 'form') {
  const db = ensureDb();

  const { data: applications, error } = await db
    .from('applications')
    .select('*, application_fields(count)')
    .eq('user_id', userId)
    .eq('tool_type', toolType)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);

  const appIds = (applications ?? []).map((a) => a.id);
  const { data: responseCounts } = appIds.length > 0
    ? await db
        .from('application_responses')
        .select('application_id')
        .in('application_id', appIds)
        .eq('status', 'complete')
    : { data: [] };

  const realCountMap: Record<string, number> = {};
  for (const row of responseCounts ?? []) {
    realCountMap[row.application_id] = (realCountMap[row.application_id] ?? 0) + 1;
  }

  return (applications ?? []).map((app) => {
    const raw = app.application_fields as unknown;
    let fieldCount = 0;
    if (Array.isArray(raw) && raw.length > 0 && typeof raw[0].count === 'number') {
      fieldCount = raw[0].count;
    }
    const appWithoutFields = { ...(app as typeof app & {
      application_fields: unknown;
    }) };
    delete appWithoutFields.application_fields;
    const liveCount = realCountMap[app.id] ?? 0;
    return { ...appWithoutFields, field_count: fieldCount, response_count: liveCount };
  });
}

export async function createApplication(
  userId: string,
  input: { title: string },
  toolType: ToolType = 'form',
) {
  const db = ensureDb();
  const slug = await generateSlug();

  const { data: application, error: appError } = await db
    .from('applications')
    .insert({
      user_id: userId,
      title: input.title,
      slug,
      status: 'draft',
      tool_type: toolType,
      theme_config: DEFAULT_THEME,
      settings: DEFAULT_SETTINGS,
      quiz_config: toolType === 'quiz' ? {} : null,
    })
    .select()
    .single();

  if (appError || !application) {
    throw new Error(appError?.message ?? 'Failed to create application');
  }

  const defaultFields = [
    {
      id: randomUUID(),
      application_id: application.id,
      position: 0,
      type: 'welcome' as FieldType,
      title: 'Bem-vindo(a)!',
      required: false,
      options: { buttonText: 'Começar →', description: '' },
      conditional_logic: {},
    },
    {
      id: randomUUID(),
      application_id: application.id,
      position: 9999,
      type: 'thank_you' as FieldType,
      title: 'Obrigado pela resposta!',
      required: false,
      options: {},
      conditional_logic: {},
    },
  ];

  const { error: fieldsError } = await db
    .from('application_fields')
    .insert(defaultFields);

  if (fieldsError) {
    logger.error('[applications] Failed to insert default fields:', fieldsError.message);
  }

  return application;
}

export async function getApplicationById(userId: string, applicationId: string) {
  const db = ensureDb();
  const application = await getOwnedApplication(userId, applicationId);
  if (!application) return null;

  const { data: fields, error: fieldsError } = await db
    .from('application_fields')
    .select('*')
    .eq('application_id', application.id)
    .order('position', { ascending: true });

  if (fieldsError) throw new Error(fieldsError.message);

  return { ...application, fields: fields ?? [] };
}

export async function updateApplication(
  userId: string,
  applicationId: string,
  updates: Record<string, unknown>,
) {
  const db = ensureDb();
  const existing = await getOwnedApplication(userId, applicationId);
  if (!existing) return null;

  const { data: updated, error } = await db
    .from('applications')
    .update(updates)
    .eq('id', applicationId)
    .eq('user_id', userId)
    .select()
    .single();

  if (error || !updated) throw new Error(error?.message ?? 'Update failed');
  return updated;
}

export async function deleteApplication(userId: string, applicationId: string) {
  const db = ensureDb();
  const existing = await getOwnedApplication(userId, applicationId);
  if (!existing) return null;

  if (existing.status === 'archived') {
    const { data: responseIds } = await db
      .from('application_responses')
      .select('id')
      .eq('application_id', applicationId);

    if (responseIds && responseIds.length > 0) {
      const ids = responseIds.map((r: { id: string }) => r.id);
      await db.from('application_response_answers').delete().in('response_id', ids);
    }

    await db.from('application_responses').delete().eq('application_id', applicationId);
    await db.from('application_events').delete().eq('application_id', applicationId);
    await db.from('application_fields').delete().eq('application_id', applicationId);

    const { error } = await db
      .from('applications')
      .delete()
      .eq('id', applicationId)
      .eq('user_id', userId);

    if (error) throw new Error(error.message);
  } else {
    const { error } = await db
      .from('applications')
      .update({ status: 'archived' })
      .eq('id', applicationId)
      .eq('user_id', userId);

    if (error) throw new Error(error.message);
  }

  return { ok: true };
}

export async function duplicateApplication(userId: string, applicationId: string) {
  const db = ensureDb();
  const source = await getOwnedApplication(userId, applicationId);
  if (!source) return null;

  const newTitle = `Cópia de ${source.title}`;
  const newSlug = await generateSlug();

  const { data: copy, error: copyError } = await db
    .from('applications')
    .insert({
      user_id: userId,
      title: newTitle,
      slug: newSlug,
      status: 'draft',
      tool_type: source.tool_type ?? 'form',
      theme_config: source.theme_config,
      settings: source.settings,
      quiz_config: source.quiz_config ?? null,
    })
    .select()
    .single();

  if (copyError || !copy) throw new Error(copyError?.message ?? 'Duplication failed');

  const { data: sourceFields, error: fieldsReadError } = await db
    .from('application_fields')
    .select('*')
    .eq('application_id', applicationId)
    .order('position', { ascending: true });

  if (fieldsReadError) throw new Error(fieldsReadError.message);

  if (sourceFields && sourceFields.length > 0) {
    const fieldCopies = sourceFields.map((f) => ({
      id: randomUUID(),
      application_id: copy.id,
      position: f.position,
      type: f.type,
      title: f.title,
      description: f.description,
      required: f.required,
      options: f.options,
      conditional_logic: f.conditional_logic,
    }));

    const { error: fieldsInsertError } = await db
      .from('application_fields')
      .insert(fieldCopies);

    if (fieldsInsertError) {
      logger.error('[applications] Duplicate fields error:', fieldsInsertError.message);
    }
  }

  return copy;
}

interface FieldInput {
  id?: string;
  type: FieldType;
  title: string;
  description?: string;
  required: boolean;
  options?: unknown;
  conditional_logic?: unknown;
}

export async function bulkReplaceFields(
  userId: string,
  applicationId: string,
  fields: FieldInput[],
) {
  const db = ensureDb();
  const existing = await getOwnedApplication(userId, applicationId);
  if (!existing) return null;

  const { error: deleteError } = await db
    .from('application_fields')
    .delete()
    .eq('application_id', applicationId);

  if (deleteError) throw new Error(deleteError.message);

  if (fields.length === 0) return [];

  const newFields = fields.map((f, index) => ({
    id: f.id ?? randomUUID(),
    application_id: applicationId,
    position: index * 10,
    type: f.type,
    title: f.title,
    description: f.description ?? null,
    required: f.required,
    options: f.options ?? [],
    conditional_logic: f.conditional_logic ?? {},
  }));

  const { data: inserted, error: insertError } = await db
    .from('application_fields')
    .insert(newFields)
    .select();

  if (insertError) throw new Error(insertError.message);

  return inserted ?? [];
}

export async function listResponses(
  userId: string,
  applicationId: string,
  page: number,
  limit: number,
) {
  const db = ensureDb();
  const existing = await getOwnedApplication(userId, applicationId);
  if (!existing) return null;

  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const { data: responses, error, count } = await db
    .from('application_responses')
    .select(
      `
      *,
      answers:application_response_answers (field_id, field_type, field_title, value)
      `,
      { count: 'exact' },
    )
    .eq('application_id', applicationId)
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error) throw new Error(error.message);

  return {
    responses: responses ?? [],
    pagination: {
      page,
      limit,
      total: count ?? 0,
      pages: Math.ceil((count ?? 0) / limit),
    },
  };
}

export async function exportResponses(userId: string, applicationId: string) {
  const db = ensureDb();
  const existing = await getOwnedApplication(userId, applicationId);
  if (!existing) return null;

  const { data: responses, error } = await db
    .from('application_responses')
    .select(
      `
      *,
      answers:application_response_answers (field_id, field_type, field_title, value)
      `,
    )
    .eq('application_id', applicationId)
    .eq('status', 'complete')
    .order('submitted_at', { ascending: false });

  if (error) throw new Error(error.message);

  return responses ?? [];
}

export async function deleteResponse(
  userId: string,
  applicationId: string,
  responseId: string,
) {
  const db = ensureDb();
  const existing = await getOwnedApplication(userId, applicationId);
  if (!existing) return null;

  const { data: responseRow, error: fetchError } = await db
    .from('application_responses')
    .select('id')
    .eq('id', responseId)
    .eq('application_id', applicationId)
    .single();

  if (fetchError || !responseRow) {
    return { found: false };
  }

  await db
    .from('application_response_answers')
    .delete()
    .eq('response_id', responseId);

  const { error } = await db
    .from('application_responses')
    .delete()
    .eq('id', responseId)
    .eq('application_id', applicationId);

  if (error) throw new Error(error.message);

  const { count } = await db
    .from('application_responses')
    .select('id', { count: 'exact', head: true })
    .eq('application_id', applicationId)
    .eq('status', 'completed');

  await db
    .from('applications')
    .update({ response_count: count ?? 0 })
    .eq('id', applicationId);

  return { found: true, ok: true };
}
