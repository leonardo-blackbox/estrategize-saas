# Story 3.7 — Fix Sistema de Créditos: Divergência Admin/Membro + Testes

**Epic:** 3 — Admin Polish & Content Tools
**Story ID:** 3.7
**Status:** Ready for Development
**Created by:** @sm (River)
**Date:** 2026-03-11
**Branch sugerida:** `feat/3.7-credits-fix-and-tests`

---

## Contexto e Root Cause Analysis

O usuário vê **42 créditos** na navegação membro e na página Conta, mas **0 créditos** na tela admin de usuários. A divergência tem **4 causas raiz independentes**, todas precisam ser corrigidas:

### Bug #1 — CRÍTICO: Cálculo de saldo no admin está ERRADO
**Arquivo:** `backend/src/routes/admin/users.ts` — `GET /:id/credit-transactions`

O código atual faz:
```ts
const balance = (allTx ?? []).reduce((sum, t) => sum + (t.amount ?? 0), 0);
```

Isso é **matematicamente incorreto** porque ignora completamente a semântica de `type` e `status`:
- Transações do tipo `consume` são armazenadas com **amount positivo** no banco, mas representam débitos
- A RPC `get_credit_balance` usa `CASE WHEN type='consume' THEN -ct.amount` para subtrair corretamente
- Transações `reserve` com `status='pending'` devem ser subtraídas (créditos reservados)
- Transações `reserve` com `status='released'` devem ser ignoradas

**Resultado:** O admin some todos os valores brutos, produzindo número completamente diferente do saldo real.

**Fix:** Substituir o `reduce` por uma chamada à RPC `get_credit_balance` via `getBalance(userId)` do `creditService`.

### Bug #2 — CRÍTICO: `CreditosPage.tsx` usa mock data hardcoded
**Arquivo:** `frontend/src/pages/member/CreditosPage.tsx`

```ts
const balance = 42;                    // hardcoded!
const mockTransactions = [...];        // dados falsos!
```

A página nunca chama `fetchBalance()` nem `fetchTransactions()` da `api/credits.ts`. O "42" que aparece sempre é literalmente o número hardcoded na linha 15.

**Fix:** Substituir mock por `useQuery` que chama `fetchBalance()` e `fetchTransactions()`.

### Bug #3 — CRÍTICO: `ContaPage.tsx` exibe valor hardcoded
**Arquivo:** `frontend/src/pages/member/ContaPage.tsx`

```ts
{ title: 'Creditos', value: '42 creditos', ... }  // hardcoded!
```

**Fix:** Chamar `fetchBalance()` e exibir `balance.available` dinamicamente.

### Bug #4 — AUSENTE: Endpoint de saldo no admin não usa RPC correta
**Arquivo:** `backend/src/routes/admin/users.ts`

O endpoint `GET /:id/credit-transactions` precisa retornar um `balance` correto usando a mesma lógica da `creditService.getBalance()`. Além disso, deve existir um endpoint dedicado `GET /:id/credit-balance` que retorna apenas o balanço detalhado (available, reserved, consumed_this_month).

---

## Arquitetura do Sistema de Créditos (Referência)

```
credit_transactions schema:
  amount   INTEGER  -- SEMPRE POSITIVO no banco
  type     CHECK IN ('purchase','monthly_grant','reserve','consume','release')
  status   CHECK IN ('pending','confirmed','released')

get_credit_balance(p_user_id) RPC — ÚNICA fonte de verdade:
  available         = SUM(purchase+monthly_grant+release WHERE confirmed)
                    - SUM(consume WHERE confirmed)
                    - SUM(reserve WHERE pending)
  reserved          = SUM(reserve WHERE pending)
  total_consumed    = SUM(consume WHERE confirmed)
  consumed_this_month = SUM(consume WHERE confirmed AND this month)
```

---

## Acceptance Criteria

