# Story 7.8 — Frontend: Pesquisa Profunda Plugin Tab

**Épico:** Epic 7 — Market Intelligence
**Story:** 7.8
**Status:** Done
**Branch:** feat/7.8-pesquisa-profunda-tab
**Parallelismo:** WAVE 5 — executar após 7.6 e 7.7

---

## User Story

> **Como** consultora com o plugin Pesquisa de Mercado instalado,
> **Quero** uma aba dedicada onde posso iniciar e visualizar a pesquisa profunda de concorrentes,
> **Para** ter um relatório de mercado completo disponível diretamente na consultoria.

---

## Contexto Técnico

**Estado atual:**
- Sistema de tabs da consultoria usa `PLUGIN_TAB_MAP` em `consultorias.detail.types.ts`
- Plugin tabs aparecem dinamicamente quando plugin está instalado (`useConsultoriaPlugins`)
- `GET /api/market-research/:consultancyId` e `POST /start` existem (Story 7.6)
- `react-markdown` pode ou não estar instalado — verificar

**O que será construído:**
- Verificar e instalar `react-markdown` + `remark-gfm` se ausente
- Hook `useMarketResearch.ts`
- Componentes:
  - `ConsultoriaDetailPesquisa/` — agregador da aba (≤ 80 linhas, é micro-módulo)
  - `PesquisaEmptyState.tsx` — estado inicial (nunca pesquisou)
  - `PesquisaProgress.tsx` — stepper de progresso
  - `PesquisaCompetitors.tsx` — grid de cards de concorrentes
  - `PesquisaReport.tsx` — relatório Markdown renderizado
- Registrar tab `pesquisa-mercado` no `PLUGIN_TAB_MAP`

---

## Acceptance Criteria

### AC1 — Verificar/instalar react-markdown
- [ ] Verificar se `react-markdown` e `remark-gfm` estão em `frontend/package.json`
- [ ] Se não: `npm install react-markdown remark-gfm` no frontend
- [ ] Importação funciona sem erro TypeScript

### AC2 — Hook `useMarketResearch.ts`
- [ ] `frontend/src/features/consultorias/hooks/useMarketResearch.ts`
- [ ] `useMarketResearch(consultancyId)` retorna:
  - `research: MarketResearchResponse | null`
  - `isLoading: boolean`
  - `isPolling: boolean`
  - `startResearch: () => Promise<void>`
  - `isStarting: boolean`
  - `manualRagIndex: () => Promise<void>`
  - `isIndexing: boolean`
- [ ] Polling a cada 5s enquanto `status` contém `running_`
- [ ] Para polling em `done | failed | not_started`
- [ ] `startResearch` chama `POST /start` → invalida query → inicia polling
- [ ] Toast de erro se `startResearch` falhar

### AC3 — Registro no PLUGIN_TAB_MAP
- [ ] Em `consultorias.detail.types.ts` (ou onde `PLUGIN_TAB_MAP` estiver definido):
  ```typescript
  'pesquisa-mercado': 'pesquisa'
  ```
- [ ] Tab label: "Pesquisa de Mercado"
- [ ] Tab aparece apenas quando plugin `pesquisa-mercado` está instalado na consultoria

### AC4 — Componente `ConsultoriaDetailPesquisa` (agregador da aba)
- [ ] Localizado em `frontend/src/features/consultorias/components/ConsultoriaDetailPesquisa/`
- [ ] Usa `useMarketResearch(consultancyId)`
- [ ] Renderiza condicionalmente:
  - `status === 'not_started'` → `<PesquisaEmptyState onStart={startResearch} isStarting={isStarting} />`
  - `status === 'pending' || running_*` → `<PesquisaProgress research={research} />`
  - `status === 'done'` → `<PesquisaCompetitors>` + `<PesquisaReport>`
  - `status === 'failed'` → mensagem de erro + botão "Tentar novamente"

### AC5 — `PesquisaEmptyState.tsx`
- [ ] Hero visual: ícone de lupa/mapa + título "Pesquisa Profunda de Mercado"
- [ ] Subtítulo: "Descubra seus concorrentes locais, analise o mercado e receba um relatório estratégico completo."
- [ ] Lista de bullets do que será feito: "🗺 Google Maps — concorrentes locais", "📱 Instagram — análise de perfis", "🌐 Sites — presença digital", "🤖 IA — relatório estratégico"
- [ ] Botão primário "Iniciar Pesquisa" com gradiente (`loading` state enquanto `isStarting`)
- [ ] Badge de créditos: "Custa X créditos" (ou "Gratuito" se 0)

### AC6 — `PesquisaProgress.tsx`
- [ ] Stepper vertical com 5 etapas:
  1. Descobrindo concorrentes locais (Maps)
  2. Analisando Instagram dos concorrentes
  3. Analisando sites dos concorrentes
  4. Gerando relatório com IA
  5. Concluído
- [ ] Etapa atual: indicador animado (pulse) + label do `progress_label` da API
- [ ] Etapas concluídas: checkmark verde
- [ ] Etapas pendentes: círculo cinza
- [ ] Mensagem de espera: "Isso pode levar até 5 minutos..."

### AC7 — `PesquisaCompetitors.tsx`
- [ ] Título: "Concorrentes Descobertos ({N})"
- [ ] Grid de cards (2 colunas no desktop, 1 no mobile)
- [ ] Cada card:
  - Nome do concorrente
  - Endereço (se Google Maps)
  - Rating + reviewsCount (se disponível)
  - Handle Instagram (se disponível)
  - Website (link clicável)
  - Indicador de qual fonte (Maps icon ou IG icon)

### AC8 — `PesquisaReport.tsx`
- [ ] Título: "Relatório de Mercado"
- [ ] Renderiza `report_markdown` com `<ReactMarkdown remarkPlugins={[remarkGfm]}>`
- [ ] Estilo Markdown integrado ao design dark do sistema:
  - `h1, h2, h3`: peso correto, cor `--text-primary`
  - Tabelas: bordas `--border-hairline`, fundo alternado
  - Listas: indentação correta
  - Strong/em: destaque correto
- [ ] Barra de ações abaixo do relatório:
  - Botão "Re-gerar Pesquisa" (re-executa POST /start)
  - Botão "Indexar no RAG" (visível se `rag_indexed = false`, chama `manualRagIndex()`)
  - Badge "Indexado no RAG ✓" (visível se `rag_indexed = true`)

### AC9 — Key Insights (se disponível)
- [ ] Se `key_insights` não é null: exibir cards de insights ANTES do relatório completo
- [ ] 3 cards horizontais: Oportunidades (verde), Ameaças (vermelho), Posicionamento (azul)
- [ ] Cada card lista os bullets de `key_insights.opportunities`, `.threats`, `.positioning`

---

## Checklist Técnico

- [ ] `ConsultoriaDetailPesquisa` é micro-módulo ≤ 80 linhas — delega para sub-componentes
- [ ] Sub-componentes são co-localizados na mesma pasta
- [ ] Polling para automaticamente — sem vazamento de interval
- [ ] ReactMarkdown com `remarkGfm` para suportar tabelas GFM
- [ ] Sem `any`

---

## Dependências

- Story 7.6 (rotas de market research)
- Story 7.7 (api client `marketResearch.ts`)
- Plugin system (PLUGIN_TAB_MAP)

---

## Definição de Pronto

- Tab "Pesquisa de Mercado" visível em consultorias com plugin instalado
- Clicar "Iniciar Pesquisa" → stepper animado → relatório renderizado
- Cards de concorrentes exibidos com dados reais
- Botão "Indexar no RAG" funciona
