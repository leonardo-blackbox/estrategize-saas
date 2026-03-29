-- Migration 025: Adiciona status draft/published a aulas.
-- Aulas existentes iniciam como draft. Admin publica manualmente cada aula.

ALTER TABLE public.lessons
  ADD COLUMN status text NOT NULL DEFAULT 'draft'
  CHECK (status IN ('draft', 'published'));
