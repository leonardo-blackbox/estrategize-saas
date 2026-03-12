-- Migration 007: Add banner_url column to courses
-- Up
ALTER TABLE courses ADD COLUMN IF NOT EXISTS banner_url text;

-- Down (rollback)
-- ALTER TABLE courses DROP COLUMN IF EXISTS banner_url;
