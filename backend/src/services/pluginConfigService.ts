import { supabaseAdmin } from '../lib/supabaseAdmin.js';
import type { Plugin } from './pluginService.js';

// ============================================================================
// getConfig
// ============================================================================

export async function getConfig(slug: string, key: string): Promise<unknown | null> {
  const { data, error } = await supabaseAdmin!
    .from('plugin_configs')
    .select('config_value')
    .eq('plugin_slug', slug)
    .eq('config_key', key)
    .eq('scope', 'global')
    .maybeSingle();

  if (error) throw error;
  return data?.config_value ?? null;
}

// ============================================================================
// setConfig
// ============================================================================

export async function setConfig(slug: string, key: string, value: unknown): Promise<void> {
  const { error } = await supabaseAdmin!
    .from('plugin_configs')
    .upsert(
      {
        plugin_slug: slug,
        config_key: key,
        config_value: value,
        scope: 'global',
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'plugin_slug,config_key,scope' },
    );

  if (error) throw error;
}

// ============================================================================
// getAllConfig
// ============================================================================

export async function getAllConfig(slug: string): Promise<Record<string, unknown>> {
  const { data, error } = await supabaseAdmin!
    .from('plugin_configs')
    .select('config_key, config_value')
    .eq('plugin_slug', slug)
    .eq('scope', 'global');

  if (error) throw error;

  return (data ?? []).reduce<Record<string, unknown>>((acc, row) => {
    acc[row.config_key] = row.config_value;
    return acc;
  }, {});
}

// ============================================================================
// listAllPlugins
// ============================================================================

export async function listAllPlugins(): Promise<Plugin[]> {
  const { data, error } = await supabaseAdmin!
    .from('plugins')
    .select('*')
    .order('sort_order', { ascending: true });

  if (error) throw error;
  return (data ?? []) as Plugin[];
}
