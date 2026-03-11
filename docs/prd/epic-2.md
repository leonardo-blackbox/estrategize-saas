# EPIC 2 — Member System + Admin Console (Iris SaaS)

**Status:** Ready
**Epic ID:** 2
**Title:** Member Area (Netflix-like Formação) + Admin Console
**Versão:** 1.0.0
**Data:** 2026-03-01
**Extensão de:** Epic 1 — Foundation & MVP Core

---

## EPIC OVERVIEW

### Objetivo

Construir e entregar uma **Área de Membros 100% funcional** (Formação/Cursos com UX Netflix-like) integrada ao SaaS da Iris, e o **Admin Console** completo do sistema — com gestão de cursos, matrículas, entitlements, webhooks, drip, usuários e auditoria.

### Premissas

- Epic 1 está em andamento/concluído: autenticação, dashboard, consultorias, créditos e Stripe já existem.
- A aplicação já roda em produção; este epic é uma extensão, não um rebuild.
- Agentes têm **autonomia total** para decisões de arquitetura, detalhes técnicos e melhorias dentro de cada fase.
- O que importa é a entrega final **completa e operacional**.

### Resultado Esperado

Plataforma com:
- ✅ Área de Membros acessível via `/formacao/*` com catálogo Netflix-like
- ✅ Sistema de entitlements por plano + overrides manuais + drip
- ✅ Admin Console em `/admin/*` com gestão completa de conteúdo, usuários e acessos
- ✅ Webhook handler genérico (HMAC, idempotente, multi-gateway)
- ✅ Onboarding automático via webhook de compra aprovada
- ✅ RLS validada e segurança end-to-end

---

## ESCOPO DETALHADO

### A) ÁREA DE MEMBROS — Netflix-like Formação

#### A1. Catálogo de Cursos
- Hero/banner rotativo com curso destaque
- Carrosséis por coleção/tag: "Continue assistindo", "Cursos liberados", "Cursos bloqueados", "Recomendações/Trilhas"
- Cards com estados: `unlocked` / `locked` / `in_progress` + barra de progresso + CTA contextual
- Busca e filtros básicos (por tag, coleção, nome)

#### A2. Página do Curso
- Header com capa, título, descrição, instrutor, progresso geral
- Lista de módulos/temporadas com aulas/episódios
- Estado de cada aula: liberada / bloqueada por drip / bloqueada por entitlement
- Progresso por módulo e curso

#### A3. Página da Aula
- Player de vídeo (embed seguro — YouTube, Vimeo ou storage próprio)
- Retomar onde parou (timestamp salvo)
- Marcar aula como concluída
- Materiais/anexos por aula (download)
- Navegação sequencial (aula anterior / próxima)

#### A4. Sistema de Progresso
- `lesson_progress`: status, timestamp, completed_at por usuário/aula
- "Continue assistindo": última aula acessada não concluída
- Drop-off básico (% de conclusão por aula — visível no admin)

#### A5. Drip & Paywall
- Liberar conteúdo por X dias desde matrícula (v1)
- Override admin: "grant full access" quebra drip
- Cursos bloqueados: exibidos com blur + lock icon + CTA elegante de upgrade
- Paywall não quebra navegação — usuário vê o catálogo completo

---

### B) ADMIN CONSOLE — Gestão do SaaS Inteiro

#### B1. Acesso Admin
- Role `admin` no banco (campo em `profiles` ou tabela separada)
- Guard de rotas: `/admin/*` bloqueado para não-admins
- RLS com política `admin_bypass` usando service_role ou check de role
- Primeiro admin: configurado via env `ADMIN_EMAIL` (bootstrapped)

#### B2. Gestão de Conteúdo
- CRUD: cursos, módulos, aulas
- Upload e gestão de capas/banners (Supabase Storage ou S3)
- Anexos por aula (arquivo + descrição)
- Publicar / Arquivar (soft delete)
- Tags e coleções para organizar carrosséis

#### B3. Gestão de Liberação e Matrículas
- Atribuir cursos liberados por plano (plan_entitlements)
- Conceder acesso individual a curso/módulo/aula (user_entitlements + override)
- Revogar acesso (deny override)
- Override "grant full access" (flag que quebra drip)
- Campo de expiração por acesso + enforcement automático

