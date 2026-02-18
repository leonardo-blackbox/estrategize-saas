-- Migration 002: Align consultancies table with PRD (Story 1.6)
-- Renames: name → title, description → client_name
-- Removes: sector
-- Status constraint: only 'active' | 'archived'

-- Step 1: Rename columns
ALTER TABLE public.consultancies RENAME COLUMN name TO title;
ALTER TABLE public.consultancies RENAME COLUMN description TO client_name;

-- Step 2: Drop sector column
ALTER TABLE public.consultancies DROP COLUMN IF EXISTS sector;

-- Step 3: Update status constraint
-- First, migrate any non-conforming statuses
UPDATE public.consultancies SET status = 'active' WHERE status IN ('draft', 'completed');
-- Drop old constraint, add new one
ALTER TABLE public.consultancies DROP CONSTRAINT IF EXISTS consultancies_status_check;
ALTER TABLE public.consultancies ADD CONSTRAINT consultancies_status_check
  CHECK (status IN ('active', 'archived'));

-- Step 4: Update default status
ALTER TABLE public.consultancies ALTER COLUMN status SET DEFAULT 'active';

-- Step 5: Recreate RLS policies (drop old, create new)
DROP POLICY IF EXISTS "consultancies_select_own" ON public.consultancies;
DROP POLICY IF EXISTS "consultancies_insert_own" ON public.consultancies;
DROP POLICY IF EXISTS "consultancies_update_own" ON public.consultancies;
DROP POLICY IF EXISTS "consultancies_delete_own" ON public.consultancies;

CREATE POLICY "consultancies_select_own" ON public.consultancies
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "consultancies_insert_own" ON public.consultancies
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "consultancies_update_own" ON public.consultancies
  FOR UPDATE USING (auth.uid() = user_id);
-- No DELETE policy: hard deletes are blocked by design
