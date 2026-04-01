import { supabaseAdmin } from '../lib/supabaseAdmin.js';

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

export async function listPlugins(): Promise<Plugin[]> {
  const { data, error } = await supabaseAdmin!
    .from('plugins')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  if (error) throw error;
  return (data ?? []) as Plugin[];
}

export async function listConsultancyPlugins(
  userId: string,
  consultancyId: string,
): Promise<ConsultancyPlugin[]> {
  const { data: consultancy } = await supabaseAdmin!
    .from('consultancies')
    .select('id')
    .eq('id', consultancyId)
    .eq('user_id', userId)
    .single();

  if (!consultancy) throw new Error('Consultancy not found or access denied');

  const { data, error } = await supabaseAdmin!
    .from('consultancy_plugins')
    .select('*, plugin:plugins(*)')
    .eq('consultancy_id', consultancyId)
    .eq('is_active', true);

  if (error) throw error;
  return (data ?? []) as ConsultancyPlugin[];
}

export async function installPlugin(
  userId: string,
  consultancyId: string,
  pluginSlug: string,
): Promise<ConsultancyPlugin> {
  const { data: consultancy } = await supabaseAdmin!
    .from('consultancies')
    .select('id')
    .eq('id', consultancyId)
    .eq('user_id', userId)
    .single();

  if (!consultancy) throw new Error('Consultancy not found or access denied');

  const { data: plugin } = await supabaseAdmin!
    .from('plugins')
    .select('slug')
    .eq('slug', pluginSlug)
    .eq('is_active', true)
    .single();

  if (!plugin) throw new Error('Plugin not found');

  const { data, error } = await supabaseAdmin!
    .from('consultancy_plugins')
    .upsert(
      {
        consultancy_id: consultancyId,
        plugin_slug: pluginSlug,
        installed_by: userId,
        is_active: true,
      },
      { onConflict: 'consultancy_id,plugin_slug' },
    )
    .select()
    .single();

  if (error) throw error;
  return data as ConsultancyPlugin;
}

export async function uninstallPlugin(
  userId: string,
  consultancyId: string,
  pluginSlug: string,
): Promise<void> {
  const { data: consultancy } = await supabaseAdmin!
    .from('consultancies')
    .select('id')
    .eq('id', consultancyId)
    .eq('user_id', userId)
    .single();

  if (!consultancy) throw new Error('Consultancy not found or access denied');

  const { error } = await supabaseAdmin!
    .from('consultancy_plugins')
    .update({ is_active: false })
    .eq('consultancy_id', consultancyId)
    .eq('plugin_slug', pluginSlug);

  if (error) throw error;
}