### AC1 — Bug #1 corrigido: Admin usa RPC para saldo
- [ ] `GET /api/admin/users/:id/credit-transactions` chama `getBalance(userId)` do `creditService`
- [ ] Campo `balance` na resposta é igual a `balance.available` da RPC
- [ ] Campos `reserved`, `consumed_this_month`, `total_consumed` também incluídos na resposta
- [ ] Saldo no admin bate exatamente com o saldo no membro para o mesmo usuário

### AC2 — Novo endpoint `GET /api/admin/users/:id/credit-balance`
- [ ] Endpoint dedicado para obter apenas o balanço completo de um usuário
- [ ] Retorna: `{ available, reserved, total_consumed, consumed_this_month, transaction_count }`
- [ ] Usado pelo `TabOverview` da `AdminUserDetailPage` (substitui query de `credit-transactions` só para mostrar saldo)

### AC3 — Bug #2 corrigido: `CreditosPage` usa dados reais
- [ ] `const balance = 42` **removido**
- [ ] `mockTransactions` **removido**
- [ ] `useQuery` chamando `fetchBalance()` exibe `balance.available`, `balance.reserved`, `balance.consumed_this_month`
- [ ] `useQuery` chamando `fetchTransactions()` lista transações reais paginadas
- [ ] Loading skeleton durante fetch
- [ ] Empty state se sem transações

### AC4 — Bug #3 corrigido: `ContaPage` usa saldo real
- [ ] `'42 creditos'` **removido**
- [ ] `useQuery` chamando `fetchBalance()` exibe `balance.available` créditos
- [ ] Loading state (mostra `—` enquanto carrega)
- [ ] Trata erro graciosamente (mostra `—` se falhar)

### AC5 — `AdminUserDetailPage` usa saldo correto
- [ ] `TabOverview` busca saldo via `GET /api/admin/users/:id/credit-balance` (novo endpoint)
- [ ] `TabCredits` exibe `balance.available` (não mais o campo `balance` do endpoint de transactions incorreto)
- [ ] `TabCredits` exibe também: reservado em aberto, consumido este mês, total consumido

### AC6 — Testes backend: admin credit endpoints
- [ ] Arquivo: `backend/src/routes/admin/users.test.ts` (criar)
- [ ] Teste: `GET /:id/credit-transactions` → retorna `balance.available` correto (via mock do `getBalance`)
- [ ] Teste: `GET /:id/credit-transactions` → paginação (`limit`, `offset`)
- [ ] Teste: `GET /:id/credit-balance` → retorna todos os campos da RPC
- [ ] Teste: `POST /:id/credits` → amount positivo insere tipo 'purchase'
- [ ] Teste: `POST /:id/credits` → amount negativo insere tipo 'consume'
- [ ] Teste: `POST /:id/credits` → amount=0 retorna 400
- [ ] Teste: `POST /:id/credits` → description vazia retorna 400
- [ ] Teste: `PATCH /:id` → altera role com audit log
- [ ] Teste: `PATCH /:id` → body vazio retorna 400

### AC7 — Testes: `creditService` edge cases adicionais
- [ ] Arquivo: `backend/src/services/creditService.test.ts` (já existe — **adicionar** casos)
- [ ] Teste: `getBalance` retorna zeros quando sem transações (already covered — verificar)
- [ ] Teste: `grantCredits` lança erro se `amount <= 0`
- [ ] Teste: saldo com mix de consume+reserve+release → `available` calculado corretamente pelo RPC

---

## Dev Notes

### Fix #1 — Backend: substituir `reduce` por `getBalance`

