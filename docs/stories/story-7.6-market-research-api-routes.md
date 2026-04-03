# Story 7.6 — Market Research API Routes + Async Job Processing

**Épico:** Epic 7 — Market Intelligence
**Story:** 7.6
**Status:** Done
**Branch:** feat/7.6-market-research-api
**Parallelismo:** WAVE 4 — executar em paralelo com Story 7.7 (requer 7.5)

---

## User Story

> **Como** consultora,
> **Quero** poder iniciar uma pesquisa profunda e acompanhar o progresso via polling,
> **Para** saber quando o relatório estará pronto e poder acessá-lo.

---

## Contexto Técnico

**Estado atual:**
- `marketResearchService.ts` criado na Story 7.5 com `startResearch()` e `getResearch()`
- Rota `GET /api/market-research/instagram/:consultancyId` criada na Story 7.2
- Tabela `market_research` existe com campo `status` e `progress_step`

**O que será construído:**
- `backend/src/routes/marketResearch.ts` — rotas completas de market research
- Rotas:
  - `POST /api/market-research/:consultancyId/start` — inicia pesquisa profunda
  - `GET /api/market-research/:consultancyId` — status + dados da pesquisa atual
  - `POST /api/market-research/:consultancyId/rag-index` — indexar relatório manualmente no RAG
- Registrar rotas no `backend/src/app.ts`

---

## Acceptance Criteria

### AC1 — `POST /api/market-research/:consultancyId/start`
- [ ] `requireAuth` obrigatório
- [ ] Verifica ownership: `consultancy_id` pertence ao `userId`
- [ ] Verifica se já há pesquisa em status `running_*` para a consultoria → 409 "Pesquisa já em andamento"
- [ ] Carrega config: `pluginConfigService.getConfig('pesquisa-mercado')`
- [ ] Se `config.enabled = false` → 403 "Plugin desabilitado"
- [ ] Verifica créditos se `credits_cost_deep > 0`:
  - Chama `creditService.reserve(userId, credits_cost_deep)`
  - Se saldo insuficiente → 402 "Créditos insuficientes"
- [ ] Se `free_first_research = true` e é a primeira pesquisa da consultoria → sem custo
- [ ] Cria registro em `market_research` (status: pending)
- [ ] Chama `marketResearchService.startResearch(researchId)` (fire-and-forget)
- [ ] Retorna: `{ researchId, status: 'pending' }` com HTTP 202

### AC2 — `GET /api/market-research/:consultancyId`
- [ ] `requireAuth` obrigatório
- [ ] Verifica ownership
- [ ] Retorna pesquisa mais recente para a consultoria
- [ ] Response:
  ```typescript
  {
    id: string
    status: string              // pending | running_maps | ... | done | failed
    progress_step: number       // 0-5
    progress_label: string      // "Descobrindo concorrentes..." etc.
    competitors_count: number   // len de competitors_discovered
    report_markdown: string | null
    key_insights: object | null
    rag_indexed: boolean
    error_message: string | null
    created_at: string
    completed_at: string | null
  }
  ```
- [ ] Se não existe pesquisa → `{ status: 'not_started' }`
- [ ] `progress_label` mapeado por step:
  - 0: "Aguardando início..."
  - 1: "Descobrindo concorrentes locais..."
  - 2: "Analisando Instagram dos concorrentes..."
  - 3: "Analisando sites dos concorrentes..."
  - 4: "Gerando relatório com IA..."
  - 5 (done): "Pesquisa concluída"

### AC3 — `POST /api/market-research/:consultancyId/rag-index`
- [ ] `requireAuth` obrigatório
- [ ] Verifica ownership
- [ ] Busca research com `status = done` para a consultoria
- [ ] Se `report_markdown` null → 400
- [ ] Se já `rag_indexed = true` → 409 "Relatório já indexado"
- [ ] Chama `knowledgeService.addDocument(...)` com `report_markdown`
- [ ] Atualiza `market_research.rag_indexed = true`
- [ ] Retorna: `{ success: true }`

### AC4 — Rota de Instagram integrada
- [ ] Mover ou reexportar `GET /api/market-research/instagram/:consultancyId` (criada na Story 7.2) para o mesmo arquivo de rotas
- [ ] Registrada como parte do mesmo router

### AC5 — Registrar router no app
- [ ] `backend/src/app.ts`: `app.use('/api/market-research', marketResearchRouter)`
- [ ] Registrado após autenticação middleware

### AC6 — Créditos: consumo após conclusão
- [ ] Quando `status` transiciona para `done`:
  - Chamar `creditService.consume(userId, credits_cost_deep, 'pesquisa-mercado')` dentro do `runPipeline` (via marketResearchService)
  - Se pipeline falha (`status: failed`): chamar `creditService.release(reservationId)`
- [ ] `credits_used` no registro atualizado com valor real consumido

---

## Checklist Técnico

- [ ] Nenhuma rota bloqueia esperando o pipeline (sempre 202 ou resposta imediata)
- [ ] Ownership check em todas as rotas (não apenas autenticação)
- [ ] Zod schema para body do POST /start (mesmo que body seja vazio)
- [ ] Sem `any`

---

## Dependências

- Story 7.1 (tabela `market_research`)
- Story 7.3 (`pluginConfigService`)
- Story 7.5 (`marketResearchService`)

---

## Definição de Pronto

- `POST /start` cria research e dispara pipeline em background
- `GET` retorna status correto e progress_label atualizado enquanto pipeline roda
- `POST /rag-index` indexa relatório no RAG quando chamado manualmente
- Créditos debitados somente após conclusão com sucesso
