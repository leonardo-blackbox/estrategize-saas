# Story 10.6 — Diagnóstico Iris com Dados Oficiais (Forense)

**Épico:** Epic 10 — Meta API Foundation (Onda 1)
**Story:** 10.6
**Status:** Draft
**Branch:** feat/10.6-iris-diagnosis-with-meta
**Agente principal:** @dev
**Paralelismo:** WAVE 4 — depende de 10.3 (insights service) — fecha a Onda 1

---

## User Story

> **Como** consultor estratégico,
> **Quero** gerar diagnósticos do método Iris alimentados com dados oficiais do Instagram da cliente (reach, demografia, retention, saves/shares dos top posts),
> **Para** entregar análises com evidência numérica em vez de raciocínio genérico — transformando o Iris em ferramenta de consultoria forense.

---

## Contexto Técnico

**Estado atual:**
- `backend/src/services/irisAIService.ts` exporta `generateDiagnosis(title, clientName?)` que monta um prompt GPT-4 estático
- O prompt atual (IRIS_METHOD_PROMPT) é abstrato — não consome nenhum dado real
- Frontend chama via tab `ConsultoriaDetailDiagnosis` (componente existe)

**O que será construído:**
- Overload de `generateDiagnosis()` aceitando contexto opcional do Instagram
- Função `buildIrisContext(consultancyId)` que consolida dados oficiais
- Endpoint novo `POST /api/diagnosis/:consultancyId/generate-with-insights`
- Botão "Gerar com dados oficiais" no frontend

---

## Acceptance Criteria

### AC1 — Refatoração não-breaking de `irisAIService.generateDiagnosis()`
- [ ] Assinatura atual: `generateDiagnosis(title, clientName?)` continua funcionando (backwards compatible)
- [ ] Nova assinatura: `generateDiagnosis(params: GenerateDiagnosisParams): Promise<DiagnosisResponse>`:
  ```ts
  interface GenerateDiagnosisParams {
    title: string;
    clientName?: string | null;
    instagramContext?: IrisInstagramContext;
    marketResearchContext?: IrisMarketContext;
    consultancyMemoryContext?: string;
  }
  ```
- [ ] Função antiga vira wrapper: `generateDiagnosis(title, clientName)` chama nova com apenas os 2 primeiros campos
- [ ] Testes existentes continuam passando sem alteração

### AC2 — Função `buildIrisContext(consultancyId)` em novo `irisContextService.ts`
- [ ] Arquivo: `backend/src/services/irisContextService.ts`
- [ ] Função `buildInstagramContext(consultancyId): Promise<IrisInstagramContext | null>`:
  - Retorna `null` se não há conexão oficial ativa
  - Consolida dos snapshots:
    1. **Account metrics 28d** (de `instagram_insights_daily` ou direto de `metaInsightsService`):
       - reach, views, accounts_engaged, profile_visits, follows, unfollows, total_interactions
       - Comparação com 28d anteriores (% delta)
    2. **Top 5 posts por save+share** (de `instagram_media_insights` últimos 90d)
       - Caption truncada (200 chars), tipo, métricas
    3. **Demografia follower** (último snapshot de `instagram_audience_snapshots`)
       - Top 3 faixas idade × gênero
       - Top 3 cidades
       - Top 3 países
    4. **Demografia engaged** (mesmo, type='engaged')
    5. **Reels retention** (últimos 5 reels):
       - avg_watch_time, video_view_total_time, replays
    6. **Posting cadence** (de media list últimos 30d):
       - Posts por semana, posts por tipo (FEED/REELS/STORY)
- [ ] Função `buildMarketResearchContext(consultancyId): Promise<IrisMarketContext | null>`:
  - Busca última `market_research` com status='done' (já existe)
  - Retorna `{ keyInsights, competitorCount, topCompetitors[] }` se houver

### AC3 — Atualização do prompt
- [ ] Constante nova `IRIS_METHOD_PROMPT_WITH_DATA` em `irisAIService.ts`
- [ ] Estrutura do prompt:
  ```
  [Prompt base IRIS atual]

  CONTEXTO REAL DA CONSULTORIA:

  📊 Métricas Instagram (28 dias):
  - Reach: {value} ({delta}% vs período anterior)
  - Accounts Engaged: ...
  - Profile Visits: ...
  - Follows: +{x}, Unfollows: -{y} (churn {z}%)

  🎯 Audiência:
  - Seguidores: {top demographics}
  - Engajados: {top demographics}
  - Gap detectado: {if gap > 15%}

  🏆 Top conteúdos (últimos 90d):
  1. [Tipo] Caption... — {saves} saves, {shares} shares, reach {reach}
  ...

  🎬 Performance Reels (últimos 5):
  - Avg watch time: {x}s
  - Retention médio: {%}

  📈 Cadência:
  - {posts}/semana
  - Distribuição: {reels}% reels, {photos}% fotos, {carrosseis}% carrosseis

  🔍 Pesquisa de mercado (se houver):
  - Insights chave: ...
  - Concorrentes mapeados: ...

  INSTRUÇÕES PARA O DIAGNÓSTICO:
  - SEMPRE cite números específicos das métricas acima
  - Compare com benchmarks quando relevante
  - Identifique padrões: "Posts de X performam Y× melhor que Z"
  - Recomendações DEVEM ter métrica esperada (ex: "espera-se aumento de 30% em saves")
  - Detecte gaps demográficos e mismatches de ICP
  - Avalie retention de Reels vs benchmark (>50% = excelente, 25-50% = bom, <25% = problema de hook)
  ```
