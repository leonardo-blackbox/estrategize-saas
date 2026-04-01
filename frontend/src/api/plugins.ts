import { client } from './client.ts';

export interface Plugin {
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

export interface ConsultancyPlugin {
  id: string;
  consultancy_id: string;
  plugin_slug: string;
  installed_by: string;
  installed_at: string;
  is_active: boolean;
  plugin?: Plugin;
}

export const pluginKeys = {
  catalog: () => ['plugins', 'catalog'] as const,
  byConsultancy: (consultancyId: string) => ['plugins', 'consultancy', consultancyId] as const,
};

export async function fetchPluginCatalog(): Promise<Plugin[]> {
  const res = await client.get('/api/plugins').json<{ plugins: Plugin[] }>();
  return res.plugins;
}

export async function fetchConsultancyPlugins(consultancyId: string): Promise<ConsultancyPlugin[]> {
  const res = await client
    .get(`/api/plugins/consultancy/${consultancyId}`)
    .json<{ plugins: ConsultancyPlugin[] }>();
  return res.plugins;
}

export async function installPluginApi(
  consultancyId: string,
  slug: string,
): Promise<ConsultancyPlugin> {
  const res = await client
    .post(`/api/plugins/consultancy/${consultancyId}/install`, { json: { slug } })
    .json<{ plugin: ConsultancyPlugin }>();
  return res.plugin;
}

export async function uninstallPluginApi(
  consultancyId: string,
  slug: string,
): Promise<void> {
  await client.delete(`/api/plugins/consultancy/${consultancyId}/${slug}`).json();
}
