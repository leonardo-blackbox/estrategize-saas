# Phase 5: Admin IA Global - Context

**Gathered:** 2026-03-30
**Status:** Ready for planning

<domain>
## Phase Boundary

Adicionar o painel "Testar IA" à página `/admin/ia`. Upload e lista de documentos já foram construídos nas Phases 10-11. Esta phase fecha o gap: endpoint `POST /api/admin/knowledge/test` + componente `TestQueryPanel` + wiring no hook e na página.

**Scope:** Apenas o painel de teste. Nenhuma alteração em upload/lista existentes.

</domain>

<decisions>
## Implementation Decisions

### Tipo de resposta do painel
- Retorna resposta completa da IA via GPT-4 **mais** fontes usadas — não apenas chunks brutos
- Escopo da busca: apenas documentos globais (`scope: 'global'`), não consultancy
- System prompt de teste minimalista: "Responda com base nos documentos fornecidos. Se não souber, diga explicitamente." — sem persona Iris, sem metodologia completa
- Objetivo: validar que os chunks certos foram recuperados e que a IA os usa corretamente

### Layout e exibição
- Painel posicionado **abaixo da lista de documentos** — fluxo natural: Upload → Lista → Testar IA
- Estrutura do painel: `<h2>Testar IA</h2>` + textarea de pergunta + botão Enviar + área de resposta
- Exibição das fontes: nome do documento + trecho curto (primeiros ~120 chars do chunk) por fonte
- O painel só exibe resposta/fontes após submit — não mostra estado vazio com placeholder de resposta

### Claude's Discretion
- Loading state do painel durante a chamada
- Número máximo de fontes exibidas (sugestão: 3)
- Estilização das fontes (cards inline, collapse, etc.)
- Tratamento de erro (toast ou inline error message)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Backend — RAG e AI
- `backend/src/services/ragService.ts` — `retrieveRAGContext(userMessage, consultancyId)` — adaptar para global-only (passar `consultancyId = null` ou criar variante)
- `backend/src/services/consultancyAIService.ts` linha 191 — `chatWithAI` — referência de como chamar GPT-4 com contexto RAG

### Backend — rota existente a estender
- `backend/src/routes/admin/knowledge.ts` — Adicionar `POST /test` neste router

### Frontend — assets existentes a estender
- `frontend/src/features/admin/services/knowledge.api.ts` — Adicionar `adminTestQuery` aqui
- `frontend/src/features/admin/hooks/useKnowledge.ts` — Adicionar `testQuery` mutation aqui
- `frontend/src/features/admin/components/AdminIAPage/AdminIAPage.tsx` — Adicionar `<TestQueryPanel>` aqui

### Requisitos
- `ADMN-04` e `ADMN-05` em `.planning/REQUIREMENTS.md`

No external specs — requirements fully captured in decisions above.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `ragService.retrieveRAGContext`: busca global + consultancy. Para este painel: chamar com `consultancyId = ''` e filtrar para `scope: 'global'` only, OU criar função simples que chama o RPC diretamente com `filter_scope: 'global'`
- `KnowledgeList.tsx` e `KnowledgeUpload.tsx`: padrões visuais de referência (bg-surface-1, border-hairline, text tokens)
- `AdminIAPage.tsx` atualmente tem 20 linhas — adicionar `<TestQueryPanel>` mantém o agregador dentro do limite

### Established Patterns
- Micro-módulos ≤ 80 linhas, hooks ≤ 120 linhas
- Upload usa `fetch` raw com `FormData` (não `client.post`) — mas test usa JSON, então `client.post` é OK
- React Query `useMutation` para operações com side effects (upload, delete) — usar para `testQuery` também
- Design tokens: `--bg-surface-1`, `--border-hairline`, `--text-primary/secondary/tertiary`

### Integration Points
- `AdminIAPage.tsx` orquestra os componentes — adicionar `TestQueryPanel` como quarto filho
- `useKnowledge.ts` hook — adicionar `testQuery` mutation e `testResult` state
- `knowledge.ts` route registrado em `backend/src/app.ts` — sem mudança necessária lá

</code_context>

<specifics>
## Specific Ideas

- Fluxo da Iris: sobe PDF → vê status "Indexado" → digita "Qual é a fase de diagnóstico?" → vê resposta + "Fonte: Metodologia Iris 2025.pdf — 'A fase de diagnóstico envolve...'"
- O painel é uma ferramenta de QA interna, não para clientes

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 05-admin-ia-global*
*Context gathered: 2026-03-30*
