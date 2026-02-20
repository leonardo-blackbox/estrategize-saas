-- Verification Script for Migration 002: Align consultancies with PRD
-- Run this in Supabase SQL Editor to verify schema changes

-- ============================================================================
-- 1. Verify column structure
-- ============================================================================
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'consultancies'
ORDER BY ordinal_position;

-- Expected output:
-- - id, user_id, title, client_name, status, deleted_at, created_at, updated_at
-- - NO "name", "description", or "sector" columns

-- ============================================================================
-- 2. Verify status constraint exists and is correct
-- ============================================================================
SELECT constraint_name, constraint_type, check_clause
FROM information_schema.table_constraints tc
LEFT JOIN information_schema.check_constraints cc
  ON tc.constraint_name = cc.constraint_name
WHERE tc.table_schema = 'public' AND tc.table_name = 'consultancies'
  AND constraint_type = 'CHECK';

-- Expected output:
-- - consultancies_status_check exists
-- - check_clause: "(status = ANY (ARRAY['active'::text, 'archived'::text]))"

-- ============================================================================
-- 3. Verify RLS is enabled
-- ============================================================================
SELECT relname, relrowsecurity, relforcerowsecurity
FROM pg_class
WHERE relname = 'consultancies';

-- Expected output:
-- - relrowsecurity: true
-- - relforcerowsecurity: false

-- ============================================================================
-- 4. Verify RLS policies
-- ============================================================================
SELECT policy_name, cmd, using_qual, with_check
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'consultancies'
ORDER BY policy_name;

-- Expected policies:
-- - consultancies_select_own (SELECT)
-- - consultancies_insert_own (INSERT)
-- - consultancies_update_own (UPDATE)
-- - NO DELETE policy

-- ============================================================================
-- 5. Verify default status value
-- ============================================================================
SELECT column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'consultancies'
  AND column_name = 'status';

-- Expected output:
-- - 'active'::character varying (or similar)

-- ============================================================================
-- 6. Quick sanity check: Try selecting a consultancy (should work if RLS is correct)
-- ============================================================================
SELECT id, user_id, title, client_name, status, deleted_at, created_at, updated_at
FROM public.consultancies
LIMIT 1;

-- Expected: Either returns row(s) or empty (depending on user data)
