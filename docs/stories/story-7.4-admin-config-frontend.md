# Story 7.4 — Admin Plugin Config: Painel Frontend Completo

**Épico:** Epic 7 — Market Intelligence
**Story:** 7.4
**Status:** Done
**Branch:** feat/7.4-admin-plugin-config-frontend
**Parallelismo:** WAVE 3 — executar em paralelo com Story 7.5 (após 7.3 concluída)

---

## User Story

> **Como** admin (Iris),
> **Quero** um painel de configuração rico e completo para o plugin de Pesquisa de Mercado,
> **Para** controlar exatamente o que é coletado, como o relatório é gerado, quanto custa e o que vai para o RAG — sem tocar em código.

---

## Contexto Técnico

**Estado atual:**
- Admin tem sidebar com navegação em `frontend/src/features/admin/`
- Padrão de páginas admin: agregador ≤ 200 linhas + micro-módulos ≤ 80 linhas
- Não existe página de config de plugin

**O que será construído:**
- Rota: `/admin/plugins/pesquisa-mercado`
- Página: `AdminPluginPesquisaMercadoPage.tsx` (wrapper ≤ 20 linhas)
- Agregador: `AdminPluginPesquisaMercadoForm.tsx` (≤ 200 linhas)
- 6 micro-módulos de seção:
  - `ConfigSectionGeneral.tsx`
  - `ConfigSectionInstagram.tsx`
  - `ConfigSectionDiscovery.tsx`
  - `ConfigSectionAIReport.tsx`
  - `ConfigSectionRAG.tsx`
  - `ConfigSectionCredits.tsx`
- Hook: `usePluginConfig.ts` (React Query GET + mutation PUT)
- Tipo API: `frontend/src/api/pluginConfig.ts`

---

## Acceptance Criteria

### AC1 — Rota e navegação no admin
- [ ] Rota `/admin/plugins/pesquisa-mercado` registrada no router
- [ ] Item "Plugins" ou "Pesquisa de Mercado" adicionado à sidebar do admin
- [ ] AdminRoute guard aplicado (redireciona não-admin)

### AC2 — API client `pluginConfig.ts`
- [ ] `frontend/src/api/pluginConfig.ts` com funções:
  - `getPluginConfig(slug: string): Promise<PesquisaMercadoConfig>`
  - `updatePluginConfig(slug: string, partial: Partial<PesquisaMercadoConfig>): Promise<PesquisaMercadoConfig>`
- [ ] Usa `client` existente (fetch wrapper)

### AC3 — Hook `usePluginConfig.ts`
- [ ] `frontend/src/features/admin/hooks/usePluginConfig.ts`
- [ ] `usePluginConfig(slug)` retorna: `{ config, isLoading, error, updateConfig, isUpdating }`
- [ ] React Query com `staleTime: 5 * 60 * 1000`
- [ ] `updateConfig(partial)` → mutation → invalidate query → retorna config atualizada
- [ ] Toast de sucesso/erro após mutation

### AC4 — Página wrapper
- [ ] `frontend/src/pages/admin/AdminPluginPesquisaMercadoPage.tsx` ≤ 20 linhas
- [ ] Apenas importa e renderiza o agregador

### AC5 — Agregador `AdminPluginPesquisaMercadoForm.tsx`
- [ ] Localizado em `frontend/src/features/admin/components/AdminPluginPesquisaMercadoForm/`
- [ ] Carrega config via `usePluginConfig('pesquisa-mercado')`
- [ ] Header com título "Pesquisa de Mercado — Configurações do Plugin" + botão "Salvar Configurações"
- [ ] Estado local de draft: `useState(config)` — edições ficam em draft até salvar
- [ ] Botão salvar chama `updateConfig(draftConfig)` → desabilita enquanto `isUpdating`
- [ ] Renderiza os 6 micro-módulos de seção passando `draftConfig` e `onChange`

### AC6 — Seção General (`ConfigSectionGeneral.tsx`)
- [ ] Toggle: "Plugin habilitado" (`enabled`)
- [ ] Toggle: "Instagram Auto-Scan ativo" (`instagram_scan_enabled`)
- [ ] Exibe aviso visual quando plugin desabilitado

