---
phase: 11-api-de-documentos-globais
plan: "01"
subsystem: backend
tags: [knowledge, admin, api, embeddings, async]
dependency_graph:
  requires: [10-pipeline-de-embeddings/10-01]
  provides: [GET /api/admin/knowledge, POST /api/admin/knowledge, DELETE /api/admin/knowledge/:id]
  affects: [backend/src/app.ts]
tech_stack:
  added: []
  patterns: [async-fire-and-forget, multer-memory-storage, supabaseAdmin-direct-insert]
key_files:
  created:
    - backend/src/routes/admin/knowledge.ts
  modified:
    - backend/src/services/knowledgeService.ts
    - backend/src/app.ts
decisions:
  - "parseFile and chunkText exported from knowledgeService so route can use them individually without calling processDocument (which would duplicate the DB insert)"
  - "generateEmbeddings re-exported from knowledgeService via export { generateEmbeddings } for single import source in route"
  - "Background IIFE fires after res.status(201).json(document) — response is sent immediately, processing happens asynchronously"
  - "fileBuffer and originalname captured in local vars before IIFE to avoid req.file reference after response"
metrics:
  duration: "5 min"
  completed: "2026-03-29"
  tasks_completed: 2
  files_changed: 3
---

# Phase 11 Plan 01: Admin Knowledge Routes Summary

**One-liner:** Admin CRUD routes for global knowledge documents with async upload-and-process model that returns 201 immediately then runs parse/chunk/embed in a background IIFE.

## What Was Built

Three admin-protected endpoints at `/api/admin/knowledge`:

- `GET /` — Lists all global knowledge documents via `getDocumentsByScope({ scope: 'global' })`
- `POST /` — Accepts PDF/TXT/MD upload (max 10 MB), inserts a record with `status: 'processing'`, returns 201 immediately, then fires a background IIFE that parses the file, chunks text, generates embeddings, inserts `knowledge_chunks` rows, and updates document status to `'ready'` or `'error'`
- `DELETE /:id` — Calls `deleteDocument`, returns 204 on success or 404 if not found/unauthorized

All routes are protected by `requireAuth` + `requireAdmin` middleware, and rate-limited by `adminLimit` in `app.ts`.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Create admin knowledge routes with async upload model | bf8cf06 | backend/src/routes/admin/knowledge.ts, backend/src/services/knowledgeService.ts |
| 2 | Register knowledge routes in app.ts | f9c5f08 | backend/src/app.ts |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] TypeScript error on req.params.id**
- **Found during:** Task 1 verification (npx tsc --noEmit)
- **Issue:** `req.params.id` has type `string | string[]` in Express; `deleteDocument` expects `string`
- **Fix:** Used `req.params['id']` with `typeof id !== 'string'` guard before calling deleteDocument
- **Files modified:** backend/src/routes/admin/knowledge.ts
- **Commit:** bf8cf06

**2. [Rule 2 - Missing export] generateEmbeddings not in knowledgeService**
- **Found during:** Task 1 pre-step — plan required importing generateEmbeddings from knowledgeService but it was only imported internally from embeddingService
- **Fix:** Added `export { generateEmbeddings }` re-export in knowledgeService.ts so the route file has one consistent import source
- **Files modified:** backend/src/services/knowledgeService.ts
- **Commit:** bf8cf06

## Self-Check: PASSED

- backend/src/routes/admin/knowledge.ts: FOUND
- backend/src/app.ts: FOUND
- backend/src/services/knowledgeService.ts: FOUND
- Commit bf8cf06: FOUND
- Commit f9c5f08: FOUND
