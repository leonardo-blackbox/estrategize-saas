import { client } from './client.ts';
import type { KnowledgeDocument, KnowledgeTestResult } from '../types/knowledge.ts';

const API_URL = (import.meta.env.VITE_API_URL as string) || 'http://localhost:3001';

export async function adminListDocuments(): Promise<KnowledgeDocument[]> {
  return client.get('/api/admin/knowledge').json<KnowledgeDocument[]>();
}

export async function adminUploadDocument(file: File): Promise<KnowledgeDocument> {
  const { useAuthStore } = await import('../stores/authStore.ts');
  const session = useAuthStore.getState().session;

  const formData = new FormData();
  formData.append('file', file);
  formData.append('scope', 'global');

  const res = await fetch(`${API_URL}/api/admin/knowledge`, {
    method: 'POST',
    headers: session?.access_token
      ? { Authorization: `Bearer ${session.access_token}` }
      : {},
    body: formData,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error((body as { error?: string }).error ?? `Upload falhou: ${res.status}`);
  }

  return res.json() as Promise<KnowledgeDocument>;
}

export async function adminDeleteDocument(id: string): Promise<void> {
  return client.delete(`/api/admin/knowledge/${id}`).json<void>();
}

export async function adminTestQuery(query: string): Promise<KnowledgeTestResult> {
  return client.post('/api/admin/knowledge/test', { json: { query } }).json<KnowledgeTestResult>();
}