- [ ] Quando `instagramContext` ausente: usa prompt antigo (IRIS_METHOD_PROMPT)
- [ ] Quando presente: usa IRIS_METHOD_PROMPT_WITH_DATA

### AC4 — Endpoint REST
- [ ] `POST /api/diagnosis/:consultancyId/generate-with-insights` (autenticado)
  - Valida ownership da consultoria
  - Chama `buildInstagramContext` E `buildMarketResearchContext` em paralelo
  - Se ambos ausentes: retorna 422 "Conecte Instagram ou rode uma Pesquisa de Mercado primeiro"
  - Chama `generateDiagnosis({ title, clientName, instagramContext, marketResearchContext, consultancyMemoryContext })`
  - Persiste `diagnoses` row (já existe a tabela) com flag `enriched_with_meta = true` (nova coluna — adicionar via micro-migration ou usar JSONB metadata)
  - Response: `DiagnosisResponse`
- [ ] Endpoint antigo `POST /api/diagnosis/:consultancyId/generate` continua funcionando sem mudança

### AC5 — Schema delta
- [ ] Decidir entre:
  - Opção A: nova coluna `diagnoses.enriched_with_meta` boolean default false
  - Opção B: usar `diagnoses.metadata` JSONB (se existir) com `{ source: 'meta' }`
- [ ] Validar com @data-engineer qual padrão usar
- [ ] Se Opção A, adicionar à migration 035 ou criar 035b (micro-migration)

### AC6 — Frontend (tab Diagnosis)
- [ ] No componente `ConsultoriaDetailDiagnosis` (existe), adicionar botão secundário:
  - Botão "Gerar Diagnóstico" (existente) continua chamando endpoint antigo
  - Novo botão "Gerar com dados oficiais ⚡" — visível apenas se `meta connection.status === 'active'` OU `lastMarketResearch.status === 'done'`
- [ ] Tooltip explica: "Diagnóstico enriquecido com métricas oficiais do Instagram e pesquisa de mercado"
- [ ] Loading state mais demorado (15-30s vs 5-10s do diagnóstico simples) — mensagem progressiva: "Consolidando métricas... Analisando audiência... Gerando insights..."
- [ ] Badge "⚡ Enriquecido" no card do diagnóstico gerado com dados

### AC7 — Tipos compartilhados
- [ ] `IrisInstagramContext`, `IrisMarketContext`, `GenerateDiagnosisParams` definidos em `backend/src/types/iris.ts`
- [ ] Espelho em `frontend/src/types/iris.ts` se necessário

### AC8 — Observabilidade
- [ ] Log estruturado quando enriquecido: `{ event: 'iris-diagnosis-generated', enriched: true, contextSize: {...}, tokensUsed }`
- [ ] Tokens OpenAI usados ficam logados (já tem `tokensUsed` no response — apenas garantir persistência)
- [ ] Tempo de geração medido e exposto em metadata

---

## Checklist Técnico

- [ ] Função `buildInstagramContext` retorna `null` graciosamente quando sem dados
- [ ] Sem dependência circular entre `irisAIService` e `metaInsightsService`
- [ ] Prompt mantém JSON-only output (não quebra parser do frontend)
- [ ] Sem `any` nas assinaturas
- [ ] Testes unitários: `buildInstagramContext` com fixtures de snapshots + roundtrip do prompt
- [ ] Sem token OpenAI exposto em log

---

## Dependências

- **Story 10.3** — bloqueante (`metaInsightsService` para fallback se snapshot não existe ainda)
- **Story 10.4** — útil (snapshot diário popula dados); sem ela, contexto pode estar vazio ou demorar
- **Story 10.2** — útil para teste E2E

---

## Definição de Pronto

- [ ] Diagnóstico antigo continua funcionando exatamente como antes
- [ ] Diagnóstico novo cita números específicos no output (validação manual: 10 frases do diagnóstico, ao menos 6 com número/percentual)
- [ ] Endpoint testado em staging com consultoria conectada
- [ ] Botão aparece e desaparece conforme estado da consultoria
- [ ] Tokens OpenAI medidos: comparação custo médio antes/depois (espera ~2x — 4k tokens vs 2k)
- [ ] PR aberto via @devops, CodeRabbit clean, QA PASS

---

## Riscos

| Risco | Mitigação |
|---|---|
| Prompt fica grande demais e ultrapassa context window | Limitar top posts a 5, demografia a top 3, reels a 5. Estimar tokens com tiktoken antes de enviar. |
| OpenAI custo dobra | Aceitável — diagnóstico é feature premium. Métrica de custo monitorada. |
| Dados insuficientes geram diagnóstico fraco | Cair pro prompt antigo quando contexto < threshold de qualidade (poucos posts, sem demografia) |
| Diagnóstico fica "factual" demais e perde o tom estratégico do Iris | Prompt explicitamente pede análise estratégica baseada nos números, não dump de números |
| Backwards compatibility quebra com call antiga | Wrapper de função preserva. Teste de regressão obrigatório. |
