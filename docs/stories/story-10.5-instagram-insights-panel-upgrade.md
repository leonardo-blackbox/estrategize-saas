# Story 10.5 — Upgrade do Painel Instagram Insights com Dados Oficiais

**Épico:** Epic 10 — Meta API Foundation (Onda 1)
**Story:** 10.5
**Status:** Draft
**Branch:** feat/10.5-instagram-insights-panel-upgrade
**Agente principal:** @dev (UI: coordenação com @ux-design-expert)
**Paralelismo:** WAVE 3 — paraleliza com 10.4; depende de 10.2 (botão) e 10.3 (endpoints)

---

## User Story

> **Como** consultor estratégico,
> **Quero** ver no painel de Insights da minha consultoria as métricas oficiais que importam (reach, accounts engaged, saves, shares, watch time, demografia real, audiência engajada),
> **Para** tomar decisões baseadas em dados e não em palpite — diferenciando consultoria séria de chute.

---

## Contexto Técnico

**Estado atual:**
- `frontend/src/features/consultorias/components/ConsultoriaDetailInstagramInsights/ConsultoriaDetailInstagramInsights.tsx` (~500 linhas estimadas) hoje mostra:
  - Bio, perfil
  - Content breakdown (reels/photos/carrosseis em %)
  - Engagement rate calculado de likes+comments
  - Top post
  - Performance stats básicos (avgLikes, avgComments)
- Usa `useInstagramSnapshot` (hook do Apify)
- Não respeita o limite de 80 linhas por micro-módulo (violação atual)

**O que será construído:**
- Refatoração: quebrar o componente em micro-módulos seguindo a regra modular do projeto
- 7 micro-módulos novos consumindo dados oficiais
- Hook `useMetaInsights` para encapsular as 3 chamadas REST
- Modo dual: se há conexão ativa, mostra painel oficial; senão CTA + fallback Apify

---

## Acceptance Criteria

### AC1 — Hook `useMetaInsights`
- [ ] Arquivo: `frontend/src/features/consultorias/hooks/useMetaInsights.ts` (≤120 linhas)
- [ ] API:
  ```ts
  function useMetaInsights(consultancyId: string): {
    account: AccountInsightsResponse | undefined;
    media: MediaWithInsights[] | undefined;
    audience: { follower: AudienceData | null; engaged: AudienceData | null } | undefined;
    isLoading: boolean;
    error: Error | null;
  }
  ```
- [ ] Internamente roda 3 React Query queries em paralelo
- [ ] `queryKey`: `['meta-insights', consultancyId, 'account' | 'media' | 'audience']`
- [ ] `staleTime: 5 * 60 * 1000` (5min — dados ficam no banco via cron)
- [ ] `enabled: !!consultancyId && connectionStatus === 'active'` — não chama se sem conexão
- [ ] Refetch on window focus desabilitado (dados são frescos via cron)

### AC2 — Componente raiz refatorado
- [ ] `ConsultoriaDetailInstagramInsights.tsx` ≤200 linhas (agregador)
- [ ] Detecta status da conexão via `useMetaConnection`
- [ ] Renderização:
  ```
  Sem conexão (status === null):
    <ConnectInstagramCTACard />        ← novo micro-módulo
    [conteúdo Apify atual mantido como "Modo legado"]

  Loading conexão:
    <Skeleton />

  Conectado:
    <OfficialDataBadge />
    <HeroMetricsOfficial />            ← novo
    <AudienceDemographicsPanel />      ← novo
    <EngagedVsFollowersGap />          ← novo
    <ReelsRetentionPanel />            ← novo
    <PostingHeatmap />                 ← novo
    <StoriesPanel />                   ← novo
    <SavesSharesBreakdown />           ← novo

  Erro (expired/revoked):
    <ReconnectCard />
  ```

### AC3 — Micro-módulo `HeroMetricsOfficial` (≤80 linhas)
- [ ] Cards no topo do painel:
  - **Reach 28d** (com seta de comparação vs 28d anteriores)
  - **Accounts Engaged 28d**
  - **Profile Visits 28d**
  - **Follows → from posts** (delta de followers no período)
- [ ] Cada card: número grande + label + delta com cor (verde/vermelho/cinza)
- [ ] Formato compacto (1.2k, 12.4M) via `Intl.NumberFormat('pt-BR', { notation: 'compact' })`

### AC4 — Micro-módulo `AudienceDemographicsPanel` (≤80 linhas)
- [ ] Tab única "Seguidores" vs "Engajados" (toggle)
- [ ] **Pirâmide etária × gênero** (gráfico horizontal espelhado: F à esquerda, M à direita, faixas etárias no eixo Y)
- [ ] **Top 5 cidades** (barras horizontais com % e cidade, estado/país)
- [ ] **Top 5 países** (barras horizontais com bandeira ou código)
- [ ] Se `engagedData === null` (conta pequena): mensagem "Audiência muito pequena para demografia engajada — mínimo 100 followers/engajados ativos"

### AC5 — Micro-módulo `EngagedVsFollowersGap` (≤80 linhas)
- [ ] Compara demografia de seguidores vs engajados, lado a lado
- [ ] Highlight em vermelho onde há gap > 15% em alguma faixa
- [ ] Mensagem gerada: "Seus seguidores são 60% F.25-34, mas só 30% deles engajam. Seu ICP real é F.18-24 (45% engagement)."
- [ ] (Mensagem é cálculo determinístico no client, não IA, na Onda 1)

