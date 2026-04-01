-- 034: Market Intelligence
-- Tables for Instagram auto-scan (Tier 1) and deep market research (Tier 2)

-- ============================================================================
-- instagram_snapshots
-- ============================================================================

CREATE TABLE IF NOT EXISTS instagram_snapshots (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  consultancy_id  UUID        NOT NULL REFERENCES consultancies(id) ON DELETE CASCADE,
  user_id         UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  handle          TEXT        NOT NULL,
  status          TEXT        NOT NULL DEFAULT 'pending'
                              CHECK (status IN ('pending', 'running', 'done', 'failed')),
  raw_data        JSONB,
  error_message   TEXT,
  scraped_at      TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_instagram_snapshots_consultancy_id
  ON instagram_snapshots (consultancy_id);

ALTER TABLE instagram_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "instagram_snapshots_owner_all"
  ON instagram_snapshots FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ============================================================================
-- market_research
-- ============================================================================

CREATE TABLE IF NOT EXISTS market_research (
  id                     UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  consultancy_id         UUID        NOT NULL REFERENCES consultancies(id) ON DELETE CASCADE,
  user_id                UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status                 TEXT        NOT NULL DEFAULT 'pending'
                                     CHECK (status IN (
                                       'pending',
                                       'running_maps',
                                       'running_instagram',
                                       'running_websites',
                                       'running_ai',
                                       'done',
                                       'failed'
                                     )),
  progress_step          INT         NOT NULL DEFAULT 0,
  config_snapshot        JSONB,
  competitors_discovered JSONB,
  instagram_data         JSONB,
  websites_data          JSONB,
  report_markdown        TEXT,
  key_insights           JSONB,
  rag_indexed            BOOLEAN     NOT NULL DEFAULT false,
  error_message          TEXT,
  credits_used           INT         NOT NULL DEFAULT 0,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at           TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_market_research_consultancy_status
  ON market_research (consultancy_id, status);

ALTER TABLE market_research ENABLE ROW LEVEL SECURITY;

CREATE POLICY "market_research_owner_all"
  ON market_research FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ============================================================================
-- plugin_market_configs (separate table for JSONB blob config, avoids conflict
-- with existing plugin_configs key-value schema)
-- ============================================================================

CREATE TABLE IF NOT EXISTS plugin_market_configs (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  slug       TEXT        NOT NULL UNIQUE,
  config     JSONB       NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE plugin_market_configs ENABLE ROW LEVEL SECURITY;

-- Service role has full access; authenticated users can SELECT
CREATE POLICY "plugin_market_configs_admin_write"
  ON plugin_market_configs FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "plugin_market_configs_authenticated_read"
  ON plugin_market_configs FOR SELECT TO authenticated
  USING (true);

-- ============================================================================
-- Register pesquisa-mercado plugin
-- ============================================================================

INSERT INTO plugins (slug, name, description, icon, category, is_free, price_type, price_amount, features, sort_order)
VALUES (
  'pesquisa-mercado',
  'Pesquisa de Mercado',
  'Inteligência de mercado automática. Scan de Instagram, análise de concorrentes via Google Maps e relatório estratégico com IA.',
  '🔍',
  'intelligence',
  false,
  'one_time',
  0,
  '["Instagram Auto-Scan", "Descoberta de concorrentes via Google Maps", "Análise de Instagram dos concorrentes", "Scraping de sites via Firecrawl", "Relatório estratégico com GPT-4", "Integração RAG automática"]'::jsonb,
  20
)
ON CONFLICT (slug) DO NOTHING;

-- ============================================================================
-- Seed default config for pesquisa-mercado
-- ============================================================================

INSERT INTO plugin_market_configs (slug, config)
VALUES (
  'pesquisa-mercado',
  '{
    "enabled": true,
    "instagram_scan_enabled": true,
    "instagram_posts_count": 12,
    "instagram_engagement_rate": true,
    "instagram_posting_frequency": true,
    "instagram_hashtag_analysis": false,
    "instagram_content_breakdown": true,
    "discovery_sources": ["google_maps"],
    "max_competitors_discover": 10,
    "max_competitors_instagram": 5,
    "include_competitor_websites": true,
    "max_websites_scrape": 5,
    "report_language": "pt-BR",
    "report_style": "detailed",
    "report_sections": {
      "market_overview": true,
      "competitor_analysis": true,
      "social_media_analysis": true,
      "digital_presence": true,
      "opportunities": true,
      "threats": true,
      "positioning": true,
      "action_plan": true
    },
    "custom_system_prompt": null,
    "ai_temperature": 0.5,
    "auto_index_rag": true,
    "rag_context_tag": "pesquisa-mercado",
    "include_raw_data_in_rag": false,
    "credits_cost_basic": 0,
    "credits_cost_deep": 5,
    "free_first_research": true
  }'::jsonb
)
ON CONFLICT (slug) DO NOTHING;
