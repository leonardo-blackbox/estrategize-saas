-- Migration 027: meeting_sessions and meeting_transcripts for Recall.ai integration
-- Creates bot session tracking and transcript storage with RLS

-- ============================================================================
-- meeting_sessions: tracks Recall.ai bot sessions per meeting
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.meeting_sessions (
  id              uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id         uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  consultancy_id  uuid        REFERENCES public.consultancies(id) ON DELETE SET NULL,
  recall_bot_id   text        NOT NULL,
  meeting_url     text        NOT NULL,
  bot_name        text        NOT NULL DEFAULT 'Iris AI Notetaker',
  status          text        NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'joining', 'in_call', 'processing', 'done', 'error')),
  started_at      timestamptz,
  ended_at        timestamptz,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

-- ============================================================================
-- meeting_transcripts: individual transcript segments from Recall.ai webhooks
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.meeting_transcripts (
  id              uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id      uuid        NOT NULL REFERENCES public.meeting_sessions(id) ON DELETE CASCADE,
  speaker         text        NOT NULL DEFAULT 'unknown',
  words           jsonb       NOT NULL DEFAULT '[]',
  raw_text        text        NOT NULL DEFAULT '',
  timestamp       timestamptz DEFAULT now(),
  created_at      timestamptz DEFAULT now()
);

-- ============================================================================
-- Indexes
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_meeting_sessions_user ON public.meeting_sessions (user_id);
CREATE INDEX IF NOT EXISTS idx_meeting_sessions_consultancy ON public.meeting_sessions (consultancy_id) WHERE consultancy_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_meeting_sessions_recall_bot ON public.meeting_sessions (recall_bot_id);
CREATE INDEX IF NOT EXISTS idx_meeting_transcripts_session ON public.meeting_transcripts (session_id);

-- ============================================================================
-- Row Level Security
-- ============================================================================

ALTER TABLE public.meeting_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meeting_transcripts ENABLE ROW LEVEL SECURITY;

-- meeting_sessions: owner can manage their own sessions
CREATE POLICY "Users can view own meeting sessions"
  ON public.meeting_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own meeting sessions"
  ON public.meeting_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own meeting sessions"
  ON public.meeting_sessions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own meeting sessions"
  ON public.meeting_sessions FOR DELETE
  USING (auth.uid() = user_id);

-- meeting_transcripts: access follows parent session ownership
CREATE POLICY "Users can view transcripts of own sessions"
  ON public.meeting_transcripts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.meeting_sessions s
      WHERE s.id = session_id AND s.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert transcripts of own sessions"
  ON public.meeting_transcripts FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.meeting_sessions s
      WHERE s.id = session_id AND s.user_id = auth.uid()
    )
  );

-- ============================================================================
-- updated_at trigger for meeting_sessions
-- ============================================================================

CREATE OR REPLACE FUNCTION public.update_meeting_sessions_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_meeting_sessions_updated_at
  BEFORE UPDATE ON public.meeting_sessions
  FOR EACH ROW EXECUTE FUNCTION public.update_meeting_sessions_updated_at();
