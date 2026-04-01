---
phase: 24-helena-frontend
plan: "02"
subsystem: frontend
tags: [admin, helena, plugin, knowledge-base, config, analytics]
dependency_graph:
  requires: [24-01]
  provides: [AdminHelenaPage, adminHelena API client, /admin/plugins/helena route]
  affects: [App.tsx routing, admin navigation]
tech_stack:
  added: []
  patterns: [React Query useQuery/useMutation, 3-layer component architecture, stagger motion, accessible toggle switches]
key_files:
  created:
    - frontend/src/api/adminHelena.ts
    - frontend/src/features/admin/components/AdminHelenaPage/AdminHelenaPageContent.tsx
    - frontend/src/features/admin/components/AdminHelenaPage/HelenaKnowledgeSection.tsx
    - frontend/src/features/admin/components/AdminHelenaPage/HelenaWindowConfigSection.tsx
    - frontend/src/features/admin/components/AdminHelenaPage/HelenaTesterSection.tsx
    - frontend/src/features/admin/components/AdminHelenaPage/HelenaAnalyticsSection.tsx
    - frontend/src/features/admin/components/AdminHelenaPage/index.ts
    - frontend/src/pages/admin/AdminHelenaPage.tsx
  modified:
    - frontend/src/App.tsx
decisions:
  - "Reused DocumentRow + DocumentUploadArea from AdminIAPage directly — no duplication"
  - "ToggleRow rendered via WINDOWS array map to stay within 80-line micro-module limit"
  - "fetchHelenaAnalytics returns null (not throws) on any error — 404 graceful handling at API layer"
  - "uploadHelenaDocument uses raw fetch with FormData + auth token — same pattern as knowledge.ts"
  - "configMutation sends key/value pairs individually matching existing PUT /api/admin/plugins/:slug/config contract"
metrics:
  duration: "~25 minutes"
  completed: "2026-04-01"
  tasks_completed: 3
  files_created: 8
  files_modified: 1
---

# Phase 24 Plan 02: AdminHelenaPage Frontend Summary

**One-liner:** Helena admin page with 4 sections (knowledge base, window config with accessible toggles, transcript tester, analytics KPIs) wired at `/admin/plugins/helena` using 3-layer architecture and React Query.

## Tasks Completed

| Task | Description | Commit |
|------|-------------|--------|
| 1 | adminHelena.ts API client — 8 exports, graceful analytics null | 214ccc0 |
| 2 | 4 micro-modules + AdminHelenaPageContent aggregator + page shell | 2802f02 |
| 3 | Route /admin/plugins/helena wired in App.tsx | 42002cc |

## What Was Built

### Task 1 — API Client (`adminHelena.ts`)

Exports: `helenaPluginKeys`, `fetchHelenaDocuments`, `uploadHelenaDocument`, `deleteHelenaDocument`, `fetchHelenaConfig`, `saveHelenaConfig`, `testHelena`, `fetchHelenaAnalytics`.

Key patterns:
- `uploadHelenaDocument` uses raw `fetch` with FormData — avoids Content-Type conflict with multipart
- `fetchHelenaAnalytics` returns `null` on any error (not throws) — UI handles gracefully
- `saveHelenaConfig` sends `{ key, value }` pairs matching the existing plugin config PUT contract

### Task 2 — Components

**HelenaKnowledgeSection** (62 lines): Reuses `DocumentRow` and `DocumentUploadArea` from `AdminIAPage` directly. Shows skeleton loading, error state, empty state, and document list.

**HelenaWindowConfigSection** (59 lines): Uses a `WINDOWS` constant array mapped to toggle rows, keeping line count under 80. Toggle switches use `role="switch"` and `aria-checked` for accessibility. Mid interval selector shows only when `mid_enabled` is true.

**HelenaTesterSection** (58 lines): Internal `useState` for textarea value, calls `onTest` prop. Shows JSON result in `<pre>` block.

**HelenaAnalyticsSection** (53 lines): 4 KPI cards with skeleton loading. When `analytics` is null (404/error): shows "--" values and "Analytics disponivel em breve" note.

**AdminHelenaPageContent** (136 lines): Sole holder of React Query state — 3 useQuery calls (documents, config, analytics) + 4 useMutations (upload, delete, config, test). Renders sections with stagger motion and border-t separators.

**AdminHelenaPage** (2 lines): Page shell re-exporting aggregator.

### Task 3 — Route

Route `/admin/plugins/helena` added inside `AdminRoute` wrapper in `App.tsx`, placed after the existing `/admin/plugins` route.

## Deviations from Plan

None — plan executed exactly as written.

## Self-Check

### Files Exist

- [x] `frontend/src/api/adminHelena.ts`
- [x] `frontend/src/features/admin/components/AdminHelenaPage/AdminHelenaPageContent.tsx`
- [x] `frontend/src/features/admin/components/AdminHelenaPage/HelenaKnowledgeSection.tsx`
- [x] `frontend/src/features/admin/components/AdminHelenaPage/HelenaWindowConfigSection.tsx`
- [x] `frontend/src/features/admin/components/AdminHelenaPage/HelenaTesterSection.tsx`
- [x] `frontend/src/features/admin/components/AdminHelenaPage/HelenaAnalyticsSection.tsx`
- [x] `frontend/src/features/admin/components/AdminHelenaPage/index.ts`
- [x] `frontend/src/pages/admin/AdminHelenaPage.tsx`

### Commits Exist

- [x] 214ccc0 — feat(24-02): add adminHelena API client
- [x] 2802f02 — feat(24-02): add AdminHelenaPage components
- [x] 42002cc — feat(24-02): wire /admin/plugins/helena route

### Size Constraints Met

- Aggregator (AdminHelenaPageContent): 136 lines ≤ 200 ✓
- HelenaKnowledgeSection: 62 lines ≤ 80 ✓
- HelenaWindowConfigSection: 59 lines ≤ 80 ✓
- HelenaTesterSection: 58 lines ≤ 80 ✓
- HelenaAnalyticsSection: 53 lines ≤ 80 ✓
- AdminHelenaPage (shell): 2 lines ≤ 20 ✓

### TypeScript

- Zero errors across all modified files (`npx tsc --noEmit` clean)

## Self-Check: PASSED
