---
phase: 12-api-de-documentos-por-consultoria
plan: "01"
subsystem: backend
tags: [knowledge, documents, consultancy, upload, embeddings]
dependency_graph:
  requires:
    - knowledgeService (parseFile, chunkText, generateEmbeddings, deleteDocument, getDocumentsByScope)
    - consultancyService (getConsultancy — ownership check)
    - middleware/auth (requireAuth)
    - lib/supabaseAdmin (DB writes)
  provides:
    - GET /api/consultancies/:consultancyId/documents
    - POST /api/consultancies/:consultancyId/documents
    - DELETE /api/consultancies/:consultancyId/documents/:docId
  affects:
    - backend/src/app.ts (route registration)
tech_stack:
  added: []
  patterns:
    - "Background IIFE for async file processing (same as admin/knowledge.ts)"
    - "mergeParams: true for nested Router param inheritance"
    - "Ownership verification via getConsultancy before every handler"
key_files:
  created:
    - backend/src/routes/consultancyDocuments.ts
  modified:
    - backend/src/app.ts
decisions:
  - "mergeParams: true on Router so :consultancyId from app.ts mount is accessible in handlers"
  - "Ownership check (getConsultancy) placed at top of each handler before any DB write — prevents cross-consultancy data leaks"
  - "authLimit (not adminLimit) — these are member routes"
  - "Background IIFE pattern mirrors admin/knowledge.ts exactly — returns 201 with status=processing then processes async"
metrics:
  duration: "2 minutes"
  completed_date: "2026-03-30"
  tasks_completed: 2
  files_changed: 2
---

# Phase 12 Plan 01: Member Consultancy Documents API Summary

**One-liner:** Express member routes for consultancy-scoped document upload, list, and delete with ownership verification and async background embedding pipeline.

## What Was Built

Three REST endpoints under `/api/consultancies/:consultancyId/documents`:

| Endpoint | Method | Description |
|---|---|---|
| `/api/consultancies/:consultancyId/documents` | GET | List documents filtered by consultancy + user |
| `/api/consultancies/:consultancyId/documents` | POST | Upload file, insert record with `scope=consultancy`, fire background IIFE |
| `/api/consultancies/:consultancyId/documents/:docId` | DELETE | Remove document if user owns consultancy |

All three routes enforce `requireAuth` and verify consultancy ownership via `getConsultancy(userId, consultancyId)` before proceeding. A 404 is returned if the consultancy does not belong to the requesting user.

## Tasks Completed

| # | Task | Commit | Files |
|---|---|---|---|
| 1 | Create consultancy documents route file | 4138bed | backend/src/routes/consultancyDocuments.ts (created) |
| 2 | Register consultancy documents route in app.ts | 15864d9 | backend/src/app.ts (modified) |

## Key Implementation Details

**consultancyDocuments.ts** mirrors `admin/knowledge.ts` exactly for:
- Multer config (memoryStorage, 10MB limit, ALLOWED_MIME_TYPES with octet-stream fallback)
- `resolveFileType` helper
- Background IIFE: `parseFile → chunkText → generateEmbeddings → insert chunks → update status ready`
- Error path: `update status error + error_message`

**Differences from admin route:**
- Uses `requireAuth` only (NOT `requireAdmin`) — member-facing
- `Router({ mergeParams: true })` — `:consultancyId` comes from the parent mount path
- Every handler calls `getConsultancy(userId, consultancyId)` first
- Insert sets `scope: 'consultancy'` and `consultancy_id: consultancyId`
- Chunk metadata: `{ scope: 'consultancy', consultancy_id: consultancyId, document_name }`

## Deviations from Plan

None — plan executed exactly as written.

## Self-Check: PASSED

- backend/src/routes/consultancyDocuments.ts — FOUND
- Commit 4138bed (Task 1) — FOUND
- Commit 15864d9 (Task 2) — FOUND
