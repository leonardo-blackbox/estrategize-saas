---
phase: 23-helena-runtime
plan: "01"
subsystem: helena-runtime
tags: [helena, real-time, transcript, sse, gpt-4o-mini, analytics]
dependency_graph:
  requires:
    - 22-02 (knowledge routes + match_knowledge_chunks RPC with plugin scope)
    - 027_meeting_sessions.sql (meeting_sessions table)
    - consultancyContextService.ts (buildFullContext)
    - embeddingService.ts (generateEmbeddings)
  provides:
    - liveTranscriptBuffer: in-memory segment accumulation per botId
    - helenaEmitter: SSE singleton for real-time report delivery
    - helenaService.maybeProcess: synchronous window engine entry point
    - helena_events table: analytics persistence with RLS
  affects:
    - 23-02 (HTTP layer wires maybeProcess + helenaEmitter to webhook/SSE routes)
tech_stack:
  added: []
  patterns:
    - fire-and-forget async inside synchronous public API (maybeProcess)
    - EventEmitter singleton for SSE multiplexing
    - raw RAG chunks as prompt context (not queryPluginKnowledge GPT wrapper)
key_files:
  created:
    - backend/src/services/liveTranscriptBuffer.ts
    - backend/src/services/helenaSSE.ts
    - backend/src/services/helenaService.ts
    - backend/src/database/migrations/033_helena_events.sql
  modified: []
decisions:
  - "Helena RAG uses match_knowledge_chunks RPC directly (filter_scope=plugin, filter_plugin_slug=helena) — avoids extra GPT call inside queryPluginKnowledge"
  - "maybeProcess is synchronous (void) — generateAndEmit runs fire-and-forget to never block webhook response"
  - "Window priority: objection > closing > opening > mid — objection has separate lastObjectionMinute counter"
  - "helenaEmitter.setMaxListeners(50) — supports up to 50 concurrent meeting sessions"
metrics:
  duration: "~12 minutes"
  completed_date: "2026-04-01"
  tasks_completed: 2
  files_created: 4
  files_modified: 0
---

# Phase 23 Plan 01: Helena Runtime Engine Summary

**One-liner:** In-memory transcript buffer + synchronous window engine calling GPT-4o-mini fire-and-forget with EventEmitter SSE delivery and helena_events analytics table.

## What Was Built

Four files forming the core Helena runtime:

1. **liveTranscriptBuffer.ts** — In-memory Map keyed by `botId`. Exports `initBuffer`, `append`, `getBuffer`, `getClientSpeech` (filters Speaker 0 = consultora), `hasClosingLanguage`, `hasObjectionLanguage`, `removeBuffer`. Duration computed from `startedAt` epoch on every `append` call.

2. **helenaSSE.ts** — EventEmitter singleton (`helenaEmitter`) with `setMaxListeners(50)`. Events emitted by `meetingSessionId` so multiple SSE clients subscribe to the same key.

3. **helenaService.ts** — Window engine (`maybeProcess`) + report generator (`generateAndEmit`):
   - `maybeProcess`: synchronous entry point. Reads buffer state, runs keyword detection, decides window type, calls `generateAndEmit` fire-and-forget.
   - `generateAndEmit`: async, runs `buildFullContext` + Helena RAG in parallel, calls GPT-4o-mini with `response_format: json_object`, emits via `helenaEmitter`, persists to `helena_events`.
   - Window priority: objection (anti-spam per minute) > closing (per minute) > opening (once at 5 min) > mid (every 10 min).

4. **033_helena_events.sql** — `helena_events` table with RLS: admin sees all, user sees own sessions, service role inserts.

## Commits

| Hash | Description |
|------|-------------|
| `5d5ad6b` | feat(23-01): add liveTranscriptBuffer, helenaSSE, and helena_events migration |
| `7713e54` | feat(23-01): add helenaService window engine + GPT-4o-mini report generator |

## Deviations from Plan

None — plan executed exactly as written.

## Verification

- All 4 files exist and are non-empty
- Buffer exports exactly 7 functions (`grep -c "^export function"` returns 7)
- `npx tsc --noEmit` exits with no errors
- No TypeScript `any` types
- `maybeProcess` is `void` (synchronous — no `async` keyword)
- `gpt-4o-mini` used (not `gpt-4`)
- `response_format: { type: 'json_object' }` present
- `match_knowledge_chunks` RPC used directly in Helena RAG
- `buildFullContext` imported from consultancyContextService

## Self-Check: PASSED

All created files confirmed to exist on disk. Both commits confirmed in git log.