#### B4. Usuários e Assinaturas
- Listar/filtrar usuários com paginação
- Ver perfil: plano ativo, entitlements efetivos, cursos acessados
- Forçar refresh/reprocess de entitlements (admin action)
- Reset de acesso / reenviar e-mail de primeiro acesso

#### B5. Webhooks e Auditoria
- Tela de `webhook_events`: status, payload, timestamp, erro se houver
- `audit_logs`: ações admin + eventos críticos (upgrade, revogação, acesso concedido)
- Filtros por tipo de evento, data, usuário

---

### C) BACKEND — Integrações e Robustez

#### C1. Webhook Handler (Gateway-Agnostic)
- Verificação de assinatura HMAC por provider (Stripe, Hotmart, Kiwify, etc.)
- Idempotência via `event_id` único (não processa evento 2x)
- Eventos suportados:
  - `purchase_approved` / `subscription_active` → cria/atualiza user + entitlements
  - `payment_failed` / `past_due` → suspender acesso (sem deletar progresso)
  - `canceled` → revogar entitlements
  - `refunded` / `chargeback` → revogar + flag no audit log

#### C2. Onboarding via Webhook
- Se email não existe: criar usuário Supabase Auth + enviar e-mail de primeiro acesso (magic link ou senha temporária)
- Se existe: atualizar entitlements/plano
- Aplicar entitlements do plano comprado imediatamente

#### C3. Entitlements Engine
- `plan_entitlements`: plano → lista de cursos/coleções liberados
- `user_entitlements`: overrides individuais (allow/deny por curso/módulo/aula)
- Drip gating: calcular dias desde matrícula vs. regra de liberação
- Expiração: checar `expires_at` antes de conceder acesso
- Resolver acesso efetivo: plan → override → drip → expiration (cascata)

#### C4. Segurança e Performance
- RLS em todas as tabelas novas (member area + admin)
- Rate limiting: endpoints de auth, webhook, admin actions
- Logs consistentes (structured logging)
- Paginação no catálogo e listas admin
- Lazy loading de dados de progresso (não bloquear carregamento do catálogo)

---

## STORIES DO EPIC 2

### Wave 1 — Foundation (Paralelo)

| Story | Agente Principal | Título |
|-------|-----------------|--------|
| 2.1 | @architect + @data-engineer | Schema, Migrations & RLS — Member Area |
| 2.2 | @dev | Admin Infrastructure — Rotas, Guard, Role |
| 2.3 | @dev | Entitlements Engine — Core Logic |

### Wave 2 — Core Backend (Paralelo, após Wave 1)

| Story | Agente Principal | Título |
|-------|-----------------|--------|
| 2.4 | @dev | Webhook Handler — Gateway-Agnostic + Idempotency |
| 2.5 | @dev | Onboarding Flow — Compra → User → Entitlements + E-mail |
| 2.6 | @dev | Drip Engine — Liberação por Dias + Override |

### Wave 3 — Admin Console Backend (Paralelo, após Wave 1)

| Story | Agente Principal | Título |
|-------|-----------------|--------|
| 2.7 | @dev | Admin API — Course/Module/Lesson CRUD |
| 2.8 | @dev | Admin API — User Management + Access Control |
| 2.9 | @dev | Admin API — Webhook Events & Audit Logs |

### Wave 4 — Member Area Frontend (Paralelo, após Wave 2+3)

| Story | Agente Principal | Título |
|-------|-----------------|--------|
| 2.10 | @ux-design-expert + @dev | Member Area Layout & Navigation |
| 2.11 | @ux-design-expert + @dev | Catálogo Netflix-like — Hero + Carrosséis + Cards |
| 2.12 | @dev | Página do Curso — Módulos, Aulas, Progresso, Drip |
| 2.13 | @dev | Página da Aula — Player, Progresso, Materiais |
| 2.14 | @ux-design-expert + @dev | Paywall Elegante + Continue Assistindo |

### Wave 5 — Admin Console Frontend (Paralelo, após Wave 3)

| Story | Agente Principal | Título |
|-------|-----------------|--------|
| 2.15 | @dev | Admin UI — Content Management (Cursos/Módulos/Aulas) |
| 2.16 | @dev | Admin UI — Users, Access & Entitlements |
| 2.17 | @dev | Admin UI — Webhooks, Audit Logs & Dashboard |

