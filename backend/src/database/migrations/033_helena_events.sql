-- Migration 033: helena_events table for analytics tracking
-- Stores every Helena report generated during live meetings

CREATE TABLE IF NOT EXISTS public.helena_events (
  id                  uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  meeting_session_id  uuid        NOT NULL REFERENCES public.meeting_sessions(id) ON DELETE CASCADE,
  consultancy_id      uuid        REFERENCES public.consultancies(id) ON DELETE CASCADE,
  event_type          text        NOT NULL CHECK (event_type IN ('opening', 'mid', 'closing', 'objection')),
  payload             jsonb       NOT NULL DEFAULT '{}',
  urgencia            text        CHECK (urgencia IN ('baixa', 'media', 'alta')),
  created_at          timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_helena_events_session ON public.helena_events (meeting_session_id);
CREATE INDEX IF NOT EXISTS idx_helena_events_consultancy ON public.helena_events (consultancy_id) WHERE consultancy_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_helena_events_type ON public.helena_events (event_type);

-- RLS
ALTER TABLE public.helena_events ENABLE ROW LEVEL SECURITY;

-- Admin can see all events
CREATE POLICY "Admin can view all helena events"
  ON public.helena_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- Member can see events from their own consultancies
CREATE POLICY "Users can view own helena events"
  ON public.helena_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.meeting_sessions ms
      WHERE ms.id = meeting_session_id AND ms.user_id = auth.uid()
    )
  );

-- Service role inserts (backend writes via supabaseAdmin)
CREATE POLICY "Service can insert helena events"
  ON public.helena_events FOR INSERT
  WITH CHECK (true);
