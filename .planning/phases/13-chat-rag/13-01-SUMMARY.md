---
phase: 13-chat-rag
plan: "01"
subsystem: backend/ai
tags: [rag, embeddings, chat, knowledge-base, openai]
dependency_graph:
  requires: [phase-10-embeddings, phase-11-global-docs, phase-12-consultancy-docs]
  provides: [rag-enriched-chat]
  affects: [consultancyAIService, chatWithAI]
tech_stack:
  added: []
  patterns: [rag-retrieval, parallel-promise-all, graceful-degradation]
key_files:
  created:
    - backend/src/services/ragService.ts
  modified:
    - backend/src/services/consultancyAIService.ts
decisions:
  - "RAG chunks prepended before system prompt so GPT-4 sees reference material first, then behavioral instructions"
  - "match_threshold 0.5 (vs 0.7 default) for more inclusive retrieval; top-5 selection handles relevance filtering"
  - "Promise.all for parallel global + consultancy + buildFullContext + getOrCreateConversation calls"
  - "Empty array fallback on any RAG error ensures chat is never blocked by retrieval failure"
metrics:
  duration: "~8 min"
  completed: "2026-03-30"
  tasks_completed: 2
  files_changed: 2
---

# Phase 13 Plan 01: RAG Integration into Chat Pipeline Summary

RAG retrieval wired into chatWithAI: every AI chat message now queries match_knowledge_chunks for global Iris methodology docs and per-consultancy documents before calling GPT-4, injecting relevant chunks as a reference block at the top of the system prompt.

## Tasks Completed

| # | Task | Commit | Files |
|---|------|--------|-------|
| 1 | Create ragService.ts with retrieveRAGContext | be520a6 | backend/src/services/ragService.ts (new) |
| 2 | Inject RAG context into chatWithAI system prompt | 232634a | backend/src/services/consultancyAIService.ts |

## What Was Built

### ragService.ts

New service with a single exported function `retrieveRAGContext(userMessage, consultancyId)`:

1. Generates embedding for the user message via `generateEmbeddings([userMessage])`
2. Converts vector to PostgREST string format `[v1,v2,...]`
3. Calls `match_knowledge_chunks` RPC twice in parallel:
   - `filter_scope: 'global'` — Iris methodology knowledge base
   - `filter_scope: 'consultancy', filter_consultancy_id` — client-specific documents
4. Merges results into a Map (deduplicates by id, keeps highest similarity)
5. Sorts by similarity descending, returns top 5 chunks
6. Full try/catch: returns `[]` on any failure (graceful degradation)

### consultancyAIService.ts changes

- Added `import { retrieveRAGContext, type RAGChunk } from './ragService.js'`
- Added `buildRAGContextBlock(chunks: RAGChunk[]): string` helper that formats chunks as a labeled reference block with similarity percentages
- Modified `chatWithAI` `Promise.all` to include `retrieveRAGContext(userMessage, consultancyId)` as third parallel call
- RAG block prepended to system prompt: `finalSystemPrompt = ragBlock + '\n\n' + systemPrompt`
- Used `finalSystemPrompt` in `messagesForAPI` array
- All other exported functions (`generateMeetingSummary`, `generateActionPlan`, etc.) unchanged

## Deviations from Plan

None — plan executed exactly as written.

## Verification

- TypeScript compiles with zero errors: confirmed
- `export.*retrieveRAGContext` in ragService.ts: line 28
- `match_knowledge_chunks` called twice in ragService.ts: lines 43, 50
- `ragService` import in consultancyAIService.ts: line 4
- `buildRAGContextBlock` in consultancyAIService.ts: line 125
- `retrieveRAGContext` called in chatWithAI: line 202

## Self-Check: PASSED

Files exist:
- backend/src/services/ragService.ts: FOUND
- backend/src/services/consultancyAIService.ts: FOUND

Commits exist:
- be520a6: FOUND
- 232634a: FOUND