```ts
// Em backend/src/routes/admin/users.ts
import { getBalance } from '../../services/creditService.js';

// GET /:id/credit-transactions
router.get('/:id/credit-transactions', async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 20, 100);
  const offset = Number(req.query.offset) || 0;

  const [{ data, error, count }, balanceResult] = await Promise.all([
    supabaseAdmin!
      .from('credit_transactions')
      .select('*', { count: 'exact' })
      .eq('user_id', req.params.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1),
    getBalance(req.params.id),   // ← usa a RPC correta
  ]);

  if (error) return res.status(500).json({ error: error.message });

  res.json({
    transactions: data ?? [],
    total: count ?? 0,
    // Saldo correto via RPC
    balance: balanceResult.available,
    reserved: balanceResult.reserved,
    consumed_this_month: balanceResult.consumed_this_month,
    total_consumed: balanceResult.total_consumed,
  });
});
```

### Fix #2 — Novo endpoint `GET /:id/credit-balance`

```ts
// Adicionar ANTES de /:id/credit-transactions para evitar conflito de rota
router.get('/:id/credit-balance', async (req, res) => {
  try {
    const balance = await getBalance(req.params.id);
    res.json(balance);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
```

### Fix #3 — `CreditosPage.tsx` com dados reais

```tsx
import { useQuery } from '@tanstack/react-query';
import { fetchBalance, fetchTransactions } from '../../api/credits.ts';

export function CreditosPage() {
  const { data: balanceData, isLoading: balanceLoading } = useQuery({
    queryKey: ['credit-balance'],
    queryFn: fetchBalance,
  });

  const { data: txData, isLoading: txLoading } = useQuery({
    queryKey: ['credit-transactions'],
    queryFn: () => fetchTransactions(20, 0),
  });

  const balance = balanceData?.data;
  const transactions = txData?.data ?? [];
  // ...
}
```

### Fix #4 — `ContaPage.tsx` com saldo real

```tsx
import { useQuery } from '@tanstack/react-query';
import { fetchBalance } from '../../api/credits.ts';

export function ContaPage() {
  const { data: balanceData } = useQuery({
    queryKey: ['credit-balance'],
    queryFn: fetchBalance,
    staleTime: 60_000,
  });

  const creditValue = balanceData?.data?.available != null
    ? `${balanceData.data.available} créditos`
    : '—';

  // Substituir '42 creditos' por creditValue na array sections
}
```

### Fix #5 — `AdminUserDetailPage.tsx` — `TabOverview` e `TabCredits`

```tsx
// TabOverview: usar GET /:id/credit-balance (novo endpoint)
import { adminGetUserCreditBalance } from '../../api/courses.ts';

const { data: creditBalance } = useQuery({
  queryKey: ['admin-user-credit-balance', userId],
  queryFn: () => adminGetUserCreditBalance(userId),
});
// Exibir creditBalance?.available (não mais txData.balance)

// TabCredits: exibir campos adicionais (reserved, consumed_this_month)
// A query de credit-transactions já retorna esses campos após o fix
```

### Nova função em `frontend/src/api/courses.ts`

```ts
export async function adminGetUserCreditBalance(id: string): Promise<{
  available: number;
  reserved: number;
  total_consumed: number;
  consumed_this_month: number;
  transaction_count: number;
}> {
  return client.get(`/api/admin/users/${id}/credit-balance`).json();
}
```

### Estrutura do teste `admin/users.test.ts`

```ts
// backend/src/routes/admin/users.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock creditService
vi.mock('../../services/creditService.js', () => ({
  getBalance: vi.fn().mockResolvedValue({
    available: 42,
    reserved: 0,
    total_consumed: 8,
    consumed_this_month: 2,
    transaction_count: 10,
  }),
}));

// Mock supabaseAdmin
// Mock requireAuth + requireAdmin middleware
// Build minimal Express app
// Test each endpoint
```

---

## Tasks

- [x] **Task 1 — Backend: Fix cálculo de saldo em `GET /:id/credit-transactions`**
  - [x] Importar `getBalance` de `creditService`
  - [x] Substituir `reduce` por `await getBalance(req.params.id)`
  - [x] Incluir `reserved`, `consumed_this_month`, `total_consumed` na resposta

