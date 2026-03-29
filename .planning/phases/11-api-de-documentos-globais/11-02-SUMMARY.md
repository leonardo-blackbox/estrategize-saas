---
phase: 11-api-de-documentos-globais
plan: "02"
subsystem: frontend-admin
tags: [knowledge, rag, admin, react-query, upload]
dependency_graph:
  requires: [11-01]
  provides: [admin-knowledge-ui]
  affects: [AdminIAPage]
tech_stack:
  added: []
  patterns: [React Query useQuery/useMutation, FormData raw fetch for multipart, 3-layer architecture]
key_files:
  created:
    - frontend/src/features/admin/services/knowledge.api.ts
    - frontend/src/features/admin/hooks/useKnowledge.ts
    - frontend/src/features/admin/components/AdminIAPage/KnowledgeUpload.tsx
    - frontend/src/features/admin/components/AdminIAPage/KnowledgeList.tsx
  modified:
    - frontend/src/features/admin/components/AdminIAPage/AdminIAPage.tsx
decisions:
  - "Raw fetch with FormData used for upload to avoid JSON Content-Type header that client.post would set"
  - "STATUS_CONFIG lookup object in KnowledgeList colocates label + className per status (processing/ready/error)"
  - "KnowledgeList helper functions (formatFileSize, formatDate) defined at module level, not inside component"
metrics:
  duration: "3 min"
  completed: "2026-03-29"
  tasks_completed: 2
  files_modified: 5
requirements: [KNWL-02, KNWL-06]
---

# Phase 11 Plan 02: Admin Knowledge Management UI Summary

**One-liner:** React Query-powered AdminIAPage with drag-drop upload zone and document list showing processing/ready/error status badges connected to /api/admin/knowledge.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | API client + React Query hook for knowledge | 54f8faa | knowledge.api.ts, useKnowledge.ts |
| 2 | AdminIAPage aggregator + KnowledgeUpload + KnowledgeList micro-modules | 0e51ae4 | AdminIAPage.tsx, KnowledgeUpload.tsx, KnowledgeList.tsx |

## What Was Built

- **knowledge.api.ts** (43 lines): `KnowledgeDocument` interface + 3 API functions. Upload uses raw `fetch` with `FormData` to avoid the JSON `Content-Type` header that `client.post` would inject.
- **useKnowledge.ts** (43 lines): React Query hook wrapping all three API functions. `useQuery` for list, two `useMutation`s for upload and delete, both invalidate `['admin-knowledge']` on success.
- **KnowledgeUpload.tsx** (72 lines): Drag-drop zone with visual highlight on drag-over. Accepts `.pdf,.txt,.md`. Hidden file input triggered on click. Spinner + "Processando..." during upload with pointer-events disabled.
- **KnowledgeList.tsx** (74 lines): Skeleton loading (3 pulse rows), empty state message, document rows with file type/size/chunks/date metadata. Status badges: amber "Processando", emerald "Indexado", red "Erro". Delete button disabled while processing.
- **AdminIAPage.tsx** (26 lines): Aggregator composing hook + micro-modules with "Base de Conhecimento" header and subtitle.

## Architecture Compliance

All layers within size limits:
- Page (AdminIAPage route): 1 line (re-export)
- Aggregator (AdminIAPage.tsx): 26 lines (limit: 200)
- Micro-modules: KnowledgeUpload 72L, KnowledgeList 74L (limit: 80 each)
- Hook: useKnowledge 43L (limit: 120)
- Service: knowledge.api.ts 43L (limit: 150)

No micro-module imports another micro-module. No API calls in visual components.

## Deviations from Plan

None — plan executed exactly as written.

## Self-Check

- [x] `frontend/src/features/admin/services/knowledge.api.ts` — exists
- [x] `frontend/src/features/admin/hooks/useKnowledge.ts` — exists
- [x] `frontend/src/features/admin/components/AdminIAPage/KnowledgeUpload.tsx` — exists
- [x] `frontend/src/features/admin/components/AdminIAPage/KnowledgeList.tsx` — exists
- [x] `frontend/src/features/admin/components/AdminIAPage/AdminIAPage.tsx` — modified
- [x] Task 1 commit: 54f8faa
- [x] Task 2 commit: 0e51ae4
- [x] TypeScript: zero errors

## Self-Check: PASSED
