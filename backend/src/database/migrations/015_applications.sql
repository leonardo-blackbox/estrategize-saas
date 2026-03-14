-- =============================================================
-- Migration 015 — Aplicações (Form Builder)
-- Tables: applications, application_fields,
--         application_responses, application_response_answers
-- =============================================================

BEGIN;

-- ─── HELPERS ──────────────────────────────────────────────────

-- 1. slugify: lowercase + remove accents + replace non-alphanumeric with hyphens
CREATE OR REPLACE FUNCTION public.slugify(input_text TEXT)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  result TEXT;
BEGIN
  -- lowercase
  result := lower(input_text);

  -- replace accented characters (common Latin)
  result := translate(result,
    'àáâãäåæçèéêëìíîïðñòóôõöùúûüýþÿ',
    'aaaaaaeceeeeiiiidnoooooouuuuyty'
  );

  -- replace anything that is not a-z, 0-9 with a hyphen
  result := regexp_replace(result, '[^a-z0-9]+', '-', 'g');

  -- strip leading/trailing hyphens
  result := trim(both '-' from result);

  -- truncate to 80 chars
  result := left(result, 80);

  -- strip any trailing hyphen that truncation may have introduced
  result := trim(trailing '-' from result);

  RETURN result;
END;
$$;

-- 2. generate_application_slug: unique slug with numeric suffix loop
CREATE OR REPLACE FUNCTION public.generate_application_slug(
  title         TEXT,
  exclude_id    UUID DEFAULT NULL
)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  base_slug TEXT;
  candidate TEXT;
  counter   INT := 2;
  found     BOOL;
BEGIN
  base_slug := public.slugify(title);

  -- Ensure base is non-empty
  IF base_slug = '' THEN
    base_slug := 'aplicacao';
  END IF;

  candidate := base_slug;

  LOOP
    SELECT EXISTS(
      SELECT 1 FROM public.applications
      WHERE slug = candidate
        AND (exclude_id IS NULL OR id <> exclude_id)
    ) INTO found;

    EXIT WHEN NOT found;

    candidate := base_slug || '-' || counter;
    counter   := counter + 1;
  END LOOP;

  RETURN candidate;
END;
$$;

-- ─── TABLE: applications ──────────────────────────────────────

CREATE TABLE public.applications (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title          TEXT        NOT NULL CHECK (char_length(title) BETWEEN 1 AND 200),
  slug           TEXT        NOT NULL UNIQUE,
  status         TEXT        NOT NULL DEFAULT 'draft'
                               CHECK (status IN ('draft', 'published', 'archived')),
  theme_config   JSONB       NOT NULL DEFAULT '{}',
  settings       JSONB       NOT NULL DEFAULT '{}',
  response_count INT         NOT NULL DEFAULT 0,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  public.applications IS 'Form builder — aplicações (formulários) dos usuários.';
COMMENT ON COLUMN public.applications.slug IS 'URL-friendly unique identifier gerado a partir do título.';

-- ─── TABLE: application_fields ────────────────────────────────

CREATE TABLE public.application_fields (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id    UUID        NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  position          INT         NOT NULL DEFAULT 0,
  type              TEXT        NOT NULL,
  title             TEXT        NOT NULL DEFAULT '',
  description       TEXT,
  required          BOOL        NOT NULL DEFAULT false,
  options           JSONB       NOT NULL DEFAULT '[]',
  conditional_logic JSONB       NOT NULL DEFAULT '{}',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.application_fields IS 'Campos/perguntas de cada aplicação.';

-- ─── TABLE: application_responses ────────────────────────────

CREATE TABLE public.application_responses (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id  UUID        NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  status          TEXT        NOT NULL DEFAULT 'partial'
                                CHECK (status IN ('partial', 'complete')),
  session_token   TEXT        NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
  metadata        JSONB       NOT NULL DEFAULT '{}',
  submitted_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.application_responses IS 'Sessões de resposta de cada aplicação.';

-- ─── TABLE: application_response_answers ─────────────────────

CREATE TABLE public.application_response_answers (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  response_id  UUID        NOT NULL REFERENCES public.application_responses(id) ON DELETE CASCADE,
  field_id     UUID        NOT NULL,
  field_type   TEXT        NOT NULL,
  field_title  TEXT        NOT NULL,
  value        JSONB       NOT NULL DEFAULT 'null',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.application_response_answers IS 'Respostas individuais por campo.';

-- ─── INDEXES ──────────────────────────────────────────────────

CREATE INDEX idx_applications_user_id
  ON public.applications (user_id);

CREATE INDEX idx_applications_slug
  ON public.applications (slug);

CREATE INDEX idx_application_fields_app_position
  ON public.application_fields (application_id, position);

CREATE INDEX idx_application_responses_app_created
  ON public.application_responses (application_id, created_at DESC);

CREATE INDEX idx_application_response_answers_response_id
  ON public.application_response_answers (response_id);

-- ─── TRIGGERS: updated_at ─────────────────────────────────────
-- Reuses public.set_updated_at() defined in migration 006

CREATE TRIGGER set_applications_updated_at
  BEFORE UPDATE ON public.applications
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_application_fields_updated_at
  BEFORE UPDATE ON public.application_fields
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ─── TRIGGER: increment response_count ───────────────────────

CREATE OR REPLACE FUNCTION public.increment_application_response_count()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Only fire when a response transitions to 'complete' for the first time
  IF NEW.status = 'complete' AND (OLD.status IS NULL OR OLD.status <> 'complete') THEN
    UPDATE public.applications
    SET response_count = response_count + 1
    WHERE id = NEW.application_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_increment_response_count
  AFTER INSERT OR UPDATE ON public.application_responses
  FOR EACH ROW EXECUTE FUNCTION public.increment_application_response_count();

-- ─── ROW LEVEL SECURITY ───────────────────────────────────────

ALTER TABLE public.applications              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.application_fields        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.application_responses     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.application_response_answers ENABLE ROW LEVEL SECURITY;

-- applications: owner CRUD
CREATE POLICY "applications_owner_select" ON public.applications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "applications_owner_insert" ON public.applications
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "applications_owner_update" ON public.applications
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "applications_owner_delete" ON public.applications
  FOR DELETE USING (auth.uid() = user_id);

-- application_fields: owner via parent application
CREATE POLICY "application_fields_owner_select" ON public.application_fields
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.applications
      WHERE id = application_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "application_fields_owner_insert" ON public.application_fields
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.applications
      WHERE id = application_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "application_fields_owner_update" ON public.application_fields
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.applications
      WHERE id = application_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "application_fields_owner_delete" ON public.application_fields
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.applications
      WHERE id = application_id AND user_id = auth.uid()
    )
  );

-- application_responses: owner SELECT only (INSERT done via service role in backend)
CREATE POLICY "application_responses_owner_select" ON public.application_responses
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.applications
      WHERE id = application_id AND user_id = auth.uid()
    )
  );

-- application_response_answers: owner SELECT via double EXISTS
CREATE POLICY "application_response_answers_owner_select" ON public.application_response_answers
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.application_responses ar
      JOIN public.applications a ON a.id = ar.application_id
      WHERE ar.id = response_id
        AND a.user_id = auth.uid()
    )
  );

COMMIT;
