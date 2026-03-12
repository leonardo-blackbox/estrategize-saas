-- Migration 011: Formation Sections + Course Sales Config (Story 3.8)

-- ============================================================================
-- formation_sections: admin-managed sections for the member Formação page
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.formation_sections (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title       TEXT NOT NULL,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.formation_sections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sections_select_auth" ON public.formation_sections
  FOR SELECT USING (auth.role() = 'authenticated');

-- ============================================================================
-- formation_section_courses: courses grouped inside each section
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.formation_section_courses (
  section_id  UUID NOT NULL REFERENCES public.formation_sections(id) ON DELETE CASCADE,
  course_id   UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (section_id, course_id)
);

ALTER TABLE public.formation_section_courses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "section_courses_select_auth" ON public.formation_section_courses
  FOR SELECT USING (auth.role() = 'authenticated');

-- ============================================================================
-- courses: add sales config columns
-- ============================================================================
ALTER TABLE public.courses
  ADD COLUMN IF NOT EXISTS sales_url            TEXT,
  ADD COLUMN IF NOT EXISTS offer_badge_enabled  BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS offer_badge_text     TEXT DEFAULT 'Oferta';

-- ============================================================================
-- Seed: default section so existing courses aren't orphaned
-- ============================================================================
INSERT INTO public.formation_sections (title, sort_order)
SELECT 'Seus Cursos', 0
WHERE NOT EXISTS (
  SELECT 1 FROM public.formation_sections WHERE title = 'Seus Cursos'
);
