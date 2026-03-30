---
phase: 12-api-de-documentos-por-consultoria
plan: 02
subsystem: ui
tags: [react, react-query, typescript, tailwind, formdata, file-upload]

# Dependency graph
requires:
  - phase: 12-01-api-de-documentos-por-consultoria
    provides: Backend endpoints /api/consultancies/:id/documents (GET, POST, DELETE)
provides:
  - consultancyDocuments.api.ts: API client with list/upload/delete functions
  - useConsultancyDocuments hook: React Query parameterized by consultancyId
  - ConsultoriaDocumentos micro-module: upload + list + status badges + delete
  - "Documentos" tab wired into ConsultoriaDetailPage aggregator
affects: [future-consultoria-ai-context, phase-13-plus]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Raw fetch with FormData for file uploads (no JSON Content-Type)
    - React Query hook parameterized by resource ID (consultancy-documents queryKey)
    - STATUS_CONFIG lookup object for status badge label + className

key-files:
  created:
    - frontend/src/features/consultorias/services/consultancyDocuments.api.ts
    - frontend/src/features/consultorias/hooks/useConsultancyDocuments.ts
    - frontend/src/features/consultorias/components/ConsultoriaDocumentos/ConsultoriaDocumentos.tsx
    - frontend/src/features/consultorias/components/ConsultoriaDocumentos/index.ts
  modified:
    - frontend/src/features/consultorias/consultorias.detail.types.ts
    - frontend/src/features/consultorias/components/ConsultoriaDetailPage/ConsultoriaDetailPage.tsx

key-decisions:
  - "Replace 'arquivos' placeholder tab with 'documentos' functional tab — arquivos was a placeholder for exactly this feature"
  - "TrashIcon extracted as local component in ConsultoriaDocumentos to keep SVG markup from inflating line count"
  - "STATUS_CONFIG mirrors Phase 11 admin pattern for consistent status badge styling across member and admin areas"

patterns-established:
  - "File upload pattern: raw fetch with FormData, Authorization header from useAuthStore.getState().session"
  - "Per-resource React Query hook: queryKey includes resource ID for cache isolation per consultancy"

requirements-completed: [KNWL-03, KNWL-04]

# Metrics
duration: 8min
completed: 2026-03-30
---

# Phase 12 Plan 02: API de Documentos por Consultoria — Frontend Summary

**Consultoria document upload/list/delete UI via new "Documentos" tab in ConsultoriaDetailPage, mirroring the Phase 11 admin knowledge pattern**

## Performance

- **Duration:** 8 min
- **Started:** 2026-03-30T01:12:25Z
- **Completed:** 2026-03-30T01:20:33Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments

- API service with 3 functions (list/upload/delete) targeting /api/consultancies/:id/documents backend endpoints from Phase 12-01
- React Query hook parameterized by consultancyId with query + 2 mutations, cache invalidation on success
- ConsultoriaDocumentos micro-module (67 lines) with upload button, document list, status badges (Processando/Pronto/Erro), and per-document delete
- "Documentos" tab wired into ConsultoriaDetailPage replacing the "Arquivos" coming-soon placeholder

## Task Commits

1. **Task 1: Create API service + React Query hook for consultancy documents** - `4c7e6ae` (feat)
2. **Task 2: Create ConsultoriaDocumentos micro-module and wire into tabs** - `52ef2d3` (feat)

## Files Created/Modified

- `frontend/src/features/consultorias/services/consultancyDocuments.api.ts` - API client: listConsultancyDocs, uploadConsultancyDoc (FormData), deleteConsultancyDoc
- `frontend/src/features/consultorias/hooks/useConsultancyDocuments.ts` - React Query hook with query + 2 mutations parameterized by consultancyId
- `frontend/src/features/consultorias/components/ConsultoriaDocumentos/ConsultoriaDocumentos.tsx` - Upload button + document list micro-module (67 lines)
- `frontend/src/features/consultorias/components/ConsultoriaDocumentos/index.ts` - Barrel export
- `frontend/src/features/consultorias/consultorias.detail.types.ts` - TabKey union: replaced 'arquivos' with 'documentos'; TABS array updated
- `frontend/src/features/consultorias/components/ConsultoriaDetailPage/ConsultoriaDetailPage.tsx` - Import + render ConsultoriaDocumentos on documentos tab; removed arquivos ComingSoon block

## Decisions Made

- Replaced 'arquivos' placeholder tab with 'documentos' functional tab — the arquivos coming-soon block was a placeholder for exactly this feature; no functional use case differs between them
- TrashIcon extracted as local component within the file to keep SVG markup from inflating the main component function beyond 80 lines
- STATUS_CONFIG object mirrors the Phase 11 admin KnowledgeList pattern for consistent status badge styling

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- ConsultoriaDetailPage now has a functional Documentos tab for member-facing document management
- Documents uploaded here use the same knowledge_documents table and pipeline from Phase 12-01
- Ready for Phase 13+ which can build AI context queries that include consultancy-scoped documents

---
*Phase: 12-api-de-documentos-por-consultoria*
*Completed: 2026-03-30*
