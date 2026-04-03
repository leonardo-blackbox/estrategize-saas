# Story 7.7 — Frontend: Instagram Snapshot Card (Tier 1 UI)

**Épico:** Epic 7 — Market Intelligence
**Story:** 7.7
**Status:** Done
**Branch:** feat/7.7-instagram-card-ui
**Parallelismo:** WAVE 4 — executar em paralelo com Story 7.6 (requer 7.2)

---

## User Story

> **Como** consultora,
> **Quero** ver os dados do Instagram da minha cliente diretamente na consultoria,
> **Para** ter um diagnóstico visual imediato do perfil sem sair da plataforma.

---

## Contexto Técnico

**Estado atual:**
- `ConsultoriaDetailOverview.tsx` e `ConsultoriaDetailDados.tsx` existem nas tabs da Central
- `GET /api/market-research/instagram/:consultancyId` existe (Story 7.2)
- Não existe nenhum componente de diagnóstico Instagram

**O que será construído:**
- `frontend/src/api/marketResearch.ts` — client functions para market research
- `frontend/src/features/consultorias/hooks/useInstagramSnapshot.ts`
- `frontend/src/features/consultorias/components/ConsultoriaDetailInstagram/` — micro-módulo

---

## Acceptance Criteria

### AC1 — API client `marketResearch.ts`
- [ ] `frontend/src/api/marketResearch.ts` com funções:
  - `getInstagramSnapshot(consultancyId: string): Promise<InstagramSnapshotResponse>`
  - `getMarketResearch(consultancyId: string): Promise<MarketResearchResponse>`
  - `startMarketResearch(consultancyId: string): Promise<{ researchId: string; status: string }>`
  - `manualRagIndex(consultancyId: string): Promise<{ success: boolean }>`
- [ ] Tipos importados de `../types/market-intelligence`

### AC2 — Hook `useInstagramSnapshot.ts`
- [ ] `frontend/src/features/consultorias/hooks/useInstagramSnapshot.ts`
- [ ] Recebe `consultancyId: string`
- [ ] React Query com `queryKey: ['instagram-snapshot', consultancyId]`
- [ ] Polling automático a cada 5 segundos enquanto `status === 'pending' || status === 'running'`
- [ ] Para de polling quando `status === 'done' || status === 'failed' || status === 'not_started'`
- [ ] Retorna: `{ snapshot, isLoading, isPolling, error }`

### AC3 — Componente `ConsultoriaDetailInstagram`
- [ ] Criado em `frontend/src/features/consultorias/components/ConsultoriaDetailInstagram/`
- [ ] Arquivo: `ConsultoriaDetailInstagram.tsx` ≤ 80 linhas
- [ ] Arquivo: `index.ts` com barrel export
- [ ] Props: `{ consultancyId: string; instagram: string | null }`

### AC4 — Estado: sem Instagram cadastrado
- [ ] Se `instagram = null`: renderiza nada (retorna null)

### AC5 — Estado: carregando / pending / running
- [ ] Skeleton animado com formato do card final
- [ ] Texto: "Analisando perfil @{handle}..."
- [ ] Ícone de spinner ou dots animados

### AC6 — Estado: done — Card de diagnóstico
Layout do card (estilo dark, consistente com ConsultoriaCard):
- [ ] **Header:** avatar circular (profilePicUrl ou iniciais com gradiente), nome completo, `@handle`, categoria de negócio
- [ ] **Métricas (grid 3 colunas):**
  - Seguidores (formatado: 1.2k, 34.5k)
  - Posts totais
  - Engajamento médio (%)
- [ ] **Frequência:** "{N} posts/semana"
- [ ] **Bio:** texto truncado em 2 linhas com expand
- [ ] **Site externo:** link clicável se disponível
- [ ] **Breakdown de conteúdo:** pills coloridas "X% Reels · Y% Fotos · Z% Carrosséis" (apenas se `instagram_content_breakdown = true` na config)
- [ ] **Grid de últimos posts:** 6 miniaturas em grid 3x2 (imagem + overlay com likes/comentários no hover)
  - Se sem imagem: placeholder com tipo do post
- [ ] Badge "Conta Business" se `isBusinessAccount = true`

### AC7 — Estado: failed
- [ ] Alerta suave: "Não foi possível analisar o perfil. Verifique se a conta é pública."
- [ ] Botão "Tentar novamente" (chama endpoint de retry — ou simplesmente reinvalida query)

### AC8 — Integração na tab Overview
- [ ] `ConsultoriaDetailOverview.tsx` importa e renderiza `<ConsultoriaDetailInstagram consultancyId={id} instagram={c.instagram} />`
- [ ] Posicionado após os dados básicos da cliente

---

## Checklist Técnico

- [ ] Polling para quando status é terminal (done/failed) — não continua infinitamente
- [ ] `refetchInterval: (data) => (data?.status === 'pending' || data?.status === 'running') ? 5000 : false`
- [ ] Formatação de números: `Intl.NumberFormat('pt-BR', { notation: 'compact' })`
- [ ] profilePicUrl pode ter CORS — usar como background-image se falhar como img tag
- [ ] Sem `any`

---

## Dependências

- Story 7.2 (GET /api/market-research/instagram/:consultancyId)

---

## Definição de Pronto

- Abrir consultoria com Instagram → card aparece com skeleton → dados do perfil após ~2 min
- Card exibe todos os campos do AC6 corretamente
- Polling para automaticamente quando done
