---
phase: 13-chat-rag
verified: 2026-03-30T00:00:00Z
status: human_needed
score: 3/4 must-haves verified (1 needs human)
re_verification: false
human_verification:
  - test: "Send a question about the Iris methodology in a consultancy with at least one global document indexed"
    expected: "AI response should cite or reflect content from the indexed document, not just the hardcoded IRIS_METHODOLOGY string"
    why_human: "Runtime LLM behavior — whether GPT-4 actually incorporates the RAG context block into its answer cannot be verified by static code analysis"
---

# Phase 13: Chat RAG Verification Report

**Phase Goal:** Pergunta sobre a metodologia da Iris retorna resposta alinhada com os documentos indexados, usando contexto global + da consultoria
**Verified:** 2026-03-30
**Status:** human_needed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Chat IA busca chunks relevantes via match_knowledge_chunks antes de chamar GPT-4 | VERIFIED | `ragService.ts` calls `rpc('match_knowledge_chunks'` at lines 43 and 50; `consultancyAIService.ts` calls `retrieveRAGContext` inside `Promise.all` at line 202, before OpenAI call at line 224 |
| 2 | Busca combina scope global + scope consultancy para a consultoria ativa | VERIFIED | `ragService.ts` lines 42-57: two parallel RPC calls — `filter_scope: 'global'` and `filter_scope: 'consultancy', filter_consultancy_id: consultancyId`; deduplication via Map (lines 70-76); top-5 sort (lines 78-80) |
| 3 | Chunks injetados no system prompt como contexto adicional | VERIFIED | `buildRAGContextBlock` (lines 125-142) formats chunks with labels and similarity percentages; `finalSystemPrompt = ragBlock + '\n\n' + systemPrompt` (line 207); `finalSystemPrompt` used in `messagesForAPI` at line 216 |
| 4 | Resposta do chat referencia conteudo dos documentos quando relevante | HUMAN NEEDED | Pipeline is correctly wired; whether GPT-4 actually incorporates the reference block into its answer is a runtime behavior that cannot be verified statically |

**Score:** 3/4 truths verified (1 deferred to human)

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `backend/src/services/ragService.ts` | RAG retrieval function that queries match_knowledge_chunks | VERIFIED | 85 lines; exports `retrieveRAGContext` and `RAGChunk` interface; implements parallel global + consultancy queries with deduplication and top-5 return |
| `backend/src/services/consultancyAIService.ts` | chatWithAI enhanced with RAG context injection | VERIFIED | Imports `retrieveRAGContext` at line 4; calls it in `Promise.all` at line 202; `buildRAGContextBlock` at line 125; `finalSystemPrompt` wired to OpenAI call at line 216 |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `ragService.ts` | `match_knowledge_chunks` SQL function | `supabaseAdmin.rpc('match_knowledge_chunks', ...)` | WIRED | Lines 43 and 50 in ragService.ts — called twice with different scopes |
| `ragService.ts` | `embeddingService.ts` | `import { generateEmbeddings }` | WIRED | Line 1: `import { generateEmbeddings } from './embeddingService.js'`; called at line 35 |
| `consultancyAIService.ts` | `ragService.ts` | `import { retrieveRAGContext }` and call in chatWithAI | WIRED | Line 4: `import { retrieveRAGContext, type RAGChunk } from './ragService.js'`; called at line 202 inside `Promise.all` |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| KNWL-05 | 13-01-PLAN.md | Chat IA da consultoria usa documentos globais + documentos da consultoria como contexto | SATISFIED | Both global and consultancy-scoped chunks fetched and injected into the system prompt before GPT-4 call |

### Anti-Patterns Found

No anti-patterns detected. The implementation:
- Uses graceful degradation (try/catch returns `[]` on failure — line 81-84 in ragService.ts)
- No placeholder returns or stub implementations
- No TODO/FIXME comments
- TypeScript compiles with zero errors (verified via `npx tsc --noEmit`)

### Human Verification Required

#### 1. RAG context actually influences GPT-4 responses

**Test:** Index at least one global document (e.g., Iris methodology PDF) via the admin knowledge interface. Then open a consultancy chat and ask: "Quais são os princípios fundamentais da metodologia Iris?"
**Expected:** The AI response should reference or reflect content specific to the uploaded document, going beyond the hardcoded `IRIS_METHODOLOGY` string in the system prompt. Similarity percentages in the context block (e.g., "relevancia: 82%") should appear internally in the prompt.
**Why human:** LLM behavior is non-deterministic. Static analysis confirms the pipeline is wired (chunks are retrieved and prepended to the system prompt), but whether GPT-4 meaningfully uses those chunks in its answer requires a live test with actual indexed documents.

### Gaps Summary

No gaps found. All three automatically-verifiable truths are confirmed by the codebase:

1. The retrieval pipeline (`ragService.ts`) correctly calls `match_knowledge_chunks` twice in parallel for global and consultancy scopes.
2. Results are deduplicated by chunk ID (keeping highest similarity), sorted descending, and limited to top 5.
3. The injection into `chatWithAI` follows the plan exactly — `buildRAGContextBlock` formats the context block, and it is prepended before the existing `systemPrompt` as `finalSystemPrompt`.
4. Graceful degradation is in place: if embeddings fail or the RPC errors, `ragService.ts` returns `[]` and the chat behaves identically to before.

The one deferred item (Truth 4) is a runtime quality check that requires a human test with real indexed documents — it is not a gap in the implementation.

---

_Verified: 2026-03-30_
_Verifier: Claude (gsd-verifier)_
