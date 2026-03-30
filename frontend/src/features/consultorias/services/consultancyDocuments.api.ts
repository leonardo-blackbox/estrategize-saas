import { client } from '../../../api/client.ts';
import { useAuthStore } from '../../../stores/authStore.ts';

const API_URL = (import.meta.env.VITE_API_URL as string) || 'http://localhost:3001';

export interface KnowledgeDocument {
  id: string;
  user_id: string;
  scope: string;
  consultancy_id: string | null;
  name: string;
  file_type: string;
  file_size_bytes: number;
  chunk_count: number;
  status: 'processing' | 'ready' | 'error';
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

export async function listConsultancyDocs(consultancyId: string): Promise<KnowledgeDocument[]> {
  return client.get(`/api/consultancies/${consultancyId}/documents`).json<KnowledgeDocument[]>();
}

export async function uploadConsultancyDoc(consultancyId: string, file: File): Promise<KnowledgeDocument> {
  const session = useAuthStore.getState().session;
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(`${API_URL}/api/consultancies/${consultancyId}/documents`, {
    method: 'POST',
    headers: {
      ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
    },
    body: formData,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error((body as { error?: string }).error ?? `Upload failed: ${res.status}`);
  }

  return res.json() as Promise<KnowledgeDocument>;
}

export async function deleteConsultancyDoc(consultancyId: string, docId: string): Promise<void> {
  return client.delete(`/api/consultancies/${consultancyId}/documents/${docId}`).json<void>();
}
