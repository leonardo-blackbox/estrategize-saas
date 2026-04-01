-- 031: Plugin Configs
-- Key-value configuration storage per plugin

CREATE TABLE IF NOT EXISTS plugin_configs (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plugin_slug  TEXT NOT NULL REFERENCES plugins(slug) ON UPDATE CASCADE ON DELETE CASCADE,
  config_key   TEXT NOT NULL,
  config_value JSONB NOT NULL DEFAULT '{}'::jsonb,
  scope        TEXT NOT NULL DEFAULT 'global',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(plugin_slug, config_key, scope)
);

ALTER TABLE plugin_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "plugin_configs_admin_all"
  ON plugin_configs FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Seed: Helena plugin
INSERT INTO plugins (slug, name, description, icon, category, is_free, price_type, price_amount, features, sort_order)
VALUES (
  'helena',
  'Helena',
  'Copiloto de reunioes com IA. Sugere abordagens comerciais em tempo real durante a reuniao.',
  '🤖',
  'meetings',
  false,
  'subscription',
  0,
  '["Sugestoes em tempo real", "Deteccao de objecoes", "Tecnicas de fechamento", "Rapport de abertura"]'::jsonb,
  10
)
ON CONFLICT (slug) DO NOTHING;

-- Seed: Helena default config entries
INSERT INTO plugin_configs (plugin_slug, config_key, config_value)
VALUES
  ('helena', 'opening_enabled',       'true'::jsonb),
  ('helena', 'mid_enabled',           'true'::jsonb),
  ('helena', 'closing_enabled',       'true'::jsonb),
  ('helena', 'objection_enabled',     'true'::jsonb),
  ('helena', 'mid_interval_minutes',  '10'::jsonb)
ON CONFLICT (plugin_slug, config_key, scope) DO NOTHING;
