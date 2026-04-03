# Story 7.3 — Admin Plugin Config: Backend Routes + Config Schema

**Épico:** Epic 7 — Market Intelligence
**Story:** 7.3
**Status:** Done
**Branch:** feat/7.3-admin-plugin-config-backend
**Parallelismo:** WAVE 2 — executar em paralelo com Story 7.2 (após 7.1 concluída)

---

## User Story

> **Como** admin (Iris),
> **Quero** APIs para ler e atualizar a configuração do plugin de Pesquisa de Mercado,
> **Para** que o painel de admin possa controlar todos os parâmetros do sistema.

---

## Contexto Técnico

**Estado atual:**
- `backend/src/routes/admin/` tem rotas: courses, formacao, home, knowledge, ofertas, plugins, stripe, turmas, users
- `backend/src/routes/admin/plugins.ts` existe mas foca em listagem de plugins (não em config por slug)
- Tabela `plugin_configs` será criada na Story 7.1

**O que será construído:**
- `backend/src/services/pluginConfigService.ts` — CRUD + cache para configurações de plugin
- Rotas em `backend/src/routes/admin/plugins.ts` (ou novo arquivo `pluginConfig.ts`):
  - `GET /api/admin/plugins/:slug/config`
  - `PUT /api/admin/plugins/:slug/config`
- Schema Zod validando todos os campos de `PesquisaMercadoConfig`

---

## Acceptance Criteria

### AC1 — `pluginConfigService.ts`
- [ ] Criado em `backend/src/services/pluginConfigService.ts`
- [ ] `getConfig(slug: string): Promise<PesquisaMercadoConfig>` — busca no banco; se não existe, retorna default hardcoded
- [ ] `updateConfig(slug: string, partial: Partial<PesquisaMercadoConfig>): Promise<PesquisaMercadoConfig>` — upsert no banco
- [ ] Cache em memória com TTL de 5 minutos:
  ```typescript
  let cache: { value: PesquisaMercadoConfig; expiresAt: number } | null = null
  ```
- [ ] Cache invalidado ao fazer `updateConfig`
- [ ] Config default exportada como constante: `DEFAULT_PESQUISA_MERCADO_CONFIG`

### AC2 — Config default completa
- [ ] `DEFAULT_PESQUISA_MERCADO_CONFIG` deve conter **todos** os campos abaixo com valores padrão:
  ```typescript
  {
    // General
    enabled: true,
    // Tier 1
    instagram_scan_enabled: true,
    instagram_posts_count: 12,
    instagram_engagement_rate: true,
    instagram_posting_frequency: true,
    instagram_hashtag_analysis: false,
    instagram_content_breakdown: true,
    // Tier 2 — Discovery
    discovery_sources: ['google_maps'],
    max_competitors_discover: 10,
    max_competitors_instagram: 5,
    include_competitor_websites: true,
    max_websites_scrape: 5,
    // AI Report
    report_language: 'pt-BR',
    report_style: 'detailed',
    report_sections: {
      market_overview: true,
      competitor_analysis: true,
      social_media_analysis: true,
      digital_presence: true,
      opportunities: true,
      threats: true,
      positioning: true,
      action_plan: true,
    },
    custom_system_prompt: null,
    ai_temperature: 0.5,
    // RAG
    auto_index_rag: true,
    rag_context_tag: 'pesquisa-mercado',
    include_raw_data_in_rag: false,
    // Credits
    credits_cost_basic: 0,
    credits_cost_deep: 5,
    free_first_research: true,
  }
  ```

### AC3 — Zod Schema de validação
- [ ] `pesquisaMercadoConfigSchema` exportado validando cada campo:
  - `enabled`: boolean
  - `instagram_scan_enabled`: boolean
  - `instagram_posts_count`: z.union([z.literal(6), z.literal(12), z.literal(24), z.literal(48)])
  - `instagram_engagement_rate`: boolean
  - `instagram_posting_frequency`: boolean
  - `instagram_hashtag_analysis`: boolean
  - `instagram_content_breakdown`: boolean
  - `discovery_sources`: z.array(z.enum(['google_maps', 'instagram_search'])).min(1)
  - `max_competitors_discover`: z.union([z.literal(5), z.literal(10), z.literal(20), z.literal(50)])
  - `max_competitors_instagram`: z.union([z.literal(3), z.literal(5), z.literal(10), z.literal(20)])
  - `include_competitor_websites`: boolean
  - `max_websites_scrape`: z.union([z.literal(3), z.literal(5), z.literal(10)])
  - `report_language`: z.enum(['pt-BR', 'en'])
  - `report_style`: z.enum(['executive', 'detailed', 'action-focused'])
  - `report_sections`: z.object({ ... todos os 8 campos como boolean })
  - `custom_system_prompt`: z.string().max(3000).nullable()
  - `ai_temperature`: z.union([z.literal(0.3), z.literal(0.5), z.literal(0.7)])
  - `auto_index_rag`: boolean
  - `rag_context_tag`: z.string().min(1).max(100)
  - `include_raw_data_in_rag`: boolean
  - `credits_cost_basic`: z.number().int().min(0).max(100)
  - `credits_cost_deep`: z.number().int().min(0).max(100)
  - `free_first_research`: boolean

### AC4 — GET /api/admin/plugins/:slug/config
- [ ] Rota em arquivo de admin plugins (criar ou expandir)
- [ ] `requireAuth` + `requireAdmin`
- [ ] Valida `slug` = `pesquisa-mercado` (400 se outro slug por ora)
- [ ] Retorna config atual mesclada com defaults (garante que campos novos apareçam mesmo se banco está desatualizado)
- [ ] Response: `{ config: PesquisaMercadoConfig }`

### AC5 — PUT /api/admin/plugins/:slug/config
- [ ] `requireAuth` + `requireAdmin`
- [ ] Body: `Partial<PesquisaMercadoConfig>` validado com schema Zod (`.partial()`)
- [ ] Merge com config atual (não sobrescreve campos não enviados)
- [ ] Invalida cache após salvar
- [ ] Retorna config completa atualizada
- [ ] Response: `{ config: PesquisaMercadoConfig }`

### AC6 — Rotas registradas
- [ ] Novas rotas acessíveis em `GET/PUT /api/admin/plugins/pesquisa-mercado/config`
- [ ] Middleware de admin verificado (requireAdmin retorna 403 para não-admin)

---

## Checklist Técnico

- [ ] Cache de módulo com TTL (não usar Redis — in-process é suficiente para MVP)
- [ ] `updateConfig` faz UPSERT (INSERT ... ON CONFLICT slug DO UPDATE)
- [ ] Sem `any` em tipos
- [ ] Erros Zod retornam 400 com mensagem legível

---

## Dependências

- Story 7.1 (tabela `plugin_configs` + tipo `PesquisaMercadoConfig`)

---

## Definição de Pronto

- `GET /api/admin/plugins/pesquisa-mercado/config` retorna config default completa
- `PUT` com campos parciais persiste e retorna config completa atualizada
- Chamada dupla com PUT idêntico não duplica registros (upsert correto)
