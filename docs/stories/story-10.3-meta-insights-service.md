# Story 10.3 — metaInsightsService: Account + Media + Audience

**Épico:** Epic 10 — Meta API Foundation (Onda 1)
**Story:** 10.3
**Status:** Draft
**Branch:** feat/10.3-meta-insights-service
**Agente principal:** @dev
**Paralelismo:** WAVE 2 — paraleliza com 10.2

---

## User Story

> **Como** sistema backend,
> **Quero** ter um serviço único que leia métricas oficiais do Instagram (conta, mídia, audiência) com rate limit, retry e cache,
> **Para** que o cron de snapshot (10.4), o painel UI (10.5) e o diagnóstico Iris (10.6) consumam dados oficiais sem implementação duplicada.

---

## Contexto Técnico

**Estado atual:**
- `apifyService.ts` é o único hoje que chama APIs externas para Instagram (scraping)
- `metaCapiService.ts` já chama Graph API para CAPI — boa referência de estilo (https + crypto)
- Não há padrão de cache no backend além de `marketPluginConfigService.ts` (cache de 5min em memória)
- Não há padrão de retry exponencial implementado

**O que será construído:**
- `backend/src/services/metaInsightsService.ts` — todas as queries Graph API de leitura
- `backend/src/services/metaInsightsCache.ts` — in-memory cache (Map com TTL); arquitetar para troca por Redis depois
- `backend/src/routes/metaInsights.ts` — 3 endpoints REST
- Helper de retry e rate limit reaproveitável (pode virar `backend/src/lib/metaApiClient.ts`)

---

## Acceptance Criteria

### AC1 — Cliente HTTP base (`backend/src/lib/metaApiClient.ts`)

**NOTA (2026-05-27):** Por causa da decisão de usar Instagram Business Login, a base URL para insights de conexões IBL é `https://graph.instagram.com/` (não `https://graph.facebook.com/`). O cliente HTTP deve detectar qual base usar via `connection.auth_flow`:
- `auth_flow='instagram_business_login'` → `https://graph.instagram.com/`
- `auth_flow='facebook_login'` (futuro) → `https://graph.facebook.com/${META_GRAPH_API_VERSION}/`

- [ ] Função `metaGet<T>(path, accessToken, options): Promise<T>`:
  - `options = { baseUrl?: 'instagram' | 'facebook', params?: Record<string, string>, version?: string }`
  - `baseUrl='instagram'` (padrão Onda 1) → `https://graph.instagram.com/${path}?access_token=...&${qs}` (Instagram Graph API não usa version no path)
  - `baseUrl='facebook'` → `https://graph.facebook.com/${version ?? META_GRAPH_API_VERSION}/${path}?access_token=...&${qs}`
  - Retry exponencial em 429 e 5xx: 3 tentativas, backoff 1s, 4s, 16s + jitter
  - Em 429 lê `X-Business-Use-Case-Usage` header e respeita `estimated_time_to_regain_access`
  - Em 4xx (não 429), throw `MetaApiError` com code, type, message do JSON de erro
  - Em token expirado (code 190): marca conexão como `status='expired'` (passa callback opcional)
  - Logging via `logger.ts` — nunca loga `access_token`
- [ ] Função `metaBatch(requests, accessToken, options): Promise<Response[]>`:
  - Aceita base URL (Instagram ou Facebook)
  - Usa endpoint `POST /` com `?batch=...` para multiplexar até 50 requests numa chamada
  - Útil para snapshot diário (story 10.4)
- [ ] Helper `getBaseUrlForConnection(connection): 'instagram' | 'facebook'`:
  - Retorna baseUrl correto baseado em `connection.auth_flow`
  - Default para `instagram` (auth_flow padrão na Onda 1)

