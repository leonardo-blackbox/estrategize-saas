---
phase: 05-admin-ia-global
plan: "02"
subsystem: admin-ia-ui
tags: [frontend, admin, knowledge, react-query, micro-modules, typescript]
dependency_graph:
  requires: [Plan 05-01 — knowledge API client + types, Plan 10 — knowledgeService embeddings]
  provides: [/admin/ia page UI with upload, document list, and AI test query panel]
  affects: []
tech_stack:
  added: []
  patterns: [3-layer architecture (aggregator + micro-modules), React Query direct hooks in aggregator, CSS variable tokens]
key_files:
  created:
    - frontend/src/features/admin/components/AdminIAPage/DocumentUploadArea.tsx
    - frontend/src/features/admin/components/AdminIAPage/DocumentList.tsx
    - frontend/src/features/admin/components/AdminIAPage/DocumentRow.tsx
    - frontend/src/features/admin/components/AdminIAPage/TestQueryPanel.tsx
  modified:
    - frontend/src/features/admin/components/AdminIAPage/AdminIAPage.tsx
decisions:
  - "AdminIAPage rewritten as direct React Query aggregator — drops useKnowledge hook in favour of inline useQuery + useMutation to align with plan spec and expose queryKey admin-knowledge-documents for cache control"
  - "DocumentUploadArea validates file extension client-side before calling onUpload — inline error text avoids modal overhead"
  - "deletingId tracked in aggregator state (not mutation variable) for per-row isDeleting prop isolation"
metrics:
  duration: "~6 min"
  completed_date: "2026-03-30"
  tasks_completed: 2
  files_modified: 5
---

# Phase 05 Plan 02: AdminIAPage UI Summary

Admin interface for /admin/ia — upload methodology documents, view indexing status, delete documents, and test AI responses using the knowledge base. Built with 4 micro-modules + 1 aggregator following the 3-layer architecture.

## Tasks Completed

| # | Task | Commit | Files |
|---|------|--------|-------|
| 1 | Micro-modules (DocumentUploadArea, DocumentList, DocumentRow, TestQueryPanel) | 93cd2e3 | 4 new files |
| 2 | AdminIAPage aggregator with React Query hooks | 3fe3d3c | AdminIAPage.tsx rewritten |

## What Was Built

### Micro-modules (Task 1)

- `DocumentUploadArea.tsx` (69 lines) — drag-and-drop / click upload zone with `.pdf/.txt/.md` extension validation. Shows spinner + "Enviando..." during upload. Inline error for invalid file types.
- `DocumentRow.tsx` (63 lines) — single document row with document icon, name, status badge (amber=Processando / emerald=Pronto / red=Erro with spinning indicator for processing), chunk count when ready, and ghost delete button.
- `DocumentList.tsx` (31 lines) — maps `KnowledgeDocument[]` to `DocumentRow` with per-row `isDeleting` prop; empty state "Nenhum documento adicionado ainda."
- `TestQueryPanel.tsx` (75 lines) — textarea (3 rows) + submit button (disabled while empty/loading) + AI response card with answer text + bullet-list sources + error display.

### Aggregator (Task 2)

- `AdminIAPage.tsx` (124 lines) — replaces old `useKnowledge` hook pattern with direct React Query hooks:
  - `useQuery({ queryKey: ['admin-knowledge-documents'], queryFn: adminListDocuments })`
  - `useMutation` for upload (invalidates on success)
  - `useMutation` for delete (clears `deletingId`, invalidates on success)
  - `useMutation` for test query (sets `testResult` or `testError` on success/error)
- Motion stagger variants (`staggerContainer` / `staggerItem`) applied to header, upload area, documents section, and test panel
- Loading: 3 skeleton rows (animate-pulse); Error: red card with message; Empty: delegated to DocumentList

## Decisions Made

- **Direct React Query in aggregator** — plan specifies useQuery/useMutation directly in AdminIAPage rather than delegating to a custom hook. Keeps the plan's queryKey explicit and avoids wrapping boilerplate.
- **deletingId in aggregator state** — tracks which document ID is currently being deleted so DocumentRow receives a scoped `isDeleting` boolean, preventing all rows from showing loading simultaneously.
- **File type validation in DocumentUploadArea** — extension check before calling `onUpload` gives immediate feedback without requiring a round-trip to the API.

## Deviations from Plan

None — plan executed exactly as written.

## Self-Check: PASSED

All 4 new micro-module files exist on disk. Both task commits (93cd2e3, 3fe3d3c) confirmed in git log. `npx tsc --noEmit` produces no errors. No horizontal imports between micro-modules. AdminIAPage under 200 lines, all micro-modules under 80 lines.
