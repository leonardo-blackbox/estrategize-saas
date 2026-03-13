# Story 3.10 — Home da Área de Membros: Título Personalizável + Painel Admin

**Épico:** Epic 3 — Member Experience & Admin Console
**Story:** 3.10
**Status:** Draft
**Branch:** feat/3.10-home-settings

---

## User Story

> **Como** administrador da plataforma,
> **Quero** personalizar o título e subtítulo exibidos na home da área de membros diretamente no admin,
> **Para** comunicar mensagens específicas aos membros sem precisar alterar código.

> **Como** membro da plataforma,
> **Quero** ver um título e subtítulo personalizados na página de Formação,
> **Para** ter uma experiência mais contextualizada e personalizada.

---

## Contexto Técnico

**Estado atual:**
- `FormacaoPage.tsx` exibe título hardcoded `"Formação"`
- Admin `/admin/formacao` → `AdminFormacaoPage.tsx` gerencia seções
- Sidebar item "Seções" aponta para `/admin/formacao`
- Não existe tabela ou endpoint para configurações da home

**O que será construído:**
- Tabela `home_settings` com `title`, `subtitle`, `updated_at`
- `GET /api/courses/home-settings` (authenticated, sem cache pesado no backend)
- `PUT /api/admin/home/settings` (requireAdmin)
- `AdminHomePage.tsx`: painel unificado — customização no topo + seções abaixo
- `FormacaoPage.tsx`: título/subtítulo dinâmico com staleTime longo

---

## Acceptance Criteria

### AC1 — DB: tabela `home_settings`
- [ ] Migration `013_home_settings.sql` cria tabela `home_settings`:
  ```sql
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title     TEXT NOT NULL DEFAULT 'Formação',
  subtitle  TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
  ```
- [ ] RLS habilitado: service_role acesso total; authenticated pode SELECT
- [ ] Seed: insere 1 linha default (`title='Formação'`) se não existir

### AC2 — Backend: GET /api/courses/home-settings
- [ ] Rota em `routes/courses.ts` registrada **antes** de `GET /:id`
- [ ] Retorna `{ title: string, subtitle: string | null }`
- [ ] Fallback: se tabela vazia retorna `{ title: 'Formação', subtitle: null }`

### AC3 — Backend: PUT /api/admin/home/settings
- [ ] Novo arquivo `routes/admin/home.ts` (requireAuth + requireAdmin)
- [ ] Zod: `title` string min(1) max(100), `subtitle` string max(300) opcional nullable
- [ ] Upsert single-row (id fixo ou ON CONFLICT DO UPDATE)
- [ ] Retorna registro atualizado
- [ ] Registrado em `index.ts` como `/api/admin/home`

### AC4 — Admin: `AdminHomePage.tsx` em `/admin/home`
- [ ] Sidebar: item "Seções" → "Home" apontando para `/admin/home`
- [ ] App.tsx: rota `/admin/home` → `AdminHomePage`, remover `/admin/formacao`
- [ ] Estrutura da página:
  - **Seção "Personalização da Home"** (topo):
    - Input `title` (label: "Título da página", placeholder: "Formação")
    - Textarea `subtitle` (label: "Subtítulo / instrução", placeholder: "Bem-vindo à sua área de aprendizado...")
    - Preview em tempo real: mostra como ficará na frente (tipografia igual à FormacaoPage)
    - Botão "Salvar alterações" → PUT + feedback "Salvo!" por 2s
    - Skeleton durante fetch inicial do GET
  - **Divisor** (`<hr>` estilizado)
  - **Seção "Seções"** (abaixo): todo o conteúdo atual de `AdminFormacaoPage.tsx` integrado inline
- [ ] `useForm` interno simples com useState (sem react-hook-form)

### AC5 — Member: `FormacaoPage` com título dinâmico
- [ ] `getHomeSettings()` em `api/courses.ts` → `GET /api/courses/home-settings`
- [ ] `useQuery({ queryKey: ['home-settings'], queryFn: getHomeSettings, staleTime: 10 * 60 * 1000 })`
- [ ] `<h1>` usa `settings?.title ?? 'Formação'`
- [ ] Se `settings?.subtitle`: exibe `<p className="text-[17px] text-[var(--color-text-secondary)] mt-2">` abaixo do h1
- [ ] **Sem loading state** para settings — render imediato com fallback, título atualiza quando fetch resolve
- [ ] `mb-8 sm:mb-12` do container do título ajustado para `mb-4 sm:mb-6` quando há subtítulo

### AC6 — Performance
- [ ] `staleTime: 10 * 60 * 1000` no useQuery (10 min sem re-fetch)
- [ ] Endpoint backend: query simples `.select('title, subtitle').limit(1).maybeSingle()`
- [ ] Zero jank na home: nenhum spinner/skeleton visível por causa do settings fetch
- [ ] FormacaoPage não entra em loading state esperando settings

---

## Arquivos Afetados

**Novos:**
- `backend/src/database/migrations/013_home_settings.sql`
- `backend/src/routes/admin/home.ts`
- `frontend/src/pages/admin/AdminHomePage.tsx`

**Modificados:**
- `backend/src/index.ts` — import + register `/api/admin/home`
- `backend/src/routes/courses.ts` — GET /home-settings antes de /:id
- `frontend/src/api/courses.ts` — getHomeSettings()
- `frontend/src/pages/member/FormacaoPage.tsx` — título/subtítulo dinâmico
- `frontend/src/components/layout/AdminShell.tsx` — Home em vez de Seções → /admin/home
- `frontend/src/App.tsx` — rota /admin/home → AdminHomePage

---

## Notas de Implementação

**Ordem de rota crítica:** `GET /api/courses/home-settings` deve ser registrado antes de `GET /api/courses/:id` no router Express — caso contrário "home-settings" é capturado como `:id`.

**Single-row pattern:** `home_settings` sempre terá 1 linha. Usar upsert com `id` fixo hardcoded (ex: UUID conhecido) ou `INSERT ... ON CONFLICT (id) DO UPDATE`.

**AdminHomePage:** Incorporar o gerenciamento de seções inline (copiar JSX de `AdminFormacaoPage` ou importar como componente separado `<SectionsManager />`). Preferir componente separado para manutenibilidade.

**Preview:** No admin, o preview deve usar as mesmas classes CSS da FormacaoPage (`text-[32px] sm:text-[40px] font-semibold tracking-tight text-[var(--color-text-primary)]`) para fidelidade visual.

**Fallback perfeito:** O valor default da tabela é `'Formação'`, que é exatamente o hardcoded atual — então mesmo antes do fetch resolver, a UX é idêntica.
