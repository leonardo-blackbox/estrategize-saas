import { client } from '../../../api/client.ts';

export interface CentralPageSummary {
  id: string;
  consultancy_id: string;
  parent_id: string | null;
  title: string;
  emoji: string | null;
  position: number;
  template_key: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface CentralPage extends CentralPageSummary {
  blocks: unknown; // ProseMirror doc JSON
}

export interface CentralTemplateInfo {
  key: string;
  icon: string;
  name: string;
  description: string;
  pageCount: number;
}

export interface CreatePagePayload {
  title?: string;
  emoji?: string | null;
  parent_id?: string | null;
  blocks?: unknown;
}

export interface UpdatePagePayload {
  title?: string;
  emoji?: string | null;
  parent_id?: string | null;
  blocks?: unknown;
  position?: number;
}

export interface ReorderItem {
  id: string;
  parent_id: string | null;
  position: number;
}

const base = (cid: string) => `/api/consultancies/${cid}/central`;

export const centralApi = {
  list: (consultancyId: string) =>
    client.get(`${base(consultancyId)}/pages`).json<CentralPageSummary[]>(),

  get: (consultancyId: string, pageId: string) =>
    client.get(`${base(consultancyId)}/pages/${pageId}`).json<CentralPage>(),

  create: (consultancyId: string, payload: CreatePagePayload) =>
    client.post(`${base(consultancyId)}/pages`, { json: payload }).json<CentralPage>(),

  update: (consultancyId: string, pageId: string, payload: UpdatePagePayload) =>
    client.patch(`${base(consultancyId)}/pages/${pageId}`, { json: payload }).json<CentralPage>(),

  remove: (consultancyId: string, pageId: string) =>
    client.delete(`${base(consultancyId)}/pages/${pageId}`).json<void>(),

  reorder: (consultancyId: string, items: ReorderItem[]) =>
    client.post(`${base(consultancyId)}/pages/reorder`, { json: { items } }).json<void>(),

  templates: (consultancyId: string) =>
    client.get(`${base(consultancyId)}/templates`).json<CentralTemplateInfo[]>(),

  applyTemplate: (consultancyId: string, key: string) =>
    client.post(`${base(consultancyId)}/templates/${key}/apply`, {}).json<CentralPage[]>(),
};