- [x] **Task 2 — Backend: Adicionar `GET /:id/credit-balance`**
  - [x] Implementar endpoint antes de `/:id/credit-transactions`
  - [x] Retornar todos os campos de `getBalance()`

- [x] **Task 3 — Frontend: Corrigir `CreditosPage.tsx`**
  - [x] Remover `mockTransactions` e `const balance = 42`
  - [x] Adicionar `useQuery` para `fetchBalance()` e `fetchTransactions()`
  - [x] Loading skeletons + empty state
  - [x] Exibir: saldo disponível, reservado, consumido este mês

- [x] **Task 4 — Frontend: Corrigir `ContaPage.tsx`**
  - [x] Adicionar `useQuery` para `fetchBalance()`
  - [x] Substituir `'42 creditos'` por `balance.available` dinâmico
  - [x] Loading state com `—`

- [x] **Task 5 — Frontend: Adicionar `adminGetUserCreditBalance` em `api/courses.ts`**
  - [x] Nova função `adminGetUserCreditBalance(id)`

- [x] **Task 6 — Frontend: Atualizar `AdminUserDetailPage.tsx`**
  - [x] `TabOverview`: usar `adminGetUserCreditBalance` (novo endpoint)
  - [x] `TabCredits`: usar campos `reserved` e `consumed_this_month` da resposta enriquecida

- [x] **Task 7 — Testes: `backend/src/routes/admin/users.test.ts`**
  - [x] Criar arquivo com mocks de `creditService` e `supabaseAdmin`
  - [x] 9 casos de teste listados no AC6 (+ 2 adicionais = 11 total)

- [x] **Task 8 — Testes: adicionar edge cases em `creditService.test.ts`**
  - [x] Verificar cobertura existente
  - [x] Adicionar casos listados no AC7

---

## Dev Agent Record

### Status
Ready for Review

### Agent Model Used
claude-sonnet-4-6

### Completion Notes
- Bug #1 corrigido: `GET /:id/credit-transactions` agora usa `getBalance()` do creditService (RPC `get_credit_balance`)
- Bug #2 corrigido: `CreditosPage.tsx` usa `useQuery` com `fetchBalance()` e `fetchTransactions()` — mock removido
- Bug #3 corrigido: `ContaPage.tsx` usa `useQuery` com `fetchBalance()` — hardcode '42 creditos' removido
- Bug #4 corrigido: novo endpoint `GET /:id/credit-balance` adicionado antes de `/:id/credit-transactions`
- Fix adicional: `POST /:id/credits` agora armazena `Math.abs(amount)` — DB exige amounts positivos
- Fix adicional: `grantCredits()` agora lança erro se `amount <= 0`
- Fix adicional: display de amounts nas transações do admin usa `t.type` para determinar sinal (não `t.amount > 0`)
- `AdminUserDetailPage.tsx` TabOverview usa `adminGetUserCreditBalance` (endpoint dedicado)
- `AdminUserDetailPage.tsx` TabCredits exibe `reserved` e `consumed_this_month`
- 72 testes passando (32 creditService + 11 admin/users + 21 credits route + 8 onboarding)
- TypeScript type-check passa sem erros (frontend e backend)

### Debug Log
_preencher se necessário_

### File List
- `backend/src/routes/admin/users.ts` (modificar — fix balance + novo endpoint)
- `frontend/src/pages/member/CreditosPage.tsx` (modificar — remover mock, usar API real)
- `frontend/src/pages/member/ContaPage.tsx` (modificar — remover hardcode, usar API)
- `frontend/src/api/courses.ts` (adicionar `adminGetUserCreditBalance`)
- `frontend/src/pages/admin/AdminUserDetailPage.tsx` (modificar — usar saldo correto)
- `backend/src/routes/admin/users.test.ts` (criar — 9 testes)
- `backend/src/services/creditService.test.ts` (modificar — adicionar edge cases)

### Change Log
| Data | Alteração |
|------|-----------|
| 2026-03-11 | Story criada pelo @sm (River) |
