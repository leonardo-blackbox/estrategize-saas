---
phase: 14-integracao-recall-ai-backend
plan: "01"
subsystem: backend
tags: [recall-ai, meetings, transcription, migration, rls]
dependency_graph:
  requires: []
  provides: [meeting_sessions table, meeting_transcripts table, POST /api/meetings, GET /api/meetings]
  affects: [backend/src/app.ts]
tech_stack:
  added: []
  patterns: [Recall.ai Token auth, assembly_ai transcription, RLS with session ownership subquery]
key_files:
  created:
    - backend/src/database/migrations/027_meeting_sessions.sql
    - backend/src/services/recallService.ts
    - backend/src/routes/meetings.ts
  modified:
    - backend/src/app.ts
decisions:
  - "authLimit (not adminLimit) for /api/meetings — member-facing endpoints"
  - "consultancy_id ON DELETE SET NULL — preserves session history when consultancy is deleted"
  - "POST / returns 502 when Recall.ai API fails — distinguishes upstream failure from server error"
  - "status CHECK constraint: pending|joining|in_call|processing|done|error covers full Recall.ai bot lifecycle"
metrics:
  duration: "2 min"
  completed: "2026-03-29"
  tasks_completed: 2
  files_created: 3
  files_modified: 1
---

# Phase 14 Plan 01: Recall.ai Backend Foundation Summary

**One-liner:** Migration 027 com meeting_sessions/meeting_transcripts + RLS, recallService.ts com Token auth e assembly_ai, endpoint POST /api/meetings criando bot e persistindo sessão com status pending.

## What Was Built

### Task 1 — Migration 027
- `meeting_sessions`: tracks bot lifecycle per meeting (`pending → joining → in_call → processing → done/error`), linked to `auth.users` and optionally to `consultancies`
- `meeting_transcripts`: stores individual transcript segments received via webhook, with `words jsonb` for word-level timestamps
- 4 indexes (user_id, consultancy_id partial, recall_bot_id, session_id)
- Full RLS: sessions owner-only (SELECT/INSERT/UPDATE/DELETE); transcripts via `EXISTS` subquery on parent session
- `updated_at` trigger for meeting_sessions following same pattern as migration 026

### Task 2 — Service + Route + App Wiring
- `recallService.ts`: `createBot()` POSTs to `https://us-east-1.recall.ai/api/v1/bot` with `Token ${RECALL_API_KEY}` header and `transcription_options: { provider: 'assembly_ai' }`
- `meetings.ts`: POST `/` validates `meeting_url` (URL) and optional `consultancy_id` (UUID) via Zod, calls createBot, inserts into `meeting_sessions` with status `pending`, returns 201; GET `/` lists sessions for authenticated user
- `app.ts`: imports `meetingsRouter`, mounts at `/api/meetings` with `authLimit` before webhooks section

## Deviations from Plan

None — plan executed exactly as written.

## Self-Check

- [x] `backend/src/database/migrations/027_meeting_sessions.sql` exists
- [x] `backend/src/services/recallService.ts` exists
- [x] `backend/src/routes/meetings.ts` exists
- [x] `backend/src/app.ts` updated with meetingsRouter
- [x] TypeScript compiles clean (`tsc --noEmit` — no output = success)
- [x] Migration: 2 CREATE TABLE, 2 ENABLE ROW LEVEL SECURITY — PASS
- [x] Task 2 verification: createBot + meetingsRouter + recall_bot_id — PASS
- [x] Commits: da38f8c (migration), f3b2823 (service + route + wiring)

## Self-Check: PASSED
