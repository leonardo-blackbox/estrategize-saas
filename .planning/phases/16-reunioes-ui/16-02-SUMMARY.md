---
phase: 16-reunioes-ui
plan: "02"
subsystem: frontend-meetings
tags: [react-query, polling, recall-ai, modal, lgpd, status-badge]
dependency_graph:
  requires:
    - 16-01  # meetings.ts API + types
  provides:
    - useMeetings hook with auto-polling
    - NewMeetingModal with LGPD consent
    - BotSessionCard with expandable transcript
    - ConsultoriaDetailMeetings aggregator (functional)
  affects:
    - frontend/src/features/consultorias/components/ConsultoriaDetailPage
tech_stack:
  added: []
  patterns:
    - prevCreating ref pattern for detecting mutation completion without onSuccess prop drilling
    - STATUS_CONFIG lookup object for badge coloring (module-level, no re-render)
    - refetchInterval callback checks terminal set for smart polling control
key_files:
  created:
    - frontend/src/features/consultorias/hooks/useMeetings.ts
    - frontend/src/features/consultorias/components/ConsultoriaDetailMeetings/NewMeetingModal.tsx
    - frontend/src/features/consultorias/components/ConsultoriaDetailMeetings/BotSessionCard.tsx
  modified:
    - frontend/src/features/consultorias/components/ConsultoriaDetailMeetings/ConsultoriaDetailMeetings.tsx
    - frontend/src/features/consultorias/components/ConsultoriaDetailPage/ConsultoriaDetailPage.tsx
decisions:
  - "prevCreating ref to detect mutation success: avoids needing to expose onSuccess via hook API or prop drilling through aggregator"
  - "STATUS_CONFIG at module level: avoids re-creating object per render; pattern consistent with Phase 09 SubscriptionCard"
  - "onNewMeeting prop made optional and removed from ConsultoriaDetailPage JSX: modal is now fully internal to aggregator"
metrics:
  duration: "2 min"
  completed_date: "2026-03-30"
  tasks_completed: 2
  files_changed: 5
---

# Phase 16 Plan 02: Reuniões Tab UI Summary

**One-liner:** React Query hook with 5s polling + 4 components (modal, card, aggregator) delivering full Recall.ai bot session UX with LGPD consent gate.

## What Was Built

### Task 1 — useMeetings hook (e9fae4f)

`frontend/src/features/consultorias/hooks/useMeetings.ts`

- `useQuery` with `meetingKeys.byConsultancy(consultancyId)` and smart `refetchInterval`: returns 5000ms when any session has a non-terminal status (`TERMINAL = new Set(['done', 'error'])`), otherwise `false` to stop polling
- `useMutation` wrapping `createMeeting`, with `onSuccess` invalidating the consultancy sessions cache
- Exports: `sessions`, `isLoading`, `error`, `createSession`, `isCreating`, `createError`

### Task 2 — Components + aggregator (544dd1b)

**NewMeetingModal.tsx** (68 lines — micro-module)
- `Modal` size="sm" with URL `Input` + LGPD checkbox
- Native `new URL()` validation: error shown on non-empty invalid URLs
- "Ativar bot" button disabled until URL valid AND `lgpdConsent=true`
- `useEffect([open])` resets state when modal closes

**BotSessionCard.tsx** (77 lines — micro-module)
- `STATUS_CONFIG` lookup with 6 variants: pending/joining/in_call/processing/done/error
- `in_call` has `pulse: true` flag → `animate-pulse` dot rendered inline
- Click toggles `expanded`; expansion section only renders when `status === 'done'`
- Expanded section shows: speakers list, summary (`whitespace-pre-wrap`), formatted_transcript (`<pre>` with `max-h-64`)
- `e.stopPropagation()` on expanded section prevents collapse on text selection

**ConsultoriaDetailMeetings.tsx** (72 lines — aggregator, replaced stub)
- Uses `useMeetings(consultancyId)`, renders `BotSessionCard` list + `NewMeetingModal`
- `prevCreating` ref detects mutation completion: when `isCreating` transitions `true → false` without `createError`, `setModalOpen(false)` is called
- Loading state: 3 skeleton `div`s with `animate-pulse`
- Empty state: 🎙️ emoji + descriptive text + secondary "Ativar bot em reunião" button

**ConsultoriaDetailPage.tsx** — removed `onNewMeeting={() => {/* modal future */}}` prop from JSX (modal is now internal)

## Deviations from Plan

None — plan executed exactly as written.

## Self-Check

### Files exist
- `frontend/src/features/consultorias/hooks/useMeetings.ts` — FOUND
- `frontend/src/features/consultorias/components/ConsultoriaDetailMeetings/NewMeetingModal.tsx` — FOUND
- `frontend/src/features/consultorias/components/ConsultoriaDetailMeetings/BotSessionCard.tsx` — FOUND
- `frontend/src/features/consultorias/components/ConsultoriaDetailMeetings/ConsultoriaDetailMeetings.tsx` — FOUND (replaced)
- `frontend/src/features/consultorias/components/ConsultoriaDetailMeetings/index.ts` — FOUND (unchanged)

### Commits exist
- e9fae4f — useMeetings hook
- 544dd1b — components + aggregator

### TypeScript
- `npx tsc --noEmit` → exit code 0, no errors

## Self-Check: PASSED
