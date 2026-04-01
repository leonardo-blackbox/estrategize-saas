import { client } from './client.ts';
import type { KnowledgeDocument } from '../types/knowledge.ts';

const API_URL = (import.meta.env.VITE_API_URL as string) || 'http://localhost:3001';

// --- Query keys ---
export const helenaPluginKeys = {
  documents: () => ['helena-plugin', 'documents'] as const,
  config: () => ['helena-plugin', 'config'] as const,
  analytics: () => ['helena-plugin', 'analytics'] as const,
};

// --- Re-export document type ---
export type { KnowledgeDocument };

// --- Knowledge CRUD ---
export async function fetchHelenaDocuments(): Promise<KnowledgeDocument[]> {
  return client.get('/api/admin/plugins/helena/knowledge').json<KnowledgeDocument[]>();
}

export async function uploadHelenaDocument(file: File): Promise<KnowledgeDocument> {
  const { useAuthStore } = await import('../stores/authStore.ts');
  const session = useAuthStore.getState().session;
  const formData = new FormData();
  formData.append('file', file);
  formData.append('scope', 'plugin');
  formData.append('plugin_slug', 'helena');
  const res = await fetch(`${API_URL}/api/admin/plugins/helena/knowledge`, {
    method: 'POST',
    headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {},
    body: formData,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error((body as { error?: string }).error ?? `Upload falhou: ${res.status}`);
  }
  return res.json() as Promise<KnowledgeDocument>;
}

export async function deleteHelenaDocument(id: string): Promise<void> {
  await client.delete(`/api/admin/plugins/helena/knowledge/${id}`).json();
}

// --- Window config ---
export interface HelenaConfig {
  opening_enabled: boolean;
  mid_enabled: boolean;
  closing_enabled: boolean;
  objection_enabled: boolean;
  mid_interval_minutes: number;
}

export async function fetchHelenaConfig(): Promise<HelenaConfig> {
  const raw = await client.get('/api/admin/plugins/helena/config').json<Record<string, unknown>>();
  return {
    opening_enabled: raw['opening_enabled'] !== false,
    mid_enabled: raw['mid_enabled'] !== false,
    closing_enabled: raw['closing_enabled'] !== false,
    objection_enabled: raw['objection_enabled'] !== false,
    mid_interval_minutes: typeof raw['mid_interval_minutes'] === 'number' ? raw['mid_interval_minutes'] : 10,
  };
}

export async function saveHelenaConfig(key: string, value: unknown): Promise<void> {
  await client.put('/api/admin/plugins/helena/config', { json: { key, value } }).json();
}

// --- Tester ---
export interface HelenaTestResult {
  tipo: string;
  sugestao_principal: string;
  frase_sugerida: string | null;
  ponto_atencao: string | null;
  urgencia: string;
}

export async function testHelena(transcript: string): Promise<HelenaTestResult> {
  return client.post('/api/admin/helena/test', { json: { transcript } }).json<HelenaTestResult>();
}

// --- Analytics ---
export interface HelenaAnalytics {
  active_meetings: number;
  reports_generated: number;
  objections_detected: number;
  top_consultoras: Array<{ name: string; count: number }>;
}

export async function fetchHelenaAnalytics(): Promise<HelenaAnalytics | null> {
  try {
    return await client.get('/api/admin/helena/analytics').json<HelenaAnalytics>();
  } catch {
    return null;
  }
}