### AC2 — Cache `metaInsightsCache.ts`
- [ ] Implementação in-memory via `Map<string, { value: unknown, expiresAt: number }>`
- [ ] API: `get<T>(key): T | null`, `set(key, value, ttlSeconds): void`, `delete(key)`, `clear()`
- [ ] Cleanup automático: setInterval a cada 5min remove entries expirados
- [ ] Key convention: `meta:{consultancyId}:{kind}:{specifier}` (ex: `meta:abc-123:account:reach_28d`)
- [ ] TTL padrão por kind (constante exportada):
  - `account` → 3600 (1h)
  - `media-list` → 1800 (30min)
  - `media-insights` → 21600 (6h)
  - `audience` → 86400 (24h)
- [ ] Comentário no topo do arquivo explicando como trocar por Redis (interface fica igual)

### AC3 — `metaInsightsService.ts` — Account
- [ ] Função `fetchAccountInsights(consultancyId, options): Promise<AccountInsights>`:
  - `options = { since?, until?, metrics?, period? }` — defaults: últimos 28d, métricas: reach, views, accounts_engaged, profile_views (deprecado mas serve como fallback), profile_links_taps, total_interactions, likes, comments, saves, shares, replies, follows, unfollows, period='day'
  - Busca conexão ativa em `instagram_official_connections` (cacheia conexão em memória 60s)
  - Decripta token via `decryptToken()`
  - Chama `GET /{ig-user-id}/insights?metric=...&period=...&since=...&until=...&access_token=...`
  - Normaliza resposta (Meta retorna em formato verboso) para objeto simples `{ reach: number, views: number, ... }` por dia
  - Caching: `meta:{consultancyId}:account:{since}-{until}` TTL 1h
- [ ] Função `fetchAccountInsightsAggregate28d(consultancyId): Promise<{ metrics, comparison }>`:
  - Conveniência: roda 2 chamadas (últimos 28d + 28d anteriores), retorna agregados + variação
- [ ] Função `fetchAccountSummary(consultancyId): Promise<{ ig_username, followers_count, follows_count, media_count, biography, profile_picture_url, account_type }>`:
  - GET `/{ig-user-id}?fields=username,followers_count,follows_count,media_count,biography,profile_picture_url,account_type`
  - TTL 1h

### AC4 — `metaInsightsService.ts` — Media
- [ ] Função `fetchMediaList(consultancyId, options): Promise<MediaItem[]>`:
  - `options = { limit?: 25, after?: string }` — pagina cursor-based
  - GET `/{ig-user-id}/media?fields=id,caption,media_type,media_product_type,media_url,permalink,thumbnail_url,timestamp,like_count,comments_count&limit=...`
  - Caching: `meta:{consultancyId}:media-list:{limit}:{after}` TTL 30min
  - Retorna `{ items, nextCursor }`
- [ ] Função `fetchMediaInsights(consultancyId, igMediaId, mediaProductType): Promise<MediaInsights>`:
  - Métricas variam por tipo:
    - FEED (IMAGE/CAROUSEL_ALBUM): `reach, views, likes, comments, saved, shares, total_interactions, profile_visits, profile_activity, follows`
    - REELS (VIDEO com media_product_type=REELS): adicionar `ig_reels_avg_watch_time, ig_reels_video_view_total_time, clips_replays_count`
    - STORY: cobertos pela story-specific endpoint, não cair aqui
  - GET `/{ig-media-id}/insights?metric=...&access_token=...`
  - Caching TTL 6h
- [ ] Função `fetchMediaWithInsightsBatch(consultancyId, igMediaIds[]): Promise<MediaWithInsights[]>`:
  - Usa `metaBatch()` para puxar insights de até 50 mídias numa chamada
  - Usado pelo cron (10.4)

### AC5 — `metaInsightsService.ts` — Audience
- [ ] Função `fetchAudienceDemographics(consultancyId, type): Promise<AudienceData>`:
  - `type = 'follower' | 'engaged'`
  - GET `/{ig-user-id}/insights?metric=follower_demographics` (ou `engaged_audience_demographics`)
  - Breakdowns: `age`, `gender`, `country`, `city`
  - Normaliza para: `{ ageGender: { "F.18-24": 0.12, ... }, topCities: [{city, country, percent}], topCountries: [{country, percent}] }`
  - Caching TTL 24h
  - Trata caso ig conta < 100 followers (Meta retorna erro 100): retorna `null` + log warn

