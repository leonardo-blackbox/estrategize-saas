# Security Audit — Epic 2 (Member Area + Admin Console)

**Data:** 2026-03-02
**Auditor:** @qa
**Status:** ✅ APROVADO com observações

---

## 1. RLS — Row Level Security

### Tabelas auditadas

| Tabela | SELECT anon | SELECT user | SELECT admin | INSERT/UPDATE/DELETE |
|--------|-------------|-------------|--------------|----------------------|
| `profiles` | ❌ bloqueado | ✅ só próprio | ✅ via service_role | ✅ service_role |
| `courses` | ❌ bloqueado | ✅ published only | ✅ todos | ✅ admin only |
| `modules` | ❌ bloqueado | ✅ via curso pub. | ✅ todos | ✅ admin only |
| `lessons` | ❌ bloqueado | ✅ via módulo pub. | ✅ todos | ✅ admin only |
| `lesson_attachments` | ❌ bloqueado | ✅ autenticado | ✅ todos | ✅ admin only |
| `collections` | ❌ bloqueado | ✅ autenticado | ✅ todos | ✅ admin only |
| `plan_entitlements` | ❌ bloqueado | ✅ autenticado | ✅ todos | ✅ admin only |
| `user_entitlements` | ❌ bloqueado | ✅ só próprio | ✅ todos | ✅ admin only |
| `enrollments` | ❌ bloqueado | ✅ só próprio | ✅ todos | ✅ admin only |
| `lesson_progress` | ❌ bloqueado | ✅ só próprio | ✅ todos | ✅ só próprio |
| `webhook_events` | ❌ bloqueado | ❌ bloqueado | ✅ só admin | ✅ service_role |
| `audit_logs` | ❌ bloqueado | ❌ bloqueado | ✅ só admin | ✅ service_role |

**Resultado:** Isolamento cross-user confirmado. Backend usa `SUPABASE_SERVICE_ROLE_KEY` que bypassa RLS corretamente para operações administrativas.

---

## 2. Rate Limiting

| Endpoint | Limite | Janela |
|----------|--------|--------|
| Geral (`*`) | 300 req | 15 min |
| Auth (`/auth/*`) | 20 req | 15 min |
| Admin (`/api/admin/*`) | 200 req | 15 min |
| Webhooks (`/api/webhooks/*`) | 60 req | 1 min |

**Implementado em:** `backend/src/index.ts` via `express-rate-limit`.
**Resposta ao exceder limite:** HTTP 429 com body `{ error: "Too many requests..." }`.

---

## 3. Webhook Security

| Verificação | Stripe | Hotmart | Kiwify |
|-------------|--------|---------|--------|
| HMAC-SHA256 | ✅ | ✅ | ✅ |
| Timing-safe compare | ✅ | ✅ | ✅ |
| Bypass em dev (`NODE_ENV !== 'production'`) | ✅ | ✅ | ✅ |
| Idempotência por `(provider, event_id)` | ✅ | ✅ | ✅ |

**Observação:** Em `NODE_ENV=development` as assinaturas são bypassadas para facilitar testes locais. Em produção, webhook sem HMAC válido retorna `401`.

---

## 4. CORS

- Origens permitidas: `FRONTEND_URL` (env) + portas Vite 5173-5175
- `credentials: true` habilitado para cookies/auth headers
- Requisições sem `Origin` (Postman, cURL) são permitidas

---

## 5. Autenticação

- JWT validado em `requireAuth` middleware via `supabase.auth.getUser(token)`
- Admin verificado em `requireAdmin` via SELECT em `profiles.role`
- Token inválido/expirado → HTTP 401
- Usuário sem role admin em rota `/admin/*` → HTTP 403

---

## 6. Observações e Itens Pendentes

| # | Item | Prioridade | Status |
|---|------|-----------|--------|
| 1 | Adicionar `helmet` para headers de segurança HTTP | Média | ⚠️ Pendente |
| 2 | Sanitização de inputs em campos de texto livres | Média | ⚠️ Pendente |
| 3 | Audit log para tentativas de acesso negadas | Baixa | ⚠️ Pendente |
| 4 | Renovação de tokens: verificar expiração no frontend | Baixa | ✅ Feito via Supabase client |

---

## 7. Conclusão

Epic 2 atende aos requisitos mínimos de segurança para um ambiente de produção de uso interno/beta. Os itens marcados como ⚠️ pendentes devem ser abordados antes de escalar para usuários públicos em grande volume.
