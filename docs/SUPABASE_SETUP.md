# Supabase Setup — Iris Platform

## 1. Criar projeto no Supabase

1. Acesse [app.supabase.com](https://app.supabase.com) e crie um novo projeto.
2. Anote as credenciais em **Settings → API**:
   - `Project URL` → `SUPABASE_URL`
   - `service_role` (secret) → `SUPABASE_SERVICE_ROLE_KEY`
   - `anon` (public) → `VITE_SUPABASE_ANON_KEY`
3. Cole essas variáveis nos arquivos `.env.local` correspondentes:
   - `backend/.env.local`
   - `frontend/.env.local`

## 2. Aplicar o schema SQL

1. No dashboard do Supabase, vá em **SQL Editor** (menu lateral esquerdo).
2. Clique em **New query**.
3. Cole o conteúdo completo de `backend/src/database/schema.sql`.
4. Clique em **Run** (ou Ctrl+Enter).
5. Verifique que não houve erros no output.

### Tabelas criadas

| Tabela | Descrição |
|--------|-----------|
| `profiles` | Perfil do usuário (espelha auth.users) |
| `plans` | Planos de assinatura |
| `subscriptions` | Assinaturas dos usuários |
| `consultancies` | Consultorias (com soft delete) |
| `consultancy_diagnostics` | Diagnósticos de IA por consultoria |
| `credit_transactions` | Transações de créditos |
| `audit_log` | Log de auditoria automático |

### RLS (Row Level Security)

Todas as tabelas têm RLS habilitado. As policies garantem:

- Usuários só acessam seus próprios dados
- `plans` é leitura pública (catálogo de planos)
- `audit_log` mostra apenas registros do próprio usuário
- `consultancy_diagnostics` verifica ownership via `consultancies`

### Triggers automáticos

- **`on_auth_user_created`** — Cria perfil na tabela `profiles` quando um usuário se cadastra.
- **`set_updated_at_*`** — Atualiza `updated_at` automaticamente em `profiles`, `subscriptions`, `consultancies`.
- **`audit_*`** — Registra INSERT/UPDATE/DELETE em `audit_log` para `consultancies`, `subscriptions`, `credit_transactions`.

## 3. Validar conexão via backend

1. Configure `backend/.env.local` com `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY`.
2. Inicie o backend:

```bash
cd backend
npm run dev
```

3. Teste o endpoint de health do banco:

```bash
curl http://localhost:3001/health/db
```

**Resposta esperada:**
```json
{
  "status": "ok",
  "timestamp": "2026-02-17T...",
  "tables": ["profiles", "plans", "subscriptions", "consultancies", "consultancy_diagnostics", "credit_transactions", "audit_log"]
}
```

**Se o Supabase não estiver configurado:**
```json
{
  "status": "error",
  "message": "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set"
}
```

## 4. Testar RLS manualmente

No SQL Editor do Supabase, rode:

```sql
-- Troque pelo UUID de um usuário real
set request.jwt.claims = '{"sub": "USER_UUID_AQUI"}';

-- Deve retornar apenas dados desse usuário
select * from public.consultancies;
select * from public.credit_transactions;
```

Para confirmar que um usuário A **não** vê dados do usuário B, repita com outro UUID.

## 5. Seed de planos (opcional)

Para inserir planos iniciais:

```sql
insert into public.plans (name, description, price_cents, credits_per_month) values
  ('Free',   'Plano gratuito',        0, 10),
  ('Pro',    'Plano profissional', 4900, 100),
  ('Enterprise', 'Plano enterprise', 19900, 500);
```
