# Story 7.2 — Firecrawl SDK + Instagram Scan Service + Auto-Trigger

**Épico:** Epic 7 — Market Intelligence
**Story:** 7.2
**Status:** Done
**Branch:** feat/7.2-instagram-scan-service
**Parallelismo:** WAVE 2 — executar em paralelo com Story 7.3 (após 7.1 concluída)

---

## User Story

> **Como** consultora,
> **Quero** que o sistema analise automaticamente o Instagram da minha cliente quando eu cadastrar uma consultoria,
> **Para** receber diagnóstico do perfil sem precisar fazer nada extra.

---

## Contexto Técnico

**Estado atual:**
- `apifyService.ts` existe com função genérica `runActor(actorId, input)`
- Script de prova de conceito: `backend/nail-ig-scraper.mjs` usa `apify/instagram-profile-scraper`
- `consultancies` table tem campo `instagram`
- `instagramScanService` não existe
- `firecrawlService` não existe
- `@mendable/firecrawl-js` não está instalado

**O que será construído:**
- `npm install @mendable/firecrawl-js` no backend
- `backend/src/services/firecrawlService.ts` — wrapper para scraping de URLs
- `backend/src/services/instagramScanService.ts` — trigger + Apify + save
- Hook no `POST /api/consultancies` para auto-trigger quando `instagram` preenchido
- `GET /api/market-research/instagram/:consultancyId` — endpoint de status/dados

---

## Acceptance Criteria

### AC1 — Instalar Firecrawl SDK
- [ ] `npm install @mendable/firecrawl-js` executado no backend
- [ ] `package.json` e `package-lock.json` atualizados
- [ ] Import verificado sem erro de TypeScript

### AC2 — `firecrawlService.ts`
- [ ] Criado em `backend/src/services/firecrawlService.ts`
- [ ] Lê `FIRECRAWL_API_KEY` do `process.env` (lança erro claro se ausente)
- [ ] Função `scrapeUrl(url: string): Promise<string>` — retorna Markdown limpo
- [ ] Se conteúdo retornado < 200 chars, retorna string vazia (sem erro)
- [ ] Timeout de 30 segundos por URL
- [ ] Erros capturados e logados — não relançados (graceful failure)

### AC3 — `instagramScanService.ts`
- [ ] Criado em `backend/src/services/instagramScanService.ts`
- [ ] Função `triggerScan(consultancyId: string, userId: string, handle: string): void`
  - Cria registro em `instagram_snapshots` (status: pending)
  - Inicia processamento async com `setImmediate(async () => { ... })`
  - Não retorna promise (fire-and-forget)
- [ ] Função `processScan(snapshotId: string, handle: string): Promise<void>` (interna):
  - Atualiza status para `running`
  - Chama `apifyService.runActor('apify/instagram-profile-scraper', input)`
  - Input: `{ usernames: [handle], proxy: { useApifyProxy: true } }`
  - Atualiza snapshot com `raw_data`, `status: done`, `scraped_at`
  - Em caso de erro: `status: failed`, `error_message`
- [ ] Função `getSnapshot(consultancyId: string, userId: string): Promise<InstagramSnapshot | null>`

### AC4 — Hook no POST /api/consultancies
- [ ] Em `backend/src/routes/consultancies.ts`, após salvar consultoria:
  - `if (instagram) instagramScanService.triggerScan(consultancyId, userId, instagram)`
  - POST retorna normalmente sem aguardar o scan
- [ ] Não quebra criação de consultoria se `instagramScanService` lançar erro

### AC5 — GET /api/market-research/instagram/:consultancyId
- [ ] Novo arquivo ou rota adicionada em route de market research
- [ ] Requer `requireAuth`
- [ ] Verifica que `consultancy_id` pertence ao `userId` (via join ou select com user_id)
- [ ] Retorna: `{ status, handle, data: InstagramProfileData | null, scraped_at }`
- [ ] Se não existe snapshot: retorna `{ status: 'not_started' }`

### AC6 — Dados estruturados do perfil
- [ ] `InstagramProfileData` extraído do `raw_data` Apify:
  ```typescript
  {
    username: string
    fullName: string
    biography: string
    followersCount: number
    followingCount: number
    postsCount: number
    isBusinessAccount: boolean
    businessCategoryName: string | null
    externalUrl: string | null
    profilePicUrl: string
    engagementRate: number        // calculado: (avg likes + avg comments) / followers * 100
    postsPerWeek: number          // calculado: posts últimos 30 dias / 4.3
    contentBreakdown: {
      reels: number              // percentual
      photos: number
      carousels: number
    }
    latestPosts: Array<{
      type: string
      caption: string            // max 200 chars
      likesCount: number
      commentsCount: number
      timestamp: string
      url: string
    }>
  }
  ```
- [ ] Campos calculados (`engagementRate`, `postsPerWeek`, `contentBreakdown`) computados antes de salvar no banco

### AC7 — Rotas registradas no app
- [ ] Nova rota de market research registrada em `backend/src/app.ts`

---

## Checklist Técnico

- [ ] `triggerScan` usa `setImmediate` — não `setTimeout(fn, 0)` — para menor latência
- [ ] `FIRECRAWL_API_KEY` não exposta em resposta HTTP
- [ ] Nenhuma chamada Apify no path crítico do create (fire-and-forget confirmado)
- [ ] Log claro quando scan inicia: `[instagram-scan] Starting scan for @handle`
- [ ] Log claro quando scan conclui: `[instagram-scan] Done: @handle — X followers`
- [ ] Erros logados com `[instagram-scan] Error for @handle: message`

---

## Dependências

- Story 7.1 (tabela `instagram_snapshots` + tipos)

---

## Definição de Pronto

- Criar consultoria com IG → snapshot criado em banco com status pending/running → done em < 3 min
- `GET /api/market-research/instagram/:id` retorna dados estruturados
- Firecrawl SDK instalado e `scrapeUrl` funciona para URL de teste
