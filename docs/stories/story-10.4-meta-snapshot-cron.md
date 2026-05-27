# Story 10.4 — Snapshot Cron Diário + Stories Cron 6h + Trigger Manual

**Épico:** Epic 10 — Meta API Foundation (Onda 1)
**Story:** 10.4
**Status:** Draft
**Branch:** feat/10.4-meta-snapshot-cron
**Agente principal:** @dev
**Paralelismo:** WAVE 3 — paraleliza com 10.5; depende de 10.3

---

## User Story

> **Como** sistema,
> **Quero** capturar diariamente as métricas oficiais de cada consultoria conectada (e a cada 6h para stories, que expiram em 24h),
> **Para** que o painel UI e o diagnóstico Iris consumam dados frescos sem estourar rate limit em queries on-demand.

---

## Contexto Técnico

**Estado atual:**
- Há padrões de job assíncrono no projeto (`marketResearchService.startResearch()` roda em background), mas não há cron schedule rodando.
- `node-cron` não está instalado — precisa adicionar dependência
- `recallService.ts` tem cleanup de sessões antigas mas sem cron — disparado via endpoint

**O que será construído:**
- Dependência: `node-cron` (ou `croner` se preferido por @architect)
- `backend/src/services/metaSnapshotService.ts` — toda lógica de snapshot
- `backend/src/crons/metaSnapshotCron.ts` — agendamento + setup no startup
- `backend/src/crons/index.ts` — registry de todos os crons (criar se não existe)
- `backend/src/routes/adminMetaSnapshot.ts` — endpoint manual de trigger (admin-only)
- Token refresh job (mesmo cron diário, mas separado por clareza)

---

## Acceptance Criteria

### AC1 — Setup de cron framework
- [ ] `node-cron` adicionado a `backend/package.json`
- [ ] Arquivo `backend/src/crons/index.ts` exporta `registerAllCrons(): void`
- [ ] Chamada de `registerAllCrons()` em `backend/src/index.ts` no startup (após DB ready)
- [ ] Crons NÃO rodam quando `NODE_ENV=test`
- [ ] Cada cron tem flag `enabled` controlada por env var (ex: `META_SNAPSHOT_CRON_ENABLED=true`)

### AC2 — `metaSnapshotService.ts` — snapshot diário
- [ ] Função `runDailySnapshot(options?): Promise<SnapshotReport>`:
  - `options = { consultancyIds?: string[], dryRun?: boolean }` — opcional filtrar consultorias específicas (usado pelo endpoint manual)
  - Busca todas as conexões com `status='active' AND expires_at > now() + 1d`
  - Para cada conexão, em série (com `await`, NÃO Promise.all — evitar saturar rate limit global):
    1. Refresh token se `expires_at < now() + 14d`:
       - Chama `metaOAuthService.refreshLongLivedToken()`
       - Atualiza `access_token_encrypted`, `expires_at`, `last_refreshed_at`
    2. Snapshot account insights:
       - Chama `metaInsightsService.fetchAccountInsightsAggregate28d(consultancyId)`
       - Para cada métrica × dia retornada, faz `INSERT ... ON CONFLICT (consultancy_id, date, metric_name, period) DO UPDATE`
    3. Snapshot media (últimas 25):
       - Chama `fetchMediaList(consultancyId, { limit: 25 })`
       - Para cada media: `fetchMediaInsights` (em batch de 5 com `metaBatch()`)
       - INSERT em `instagram_media_insights` com `ON CONFLICT (consultancy_id, ig_media_id, captured_at::date) DO UPDATE`
    4. Snapshot demographics:
       - Chama `fetchAudienceDemographics('follower')` E `fetchAudienceDemographics('engaged')`
       - INSERT em `instagram_audience_snapshots`
    5. Atualiza `last_snapshot_at` na conexão
    6. Em qualquer erro: atualiza `last_error`, status='error', continua próxima conexão
- [ ] Logging estruturado por conexão: `{ event, consultancyId, durationMs, metricsCount, errors[] }`
- [ ] Retorna `SnapshotReport` = `{ totalConnections, successful, failed, errors[] }`
- [ ] Dry-run mode: simula tudo mas não escreve no banco

### AC3 — `metaSnapshotService.ts` — stories cron 6h
- [ ] Função `runStoriesSnapshot(): Promise<StoriesReport>`:
  - Para cada conexão ativa:
    1. GET `/{ig-user-id}/stories?fields=id,permalink,thumbnail_url,timestamp,media_type`
    2. Para cada story ativa: GET `/{story-id}/insights?metric=views,reach,replies,navigation,profile_visits,follows,shares,total_interactions`
    3. INSERT em `instagram_stories_insights` (sempre cria novo row — UNIQUE em `(consultancy_id, ig_story_id, captured_at)` permite múltiplos snapshots)
    4. Para stories que já existiam mas agora estão > 24h da `posted_at`: UPDATE `is_final=true` no snapshot mais recente

