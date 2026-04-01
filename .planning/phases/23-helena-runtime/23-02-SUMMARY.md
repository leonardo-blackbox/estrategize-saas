---
phase: 23-helena-runtime
plan: "02"
subsystem: helena-http-layer
tags: [webhook, sse, real-time, helena, recall]
dependency_graph:
  requires: [23-01]
  provides: [helena-sse-endpoint, recall-partial-data-handler]
  affects: [meetings-api, recall-webhook]
tech_stack:
  added: []
  patterns: [SSE, fire-and-forget, EventEmitter, buffer-lifecycle]
key_files:
  created:
    - backend/src/routes/helenaSSE.ts
  modified:
    - backend/src/routes/webhooks/recall.ts
    - backend/src/app.ts
decisions:
  - "transcript.partial_data handler placed before transcript.data in if-else chain to ensure partial events are captured before complete utterances"
  - "maybeProcess called synchronously fire-and-forget (not awaited) so webhook responds to Recall.ai within milliseconds"
  - "Buffer lazy-init on first partial_data as fallback to in_call init, supporting bots that miss the in_call event"
  - "SSE endpoint returns 204 (not error) for terminal-state sessions to allow graceful client handling"
  - "sessionId cast as string for EventEmitter API compatibility (Express params typed as string | string[])"
metrics:
  duration: "~15 minutes"
  completed: "2026-04-01"
  tasks_completed: 2
  files_modified: 3
---

# Phase 23 Plan 02: Helena HTTP Layer Summary

Wired the Helena runtime engine (Plan 01) to the HTTP layer: Recall.ai webhook now feeds live transcript segments into the buffer, and a new SSE endpoint streams Helena reports to authenticated clients in real time.

## Tasks Completed

| # | Name | Commit | Key Files |
|---|------|--------|-----------|
| 1 | Add transcript.partial_data + buffer lifecycle to recall webhook | eb4f01d | backend/src/routes/webhooks/recall.ts |
| 2 | SSE endpoint + app.ts route registration | 69a5e17 | backend/src/routes/helenaSSE.ts, backend/src/app.ts |

## What Was Built

### Task 1 — recall.ts webhook (3 changes)

**Change 1 — Imports added:**
```typescript
import { initBuffer, append, removeBuffer, getBuffer } from '../../services/liveTranscriptBuffer.js';
import { maybeProcess } from '../../services/helenaService.js';
```

**Change 2 — `transcript.partial_data` handler (lines 104-150):**
- Placed BEFORE `transcript.data` in the if-else chain
- Normalizes Recall.ai word objects to `{ text, start_time, end_time, speaker }`
- Lazy buffer init: if buffer not yet created, queries `meeting_sessions` for `consultancy_id`/`user_id`, calls `initBuffer`
- Skips silently if no consultancy linked (Helena cannot operate without context)
- Calls `append(botId, normalized)` then `maybeProcess(botId)` — NOT awaited

**Change 3 — Buffer lifecycle hooks in `bot.*` handlers:**
- `in_call` status: calls `initBuffer` if `consultancy_id` present (eager init)
- `done`/`error` status: calls `removeBuffer` (in both the status update block and the bot.done pipeline block)
- Updated `meeting_sessions` select from `id, status, started_at` to `id, status, started_at, user_id, consultancy_id`

### Task 2 — helenaSSE.ts route + app.ts

**New route `GET /api/meetings/:sessionId/helena`:**
- `router.use(requireAuth)` — all routes require authentication
- Queries `meeting_sessions` with `eq('user_id', userId)` — enforces ownership
- Returns `204` if session is already `done` or `error`
- Sets SSE headers: `Content-Type: text/event-stream`, `Cache-Control: no-cache`, `Connection: keep-alive`, `X-Accel-Buffering: no`
- Writes initial `data: {"type":"connected","sessionId":"..."}` event
- Subscribes `helenaEmitter.on(sessionId, onReport)` — streams `HelenaReport` JSON
- `setInterval` heartbeat every 30s: writes `: heartbeat\n\n` (SSE comment, not data)
- `req.on('close', ...)`: calls `helenaEmitter.off` and `clearInterval(heartbeat)`

**app.ts registration:**
```typescript
import helenaSSERouter from './routes/helenaSSE.js';
// ...
app.use('/api/meetings', helenaSSERouter); // after meetingsRouter
```

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed TypeScript error: `string | string[]` not assignable to EventEmitter key**
- **Found during:** TypeScript check after Task 2
- **Issue:** `req.params.sessionId` is typed as `string | string[]` in Express, but `EventEmitter.on/off` expects `string | symbol`
- **Fix:** Changed destructuring `const { sessionId } = req.params` to explicit cast `const sessionId = req.params.sessionId as string`
- **Files modified:** `backend/src/routes/helenaSSE.ts`
- **Commit:** Included in 69a5e17 (fix applied before commit)

## Acceptance Criteria — Final Verification

| Criterion | Status |
|-----------|--------|
| `transcript.partial_data` block before `transcript.data` (lines 105 vs 152) | PASS |
| `import { initBuffer, append, removeBuffer, getBuffer }` in recall.ts | PASS |
| `import { maybeProcess }` in recall.ts | PASS |
| `maybeProcess(botId)` NOT awaited | PASS |
| `removeBuffer(botId)` present 3x (terminal update, bot.done block) | PASS |
| `initBuffer(botId` present 3x (in_call eager, partial_data lazy, import) | PASS |
| `text/event-stream` content type in helenaSSE.ts | PASS |
| `helenaEmitter.on` and `helenaEmitter.off` in helenaSSE.ts | PASS |
| `heartbeat` setInterval in helenaSSE.ts | PASS |
| `req.on.*close` cleanup in helenaSSE.ts | PASS |
| `requireAuth` applied in helenaSSE.ts | PASS |
| `import helenaSSERouter` in app.ts | PASS |
| `app.use('/api/meetings', helenaSSERouter)` in app.ts | PASS |
| `res.write.*data:` at least 2 matches (connected + report) | PASS |
| TypeScript compiles with 0 errors | PASS |

## Self-Check: PASSED

- `backend/src/routes/helenaSSE.ts` — FOUND
- `backend/src/routes/webhooks/recall.ts` — FOUND (modified)
- `backend/src/app.ts` — FOUND (modified)
- `.planning/phases/23-helena-runtime/23-02-SUMMARY.md` — FOUND
- Commit eb4f01d — FOUND
- Commit 69a5e17 — FOUND
