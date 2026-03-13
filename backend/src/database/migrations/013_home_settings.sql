-- Migration 013: home_settings
-- Single-row table for personalized home title/subtitle

CREATE TABLE IF NOT EXISTS home_settings (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title      TEXT NOT NULL DEFAULT 'Formação',
  subtitle   TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE home_settings ENABLE ROW LEVEL SECURITY;

-- authenticated users can read
CREATE POLICY "home_settings_read" ON home_settings
  FOR SELECT TO authenticated USING (true);

-- service_role has full access (bypasses RLS by default)

-- Seed default row if table is empty
INSERT INTO home_settings (title, subtitle)
SELECT 'Formação', NULL
WHERE NOT EXISTS (SELECT 1 FROM home_settings);
