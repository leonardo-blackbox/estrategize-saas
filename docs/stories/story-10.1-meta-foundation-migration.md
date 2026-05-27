# Story 10.1 — Foundation: Migration 035 + Token Vault (pgcrypto)

**Épico:** Epic 10 — Meta API Foundation (Onda 1)
**Story:** 10.1
**Status:** Draft
**Branch:** feat/10.1-meta-foundation-migration
**Agente principal:** @data-engineer
**Paralelismo:** WAVE 1 — bloqueia todas as outras stories da Epic

---

## User Story

> **Como** sistema,
> **Quero** ter 5 tabelas Meta no banco de dados com RLS, indexes, pgcrypto e schema preparado para snapshots,
> **Para** que as stories subsequentes (OAuth, Insights, Cron, UI, Diagnóstico) possam construir sobre uma base sólida e segura.

---

## Contexto Técnico

**Estado atual:**
- Última migration: `034_helena_events.sql` (verificar nome exato ao começar — pode ter migrations sob `supabase/migrations/` também)
- pgcrypto pode ou não estar habilitado — verificar via `SELECT * FROM pg_extension WHERE extname='pgcrypto'`
- Padrão RLS do projeto: `auth.uid() = user_id` ou via JOIN para tabelas filhas
- Nenhuma tabela `instagram_*` oficial existe — `instagram_snapshots` é do Apify (Phase Market Intelligence)

**O que será construído:**
- Arquivo `backend/src/database/migrations/035_meta_foundation.sql`
- 5 tabelas novas, todas escopadas por `consultancy_id` com RLS via JOIN com `consultancies`
- Extensão pgcrypto habilitada
- Coluna `access_token_encrypted` na tabela de conexões — encriptação via `pgp_sym_encrypt()`

---

## Acceptance Criteria

### AC1 — Habilitação do pgcrypto
- [ ] Migration inclui `CREATE EXTENSION IF NOT EXISTS pgcrypto`
- [ ] Comentário SQL explica que pgcrypto é usado para encriptar tokens Meta

### AC2 — Tabela `instagram_official_connections`

**NOTA (2026-05-27):** O fluxo OAuth foi mudado para **Instagram Business Login** (direto, sem Page intermediária). Por isso `page_id` e `page_name` ficam nullable — permanecem opcionais para suportar Facebook Login no futuro caso queiramos cobrir Creator accounts.

- [ ] Colunas:
  - `id` (uuid PK, default gen_random_uuid())
  - `consultancy_id` (uuid FK consultancies CASCADE NOT NULL)
  - `user_id` (uuid FK auth.users NOT NULL — owner que conectou)
  - `ig_user_id` (text UNIQUE NOT NULL — Instagram Business Account ID, retornado por `/me?fields=user_id`)
  - `ig_username` (text NOT NULL)
  - `page_id` (text NULL — Facebook Page ID, populado apenas se Facebook Login for Business; null em Instagram Business Login direto)
  - `page_name` (text NULL)
  - `access_token_encrypted` (bytea NOT NULL — pgp_sym_encrypt output)
  - `scopes` (text[] NOT NULL DEFAULT '{}')
  - `account_type` (text CHECK IN 'BUSINESS','CREATOR' NOT NULL — Instagram Business Login só retorna BUSINESS)
  - `auth_flow` (text CHECK IN 'instagram_business_login','facebook_login' NOT NULL DEFAULT 'instagram_business_login' — registra qual flow originou a conexão)
  - `status` (text CHECK IN 'active','expired','revoked','error' DEFAULT 'active')
  - `expires_at` (timestamptz NOT NULL — 60d após connect)
  - `last_refreshed_at` (timestamptz)
  - `last_error` (text)
  - `connected_at` (timestamptz DEFAULT now())
  - `updated_at` (timestamptz DEFAULT now())