### AC7 — Seção Instagram Scan (`ConfigSectionInstagram.tsx`)
- [ ] Select: "Posts a buscar" — opções: 6, 12, 24, 48 (`instagram_posts_count`)
- [ ] Toggle: "Calcular taxa de engajamento" (`instagram_engagement_rate`)
- [ ] Toggle: "Calcular frequência de posts" (`instagram_posting_frequency`)
- [ ] Toggle: "Análise de hashtags" (`instagram_hashtag_analysis`)
- [ ] Toggle: "Breakdown de conteúdo (reels/fotos/carrosséis)" (`instagram_content_breakdown`)

### AC8 — Seção Descoberta de Concorrentes (`ConfigSectionDiscovery.tsx`)
- [ ] Checkboxes múltiplos: "Fontes de descoberta" — Google Maps, Busca Instagram (`discovery_sources`)
- [ ] Select: "Máximo de concorrentes a descobrir" — 5, 10, 20, 50 (`max_competitors_discover`)
- [ ] Select: "Máximo a analisar no Instagram" — 3, 5, 10, 20 (`max_competitors_instagram`)
- [ ] Toggle: "Analisar sites dos concorrentes (Firecrawl)" (`include_competitor_websites`)
- [ ] Select condicional (visível se toggle acima = true): "Máximo de sites" — 3, 5, 10 (`max_websites_scrape`)

### AC9 — Seção Relatório IA (`ConfigSectionAIReport.tsx`)
- [ ] Select: "Idioma do relatório" — PT-BR, English (`report_language`)
- [ ] Select: "Estilo do relatório" — Executivo, Detalhado, Orientado a Ação (`report_style`)
- [ ] Checkboxes por seção do relatório (8 opções): Panorama do Mercado, Análise de Concorrentes, Análise de Redes Sociais, Presença Digital, Oportunidades, Ameaças e Riscos, Posicionamento Sugerido, Plano de Ação (`report_sections.*`)
- [ ] Textarea: "Prompt personalizado (opcional)" — placeholder: "Deixe vazio para usar o prompt padrão" (`custom_system_prompt`, max 3000 chars, contador de chars)
- [ ] Select: "Temperatura da IA" — 0.3 (Conservador), 0.5 (Balanceado), 0.7 (Criativo) (`ai_temperature`)

### AC10 — Seção RAG (`ConfigSectionRAG.tsx`)
- [ ] Toggle: "Indexar relatório automaticamente no RAG após conclusão" (`auto_index_rag`)
- [ ] Input text: "Tag de contexto RAG" (`rag_context_tag`, placeholder: "pesquisa-mercado")
- [ ] Toggle: "Incluir dados brutos dos concorrentes no RAG" (`include_raw_data_in_rag`)

### AC11 — Seção Créditos (`ConfigSectionCredits.tsx`)
- [ ] Number input: "Créditos para scan básico de Instagram" — 0 = gratuito (`credits_cost_basic`)
- [ ] Number input: "Créditos para pesquisa profunda" (`credits_cost_deep`)
- [ ] Toggle: "Primeira pesquisa gratuita por consultoria" (`free_first_research`)
- [ ] Exibir previsão: "Custo atual: X créditos por pesquisa profunda"

### AC12 — Estados e UX
- [ ] Loading skeleton enquanto config carrega
- [ ] Campos desabilitados enquanto `isUpdating`
- [ ] Campos condicionais mostrados/ocultos corretamente (ex: `max_websites_scrape` só se `include_competitor_websites = true`)
- [ ] Botão salvar: disabled se config draft === config salva (sem mudanças)
- [ ] Toast de sucesso após salvar
- [ ] Toast de erro com mensagem se falhar

---

## Checklist Técnico

- [ ] Nenhum fetch direto em micro-módulo — tudo via `usePluginConfig` no agregador
- [ ] Micro-módulos recebem apenas `config: PesquisaMercadoConfig` e `onChange: (partial) => void`
- [ ] Sem `any` em handlers
- [ ] Design consistente com outros painéis admin (mesmos tokens CSS)
- [ ] Responsivo em 375px (campos em coluna única em mobile)

---

## Dependências

- Story 7.1 (tipos `PesquisaMercadoConfig`)
- Story 7.3 (rotas backend GET/PUT)

---

## Definição de Pronto

- Admin acessa `/admin/plugins/pesquisa-mercado` sem erro
- Todos os 6 campos de seção renderizados e funcionais
- Editar e salvar persiste no banco
- Recarregar a página exibe valores salvos