### Wave 6 — QA, Segurança & Go-Live (Sequencial)

| Story | Agente Principal | Título |
|-------|-----------------|--------|
| 2.18 | @qa + @dev | Security Audit — RLS, Rate Limit, Webhook Signatures |
| 2.19 | @qa | E2E Tests — Fluxos Críticos (Webhook, Entitlement, Admin, Drip) |
| 2.20 | @qa + @devops | Go-Live Checklist + Deploy |

---

## GATES / GO-NO-GO

| Gate | Responsável | Critério |
|------|-------------|---------|
| **Gate 1 — Design/UX** | @ux-design-expert + @pm | Layout Netflix funcional, navegação aprovada em desktop + mobile |
| **Gate 2 — Data/RLS** | @data-engineer + @qa | Schema completo, RLS testada (usuário A não vê dados de B, admin bypassa) |
| **Gate 3 — Webhooks** | @qa + @dev | Idempotência validada, assinatura verificada, eventos duplicados não geram inconsistência |
| **Gate 4 — QA Final** | @qa | Fluxos críticos passando: signup via webhook, acesso, drip/override, admin CRUD |

---

## ACCEPTANCE CRITERIA GLOBAIS

### Usuário Final
- [ ] Acessa `/formacao` e vê catálogo Netflix-like
- [ ] Visualiza cursos liberados e bloqueados (paywall elegante, sem quebrar UX)
- [ ] Assiste aula e progresso é salvo automaticamente
- [ ] "Continue assistindo" mostra a última aula corretamente
- [ ] Conteúdo com drip aparece bloqueado até data de liberação

### Admin
- [ ] Acessa `/admin` e é bloqueado se não for admin
- [ ] Cria, edita e publica curso/módulo/aula
- [ ] Concede e revoga acesso individual a qualquer nível
- [ ] Override "grant full access" funciona e quebra drip
- [ ] Visualiza webhook_events e audit_logs com filtros

### Webhooks
- [ ] Compra aprovada → cria/atualiza user + aplica entitlements + envia e-mail
- [ ] Evento duplicado não gera duplicação (idempotência)
- [ ] Cancelamento revoga acesso corretamente
- [ ] Assinatura HMAC validada (rejeita webhook sem assinatura válida)

### Segurança
- [ ] RLS: usuário só acessa dados de cursos que tem entitlement
- [ ] `/admin/*` retorna 403 para usuário sem role admin
- [ ] Rate limit ativo em `/api/webhook`, `/admin/*`
- [ ] Audit log registra todas as ações admin críticas

---

## DEFINIÇÃO DE "EPIC CONCLUÍDO"

O epic está completo quando todos os 4 gates passam e os acceptance criteria globais estão 100% checados.

---

## DEPENDÊNCIAS TÉCNICAS

### Novas Tabelas (resumo — detalhadas na Story 2.1)
- `courses` — catálogo de cursos
- `modules` — módulos/temporadas por curso
- `lessons` — aulas/episódios por módulo
- `lesson_attachments` — materiais por aula
- `collections` — coleções/tags para carrosséis
- `course_collections` — relação curso ↔ coleção
- `plan_entitlements` — plano → cursos liberados
- `user_entitlements` — overrides individuais
- `enrollments` — matrícula com drip tracking
- `lesson_progress` — progresso por aula/usuário
- `webhook_events` — log de webhooks recebidos
- `audit_logs` — audit trail de ações admin

### Variáveis de Ambiente Novas
```
WEBHOOK_SECRET_STRIPE=...
WEBHOOK_SECRET_HOTMART=...
WEBHOOK_SECRET_KIWIFY=...
ADMIN_EMAIL=...
STORAGE_BUCKET_COURSES=...
SMTP_FROM=...
MAGIC_LINK_REDIRECT_URL=...
```

---

## MODO DE EXECUÇÃO

- **interactive** com checkpoints por gate (1–4)
- Autonomia total dentro de cada fase/wave
- Reporte apenas nos gates de qualidade
- Prioridade: Segurança > RLS > Webhooks > Admin > UX refinada

---

*Epic 2 criado por @pm (Morgan) em 2026-03-01*
*Extensão do Epic 1 — Foundation & MVP Core*
