-- Migration 029: Consultancies Extra Fields (Phase 18 — Wizard de Criação)
-- Adds ticket, has_team, has_website, current_stage to consultancies table

ALTER TABLE consultancies
  ADD COLUMN IF NOT EXISTS ticket INTEGER,
  ADD COLUMN IF NOT EXISTS has_team BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS has_website BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS current_stage TEXT;

-- Rollback: ALTER TABLE consultancies DROP COLUMN IF EXISTS ticket, DROP COLUMN IF EXISTS has_team, DROP COLUMN IF EXISTS has_website, DROP COLUMN IF EXISTS current_stage;
