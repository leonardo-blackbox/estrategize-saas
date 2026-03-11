# Go-Live Checklist — Epic 2

**Data:** 2026-03-02
**Responsável:** @devops (Gage)
**Epic:** Member Area + Admin Console

---

## 1. Variáveis de Ambiente

### Backend (Railway / produção)

| Variável | Obrigatório | Descrição |
|----------|-------------|-----------|
| `SUPABASE_URL` | ✅ | URL do projeto Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | Chave service_role (nunca expor no frontend) |
| `SUPABASE_ANON_KEY` | ✅ | Chave anon pública |
| `OPENAI_API_KEY` | ✅ | Para diagnósticos Iris |
| `STRIPE_SECRET_KEY` | ✅ | `sk_live_...` em produção |
| `STRIPE_WEBHOOK_SECRET` | ✅ | `whsec_...` do endpoint Stripe |
| `HOTMART_WEBHOOK_SECRET` | ⚠️ | Se usar Hotmart |
| `KIWIFY_WEBHOOK_SECRET` | ⚠️ | Se usar Kiwify |
| `ADMIN_EMAIL` | ✅ | Email do primeiro admin (bootstrapped no startup) |
| `FRONTEND_URL` | ✅ | URL de produção do frontend (ex: `https://app.iris.com`) |
| `NODE_ENV` | ✅ | `production` |
| `PORT` | ✅ | Porta do servidor (Railway injeta automaticamente) |

### Frontend (Vercel / produção)

| Variável | Obrigatório | Descrição |
|----------|-------------|-----------|
| `VITE_SUPABASE_URL` | ✅ | URL do projeto Supabase |
| `VITE_SUPABASE_ANON_KEY` | ✅ | Chave anon pública |
| `VITE_API_URL` | ✅ | URL do backend em produção |

---

## 2. Migrations

- [ ] Rodar `006_member_area_and_admin.sql` no Supabase de produção via SQL Editor
- [ ] Verificar que todas as 12 tabelas foram criadas: `courses`, `modules`, `lessons`, `lesson_attachments`, `collections`, `course_collections`, `plan_entitlements`, `user_entitlements`, `enrollments`, `lesson_progress`, `webhook_events`, `audit_logs`
- [ ] Verificar que coluna `role` foi adicionada em `profiles`
- [ ] Confirmar seed de coleções padrão (`continue-assistindo`, `cursos-liberados`, etc.)

---

## 3. Supabase Auth

- [ ] Desabilitar "Confirm email" em produção (ou garantir template de email configurado)
- [ ] Configurar URL de redirecionamento pós-signup para `https://app.iris.com`
- [ ] Verificar regras de senha (mínimo 6 chars já configurado no frontend)

---

## 4. Stripe Webhooks

- [ ] Criar endpoint no Stripe Dashboard apontando para `https://api.iris.com/api/webhooks/stripe`
- [ ] Selecionar eventos: `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.deleted`, `invoice.payment_failed`
- [ ] Copiar `whsec_...` para `STRIPE_WEBHOOK_SECRET`

---

## 5. Deploy

### Backend (Railway)
```bash
# Railway detecta automaticamente via Procfile ou package.json start
npm run build && npm start
```

### Frontend (Vercel)
```bash
# Vercel detecta automaticamente o projeto Vite
npm run build
# Output: dist/
```

---

## 6. Smoke Tests Pós-Deploy

Execute estes testes manualmente após o deploy:

- [ ] **Auth:** Login com email/senha funciona → redireciona para `/formacao`
- [ ] **Catálogo:** `/formacao` carrega cursos (mesmo que vazio, sem erro)
- [ ] **Admin:** Login com `ADMIN_EMAIL` → acessar `/admin` → ver dashboard
- [ ] **Admin CRUD:** Criar curso, adicionar módulo, adicionar aula, publicar
- [ ] **Webhook:** Enviar evento teste via Stripe Dashboard → verificar em `/admin/stripe`
- [ ] **Health:** `GET /health` → `{ status: 'ok' }`

---

## 7. Monitoramento

- [ ] Configurar alertas de erro no Railway (logs + métricas)
- [ ] Configurar Sentry no backend (`src/index.ts`) para captura de erros
- [ ] Monitorar webhook events com status `failed` via `/admin/stripe`
- [ ] Configurar uptime monitor (UptimeRobot / Better Uptime) no endpoint `/health`

---

## 8. Rollback Plan

Se algo der errado após o deploy:

1. Reverter deploy no Railway/Vercel para versão anterior
2. As migrations de banco são aditivas (não destrutivam) — sem necessidade de rollback de DB
3. Caso necessário, remover tabelas do Epic 2 com:
   ```sql
   -- CUIDADO: apenas em emergência
   DROP TABLE IF EXISTS audit_logs, webhook_events, lesson_progress,
     enrollments, user_entitlements, plan_entitlements,
     course_collections, collections, lesson_attachments,
     lessons, modules, courses CASCADE;
   ALTER TABLE profiles DROP COLUMN IF EXISTS role;
   ```