### AC6 — Endpoints REST `backend/src/routes/metaInsights.ts`
- [ ] `GET /api/meta/insights/:consultancyId/account?since=&until=` (autenticado)
  - Valida ownership
  - Chama `fetchAccountInsightsAggregate28d` por padrão (sem query params)
  - Response: `{ summary, metrics, comparison, period: { since, until } }`
- [ ] `GET /api/meta/insights/:consultancyId/media?limit=25&after=` (autenticado)
  - Chama `fetchMediaList` + para cada mídia chama `fetchMediaInsights` (em batch)
  - Response: `{ items: MediaWithInsights[], nextCursor }`
- [ ] `GET /api/meta/insights/:consultancyId/audience` (autenticado)
  - Chama `fetchAudienceDemographics('follower')` E `fetchAudienceDemographics('engaged')` em paralelo
  - Response: `{ follower, engaged }`
- [ ] Todos endpoints retornam 404 se não há conexão ativa (em vez de erro genérico)
- [ ] Todos endpoints retornam 503 + retry-after se rate limit foi atingido

### AC7 — Tipos compartilhados em `backend/src/types/metaApi.ts`
- [ ] Interfaces: `MetaConnection`, `AccountInsights`, `MediaItem`, `MediaInsights`, `MediaWithInsights`, `AudienceData`, `AgeGenderBreakdown`, `LocationBreakdown`, `MetaApiError`
- [ ] Re-exportados via `frontend/src/types/meta-api.ts` (cópia manual ou via shared types — verificar padrão do projeto)

### AC8 — Tratamento de erros e observabilidade
- [ ] `MetaApiError` extends `Error` com `code`, `type`, `subcode`, `fbTraceId`
- [ ] Token inválido (code 190): atualiza `instagram_official_connections.status = 'expired'` e `last_error`
- [ ] Permissão faltando (code 200): log error + retorna 403 ao cliente com mensagem clara
- [ ] Rate limit (429): retry automático + se persistir, retorna 503 com `Retry-After` header
- [ ] Todos os erros gravam log estruturado: `{ event: 'meta-api-error', consultancyId, endpoint, code, type, attemptNumber }`

---

## Checklist Técnico

- [ ] Sem `console.*` — sempre `logger.ts`
- [ ] Token nunca em log (mascarar)
- [ ] Sem N+1 nas funções batch — uma chamada por consultancyId quando possível
- [ ] Testes unitários com fetch mockado para fetchAccountInsights, fetchMediaList, fetchAudienceDemographics
- [ ] Cobertura mínima do `metaInsightsService.ts`: 50%
- [ ] Sem `any` em assinaturas de função

---

## Dependências

- **Story 10.1** — bloqueante (precisa de `instagram_official_connections` para ler token)
- **Story 10.2** — opcional para teste E2E (pode usar token mock manual em dev até 10.2 estar pronto)
- **Env:** `META_GRAPH_API_VERSION` (padrão `v22.0`), `META_TOKEN_ENCRYPTION_KEY`

---

## Definição de Pronto

- [ ] 3 endpoints respondem com dados reais em staging usando conta de teste
- [ ] Rate limit handler testado via mock (resposta 429 → retry)
- [ ] Cache hit/miss observável via log
- [ ] Tipos exportados e usados em frontend (Story 10.5)
- [ ] PR aberto via @devops, CodeRabbit clean, QA PASS

---

## Riscos

| Risco | Mitigação |
|---|---|
| Métricas mudaram entre versões da API | Pinned em `META_GRAPH_API_VERSION` + monitorar deprecation notices |
| Cache in-memory perde dados em restart | Aceitável na Onda 1; Redis na Onda 2 |
| Endpoint demora em produção sob carga | Snapshot diário (10.4) reduz queries on-demand; cache aliviam |
| Diferença entre `views` (v22+) e `impressions` (deprecado) | Usar `views` como métrica primária; documentar |
| `engaged_audience_demographics` falha para contas pequenas | Tratar erro 100 graciosamente, retornar null + UI mostra "Audiência muito pequena para demografia" |
