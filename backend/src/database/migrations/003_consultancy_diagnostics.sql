-- Migration 003: Create consultancy_diagnostics table with RLS
-- Story 1.8: Consultancy Diagnosis (IA Iris)

-- Step 1: Create consultancy_diagnostics table
CREATE TABLE IF NOT EXISTS public.consultancy_diagnostics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  consultancy_id UUID NOT NULL REFERENCES public.consultancies(id) ON DELETE CASCADE,

  -- Diagnosis content
  content JSONB NOT NULL, -- { title, sections: [{ name, insights }], summary, ...}
  is_edited BOOLEAN DEFAULT FALSE,
  edited_at TIMESTAMP WITH TIME ZONE,

  -- Version control
  version INTEGER NOT NULL DEFAULT 1,

  -- Metadata
  tokens_used INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT consultancy_diagnostics_user_consultancy_unique UNIQUE (consultancy_id, version)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_consultancy_diagnostics_user_id ON public.consultancy_diagnostics(user_id);
CREATE INDEX IF NOT EXISTS idx_consultancy_diagnostics_consultancy_id ON public.consultancy_diagnostics(consultancy_id);
CREATE INDEX IF NOT EXISTS idx_consultancy_diagnostics_created_at ON public.consultancy_diagnostics(created_at);

-- Step 2: Enable RLS
ALTER TABLE public.consultancy_diagnostics ENABLE ROW LEVEL SECURITY;

-- Step 3: Create RLS policies
-- Users can SELECT their own diagnostics
CREATE POLICY "diagnostics_select_own" ON public.consultancy_diagnostics
  FOR SELECT USING (auth.uid() = user_id);

-- Users can INSERT diagnostics for their consultancies
CREATE POLICY "diagnostics_insert_own" ON public.consultancy_diagnostics
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can UPDATE their own diagnostics (to mark as edited)
CREATE POLICY "diagnostics_update_own" ON public.consultancy_diagnostics
  FOR UPDATE USING (auth.uid() = user_id);

-- No DELETE policy: use soft delete via is_edited flag

-- Step 4: Create update trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_consultancy_diagnostics_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_consultancy_diagnostics_updated_at ON public.consultancy_diagnostics;
CREATE TRIGGER trigger_consultancy_diagnostics_updated_at
  BEFORE UPDATE ON public.consultancy_diagnostics
  FOR EACH ROW
  EXECUTE FUNCTION public.update_consultancy_diagnostics_updated_at();
