import { supabaseAdmin } from '../lib/supabaseAdmin.js';
import type { CentralTemplateKey } from './centralTemplates.js';
import { IRIS_TEMPLATES } from './centralTemplates.js';

export interface CentralPageRow {
  id: string;
  consultancy_id: string;
  parent_id: string | null;
  title: string;
  emoji: string | null;
  position: number;
  blocks: unknown;
  template_key: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export type CentralPageSummary = Omit<CentralPageRow, 'blocks'>;

const EMPTY_DOC = { type: 'doc', content: [{ type: 'paragraph' }] };

function ensureClient() {
  if (!supabaseAdmin) throw new Error('Database service unavailable');
  return supabaseAdmin;
}

export async function listPages(consultancyId: string): Promise<CentralPageSummary[]> {
  const supabase = ensureClient();
  const { data, error } = await supabase
    .from('central_pages')
    .select('id, consultancy_id, parent_id, title, emoji, position, template_key, created_by, created_at, updated_at')
    .eq('consultancy_id', consultancyId)
    .order('parent_id', { ascending: true, nullsFirst: true })
    .order('position', { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as CentralPageSummary[];
}

export async function getPage(pageId: string, consultancyId: string): Promise<CentralPageRow | null> {
  const supabase = ensureClient();
  const { data, error } = await supabase
    .from('central_pages')
    .select('*')
    .eq('id', pageId)
    .eq('consultancy_id', consultancyId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data as CentralPageRow | null) ?? null;
}

interface CreatePageInput {
  consultancyId: string;
  userId: string;
  title?: string;
  emoji?: string | null;
  parentId?: string | null;
  templateKey?: string | null;
  blocks?: unknown;
}

async function nextPosition(consultancyId: string, parentId: string | null): Promise<number> {
  const supabase = ensureClient();
  const query = supabase
    .from('central_pages')
    .select('position')
    .eq('consultancy_id', consultancyId);
  const filtered = parentId ? query.eq('parent_id', parentId) : query.is('parent_id', null);
  const { data, error } = await filtered.order('position', { ascending: false }).limit(1).maybeSingle();
  if (error) throw new Error(error.message);
  return ((data?.position ?? -1) as number) + 1;
}

export async function createPage(input: CreatePageInput): Promise<CentralPageRow> {
  const supabase = ensureClient();
  const position = await nextPosition(input.consultancyId, input.parentId ?? null);
  const { data, error } = await supabase
    .from('central_pages')
    .insert({
      consultancy_id: input.consultancyId,
      parent_id: input.parentId ?? null,
      title: input.title ?? 'Sem título',
      emoji: input.emoji ?? null,
      position,
      blocks: input.blocks ?? EMPTY_DOC,
      template_key: input.templateKey ?? null,
      created_by: input.userId,
    })
    .select()
    .single();
  if (error || !data) throw new Error(error?.message ?? 'Failed to create page');
  return data as CentralPageRow;
}

interface UpdatePageInput {
  title?: string;
  emoji?: string | null;
  blocks?: unknown;
  parentId?: string | null;
  position?: number;
}

export async function updatePage(
  pageId: string,
  consultancyId: string,
  patch: UpdatePageInput,
): Promise<CentralPageRow> {
  const supabase = ensureClient();
  const updates: Record<string, unknown> = {};
  if (patch.title !== undefined) updates['title'] = patch.title;
  if (patch.emoji !== undefined) updates['emoji'] = patch.emoji;
  if (patch.blocks !== undefined) updates['blocks'] = patch.blocks;
  if (patch.parentId !== undefined) updates['parent_id'] = patch.parentId;
  if (patch.position !== undefined) updates['position'] = patch.position;

  const { data, error } = await supabase
    .from('central_pages')
    .update(updates)
    .eq('id', pageId)
    .eq('consultancy_id', consultancyId)
    .select()
    .single();
  if (error || !data) throw new Error(error?.message ?? 'Failed to update page');
  return data as CentralPageRow;
}

export async function deletePage(pageId: string, consultancyId: string): Promise<void> {
  const supabase = ensureClient();
  const { error } = await supabase
    .from('central_pages')
    .delete()
    .eq('id', pageId)
    .eq('consultancy_id', consultancyId);
  if (error) throw new Error(error.message);
}

export interface ReorderInput { id: string; parentId: string | null; position: number }

export async function reorderPages(consultancyId: string, items: ReorderInput[]): Promise<void> {
  const supabase = ensureClient();
  // Sequential updates — Postgres lacks bulk update with different values per row trivially via supabase-js
  for (const item of items) {
    const { error } = await supabase
      .from('central_pages')
      .update({ parent_id: item.parentId, position: item.position })
      .eq('id', item.id)
      .eq('consultancy_id', consultancyId);
    if (error) throw new Error(error.message);
  }
}

export async function applyTemplate(
  consultancyId: string,
  userId: string,
  templateKey: CentralTemplateKey,
): Promise<CentralPageRow[]> {
  const template = IRIS_TEMPLATES.find((t) => t.key === templateKey);
  if (!template) throw new Error(`Template not found: ${templateKey}`);

  const created: CentralPageRow[] = [];
  const idByIndex: Record<number, string> = {};

  for (let i = 0; i < template.pages.length; i++) {
    const page = template.pages[i];
    const parentId = page.parentIndex !== undefined ? idByIndex[page.parentIndex] ?? null : null;
    const row = await createPage({
      consultancyId,
      userId,
      title: page.title,
      emoji: page.emoji ?? null,
      parentId,
      templateKey,
      blocks: page.blocks,
    });
    idByIndex[i] = row.id;
    created.push(row);
  }
  return created;
}
