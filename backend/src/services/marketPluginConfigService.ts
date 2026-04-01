import { z } from 'zod';
import { supabaseAdmin } from '../lib/supabaseAdmin.js';
import type { PesquisaMercadoConfig } from '../types/marketIntelligence.js';

// ============================================================================
// Default config
// ============================================================================

export const DEFAULT_PESQUISA_MERCADO_CONFIG: PesquisaMercadoConfig = {
  enabled: true,
  instagram_scan_enabled: true,
  instagram_posts_count: 12,
  instagram_engagement_rate: true,
  instagram_posting_frequency: true,
  instagram_hashtag_analysis: false,
  instagram_content_breakdown: true,
  discovery_sources: ['google_maps'],
  max_competitors_discover: 10,
  max_competitors_instagram: 5,
  include_competitor_websites: true,
  max_websites_scrape: 5,
  report_language: 'pt-BR',
  report_style: 'detailed',
  report_sections: {
    market_overview: true,
    competitor_analysis: true,
    social_media_analysis: true,
    digital_presence: true,
    opportunities: true,
    threats: true,
    positioning: true,
    action_plan: true,
  },
  custom_system_prompt: null,
  ai_temperature: 0.5,
  auto_index_rag: true,
  rag_context_tag: 'pesquisa-mercado',
  include_raw_data_in_rag: false,
  credits_cost_basic: 0,
  credits_cost_deep: 5,
  free_first_research: true,
};

// ============================================================================
// Zod Schema
// ============================================================================

export const pesquisaMercadoConfigSchema = z.object({
  enabled: z.boolean(),
  instagram_scan_enabled: z.boolean(),
  instagram_posts_count: z.union([
    z.literal(6),
    z.literal(12),
    z.literal(24),
    z.literal(48),
  ]),
  instagram_engagement_rate: z.boolean(),
  instagram_posting_frequency: z.boolean(),
  instagram_hashtag_analysis: z.boolean(),
  instagram_content_breakdown: z.boolean(),
  discovery_sources: z
    .array(z.enum(['google_maps', 'instagram_search']))
    .min(1),
  max_competitors_discover: z.union([
    z.literal(5),
    z.literal(10),
    z.literal(20),
    z.literal(50),
  ]),
  max_competitors_instagram: z.union([
    z.literal(3),
    z.literal(5),
    z.literal(10),
    z.literal(20),
  ]),
  include_competitor_websites: z.boolean(),
  max_websites_scrape: z.union([
    z.literal(3),
    z.literal(5),
    z.literal(10),
  ]),
  report_language: z.enum(['pt-BR', 'en']),
  report_style: z.enum(['executive', 'detailed', 'action-focused']),
  report_sections: z.object({
    market_overview: z.boolean(),
    competitor_analysis: z.boolean(),
    social_media_analysis: z.boolean(),
    digital_presence: z.boolean(),
    opportunities: z.boolean(),
    threats: z.boolean(),
    positioning: z.boolean(),
    action_plan: z.boolean(),
  }),
  custom_system_prompt: z.string().max(3000).nullable(),
  ai_temperature: z.union([
    z.literal(0.3),
    z.literal(0.5),
    z.literal(0.7),
  ]),
  auto_index_rag: z.boolean(),
  rag_context_tag: z.string().min(1).max(100),
  include_raw_data_in_rag: z.boolean(),
  credits_cost_basic: z.number().int().min(0).max(100),
  credits_cost_deep: z.number().int().min(0).max(100),
  free_first_research: z.boolean(),
});

// ============================================================================
// In-memory cache
// ============================================================================

interface CacheEntry {
  value: PesquisaMercadoConfig;
  expiresAt: number;
}

let cache: CacheEntry | null = null;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

function invalidateCache(): void {
  cache = null;
}

// ============================================================================
// getConfig
// ============================================================================

export async function getConfig(slug: string): Promise<PesquisaMercadoConfig> {
  if (slug !== 'pesquisa-mercado') {
    throw new Error(`Unknown plugin slug: ${slug}`);
  }

  if (cache && cache.expiresAt > Date.now()) {
    return cache.value;
  }

  const db = supabaseAdmin;
  if (!db) return DEFAULT_PESQUISA_MERCADO_CONFIG;

  const { data, error } = await db
    .from('plugin_market_configs')
    .select('config')
    .eq('slug', slug)
    .maybeSingle();

  if (error) throw new Error(`Failed to get plugin config: ${error.message}`);

  const stored = (data?.config ?? {}) as Partial<PesquisaMercadoConfig>;
  const merged: PesquisaMercadoConfig = { ...DEFAULT_PESQUISA_MERCADO_CONFIG, ...stored };

  cache = { value: merged, expiresAt: Date.now() + CACHE_TTL_MS };
  return merged;
}

// ============================================================================
// updateConfig
// ============================================================================

export async function updateConfig(
  slug: string,
  partial: Partial<PesquisaMercadoConfig>,
): Promise<PesquisaMercadoConfig> {
  if (slug !== 'pesquisa-mercado') {
    throw new Error(`Unknown plugin slug: ${slug}`);
  }

  const db = supabaseAdmin;
  if (!db) throw new Error('Database service unavailable');

  const current = await getConfig(slug);
  const updated: PesquisaMercadoConfig = { ...current, ...partial };

  const { error } = await db
    .from('plugin_market_configs')
    .upsert(
      { slug, config: updated, updated_at: new Date().toISOString() },
      { onConflict: 'slug' },
    );

  if (error) throw new Error(`Failed to update plugin config: ${error.message}`);

  invalidateCache();
  return updated;
}