### AC6 — Micro-módulo `ReelsRetentionPanel` (≤80 linhas)
- [ ] Lista dos últimos 10 Reels com:
  - Thumbnail
  - Avg watch time (em segundos)
  - Retention rate (avg watch time / duração estimada × 100 — se duração disponível)
  - Replays
  - Views
- [ ] Ordenação por retention DESC
- [ ] Badge "🏆 Top retention" no #1

### AC7 — Micro-módulo `PostingHeatmap` (≤80 linhas)
- [ ] Heatmap 7×24 (dias da semana × hora do dia) com cor por reach médio dos posts publicados naquele slot
- [ ] Cor mais escura = melhor performance
- [ ] Indicador "Melhor janela: Quarta 19h-20h (reach médio +45%)"
- [ ] Derivado dos snapshots em `instagram_media_insights` (não da API em tempo real)

### AC8 — Micro-módulo `StoriesPanel` (≤80 linhas)
- [ ] Top story do mês (por views)
- [ ] Stories ativas agora (se houver) com countdown
- [ ] Drop-off entre slides do top story (se múltiplos slides)
- [ ] Stat agregado: "Views médias por story", "Reach médio", "Replies médias"
- [ ] Empty state se sem stories: "Comece a postar Stories para ver insights aqui"

### AC9 — Micro-módulo `SavesSharesBreakdown` (≤80 linhas)
- [ ] Top 5 posts por **saves**
- [ ] Top 5 posts por **shares**
- [ ] Tooltip: "Saves e Shares indicam alto valor percebido — conteúdos para replicar"
- [ ] Cada post tem thumbnail + caption truncada + métrica

### AC10 — Micro-módulo `ConnectInstagramCTACard` (≤80 linhas)
- [ ] Card destacado quando sem conexão:
  - Ícone Instagram
  - Título: "Conecte o Instagram para ver dados oficiais"
  - Lista de benefícios (4-5 bullets curtos)
  - Botão `<ConnectInstagramButton />` (de 10.2)
- [ ] Não esconde o conteúdo Apify atual — vira "modo legado" abaixo

### AC11 — Micro-módulo `OfficialDataBadge` (≤80 linhas)
- [ ] Badge sutil no topo: "✓ Dados oficiais via Meta — atualizado às {snapshot_time}"
- [ ] Tooltip explica que dados vêm do snapshot diário

### AC12 — Responsividade e a11y
- [ ] Tudo funciona em 320px (mobile-first)
- [ ] Grid muda: 4 colunas em desktop, 2 em tablet, 1 em mobile
- [ ] Heatmap colapsa para tabela vertical em mobile
- [ ] Pirâmide etária vira tabela compacta em <768px
- [ ] Cores respeitam contraste AAA conforme tokens existentes
- [ ] Headings têm hierarquia correta (h2 do painel, h3 dos micro-módulos)

### AC13 — Tipos compartilhados
- [ ] `frontend/src/types/meta-api.ts` espelha tipos do backend (`AccountInsights`, `MediaWithInsights`, `AudienceData`)
- [ ] Sem `any` em props ou state

---

## Checklist Técnico

- [ ] Componente raiz NÃO faz fetch — apenas hooks
- [ ] Nenhum micro-módulo importa outro micro-módulo do mesmo grupo (acoplamento horizontal proibido)
- [ ] Tokens de design usados (cores, espacamento) — sem hard-code
- [ ] Skeleton loading state em cada micro-módulo
- [ ] Empty state em cada micro-módulo
- [ ] Sem `console.*`
- [ ] Sem `useEffect` em micro-módulos (estado local máximo: `useState` para UI tab toggle)

---

## Dependências

- **Story 10.2** — `ConnectInstagramButton` e `useMetaConnection`
- **Story 10.3** — endpoints de insights
- **Story 10.4** — útil mas não bloqueante (sem cron, painel cai em chamadas on-demand que podem ser lentas mas funcionam)

---

## Definição de Pronto

- [ ] Painel renderiza 7 micro-módulos corretamente para consultoria com conexão
- [ ] Painel renderiza CTA + fallback Apify para consultoria sem conexão
- [ ] Painel renderiza Reconnect para conexão expirada
- [ ] Smoke test E2E em staging com conta IG Business real
- [ ] Responsividade testada em 320px, 768px, 1024px
- [ ] PR aberto via @devops, CodeRabbit clean, QA PASS

---

## Riscos

| Risco | Mitigação |
|---|---|
| Dados do cron estão "stale" (até 24h velhos) | Badge mostra timestamp do snapshot. Botão "Atualizar agora" (futuro) ou aceitar como trade-off |
| Demografia engajada é null para contas pequenas | Empty state claro com explicação |
| Conta de teste sem dados suficientes para heatmap | Mostrar "Precisa de pelo menos 14 dias de posts para mapa de calor" |
| Componente raiz refatorado quebra fallback Apify | Testes manuais com conta sem conexão obrigatórios antes do merge |
| UX dos 7 painéis fica poluído visualmente | Coordenar com @ux-design-expert antes da implementação. Considerar tabs ou collapse em alguns. |
