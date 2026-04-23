-- =============================================================
-- Migration 016: Quiz Extension
-- =============================================================
-- Purpose: Estende o schema de aplicações para suportar quizzes.
-- Isolation: 100% additive. Não altera comportamento existente.
-- Default tool_type = 'form' mantém aplicações atuais intactas.
--
-- Tracking Quiz (Meta Pixel + CAPI):
-- quiz_config JSONB suporta: leadTrigger, leadScoreMinimum
-- quiz_outcomes.pixel_event_name: evento Meta por outcome (ex: 'Lead', 'ViewContent')
-- =============================================================

-- 1. Extensão da tabela applications (additive)
-- -------------------------------------------------------------
-- tool_type: discrimina form vs quiz (default 'form' preserva comportamento atual)
-- quiz_config: JSONB flexível para configurações do quiz (scoring rules, branding, etc.)
ALTER TABLE applications
  ADD COLUMN IF NOT EXISTS tool_type TEXT DEFAULT 'form'
    CHECK (tool_type IN ('form', 'quiz')),
  ADD COLUMN IF NOT EXISTS quiz_config JSONB DEFAULT NULL;

-- 2. Tabela quiz_outcomes
-- -------------------------------------------------------------
-- Representa resultados possíveis de um quiz (faixas de score).
-- Cada outcome pode ter CTA (URL, WhatsApp ou nenhum) e visual customizado.
CREATE TABLE IF NOT EXISTS quiz_outcomes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  outcome_key TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  score_min INTEGER NOT NULL DEFAULT 0,
  score_max INTEGER NOT NULL DEFAULT 100,
  cta_type TEXT DEFAULT 'none' CHECK (cta_type IN ('url', 'whatsapp', 'none')),
  cta_url TEXT,
  cta_label TEXT,
  image_url TEXT,
  background_color TEXT,
  "order" INTEGER DEFAULT 0,
  -- Pixel Meta: evento disparado quando este outcome é exibido ao respondente
  -- Ex: 'Lead', 'ViewContent', 'Purchase' — null = não dispara
  pixel_event_name TEXT DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Row Level Security
-- -------------------------------------------------------------
-- Usuário só acessa outcomes de quizzes que ele próprio possui.
ALTER TABLE quiz_outcomes ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'quiz_outcomes'
      AND policyname = 'Users manage own quiz outcomes'
  ) THEN
    CREATE POLICY "Users manage own quiz outcomes" ON quiz_outcomes
      FOR ALL
      USING (
        application_id IN (
          SELECT id FROM applications WHERE user_id = auth.uid()
        )
      );
  END IF;
END
$$;

-- 4. Index para lookups por application_id (padrão mais comum)
-- -------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_quiz_outcomes_application_id
  ON quiz_outcomes(application_id);
