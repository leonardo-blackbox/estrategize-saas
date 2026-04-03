# Story 7.1 — Foundation: Migration + Plugin Catalog

**Épico:** Epic 7 — Market Intelligence
**Story:** 7.1
**Status:** Done
**Branch:** feat/7.1-market-intelligence-foundation
**Parallelismo:** WAVE 1 — deve ser executada primeiro (bloqueia todas as outras)

---

## User Story

> **Como** sistema,
> **Quero** ter as tabelas e o registro de plugin necessários para o Market Intelligence,
> **Para** que todas as outras stories possam construir sobre uma base de dados sólida e corretamente configurada.

---

## Contexto Técnico

**Estado atual:**
- Sistema de plugins já existe: tabelas `plugins` e `consultancy_plugins` (Phase 21-23)
- Não existe tabela `instagram_snapshots`, `market_research`, ou `plugin_configs`
- Plugin `pesquisa-mercado` não está registrado no catálogo

**O que será construído:**
- Migration `031_market_intelligence.sql` com 3 novas tabelas + RLS + índices
- INSERT do plugin `pesquisa-mercado` com config padrão
- Tipos TypeScript correspondentes em `frontend/src/types/market-intelligence.ts` e `backend/src/types/marketIntelligence.ts`

---

## Acceptance Criteria

### AC1 — Migration: tabela `instagram_snapshots`
- [ ] Tabela criada com colunas: `id`, `consultancy_id`, `user_id`, `handle`, `status`, `raw_data`, `error_message`, `scraped_at`, `created_at`
- [ ] `status` CHECK constraint: `pending | running | done | failed`
- [ ] RLS habilitado: usuária vê apenas snapshots das suas próprias consultorias
- [ ] Index em `(consultancy_id)` para lookup rápido

### AC2 — Migration: tabela `market_research`
- [ ] Tabela criada com colunas: `id`, `consultancy_id`, `user_id`, `status`, `progress_step`, `config_snapshot`, `competitors_discovered`, `instagram_data`, `websites_data`, `report_markdown`, `key_insights`, `rag_indexed`, `error_message`, `created_at`, `completed_at`, `credits_used`
- [ ] `status` CHECK: `pending | running_maps | running_instagram | running_websites | running_ai | done | failed`
- [ ] `progress_step` INT DEFAULT 0 (0-4 para UI progress bar)
- [ ] RLS: usuária vê apenas research das suas consultorias
- [ ] Index em `(consultancy_id, status)`

### AC3 — Migration: tabela `plugin_configs`
- [ ] Tabela criada: `id`, `slug` UNIQUE, `config` JSONB DEFAULT '{}', `updated_at`
- [ ] RLS: service_role tem acesso total; authenticated pode SELECT
- [ ] Seed: INSERT do registro `pesquisa-mercado` com config default completa (ver PRD seção 2)

### AC4 — Plugin registrado no catálogo
- [ ] INSERT na tabela `plugins`: `slug = 'pesquisa-mercado'`, `name = 'Pesquisa de Mercado'`, `description`, `is_free = false`, `features` array
- [ ] Plugin aparece em GET /api/plugins

### AC5 — Tipos TypeScript Backend
- [ ] `backend/src/types/marketIntelligence.ts` criado com:
  - `InstagramSnapshot` (espelha tabela)
  - `MarketResearch` (espelha tabela)
  - `PesquisaMercadoConfig` (interface tipada com todos os campos configuráveis)
  - `InstagramProfileData` (estrutura do raw_data do Apify)
  - `CompetitorData` (estrutura do competitors_discovered)

### AC6 — Tipos TypeScript Frontend
- [ ] `frontend/src/types/market-intelligence.ts` criado com tipos espelhando o backend
- [ ] Exportado corretamente

### AC7 — Migration aplicada
- [ ] Arquivo `supabase/migrations/20260401000031_market_intelligence.sql` criado
- [ ] `supabase db push` sem erros

---

## Checklist Técnico

- [ ] Migration usa `IF NOT EXISTS` para ser idempotente
- [ ] RLS políticas testadas (service_role bypass, user isolation)
- [ ] Config default do plugin tem todos os campos do `PesquisaMercadoConfig` interface
- [ ] Tipos não têm `any`
- [ ] Arquivo de migration segue nomenclatura `YYYYMMDDHHMMSS_name.sql`

---

## Dependências

- Nenhuma (esta é a story fundação)

---

## Definição de Pronto

- Migration aplicada no Supabase (local + produção)
- Tipos TypeScript sem erros de compilação
- Plugin visível em GET /api/plugins
