# Story 3.6 — Admin: Página de Detalhe de Usuário Completa

**Epic:** 3 — Admin Polish & Content Tools
**Story ID:** 3.6
**Status:** Ready for Development
**Created by:** @sm (River)
**Date:** 2026-03-11
**Branch sugerida:** `feat/3.6-admin-user-detail`

---

## Contexto

Atualmente ao clicar em um usuário no admin, abre-se um **modal pequeno** (max-w-xl) com informações limitadíssimas: apenas entitlements e matrículas. Não há histórico de login, saldo de créditos, histórico de transações, informações de plano ativo, histórico de ações na plataforma, nem capacidade de editar o perfil.

Esta story transforma a gestão de usuários em uma **página dedicada completa** (`/admin/usuarios/:id`) com tabs organizando todas as informações relevantes, ações administrativas, e novos endpoints backend para suportar os dados ausentes.

---

## Escopo em 3 Partes

| Parte | Área | Descrição |
|-------|------|-----------|
| **A** | Backend | Novos endpoints + enriquecer `GET /admin/users/:id` com auth info, créditos e ações |
| **B** | Frontend | Nova página `/admin/usuarios/:id` com tabs e layout completo |
| **C** | Frontend | Refatorar lista para navegar para a página ao invés de abrir modal |

---

## Acceptance Criteria

### AC1 — Nova rota `/admin/usuarios/:id`
- [ ] Rota `<Route path="/admin/usuarios/:id" element={<AdminUserDetailPage />} />` adicionada em `App.tsx`
- [ ] Componente `AdminUserDetailPage.tsx` criado em `frontend/src/pages/admin/`
- [ ] Ao clicar em um usuário na lista, navega para `/admin/usuarios/:id` (via `useNavigate`)
- [ ] Breadcrumb no topo: `← Usuários` (link) > Nome do usuário
- [ ] Modal de detalhe antigo **removido** da `AdminUsuariosPage`

### AC2 — Layout com Tabs
- [ ] Tabs: **Visão Geral**, **Cursos & Acesso**, **Créditos**, **Histórico**
- [ ] Tab ativa tem indicador visual (underline ou bg highlight)
- [ ] Cada tab mantém seu estado enquanto a página está aberta

### AC3 — Tab: Visão Geral
- [ ] Avatar com inicial do nome/email + badge de role (`member` / `admin`)
- [ ] Nome completo (editável inline ou via modal), email (read-only), data de criação da conta
- [ ] **Último acesso:** `last_sign_in_at` via `auth.admin.getUserById()` no backend
- [ ] **Email verificado:** `email_confirmed_at` (data ou "Não verificado")
- [ ] **Plano ativo:** nome do plano + status (`active`/`canceled`/`past_due`) + data de expiração
  - Se sem plano: "Sem plano ativo"
- [ ] **Resumo de créditos:** saldo atual (soma das transactions) em destaque
- [ ] Ação: botão "Alterar role" → modal com select `member` / `admin` → `PATCH /api/admin/users/:id`
- [ ] Ação: botão "Suspender acesso" → cria entitlement global `deny` (usa endpoint existente)

### AC4 — Tab: Cursos & Acesso
- [ ] Seção **Entitlements** — exatamente o que existe hoje no modal (manter funcionalidade)
  - Lista de entitlements com badge de tipo, data de expiração, motivo
  - Botão "Revogar" por entitlement
  - Botão "+ Entitlement" abre modal de concessão
- [ ] Seção **Matrículas** — lista de cursos matriculados com data
- [ ] Seção **Progresso** — por curso matriculado, mostrar `X de Y aulas concluídas`
  - Dados via `lesson_progress` do usuário: `GET /api/admin/users/:id/progress`

### AC5 — Tab: Créditos
- [ ] **Saldo atual** em destaque (calculado a partir das transactions)
- [ ] **Histórico de transações** paginado (20 por página)
  - Cada linha: tipo (`credit`/`debit`/`reserve`/`release`), amount, description, idempotency_key, created_at
  - Badge de tipo com cor (verde para credit, vermelho para debit)
- [ ] **Ajuste manual de créditos:**
  - Formulário: campo amount (positivo = adicionar, negativo = remover), description obrigatório
  - Botão "Aplicar ajuste" → `POST /api/admin/users/:id/credits`
  - Validação: amount ≠ 0, description não vazia
  - Após sucesso: invalidar query de transactions + saldo

### AC6 — Tab: Histórico
- [ ] Lista paginada dos `audit_logs` onde `target_id = userId` (ações sobre este usuário)
- [ ] Cada linha: action, actor (nome do admin que executou), metadata (JSON compacto), data/hora
- [ ] Empty state: "Nenhuma ação registrada para este usuário"

### AC7 — Novos endpoints backend

**`GET /api/admin/users/:id`** (enriquecer resposta existente):
- [ ] Adicionar campo `authUser` com: `last_sign_in_at`, `email_confirmed_at`, `created_at`, `email`
  - Via `supabaseAdmin.auth.admin.getUserById(id)`
- [ ] Manter: `profile`, `entitlements`, `enrollments`

**`GET /api/admin/users/:id/credit-transactions`**:
- [ ] Params: `limit` (default 20, max 100), `offset`
- [ ] Retorna: `{ transactions: [...], total, balance }` onde `balance = SUM(amount)`
- [ ] Ordena por `created_at DESC`

**`POST /api/admin/users/:id/credits`**:
- [ ] Body: `{ amount: number (≠0), description: string }`
- [ ] Insere em `credit_transactions` com `type = amount > 0 ? 'credit' : 'debit'`
- [ ] Registra em `audit_logs` com action `admin_credit_adjustment`
- [ ] Retorna a transaction criada

**`PATCH /api/admin/users/:id`**:
- [ ] Body: `{ role?: 'member' | 'admin', full_name?: string }`
- [ ] Atualiza `profiles` com os campos fornecidos
- [ ] Registra em `audit_logs` com action `admin_update_profile`
- [ ] Retorna o profile atualizado

**`GET /api/admin/users/:id/progress`**:
- [ ] Retorna progresso por curso: `{ course_id, title, total_lessons, completed_lessons }`
- [ ] Via `lesson_progress` JOIN `lessons` JOIN `modules` JOIN `courses`

---

## Dev Notes

### Estrutura de arquivos

```
frontend/src/
  pages/admin/
    AdminUsuariosPage.tsx       ← MODIFICAR (remover modal, add navigate)
    AdminUserDetailPage.tsx     ← CRIAR
  api/
    courses.ts                  ← ADICIONAR funções admin de usuário

backend/src/routes/admin/
  users.ts                      ← ADICIONAR novos endpoints
```

### Rota no App.tsx

```tsx
// Adicionar DENTRO do bloco AdminRoute, após /admin/usuarios
<Route path="/admin/usuarios/:id" element={<AdminUserDetailPage />} />
```

### Tabs no frontend

```tsx
type TabId = 'overview' | 'courses' | 'credits' | 'history';

const TABS: { id: TabId; label: string }[] = [
  { id: 'overview', label: 'Visão Geral' },
  { id: 'courses', label: 'Cursos & Acesso' },
  { id: 'credits', label: 'Créditos' },
  { id: 'history', label: 'Histórico' },
];
```

### Backend: enriquecer GET /:id

```ts
// Adicionar ao GET /:id existente:
const { data: authUser } = await supabaseAdmin!.auth.admin.getUserById(req.params.id);

// Adicionar ao retorno:
res.json({
  profile,
  entitlements: entitlements ?? [],
  enrollments: enrollments ?? [],
  authUser: authUser.user ? {
    email: authUser.user.email,
    last_sign_in_at: authUser.user.last_sign_in_at,
    email_confirmed_at: authUser.user.email_confirmed_at,
    created_at: authUser.user.created_at,
  } : null,
});
```

### Backend: GET /:id/credit-transactions

```ts
router.get('/:id/credit-transactions', async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 20, 100);
  const offset = Number(req.query.offset) || 0;

  const { data, error, count } = await supabaseAdmin!
    .from('credit_transactions')
    .select('*', { count: 'exact' })
    .eq('user_id', req.params.id)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) return res.status(500).json({ error: error.message });

  // Calcular saldo total (SUM de todos, não só da página)
  const { data: allTransactions } = await supabaseAdmin!
    .from('credit_transactions')
    .select('amount')
    .eq('user_id', req.params.id);

  const balance = (allTransactions ?? []).reduce((sum, t) => sum + (t.amount ?? 0), 0);

  res.json({ transactions: data ?? [], total: count ?? 0, balance });
});
```

### Backend: POST /:id/credits

```ts
const creditAdjustSchema = z.object({
  amount: z.number().int().refine((n) => n !== 0, 'amount cannot be zero'),
  description: z.string().min(1).max(255),
});

router.post('/:id/credits', async (req: AuthenticatedRequest, res) => {
  const parsed = creditAdjustSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const { amount, description } = parsed.data;
  const type = amount > 0 ? 'credit' : 'debit';

  const { data, error } = await supabaseAdmin!
    .from('credit_transactions')
    .insert({
      user_id: req.params.id,
      amount,
      type,
      description,
      idempotency_key: `admin_adjust_${req.userId}_${Date.now()}`,
    })
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });

  await supabaseAdmin!.from('audit_logs').insert({
    actor_id: req.userId,
    action: 'admin_credit_adjustment',
    target_type: 'user',
    target_id: req.params.id,
    metadata: { amount, description, transaction_id: data.id },
  });

  res.status(201).json(data);
});
```

### Backend: PATCH /:id (update profile)

```ts
const updateProfileSchema = z.object({
  role: z.enum(['member', 'admin']).optional(),
  full_name: z.string().min(1).max(255).optional(),
}).refine((d) => d.role !== undefined || d.full_name !== undefined, {
  message: 'At least one field required',
});

router.patch('/:id', async (req: AuthenticatedRequest, res) => {
  const parsed = updateProfileSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const { data, error } = await supabaseAdmin!
    .from('profiles')
    .update(parsed.data)
    .eq('id', req.params.id)
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });

  await supabaseAdmin!.from('audit_logs').insert({
    actor_id: req.userId,
    action: 'admin_update_profile',
    target_type: 'user',
    target_id: req.params.id,
    metadata: parsed.data,
  });

  res.json(data);
});
```

### Backend: GET /:id/progress

```ts
router.get('/:id/progress', async (req, res) => {
  // Buscar todos os cursos que o usuário tem matrícula ou entitlement
  const { data: enrollments } = await supabaseAdmin!
    .from('enrollments')
    .select('course_id, courses (id, title)')
    .eq('user_id', req.params.id);

  if (!enrollments || enrollments.length === 0) {
    return res.json({ progress: [] });
  }

  const result = await Promise.all(
    (enrollments as any[]).map(async (enr) => {
      const courseId = enr.course_id;

      // Total de aulas do curso
      const { count: totalLessons } = await supabaseAdmin!
        .from('lessons')
        .select('id', { count: 'exact', head: true })
        .eq('modules.course_id', courseId); // via join modules

      // Aulas concluídas pelo usuário neste curso
      const { count: completedLessons } = await supabaseAdmin!
        .from('lesson_progress')
        .select('lesson_id', { count: 'exact', head: true })
        .eq('user_id', req.params.id)
        .eq('completed', true);

      return {
        course_id: courseId,
        title: (enr.courses as any)?.title ?? courseId,
        total_lessons: totalLessons ?? 0,
        completed_lessons: completedLessons ?? 0,
      };
    }),
  );

  res.json({ progress: result });
});
```

> **Nota dev:** A query de progresso pode precisar de ajuste dependendo da estrutura das FK do Supabase. Ajustar se o join `modules.course_id` não funcionar diretamente — usar subquery alternativa.

### Novo API client (frontend)

```ts
// Adicionar em frontend/src/api/courses.ts

export async function adminGetUserDetail(id: string) {
  return client.get(`/api/admin/users/${id}`).json();
}

export async function adminGetUserCreditTransactions(id: string, params?: { limit?: number; offset?: number }) {
  const clean: Record<string, string> = {};
  if (params?.limit != null) clean.limit = String(params.limit);
  if (params?.offset != null) clean.offset = String(params.offset);
  const search = new URLSearchParams(clean).toString();
  return client.get(`/api/admin/users/${id}/credit-transactions${search ? `?${search}` : ''}`).json();
}

export async function adminAdjustCredits(id: string, data: { amount: number; description: string }) {
  return client.post(`/api/admin/users/${id}/credits`, { json: data }).json();
}

export async function adminUpdateUserProfile(id: string, data: { role?: 'member' | 'admin'; full_name?: string }) {
  return client.patch(`/api/admin/users/${id}`, { json: data }).json();
}

export async function adminGetUserProgress(id: string) {
  return client.get(`/api/admin/users/${id}/progress`).json();
}

export async function adminGetUserAuditLogs(id: string, params?: { limit?: number; offset?: number }) {
  const clean: Record<string, string> = {};
  if (params?.limit != null) clean.limit = String(params.limit);
  if (params?.offset != null) clean.offset = String(params.offset);
  const search = new URLSearchParams(clean).toString();
  return client.get(`/api/admin/users/audit?target_id=${id}${search ? `&${search}` : ''}`).json();
}
```

### Modificar GET /audit para aceitar filtro por target_id

```ts
// Em users.ts, no endpoint GET /audit, adicionar:
const targetId = req.query.target_id as string | undefined;
// ...
if (targetId) query = query.eq('target_id', targetId);
```

### Nota sobre credit_transactions schema

```ts
// Verificar campos existentes em schema.sql:
// credit_transactions: id, user_id, amount, type, description, idempotency_key, created_at
// Se `type` não existir como coluna, derivar de amount > 0 ? 'credit' : 'debit' no frontend
```

---

## Tasks

- [x] **Task 1 — Backend: enriquecer GET /:id**
  - [x] Adicionar `supabaseAdmin.auth.admin.getUserById(id)` e incluir `authUser` na resposta

- [x] **Task 2 — Backend: novos endpoints**
  - [x] `GET /:id/credit-transactions` com paginação + cálculo de saldo
  - [x] `POST /:id/credits` com validação Zod + audit log
  - [x] `PATCH /:id` com validação Zod + audit log
  - [x] `GET /:id/progress` via enrollments + lesson_progress
  - [x] Modificar `GET /audit` para aceitar `?target_id=` como filtro

- [x] **Task 3 — Frontend: novas funções API**
  - [x] `adminGetUserCreditTransactions`, `adminAdjustCredits`, `adminUpdateUserProfile`, `adminGetUserProgress`, `adminGetUserAuditLogs`

- [x] **Task 4 — Frontend: `AdminUserDetailPage.tsx`**
  - [x] Breadcrumb `← Usuários` + nome do usuário
  - [x] Componente de tabs (`TabId` type + state)
  - [x] **Tab Visão Geral:** avatar, nome, email, plano, último login, email verificado, saldo, alterar role + suspender
  - [x] Modal "Alterar role" com select + mutation `adminUpdateUserProfile`
  - [x] **Tab Cursos & Acesso:** entitlements (revogar/grant) + matrículas + progresso (barra)
  - [x] **Tab Créditos:** saldo + transactions paginadas + ajuste manual com validação
  - [x] **Tab Histórico:** audit_logs filtrados por userId

- [x] **Task 5 — Frontend: refatorar `AdminUsuariosPage.tsx`**
  - [x] Removido todo estado de modal e selectedUserId
  - [x] `navigate(\`/admin/usuarios/\${user.id}\`)` ao clicar em usuário

- [x] **Task 6 — App.tsx: nova rota**
  - [x] Importar `AdminUserDetailPage`
  - [x] `<Route path="/admin/usuarios/:id" element={<AdminUserDetailPage />} />`

---

## Dev Agent Record

### Status
Ready for Review

### Agent Model Used
claude-sonnet-4-6

### Completion Notes
- `backend/src/routes/admin/users.ts` reescrito com 5 novos endpoints
- **Bug crítico corrigido:** rotas estáticas (`/stats`, `/enrollments`, `/audit`, `/webhooks/events`) movidas para ANTES de `/:id` — estavam unreachable no código anterior
- `credit_transactions.type` usa `'purchase'` (positivo) / `'consume'` (negativo) conforme CHECK constraint do schema
- `GET /:id/progress`: subquery manual via `modules.id` → `lessons.id` → `lesson_progress` (PostgREST não suporta nested filter `.eq('modules.course_id', ...)`)
- `GET /audit` agora aceita `?target_id=` para filtrar por usuário
- Frontend: `AdminUsuariosPage` simplificada (sem modal) com `navigate()`
- Frontend: `AdminUserDetailPage` com 4 tabs, animações framer-motion, progress bar por curso
- TS limpo em frontend e backend (`tsc --noEmit` sem erros)

### Debug Log
Nenhum bloqueio.

### File List
- `frontend/src/pages/admin/AdminUserDetailPage.tsx` (criar)
- `frontend/src/pages/admin/AdminUsuariosPage.tsx` (modificar — remover modal)
- `frontend/src/api/courses.ts` (adicionar funções)
- `backend/src/routes/admin/users.ts` (adicionar endpoints)
- `frontend/src/App.tsx` (adicionar rota)

### Change Log
| Data | Alteração |
|------|-----------|
| 2026-03-11 | Story criada pelo @sm (River) |