- [ ] UNIQUE constraint em `(consultancy_id)` — uma consultoria, uma conexão
- [ ] Index em `(status)` para query de cron
- [ ] Index em `(expires_at)` para query de refresh job
- [ ] RLS habilitado
- [ ] Policy: usuário vê apenas conexões de suas próprias consultorias via `consultancy_id IN (SELECT id FROM consultancies WHERE user_id = auth.uid())`
- [ ] Service role tem INSERT/UPDATE/DELETE irrestrito (necessário para cron e webhook)

### AC3 — Tabela `instagram_insights_daily`
- [ ] Colunas:
  - `id` (uuid PK)
  - `consultancy_id` (uuid FK consultancies CASCADE NOT NULL)
  - `date` (date NOT NULL)
  - `metric_name` (text NOT NULL — ex: 'reach', 'views', 'accounts_engaged', 'profile_links_taps', 'total_interactions', 'follows', 'unfollows')
  - `value` (bigint NOT NULL)
  - `period` (text CHECK IN 'day','week','days_28','lifetime' NOT NULL)
  - `created_at` (timestamptz DEFAULT now())
- [ ] UNIQUE constraint em `(consultancy_id, date, metric_name, period)` — idempotência do cron
- [ ] Index composto em `(consultancy_id, date DESC)`
- [ ] RLS via JOIN com `consultancies` (mesmo padrão da tabela anterior)

### AC4 — Tabela `instagram_media_insights`
- [ ] Colunas:
  - `id` (uuid PK)
  - `consultancy_id` (uuid FK consultancies CASCADE NOT NULL)
  - `ig_media_id` (text NOT NULL — Instagram media ID)
  - `media_type` (text CHECK IN 'IMAGE','VIDEO','CAROUSEL_ALBUM' NOT NULL)
  - `media_product_type` (text CHECK IN 'FEED','REELS','STORY' NOT NULL)
  - `permalink` (text)
  - `caption` (text)
  - `thumbnail_url` (text)
  - `posted_at` (timestamptz)
  - `captured_at` (timestamptz DEFAULT now())
  - `metrics` (jsonb NOT NULL — { reach, views, likes, comments, saved, shares, total_interactions, profile_visits, follows, ig_reels_avg_watch_time, ig_reels_video_view_total_time, clips_replays_count })
- [ ] UNIQUE constraint em `(consultancy_id, ig_media_id, captured_at::date)` — uma captura por dia por mídia
- [ ] Index em `(consultancy_id, posted_at DESC)`
- [ ] Index em `(consultancy_id, media_product_type)` para filtros
- [ ] RLS via JOIN com `consultancies`

### AC5 — Tabela `instagram_audience_snapshots`
- [ ] Colunas:
  - `id` (uuid PK)
  - `consultancy_id` (uuid FK consultancies CASCADE NOT NULL)
  - `date` (date NOT NULL)
  - `audience_type` (text CHECK IN 'follower','engaged' NOT NULL)
  - `total_followers` (bigint)
  - `age_gender` (jsonb — { "F.18-24": 0.12, "M.25-34": 0.08, ... })
  - `top_cities` (jsonb — [{ city, country, percent }] até 45)
  - `top_countries` (jsonb — [{ country, percent }] até 45)
  - `locales` (jsonb)
  - `captured_at` (timestamptz DEFAULT now())
- [ ] UNIQUE constraint em `(consultancy_id, date, audience_type)`
- [ ] Index em `(consultancy_id, date DESC)`
- [ ] RLS via JOIN com `consultancies`

### AC6 — Tabela `instagram_stories_insights`
- [ ] Colunas:
  - `id` (uuid PK)
  - `consultancy_id` (uuid FK consultancies CASCADE NOT NULL)
  - `ig_story_id` (text NOT NULL)
  - `permalink` (text)
  - `thumbnail_url` (text)
  - `posted_at` (timestamptz)
  - `captured_at` (timestamptz DEFAULT now())
  - `metrics` (jsonb NOT NULL — { views, reach, replies, navigation, profile_visits, follows, shares, reposts, total_interactions })
  - `is_final` (boolean DEFAULT false — true após 24h, congela último snapshot)
- [ ] UNIQUE constraint em `(consultancy_id, ig_story_id, captured_at)` (permite múltiplos snapshots na janela de 24h)
- [ ] Index em `(consultancy_id, posted_at DESC)`
- [ ] Index em `(captured_at)` para query de cron
- [ ] RLS via JOIN com `consultancies`

### AC7 — Teste de pgcrypto round-trip
- [ ] Migration inclui bloco DO $$ ... $$ comentado (ou nota em comentário SQL) que documenta como testar:
  ```sql
  -- Teste manual após apply:
  -- SELECT pgp_sym_encrypt('test-token', 'test-key');
  -- SELECT pgp_sym_decrypt(pgp_sym_encrypt('test-token', 'test-key'), 'test-key');
  ```
- [ ] Validação prática: após `supabase db push`, executar o round-trip e confirmar que retorna `'test-token'`

### AC8 — Idempotência e qualidade
- [ ] Toda criação usa `CREATE TABLE IF NOT EXISTS`, `CREATE INDEX IF NOT EXISTS`, `CREATE EXTENSION IF NOT EXISTS`
- [ ] Todas as policies usam `DROP POLICY IF EXISTS ... ; CREATE POLICY ...` para serem idempotentes
- [ ] Migration executa sem erros via `supabase db push`
- [ ] Migration roda 2x seguidas sem erro
- [ ] Sem `DROP TABLE` ou comandos destrutivos
- [ ] Comentários SQL nas colunas menos óbvias (ex: `COMMENT ON COLUMN ... IS '...'`)

---

## Checklist Técnico

- [ ] Migration nomeada `035_meta_foundation.sql` em `backend/src/database/migrations/` (verificar se há migrations em `supabase/migrations/` também e seguir o padrão correto)
- [ ] Todas as FKs com `ON DELETE CASCADE` apropriado
- [ ] Indexes criados para todas as colunas usadas em queries do cron e dos endpoints
- [ ] RLS validada manualmente:
  - usuário A não vê conexão da consultoria de B
  - service role consegue inserir snapshot sem auth context
- [ ] pgcrypto round-trip testado e documentado
- [ ] Sem secrets ou keys hardcoded — encryption key vem da env `META_TOKEN_ENCRYPTION_KEY`

---

## Dependências

- Nenhuma story anterior (esta é a fundação da Epic 10)
- Pré-requisitos externos:
  - `supabase` CLI configurado para o projeto correto
  - Acesso ao banco de produção via service role (já existe)
- Pré-requisitos do app Meta: não bloqueiam esta story (são para 10.2)

---

## Definição de Pronto

- [ ] Arquivo `035_meta_foundation.sql` criado
- [ ] `supabase db push` executado em staging sem erros
- [ ] 5 tabelas criadas, RLS habilitada em todas
- [ ] pgcrypto extension habilitada
- [ ] Round-trip de pgcrypto testado e documentado em comentário SQL
- [ ] RLS verificada manualmente em staging
- [ ] PR aberto via @devops, CodeRabbit clean
- [ ] Story status atualizada para Done após merge

---

## Riscos

| Risco | Mitigação |
|---|---|
| pgcrypto não disponível no Supabase tier atual | Validar antes via `SELECT * FROM pg_available_extensions WHERE name='pgcrypto'`. Pgcrypto está disponível no plano free do Supabase. |
| Migration conflita com numeração existente | Verificar última migration ao começar; renumerar se necessário para sequência contínua |
| RLS muito restritiva quebra cron | Service role tem bypass por padrão. Testar inserção via service role antes de fechar story |
| Tamanho da coluna `bytea` cresce com muitos tokens | Aceitável: ~500 bytes por token; 10k conexões = 5 MB |
