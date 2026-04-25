-- Migration 034: central_pages — Notion-like workspace per consultancy
-- Materializes the Iris methodology as editable pages with hierarchy

CREATE TABLE IF NOT EXISTS public.central_pages (
  id              uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  consultancy_id  uuid        NOT NULL REFERENCES public.consultancies(id) ON DELETE CASCADE,
  parent_id       uuid        REFERENCES public.central_pages(id) ON DELETE CASCADE,
  title           text        NOT NULL DEFAULT 'Sem título',
  emoji           text,
  position        integer     NOT NULL DEFAULT 0,
  blocks          jsonb       NOT NULL DEFAULT '{"type":"doc","content":[{"type":"paragraph"}]}',
  template_key    text,
  created_by      uuid        NOT NULL REFERENCES auth.users(id),
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

-- Indexes for tree navigation and ordering
CREATE INDEX IF NOT EXISTS idx_central_pages_consultancy ON public.central_pages (consultancy_id);
CREATE INDEX IF NOT EXISTS idx_central_pages_parent      ON public.central_pages (parent_id);
CREATE INDEX IF NOT EXISTS idx_central_pages_position    ON public.central_pages (consultancy_id, parent_id, position);

-- Updated_at trigger (reuse existing function if available, otherwise create)
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_central_pages_updated ON public.central_pages;
CREATE TRIGGER trg_central_pages_updated
  BEFORE UPDATE ON public.central_pages
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- RLS — owner-only access via consultancy ownership
ALTER TABLE public.central_pages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_central_pages_owner" ON public.central_pages;
CREATE POLICY "users_central_pages_owner"
  ON public.central_pages
  FOR ALL
  USING (
    consultancy_id IN (
      SELECT id FROM public.consultancies WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    consultancy_id IN (
      SELECT id FROM public.consultancies WHERE user_id = auth.uid()
    )
  );

-- Admins (role='admin' in profiles) can see all central pages
DROP POLICY IF EXISTS "admins_central_pages_view" ON public.central_pages;
CREATE POLICY "admins_central_pages_view"
  ON public.central_pages
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );
