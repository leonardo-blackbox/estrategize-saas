-- Migration 028: Add aggregated transcript columns to meeting_sessions
-- These columns store the GPT-4 processed output after a meeting ends.
-- meeting_transcripts holds individual Recall.ai segments (one row per speaker turn).
-- meeting_sessions stores the aggregated results produced by transcriptService.ts.

ALTER TABLE public.meeting_sessions
  ADD COLUMN IF NOT EXISTS formatted_transcript TEXT,
  ADD COLUMN IF NOT EXISTS summary             TEXT,
  ADD COLUMN IF NOT EXISTS speakers            TEXT[] DEFAULT '{}';
