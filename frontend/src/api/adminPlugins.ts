import { client } from './client.ts';

export interface AdminPlugin {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  icon: string | null;
  category: string;
  is_free: boolean;
  price_type: 'credit' | 'subscription' | 'one_time' | null;
  price_amount: number;
  features: string[];
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

export const adminPluginKeys = {
  all: () => ['admin-plugins'] as const,
  config: (slug: string) => ['admin-plugins', 'config', slug] as const,
};

export async function fetchAdminPlugins(): Promise<AdminPlugin[]> {
  return client.get('/api/admin/plugins').json<AdminPlugin[]>();
}

export async function fetchPluginConfig(slug: string): Promise<Record<string, unknown>> {
  return client.get(`/api/admin/plugins/${slug}/config`).json<Record<string, unknown>>();
}

export async function savePluginConfig(slug: string, key: string, value: unknown): Promise<void> {
  await client.put(`/api/admin/plugins/${slug}/config`, { json: { key, value } }).json();
}
