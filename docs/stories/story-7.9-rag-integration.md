# Story 7.9 — RAG Auto-Index Integration

**Épico:** Epic 7 — Market Intelligence
**Story:** 7.9
**Status:** Done
**Branch:** feat/7.9-rag-integration
**Parallelismo:** WAVE 5 — executar após 7.5 e 7.8

---

## User Story

> **Como** consultora,
> **Quero** que o relatório de pesquisa de mercado seja automaticamente disponibilizado para a IA Dedicada da consultoria,
> **Para** que a IA use o contexto de mercado ao responder minhas perguntas — sem precisar fazer nada extra.

---

## Contexto Técnico

**Estado atual:**
- `knowledgeService.ts` existe com funções de upload/indexação de documentos
- `GET /api/knowledge/:consultancyId` lista documentos indexados
- `POST /api/knowledge/:consultancyId/upload` indexa novo documento
- Story 7.5 já inclui lógica de auto-index no `runPipeline` via `knowledgeService`
- Story 7.6 inclui `POST /api/market-research/:consultancyId/rag-index` manual
- Esta story valida e refina a integração end-to-end

**O que será construído/validado:**
- Verificar que `knowledgeService.addDocument()` aceita conteúdo Markdown diretamente
- Adaptar se necessário para suportar source_tag customizado
- Garantir que relatório indexado aparece em `GET /api/knowledge/:consultancyId`
- Teste end-to-end: pesquisa completa → RAG indexado → chat IA usa contexto

---

## Acceptance Criteria

### AC1 — `knowledgeService` suporta source_tag
- [ ] Verificar assinatura atual de `knowledgeService.addDocument()` ou equivalente
- [ ] Se não aceita `source_tag`: adicionar parâmetro opcional `sourceTag?: string`
- [ ] `source_tag` salvo em `knowledge_documents.source_tag` (verificar se coluna existe — adicionar na migration se necessário)
- [ ] Documentos com `source_tag = 'pesquisa-mercado'` são filtráveis separadamente

### AC2 — Indexação automática no pipeline (validação Story 7.5)
- [ ] Após `status: done` no `runPipeline`:
  - Chama `knowledgeService` com `report_markdown` como conteúdo
  - `source_tag = config.rag_context_tag` (default: `'pesquisa-mercado'`)
  - `consultancyId` correto
- [ ] `market_research.rag_indexed` = true após sucesso
- [ ] Erro no RAG logado mas não reverte `status: done`

### AC3 — Indexação manual funcional (validação Story 7.6)
- [ ] `POST /api/market-research/:consultancyId/rag-index` chama `knowledgeService` corretamente
- [ ] Retorna 200 com `{ success: true }` após indexar
- [ ] Retorna 409 se já indexado

### AC4 — Documento aparece na lista de documentos
- [ ] Após indexar relatório: `GET /api/knowledge/:consultancyId` inclui o documento
- [ ] Documento tem `name` descritivo: `"Pesquisa de Mercado — {data}"` ou similar
- [ ] Documento tem `source_tag: 'pesquisa-mercado'`

### AC5 — Chat IA usa contexto do relatório
- [ ] Fazer pergunta à IA Dedicada da consultoria após indexar relatório
- [ ] IA consegue responder usando dados do relatório (ex: "Quais são os principais concorrentes da minha cliente?")
- [ ] Verificar que `match_knowledge_chunks` retorna chunks do relatório indexado

### AC6 — Frontend: feedback de indexação
- [ ] Após clicar "Indexar no RAG" e sucesso:
  - Toast: "Relatório indexado na base de conhecimento da IA ✓"
  - Botão muda para badge "Indexado ✓" (desabilitado)
- [ ] `rag_indexed: true` na query invalidada → UI atualiza sem reload

### AC7 — Dados raw opcionais no RAG
- [ ] Se `config.include_raw_data_in_rag = true`:
  - Indexar também dados dos concorrentes (`competitors_discovered` + `instagram_data`) como documento separado
  - Source tag: `'pesquisa-mercado-raw'`
- [ ] Se false: indexar apenas `report_markdown`

---

## Checklist Técnico

- [ ] Chunks do relatório têm tamanho adequado para embedding (verificar chunking em `embeddingService`)
- [ ] Relatório muito longo (> 50k chars): truncar por seção antes de indexar (ou chunk automático)
- [ ] Sem duplicatas: verificar se já existe documento com mesmo source_tag antes de indexar (ou fazer upsert)
- [ ] Log: `[market-research] RAG indexed: document id={docId} consultancy={cId}`

---

## Dependências

- Story 7.5 (`marketResearchService.runPipeline`)
- Story 7.6 (`POST /rag-index` route)
- Story 7.8 (frontend feedback)
- `knowledgeService.ts` existente

---

## Definição de Pronto

- Pesquisa completa com `auto_index_rag = true` → documento aparece em `/documentos` da consultoria
- Chat IA responde com contexto do relatório de mercado
- Indexação manual via botão frontend funciona
- `rag_indexed = true` reflete corretamente no banco e na UI
