---
phase: 15-pipeline-transcript-ia
plan: "01"
subsystem: backend
tags: [ai, meetings, transcript, gpt4, pipeline]
dependency_graph:
  requires:
    - 14-02 (recall webhook inserts meeting_transcripts segments)
    - 027_meeting_sessions.sql (meeting_sessions + meeting_transcripts schema)
  provides:
    - processTranscript() callable by recall webhook after meeting ends
    - migration 028 with summary columns on meeting_sessions
  affects:
    - meeting_sessions (adds formatted_transcript, summary, speakers columns + status=done)
    - consultancy_action_items (bulk insert from GPT-4 output with origin=meeting_ai)
tech_stack:
  added:
    - OpenAI GPT-4o via existing openai npm package (no new dependency)
  patterns:
    - fire-and-forget async pipeline (never throws, never blocks webhook response)
    - response_format json_object for reliable GPT-4 structured output
    - supabaseAdmin (service role) for all DB ops (no user auth context in background)
    - ensureAdmin() guard pattern (consistent with actionItemService.ts)
key_files:
  created:
    - backend/src/database/migrations/028_meeting_transcript_columns.sql
    - backend/src/services/transcriptService.ts
  modified: []
decisions:
  - processTranscript runs as fire-and-forget: errors caught internally, session.status set to error on failure, never re-throws
  - GPT-4o response_format json_object chosen over prompt engineering for reliable JSON output
  - Aggregated columns (formatted_transcript, summary, speakers) placed on meeting_sessions not meeting_transcripts — meeting_transcripts holds raw Recall.ai segments
  - Action items skipped (not failed) when consultancy_id is null — preserves orphaned session history
  - No credit charge for this pipeline — triggered by webhook, not user action
metrics:
  duration: 2 min
  completed: "2026-03-30"
  tasks_completed: 2
  files_created: 2
  files_modified: 0
---

# Phase 15 Plan 01: GPT-4 Transcript Processing Pipeline Summary

**One-liner:** GPT-4o pipeline that transforms raw Recall.ai transcript segments into formatted transcript, executive summary, and consultancy action items stored back on meeting_sessions.

## What Was Built

### Migration 028 (`028_meeting_transcript_columns.sql`)
Adds three columns to `meeting_sessions`:
- `formatted_transcript TEXT` — full aggregated transcript with speaker labels and timestamps
- `summary TEXT` — GPT-4o executive summary (3-5 paragraphs, strategic tone)
- `speakers TEXT[] DEFAULT '{}'` — deduplicated list of detected speakers

No RLS changes needed — meeting_sessions already has owner-based RLS from migration 027.

### transcriptService.ts — `processTranscript(sessionId)`

A complete 6-step background pipeline:

1. **Fetch session** — queries meeting_sessions for `user_id` and `consultancy_id`
2. **Fetch segments** — queries meeting_transcripts ordered by timestamp ASC
3. **Format transcript** — builds `[Speaker] (HH:MM:SS)\nraw_text` blocks; extracts unique speakers
4. **GPT-4o analysis** — calls `gpt-4o` with `response_format: json_object`, `temperature: 0.3`, `max_tokens: 4000`; system prompt in PT-BR yields `{ summary, action_items[], next_steps[] }`
5. **Update session** — stores formatted_transcript, summary, speakers, status=done
6. **Bulk insert action items** — maps GPT output to consultancy_action_items rows with `origin: 'meeting_ai'`, only when consultancy_id is non-null

## Deviations from Plan

None — plan executed exactly as written.

## Decisions Made

| Decision | Rationale |
|---|---|
| `response_format: json_object` | Eliminates JSON parsing failures from freeform text responses |
| Aggregated columns on meeting_sessions | meeting_transcripts is append-only raw storage; session is the natural owner of processed output |
| Skip (not fail) when consultancy_id is null | Orphaned sessions are valid (consultancy deleted); history preserved, action items simply skipped |
| No credit deduction | Pipeline fires from webhook automatically, not from explicit user action |

## Self-Check

Files created:
- `backend/src/database/migrations/028_meeting_transcript_columns.sql` — FOUND
- `backend/src/services/transcriptService.ts` — FOUND

Commits:
- `808a5f8` — migration 028
- `7fef3c9` — transcriptService.ts

TypeScript: `npx tsc --noEmit` — PASS

## Self-Check: PASSED
