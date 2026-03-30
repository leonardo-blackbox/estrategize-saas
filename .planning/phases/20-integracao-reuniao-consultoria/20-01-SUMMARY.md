---
phase: 20-integracao-reuniao-consultoria
plan: "01"
subsystem: transcript-pipeline
tags: [bug-fix, rag, action-items, frontend, backend]
dependency_graph:
  requires: []
  provides: [action-items-display, transcript-rag-indexing]
  affects: [ConsultoriaDetailActions, processTranscript, ActionItem-type]
tech_stack:
  added: []
  patterns: [fire-and-forget-rag, non-fatal-error-handling]
key_files:
  modified:
    - frontend/src/api/consultancies.ts
    - frontend/src/features/consultorias/components/ConsultoriaDetailActions/ConsultoriaDetailActions.tsx
    - backend/src/services/transcriptService.ts
decisions:
  - "RAG indexing in transcriptService uses direct supabase inserts (not processDocument) to avoid re-parsing already-formatted text"
  - "Step 5b wrapped in try/catch so RAG failure never breaks action item insertion in Step 6"
  - "formattedTranscript.length > 100 guard skips indexing trivially short transcripts"
metrics:
  duration: "1 min"
  completed_date: "2026-03-30"
  tasks_completed: 1
  files_modified: 3
---

# Phase 20 Plan 01: Fix Action Item Status Enum + Transcript RAG Indexing Summary

One-liner: Fixed 'pending' vs 'todo' status mismatch blocking action item display, and added auto-RAG indexing of meeting transcripts after GPT-4 pipeline completes.

## What Was Built

### Task 1: Fix ActionItem status enum mismatch + auto-index transcript as RAG

**Part A — Frontend Status Fix (2 files):**
- `frontend/src/api/consultancies.ts`: Changed `ActionItem.status` type from `'pending' | 'in_progress' | 'done' | 'cancelled'` to `'todo' | 'in_progress' | 'done' | 'cancelled'`, aligning the TypeScript type with the DB `CHECK` constraint in migration 021.
- `frontend/src/features/consultorias/components/ConsultoriaDetailActions/ConsultoriaDetailActions.tsx`: Updated kanban column filter from `a.status === 'pending'` to `a.status === 'todo'`, making meeting-generated action items (origin: `meeting_ai`, status: `todo`) visible in the "A fazer" column.

**Part B — Backend RAG Indexing (1 file):**
- `backend/src/services/transcriptService.ts`: Added import of `chunkText` and `generateEmbeddings` from `knowledgeService.js`. Added Step 5b between the session update (Step 5) and action item insertion (Step 6): after GPT-4 analysis, if the session has a `consultancy_id` and the transcript is non-trivial (>100 chars), the `formattedTranscript` is chunked, embedded, and stored in `knowledge_documents` + `knowledge_chunks` as a consultancy-scoped RAG document. The entire block is wrapped in `try/catch` so RAG failures are logged but do not interrupt the main pipeline.

## Commits

| Hash | Message |
|------|---------|
| 3ae6a87 | fix(20-01): fix action item status enum and add transcript RAG indexing |

## Deviations from Plan

None — plan executed exactly as written.

## Self-Check

- [x] `frontend/src/api/consultancies.ts` modified — status type uses 'todo'
- [x] `ConsultoriaDetailActions.tsx` modified — filter uses 'todo'
- [x] `backend/src/services/transcriptService.ts` modified — RAG Step 5b present
- [x] Commit 3ae6a87 exists
- [x] Frontend TypeScript: 0 errors
- [x] Backend TypeScript: 0 errors in transcriptService.ts (2 pre-existing errors in consultancies.ts routes, out of scope)

## Self-Check: PASSED
