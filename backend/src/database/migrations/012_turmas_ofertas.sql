-- Migration 012: Turmas (Cohorts) + Ofertas (Offers)

-- turmas: cohorts attached to courses
CREATE TABLE IF NOT EXISTS public.turmas (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id       UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  description     TEXT,
  drip_type       TEXT NOT NULL DEFAULT 'enrollment_date', -- 'enrollment_date' | 'fixed_date'
  access_start_date TIMESTAMPTZ,  -- used when drip_type = 'fixed_date'
  status          TEXT NOT NULL DEFAULT 'active', -- 'active' | 'archived'
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.turmas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "turmas_admin_all" ON public.turmas
  FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "turmas_member_select" ON public.turmas
  FOR SELECT USING (auth.role() = 'authenticated');

-- Add turma_id FK to enrollments (nullable for backward compat)
ALTER TABLE public.enrollments
  ADD COLUMN IF NOT EXISTS turma_id UUID REFERENCES public.turmas(id) ON DELETE SET NULL;

-- ofertas: product offers
CREATE TABLE IF NOT EXISTS public.ofertas (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,
  type            TEXT NOT NULL DEFAULT 'one-time', -- 'one-time' | 'subscription'
  price_display   TEXT, -- display string like "R$ 197/mês"
  status          TEXT NOT NULL DEFAULT 'active', -- 'active' | 'archived'
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.ofertas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ofertas_admin_all" ON public.ofertas
  FOR ALL USING (auth.role() = 'service_role');

-- oferta_turmas: which turmas are included in each offer
CREATE TABLE IF NOT EXISTS public.oferta_turmas (
  oferta_id   UUID NOT NULL REFERENCES public.ofertas(id) ON DELETE CASCADE,
  turma_id    UUID NOT NULL REFERENCES public.turmas(id) ON DELETE CASCADE,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (oferta_id, turma_id)
);

ALTER TABLE public.oferta_turmas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "oferta_turmas_admin_all" ON public.oferta_turmas
  FOR ALL USING (auth.role() = 'service_role');