### AC4 — Cron schedule (`backend/src/crons/metaSnapshotCron.ts`)
- [ ] Cron 1: `0 3 * * *` (todo dia 03:00 BRT — timezone explícito `America/Sao_Paulo`)
  - Chama `runDailySnapshot()`
  - Lock global em memória: se já está rodando, ignora (log warn)
- [ ] Cron 2: `0 */6 * * *` (a cada 6 horas)
  - Chama `runStoriesSnapshot()`
  - Mesmo lock global
- [ ] Logs no startup: "Meta snapshot cron registered: daily=03:00 BRT, stories=every 6h"

### AC5 — Trigger manual admin
- [ ] `POST /api/admin/meta/snapshot/run` (requireAdmin)
  - Body: `{ consultancyIds?: string[], dryRun?: boolean, includeStories?: boolean }`
  - Roda `runDailySnapshot(options)` (e opcionalmente `runStoriesSnapshot`)
  - Response: `SnapshotReport` (síncrono — útil para teste, não escalar para >10 consultorias)
- [ ] `GET /api/admin/meta/snapshot/status` (requireAdmin)
  - Retorna `{ lastRun: timestamp, lastReport: SnapshotReport, currentlyRunning: boolean }`
- [ ] Página admin em `frontend/src/features/admin/pages/AdminMetaSnapshot.tsx` (opcional — pode ficar para depois): botão de trigger + view do último report

### AC6 — Observabilidade
- [ ] Após cada run, salvar resumo em tabela `audit_logs` (já existe):
  - `entity_type='meta-snapshot'`, `action='daily-run'` ou `'stories-run'`
  - `metadata` = SnapshotReport completo
- [ ] Métricas (futuro Sentry/Prometheus): `meta_snapshot_runs_total`, `meta_snapshot_errors_total`, `meta_snapshot_duration_seconds`
- [ ] Por enquanto, log estruturado é suficiente

### AC7 — Validações de robustez
- [ ] Lock global previne concorrência (2 runs simultâneos quebrariam idempotência)
- [ ] Token expirado durante run: marca conexão como `'expired'` mas continua o resto
- [ ] Erros isolados por conexão: 1 conexão com erro não derruba o run inteiro
- [ ] Timeout por conexão: 60s — depois move para próxima

---

## Checklist Técnico

- [ ] `node-cron` adicionado, verificado em produção (Railway aceita node-cron sem issues)
- [ ] Cron jobs idempotentes — rodar 2x mesmo dia não duplica linhas
- [ ] Sem `console.*` — sempre `logger.ts`
- [ ] Testes unitários para `runDailySnapshot` com mock de `metaInsightsService`
- [ ] Verificar comportamento em deploy Railway: cron sobrevive a restarts? (sim, mas perde execuções durante downtime — aceitável)

---

## Dependências

- **Story 10.1** — bloqueante (tabelas)
- **Story 10.3** — bloqueante (`metaInsightsService` para fetch)
- **Story 10.2** — útil mas não bloqueante (precisa de tokens reais para teste E2E)

---

## Definição de Pronto

- [ ] Cron registrado e rodando em staging por 48h sem erros
- [ ] Endpoint manual de trigger testado em staging
- [ ] Tabelas `instagram_insights_daily`, `instagram_media_insights`, `instagram_audience_snapshots`, `instagram_stories_insights` populadas para conta de teste
- [ ] Token refresh testado: forçar `expires_at = now() + 10d`, rodar snapshot, verificar que rotacionou
- [ ] PR aberto via @devops, CodeRabbit clean, QA PASS

---

## Riscos

| Risco | Mitigação |
|---|---|
| Snapshot saturando rate limit em horário de pico de uso normal | Cron roda 03:00 BRT (baixo tráfego). Stories cron espalhado a cada 6h. Em série por conexão. |
| Cron não roda em Railway por causa de sleep | Railway containers ficam acordados — verificar plano. Backup: usar GitHub Actions cron-driven HTTP trigger |
| Restart do container durante run = inconsistência | INSERT idempotente (`ON CONFLICT DO UPDATE`) garante consistência |
| Token refresh falha mas snapshot continua tentando | Detectar erro 190 (token expirado) e parar para essa conexão imediatamente |
| Snapshot quebra com conta que mudou de Business para Personal | Detectar erro 100 ou 803, marcar conexão como 'error' e continuar |
