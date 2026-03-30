---
phase: 16-reunioes-ui
plan: "01"
subsystem: meetings-api
tags: [backend, frontend, api, recall-ai, typescript]
dependency_graph:
  requires: []
  provides: [frontend/src/api/meetings.ts, GET /api/meetings?consultancy_id filter]
  affects: [16-02 ConsultoriaDetailMeetings]
tech_stack:
  added: []
  patterns: [React Query cache keys, Zod query param validation]
key_files:
  created:
    - frontend/src/api/meetings.ts
  modified:
    - backend/src/routes/meetings.ts
decisions:
  - "listQuerySchema with z.string().uuid().optional() validates consultancy_id before Supabase query — returns 400 on malformed UUID"
  - "Supabase query chain: base query built first, .eq('consultancy_id', ...) conditionally chained — avoids branching the full query"
  - "meetingKeys.byConsultancy uses spread of meetingKeys.all for cache hierarchy consistency"
metrics:
  duration: "1 min"
  completed: "2026-03-30"
  tasks_completed: 2
  tasks_total: 2
  files_changed: 2
requirements_addressed:
  - MEET-06
---

# Phase 16 Plan 01: Meeting API Client and Backend Filter Summary

**One-liner:** Backend GET /api/meetings now filters by consultancy_id via Zod-validated query param; frontend/src/api/meetings.ts provides MeetingSession types and React Query-ready API functions.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Backend — adicionar filtro consultancy_id no GET /api/meetings | 5b2ef35 | backend/src/routes/meetings.ts |
| 2 | Frontend — criar frontend/src/api/meetings.ts com tipos e funções | accd426 | frontend/src/api/meetings.ts (new) |

## What Was Built

**Task 1 — Backend filter:**
- Added `listQuerySchema` with `z.string().uuid().optional()` for the `consultancy_id` query param
- GET handler validates the param before hitting Supabase; returns 400 on invalid UUID format
- Query chain builds base query then conditionally appends `.eq('consultancy_id', ...)` — no param means all sessions for the user (unchanged behavior)

**Task 2 — Frontend API module:**
- `MeetingSession` interface covers all columns from migrations 027 + 028 (including `formatted_transcript`, `summary`, `speakers`)
- `status` field typed as a strict union of 6 values matching the DB CHECK constraint
- `meetingKeys` object provides React Query cache key hierarchy: `all` and `byConsultancy(id)`
- `listMeetings(consultancyId)` calls `GET /api/meetings?consultancy_id=` via the `client` wrapper
- `createMeeting(payload)` calls `POST /api/meetings` with JSON body

## Deviations from Plan

None — plan executed exactly as written.

## Verification

```
Backend TypeScript: OK (npx tsc --noEmit — no errors)
Frontend TypeScript: OK (npx tsc --noEmit — no errors)
Exports verified: MeetingSession, CreateMeetingPayload, listMeetings, createMeeting, meetingKeys
Backend consultancy_id filter: present in GET handler with Zod validation
```

## Self-Check

- [x] `frontend/src/api/meetings.ts` — created
- [x] `backend/src/routes/meetings.ts` — modified
- [x] Commit 5b2ef35 exists
- [x] Commit accd426 exists
- [x] Both TypeScript compilations pass
- [x] 5 exports present in meetings.ts

## Self-Check: PASSED
