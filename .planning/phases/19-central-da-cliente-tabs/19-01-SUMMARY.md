---
phase: 19-central-da-cliente-tabs
plan: "01"
subsystem: frontend/consultorias
tags: [tabs, navigation, memory, ui-refactor]
dependency_graph:
  requires: []
  provides: [canonical-tab-order, memory-tab]
  affects: [ConsultoriaDetailPage, ConsultoriaDetailMemory, consultorias.detail.types]
tech_stack:
  added: []
  patterns: [feature-based-components, micro-module-grid-layout]
key_files:
  created: []
  modified:
    - frontend/src/features/consultorias/consultorias.detail.types.ts
    - frontend/src/features/consultorias/components/ConsultoriaDetailPage/ConsultoriaDetailPage.tsx
    - frontend/src/features/consultorias/components/ConsultoriaDetailMemory/ConsultoriaDetailMemory.tsx
decisions:
  - TabKey reduced from 12 to 9 — removed jornada/mercado/conteudo/financeiro as they are no longer in roadmap
  - TABS order follows user workflow: overview → ai → meetings → documentos → diagnosis → actions → deliverables → memory → dados
  - ConsultoriaDetailMemory sidebar sizing (lg:w-80) removed; grid-cols-1/2/3 used for full-width responsive layout
metrics:
  duration: "~5 min"
  completed_date: "2026-03-30"
  tasks_completed: 2
  files_modified: 3
---

# Phase 19 Plan 01: Reorganizar Tabs da Central da Cliente

**One-liner:** 9 tabs na ordem correta com Memória IA dedicada e layout full-width responsivo.

## What Was Built

Reorganized the consultoria detail tab system from 12 tabs (with 4 unused placeholder tabs) to 9 canonical tabs in workflow-logical order. Added a dedicated "Memória IA" tab that renders `ConsultoriaDetailMemory` as a full-width responsive grid instead of the previous narrow sidebar.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Reorder TabKey type, TABS array, and update page routing | 79f67c4 | consultorias.detail.types.ts, ConsultoriaDetailPage.tsx |
| 2 | Adapt ConsultoriaDetailMemory from sidebar to full-width | f4b110f | ConsultoriaDetailMemory.tsx |

## Verification Results

- `tsc --noEmit` passes with zero errors
- `npm run build --prefix frontend` succeeds (✓ built in 14.03s)
- No references to removed tab keys (jornada, mercado, conteudo, financeiro) in types file
- Tab bar shows exactly 9 tabs in correct order
- Memory items render in 1/2/3 column responsive grid

## Deviations from Plan

None — plan executed exactly as written.

## Self-Check: PASSED

- [x] `frontend/src/features/consultorias/consultorias.detail.types.ts` — modified, exists
- [x] `frontend/src/features/consultorias/components/ConsultoriaDetailPage/ConsultoriaDetailPage.tsx` — modified, exists
- [x] `frontend/src/features/consultorias/components/ConsultoriaDetailMemory/ConsultoriaDetailMemory.tsx` — modified, exists
- [x] Commit 79f67c4 exists (Task 1)
- [x] Commit f4b110f exists (Task 2)
