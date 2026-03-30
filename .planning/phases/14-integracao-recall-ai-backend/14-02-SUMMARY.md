---
phase: 14-integracao-recall-ai-backend
plan: "02"
subsystem: backend-webhooks
tags: [recall-ai, webhook, hmac, transcript, meeting]
requires: [14-01]
provides: [recall-webhook-receiver]
affects: [meeting_sessions, meeting_transcripts]
tech-stack:
  added: []
  patterns: [HMAC-SHA256 timingSafeEqual, webhook route isolation, terminal state guard]
key-files:
  created:
    - backend/src/routes/webhooks/recall.ts
  modified:
    - backend/src/app.ts
decisions:
  - "Recall webhook mounted at /api/webhooks/recall BEFORE generic /:provider handler to prevent route capture"
  - "Terminal state guard: UPDATE WHERE status NOT IN (done, error) prevents status regression"
  - "started_at only set when transitioning to in_call and started_at IS NULL — safe for out-of-order events"
  - "Unknown Recall events return 200 with ignored:true to prevent Recall.ai retry storms"
  - "HMAC verification skipped in non-production when RECALL_WEBHOOK_SECRET missing — dev-friendly"
metrics:
  duration: "2 min"
  completed_date: "2026-03-30"
  tasks_completed: 1
  files_modified: 2
---

# Phase 14 Plan 02: Recall.ai Webhook Receiver Summary

**One-liner:** HMAC-SHA256 webhook receiver for Recall.ai that persists raw transcripts into meeting_transcripts and updates meeting_sessions status with terminal state protection.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Recall.ai webhook receiver with HMAC and transcript storage | cb3c9ca | backend/src/routes/webhooks/recall.ts (new), backend/src/app.ts (modified) |

## What Was Built

### backend/src/routes/webhooks/recall.ts

Webhook receiver for Recall.ai events:

- `verifyRecallSignature()`: HMAC-SHA256 with `crypto.timingSafeEqual` — same security pattern as existing payment webhooks. Uses `x-recall-signature` header and `RECALL_WEBHOOK_SECRET` env var.
- `RECALL_STATUS_MAP`: Maps Recall.ai bot statuses to internal session statuses: `joining→joining`, `in_call_not_recording|in_call_recording→in_call`, `call_ended→processing`, `done→done`, `error|fatal→error`.
- `transcript.data` handler: Looks up session by `recall_bot_id`, concatenates `words[].text` to `raw_text`, inserts into `meeting_transcripts` with session_id, speaker, words (jsonb), raw_text, timestamp.
- `bot.status_change` handler: Maps status, reads current session state, skips terminal sessions in-process, applies UPDATE with `.not('status', 'in', '("done","error")')` guard, conditionally sets `started_at` and `ended_at`.
- Unknown events: returns `{ ok: true, ignored: true }` — never 4xx to prevent Recall retry loops.

### backend/src/app.ts

Added import for `recallWebhookRouter` and mounted it at `/api/webhooks/recall` with `webhookLimit` — positioned immediately before the existing `app.use('/api/webhooks', webhookLimit, webhooksRouter)` to prevent the generic `/:provider` param handler from capturing Recall traffic.

## Deviations from Plan

None — plan executed exactly as written.

## Verification Results

Automated check: PASS
```
grep -q "verifyRecallSignature" backend/src/routes/webhooks/recall.ts
grep -q "recallWebhookRouter" backend/src/app.ts
grep -q "meeting_transcripts" backend/src/routes/webhooks/recall.ts
grep -q "bot.status_change" backend/src/routes/webhooks/recall.ts
```

TypeScript: `npx tsc --noEmit` — zero errors.

Mount order confirmed:
- Line 127: `app.use('/api/webhooks/recall', webhookLimit, recallWebhookRouter)`
- Line 128: `app.use('/api/webhooks', webhookLimit, webhooksRouter)`

## Self-Check: PASSED

- [x] `backend/src/routes/webhooks/recall.ts` exists
- [x] Commit `cb3c9ca` exists in git log
- [x] TypeScript compiles clean
- [x] `recallWebhookRouter` mounted before generic webhooks handler
