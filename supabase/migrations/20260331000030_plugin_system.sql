-- 030: Plugin System
-- Creates plugin catalog and consultancy_plugins (installed plugins per consultancy)

-- ─── Plugin catalog ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS plugins (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug        TEXT UNIQUE NOT NULL,
  name        TEXT NOT NULL,
  description TEXT,
  icon        TEXT,
  category    TEXT NOT NULL DEFAULT 'general',
  is_free     BOOLEAN NOT NULL DEFAULT true,
  price_type  TEXT CHECK (price_type IN ('credit', 'subscription', 'one_time')),
  price_amount INTEGER NOT NULL DEFAULT 0,
  features    JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_active   BOOLEAN NOT NULL DEFAULT true,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE plugins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "plugins_read_authenticated"
  ON plugins FOR SELECT TO authenticated
  USING (is_active = true);

-- ─── Consultancy plugins (installed per consultancy) ─────────────────────────
CREATE TABLE IF NOT EXISTS consultancy_plugins (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consultancy_id UUID NOT NULL REFERENCES consultancies(id) ON DELETE CASCADE,
  plugin_slug    TEXT NOT NULL REFERENCES plugins(slug) ON UPDATE CASCADE,
  installed_by   UUID NOT NULL REFERENCES auth.users(id),
  installed_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_active      BOOLEAN NOT NULL DEFAULT true,
  UNIQUE(consultancy_id, plugin_slug)
);

ALTER TABLE consultancy_plugins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cp_owner_all"
  ON consultancy_plugins FOR ALL TO authenticated
  USING (
    consultancy_id IN (
      SELECT id FROM consultancies WHERE user_id = auth.uid()
    )
  );

-- ─── Seed: Transcrição de Reunião plugin ─────────────────────────────────────
INSERT INTO plugins (slug, name, description, icon, category, is_free, features, sort_order)
VALUES (
  'transcricao-reuniao',
  'Transcrição de Reunião',
  'Bot IA que entra na sua reunião e transcreve automaticamente com resumo, plano de ação e indexação na memória da consultoria.',
  '🎙️',
  'meetings',
  true,
  '["Transcrição automática", "Resumo por IA (GPT-4o)", "Plano de ação extraído", "Indexado na memória IA da consultoria"]'::jsonb,
  0
)
ON CONFLICT (slug) DO NOTHING;

-- ─── Auto-install for existing meeting sessions ───────────────────────────────
-- Users who already have meeting sessions get the plugin auto-installed
INSERT INTO consultancy_plugins (consultancy_id, plugin_slug, installed_by)
SELECT DISTINCT
  ms.consultancy_id,
  'transcricao-reuniao',
  ms.user_id
FROM meeting_sessions ms
WHERE ms.consultancy_id IS NOT NULL
  AND EXISTS (SELECT 1 FROM consultancies c WHERE c.id = ms.consultancy_id)
ON CONFLICT (consultancy_id, plugin_slug) DO NOTHING;
