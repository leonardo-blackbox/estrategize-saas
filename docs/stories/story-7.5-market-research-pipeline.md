# Story 7.5 — Market Research Pipeline Service

**Épico:** Epic 7 — Market Intelligence
**Story:** 7.5
**Status:** Done
**Branch:** feat/7.5-market-research-pipeline
**Parallelismo:** WAVE 3 — executar em paralelo com Story 7.4 (requer 7.2 + 7.3)

---

## User Story

> **Como** sistema,
> **Quero** um serviço que orquestre o pipeline completo de pesquisa profunda (Maps → Instagram → Firecrawl → GPT-4),
> **Para** que a consultora receba um relatório completo de inteligência de mercado.

---

## Contexto Técnico

**Estado atual:**
- `apifyService.ts` com `runActor()` genérico — funciona
- `firecrawlService.ts` criado na Story 7.2
- `instagramScanService.ts` criado na Story 7.2
- `irisAIService.ts` existe com GPT-4 integrado
- `pluginConfigService.ts` criado na Story 7.3
- Tabela `market_research` criada na Story 7.1

**O que será construído:**
- `backend/src/services/marketResearchService.ts` — orquestrador do pipeline completo:
  1. `discoverCompetitors()` — Apify Google Maps
  2. `scrapeCompetitorInstagram()` — Apify instagram-profile-scraper em batch
  3. `scrapeCompetitorWebsites()` — Firecrawl por URL
  4. `generateReport()` — GPT-4 com prompt configurável
  5. `runPipeline()` — executa etapas em sequência, atualiza status, suporta graceful degradation

---

## Acceptance Criteria

### AC1 — Estrutura do arquivo
- [ ] `backend/src/services/marketResearchService.ts`
- [ ] Exporta: `startResearch(researchId: string): void` (fire-and-forget, usa `setImmediate`)
- [ ] Exporta: `getResearch(consultancyId: string, userId: string): Promise<MarketResearch | null>`
- [ ] Funções internas: `runPipeline`, `discoverCompetitors`, `scrapeCompetitorInstagram`, `scrapeCompetitorWebsites`, `generateReport`

### AC2 — `discoverCompetitors(config, consultancyContext)`
- [ ] Se `config.discovery_sources` inclui `google_maps`:
  - Usa `apifyService.runActor('compass/google-maps-scraper', input)`
  - Input: `{ searchStrings: ['{nicho} {cidade}'], maxCrawledPlaces: config.max_competitors_discover, language: 'pt' }`
  - `nicho` e `cidade` extraídos do `consultancyContext` (niche + location fields da consultoria)
- [ ] Retorna array de `CompetitorData`:
  ```typescript
  {
    name: string
    address: string | null
    phone: string | null
    website: string | null
    rating: number | null
    reviewsCount: number | null
    instagramHandle: string | null   // extraído do website ou descrição se disponível
    source: 'google_maps'
  }
  ```
- [ ] Timeout: 120 segundos
- [ ] Se falhar: retorna array vazio (graceful degradation)

### AC3 — `scrapeCompetitorInstagram(competitors, config)`
- [ ] Filtra competidores com `instagramHandle` não nulo — até `config.max_competitors_instagram`
- [ ] Chama `apifyService.runActor('apify/instagram-profile-scraper', { usernames: [...], proxy: { useApifyProxy: true } })`
- [ ] Retorna dados estruturados (mesmo formato de `InstagramProfileData`)
- [ ] Timeout: 180 segundos
- [ ] Se falhar: retorna array vazio

### AC4 — `scrapeCompetitorWebsites(competitors, config)`
- [ ] Apenas se `config.include_competitor_websites = true`
- [ ] Filtra competidores com `website` não nulo — até `config.max_websites_scrape`
- [ ] Para cada URL: chama `firecrawlService.scrapeUrl(url)`
- [ ] Retorna array de `{ url, markdown, scraped_at }`
- [ ] Execução sequencial (não paralela) para evitar rate limit
- [ ] Se Firecrawl estiver desabilitado/falhar: retorna array vazio

### AC5 — `generateReport(data, config, consultancyContext)`
- [ ] Monta prompt com base nos dados coletados e configurações:
  - Se `config.custom_system_prompt` não é null: usa como system prompt completo
  - Caso contrário: usa prompt padrão estruturado
- [ ] Prompt padrão inclui:
  - Contexto da cliente (nome, nicho, localização, bio IG, seguidores)
  - Dados dos concorrentes descobertos (tabela comparativa)
  - Análise de Instagram de cada concorrente
  - Conteúdo dos sites (se disponível)
  - Instrução para gerar relatório em `config.report_language`
  - Instrução de estilo (`config.report_style`)
  - Lista de seções a incluir (apenas as que têm `true` em `config.report_sections`)
- [ ] Chama OpenAI `gpt-4o` com `temperature: config.ai_temperature`
- [ ] Retorna: `{ reportMarkdown: string, keyInsights: { opportunities: string[], threats: string[], positioning: string } }`
- [ ] `key_insights` extraído com structured output separado ou parseado do relatório

### AC6 — `runPipeline(researchId, config, consultancyContext)`
- [ ] Sequência de execução:
  1. Update `status: running_maps`, `progress_step: 1`
  2. `discoverCompetitors()` → salva `competitors_discovered`
  3. Update `status: running_instagram`, `progress_step: 2`
  4. `scrapeCompetitorInstagram()` → salva `instagram_data`
  5. Update `status: running_websites`, `progress_step: 3`
  6. `scrapeCompetitorWebsites()` → salva `websites_data`
  7. Update `status: running_ai`, `progress_step: 4`
  8. `generateReport()` → salva `report_markdown`, `key_insights`
  9. Update `status: done`, `progress_step: 5`, `completed_at`
- [ ] Em qualquer erro fatal: `status: failed`, `error_message`
- [ ] Falha em etapa individual (ex: websites) não cancela pipeline — continua com o que tem

### AC7 — `startResearch(researchId)`
- [ ] Usa `setImmediate(async () => runPipeline(researchId))`
- [ ] Carrega `research` do banco para obter `consultancy_id`
- [ ] Carrega `config` via `pluginConfigService.getConfig('pesquisa-mercado')`
- [ ] Carrega `consultancyContext` (join consultancies para obter niche, location, client_name)

### AC8 — Integração RAG automática
- [ ] Após `status: done` e se `config.auto_index_rag = true`:
  - Chama `knowledgeService.addDocument({ consultancyId, content: reportMarkdown, sourceTag: config.rag_context_tag })`
  - Update `market_research.rag_indexed = true`
- [ ] Erros no RAG não revertem o status `done` do research

---

## Checklist Técnico

- [ ] `runPipeline` tem try/catch geral que garante status `failed` em caso de crash
- [ ] Cada etapa tem seu próprio try/catch para graceful degradation
- [ ] Logs claros em cada etapa: `[market-research] Step 1/5: Discovering competitors...`
- [ ] Nenhuma etapa usa `Promise.all` sem timeout individual
- [ ] Sem `any` em tipos

---

## Dependências

- Story 7.1 (tabela `market_research` + tipos)
- Story 7.2 (`firecrawlService`, `instagramScanService`)
- Story 7.3 (`pluginConfigService.getConfig()`)

---

## Definição de Pronto

- Pipeline completo executa sem crash
- Cada etapa atualiza o `status` no banco
- Relatório gerado em PT-BR com seções corretas baseadas na config
- Graceful degradation: etapa Map falhando → relatório gerado com dados parciais
