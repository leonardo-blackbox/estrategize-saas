---
phase: 10-pipeline-de-embeddings
plan: "01"
subsystem: backend/knowledge
tags: [pgvector, embeddings, rag, openai, pdf-parse, supabase]
dependency_graph:
  requires: []
  provides: [knowledge_documents table, knowledge_chunks table, embeddingService, knowledgeService]
  affects: [Phase 11 admin UI, Phase 12 consultancy docs, Phase 13 chat RAG]
tech_stack:
  added: [pdf-parse, "@types/pdf-parse"]
  patterns: [createRequire for CJS-in-ESM, service-role supabase for server-side processing, ivfflat cosine similarity index]
key_files:
  created:
    - backend/src/database/migrations/026_knowledge_base.sql
    - backend/src/services/embeddingService.ts
    - backend/src/services/knowledgeService.ts
  modified:
    - backend/package.json
decisions:
  - createRequire pattern used to import pdf-parse (CJS module) inside ESM project with moduleResolution bundler
  - supabaseAdmin (service role) used in knowledgeService to bypass RLS for server-side document processing
  - Embedding vector stored as string "[v1,v2,...]" — PostgREST handles vector type conversion from string
  - chunkText preserves overlap via tail-prepend pattern (last N chars of prev chunk prepended to next)
metrics:
  duration: "3 min"
  completed: "2026-03-29"
  tasks_completed: 2
  files_created: 3
  files_modified: 1
---

# Phase 10 Plan 01: Knowledge Base Pipeline — pgvector Embedding Pipeline Summary

## One-liner

pgvector migration + OpenAI text-embedding-3-small service + PDF/txt/md chunking pipeline with 300-500 token overlapping chunks stored in Supabase.

## What was built

### Task 1: Migration 026_knowledge_base.sql

Created the database foundation for RAG with two tables:

- `knowledge_documents`: tracks uploaded files with scope (global/consultancy), processing status, and ownership
- `knowledge_chunks`: stores text chunks with `vector(1536)` embeddings for similarity search

Key schema features:
- `CONSTRAINT chk_consultancy_scope` ensures global docs have NULL consultancy_id; consultancy docs have NOT NULL
- 6 RLS policies: owner SELECT/INSERT/DELETE on documents + global documents visible to all auth users; chunks follow parent document access
- `ivfflat` index with `vector_cosine_ops` for efficient similarity search (100 lists)
- `match_knowledge_chunks()` SQL function for future RAG queries with threshold + count + scope filters
- `trg_knowledge_documents_updated_at` trigger following migration 023 pattern

### Task 2: Services

**embeddingService.ts** — thin OpenAI wrapper:
- Uses `text-embedding-3-small` (1536 dimensions)
- Batches in groups of 100 (OpenAI API limit)
- Returns `number[][]` in input order

**knowledgeService.ts** — orchestration pipeline:
- `processDocument()`: insert record → parse file → chunk text → generate embeddings → store chunks → mark ready/error
- `deleteDocument()`: ownership check + delete with cascade
- `getDocumentsByScope()`: list documents filtered by scope/consultancy_id
- `parseFile()`: pdf-parse for PDF, utf-8 decode for txt/md
- `chunkText()`: paragraph splitting targeting 400 tokens, capping at 500, discarding < 300, 50-token overlap via tail-prepend

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] pdf-parse CJS import fails with moduleResolution: bundler**
- **Found during:** Task 2 TypeScript compilation
- **Issue:** `import pdfParse from 'pdf-parse'` triggers TS1192 "no default export" because @types/pdf-parse uses `export =` syntax (CommonJS) incompatible with bundler moduleResolution + esModuleInterop
- **Fix:** Replaced default import with `createRequire(import.meta.url)` + inline type cast `(buffer: Buffer) => Promise<{ text: string }>` to avoid @types/pdf-parse incompatibility entirely
- **Files modified:** `backend/src/services/knowledgeService.ts`
- **Commit:** ab030fb

## Self-Check: PASSED

- FOUND: `backend/src/database/migrations/026_knowledge_base.sql`
- FOUND: `backend/src/services/embeddingService.ts`
- FOUND: `backend/src/services/knowledgeService.ts`
- FOUND: commit `be79a64` (migration)
- FOUND: commit `ab030fb` (services + pdf-parse)
