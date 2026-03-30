---
phase: 17-lista-de-consultorias-com-kpis
plan: "01"
subsystem: frontend/consultorias
tags: [feature, ui, filter, consultorias]
dependency_graph:
  requires: []
  provides: [StatusFilter type, statusFilterLabels, useDebounce hook, instagram display in card, status filter pills]
  affects: [ConsultoriaCard, ConsultoriasFilterBar, ConsultoriasPage, useConsultorias]
tech_stack:
  added: []
  patterns: [useDebounce generic hook extraction, pillBase/pillActive/pillInactive constants for DRY pill rendering]
key_files:
  created:
    - frontend/src/hooks/useDebounce.ts
  modified:
    - frontend/src/features/consultorias/consultorias.helpers.ts
    - frontend/src/features/consultorias/hooks/useConsultorias.ts
    - frontend/src/features/consultorias/components/ConsultoriaCard/ConsultoriaCard.tsx
    - frontend/src/features/consultorias/components/ConsultoriasFilterBar/ConsultoriasFilterBar.tsx
    - frontend/src/features/consultorias/components/ConsultoriasPage/ConsultoriasPage.tsx
decisions:
  - "useDebounce extracted to src/hooks/ (used by 1 feature currently) anticipating reuse; removes inline debounce pattern from useConsultorias to stay within 120-line limit"
  - "pillBase/pillActive/pillInactive module-level constants in ConsultoriasFilterBar DRY both pill rows without extra abstraction"
  - "hasSearch broadened to include statusFilter and phaseFilter checks so any active filter triggers the filtered-empty-state message"
metrics:
  duration_minutes: 3
  completed_date: "2026-03-30"
  tasks_completed: 2
  files_changed: 6
requirements_completed: [CONS-01, CONS-02]
---

# Phase 17 Plan 01: Instagram handle in card + status filter pills

One-liner: Added @instagram display in ConsultoriaCard and status pills (Todas/Em risco/Alta prioridade) in FilterBar with hook-level filtering and a shared useDebounce extraction.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Extract useDebounce, add StatusFilter to helpers and hook | a9c81f3 | useDebounce.ts (new), consultorias.helpers.ts, useConsultorias.ts |
| 2 | Display @instagram in card, add status pills in FilterBar | 9f428b6 | ConsultoriaCard.tsx, ConsultoriasFilterBar.tsx, ConsultoriasPage.tsx |

## What Was Built

### useDebounce.ts (new)
Generic debounce hook extracted from the inline `useEffect`/`useRef` pattern in `useConsultorias`. Lives in `src/hooks/` per the "2 consumers" rule anticipation. Reduces `useConsultorias` by ~8 lines to stay within the 120-line limit.

### consultorias.helpers.ts
Added `StatusFilter` type (`'all' | 'at_risk' | 'high'`) and `statusFilterLabels` array with three entries (Todas, Em risco, Alta prioridade).

### useConsultorias.ts
- Removed inline debounce; imported `useDebounce` from `src/hooks/useDebounce.ts`
- Added `statusFilter`/`setStatusFilter` state
- Added `.filter((c) => statusFilter === 'all' || c.priority === statusFilter)` step in the filtered pipeline — AND logic with phaseFilter
- Returns both new values; file is 117 lines (within 120-line limit)

### ConsultoriaCard.tsx
Renders `@{c.instagram}` between `client_name` and `title` when `c.instagram` is not null. 79 lines (within 80-line limit).

### ConsultoriasFilterBar.tsx
- Props interface updated with `statusFilter` + `onStatusFilterChange`
- Added status pills row below phase pills row
- Extracted `pillBase`/`pillActive`/`pillInactive` constants for DRY rendering of both pill rows
- 61 lines (within 80-line limit)

### ConsultoriasPage.tsx
- Destructures `statusFilter`/`setStatusFilter` from `useConsultorias()`
- Passes them as props to `<ConsultoriasFilterBar>`
- `hasSearch` now `!!debouncedSearch || statusFilter !== 'all' || phaseFilter !== 'all'`

## Deviations from Plan

None - plan executed exactly as written.

## Self-Check: PASSED

Files created/modified:
- FOUND: frontend/src/hooks/useDebounce.ts
- FOUND: frontend/src/features/consultorias/consultorias.helpers.ts
- FOUND: frontend/src/features/consultorias/hooks/useConsultorias.ts
- FOUND: frontend/src/features/consultorias/components/ConsultoriaCard/ConsultoriaCard.tsx
- FOUND: frontend/src/features/consultorias/components/ConsultoriasFilterBar/ConsultoriasFilterBar.tsx
- FOUND: frontend/src/features/consultorias/components/ConsultoriasPage/ConsultoriasPage.tsx

Commits verified:
- FOUND: a9c81f3 (Task 1)
- FOUND: 9f428b6 (Task 2)

TypeScript: `npx tsc --noEmit` exits 0, zero errors.
