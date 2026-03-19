-- Migration 022: fix response_count desync
-- Recalculate response_count for all applications based on actual completed responses

UPDATE public.applications a
SET response_count = (
  SELECT COUNT(*)
  FROM public.application_responses r
  WHERE r.application_id = a.id
    AND r.status = 'completed'
);
