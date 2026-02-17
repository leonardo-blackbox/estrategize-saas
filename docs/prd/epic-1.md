# EPIC 1 — Foundation & MVP Core

**Status:** Ready
**Epic ID:** 1
**Title:** Foundation Phase - Authentication, Dashboard, Consultorias, Credits & Payments
**Versão:** 1.0.0
**Data:** 2026-02-16

---

## EPIC OVERVIEW

### Objetivo

Construir a **fundação completa** da plataforma Iris com autenticação, painel operacional, gerenciamento de consultorias, sistema de créditos e integração de pagamentos.

### Escopo

| Área | Stories | Descrição |
|------|---------|-----------|
| **Infra & Auth** | 1.1, 1.2, 1.3 | Setup, PostgreSQL RLS, Autenticação |
| **Dashboard** | 1.4, 1.5 | Layout responsivo, componentes principais |
| **Consultorias** | 1.6, 1.7, 1.8 | CRUD, Diagnóstico IA, Workspace |
| **Créditos** | 1.9, 1.10 | Sistema de reserva/consumo, auditoria |
| **Pagamentos** | 1.11, 1.12 | Stripe integration, webhooks |

### Resultado Esperado

Plataforma funcional com:
- ✅ Usuários autenticados via Supabase
- ✅ Dashboard operacional
- ✅ Gerenciamento de 1+ consultoria por usuário
- ✅ Sistema de créditos funcionando
- ✅ Pagamento via Stripe (webhooks idempotentes)

---

## DEPENDÊNCIAS E PRÉ-REQUISITOS

### Decisões Técnicas Necessárias

Antes de começar, o time deve confirmar:

- [ ] **Frontend:** React 18 + TypeScript + Vite ✅
- [ ] **Backend:** Node.js + Express + TypeScript ✅
- [ ] **Database:** PostgreSQL + Supabase ✅
- [ ] **Auth:** Supabase Auth ✅
- [ ] **IA:** OpenAI GPT-4 ✅
- [ ] **Pagamento:** Stripe ✅
- [ ] **Hosting:** Vercel (FE) + Railway (BE) ✅

### Contas & Credenciais Necessárias

- [ ] Supabase account (Leonardo tem)
- [ ] OpenAI API key
- [ ] Stripe account (test + production)
- [ ] Vercel account
- [ ] Railway account
- [ ] SendGrid account (emails)

### Ferramentas de Dev

- [ ] Node.js 18+ LTS
- [ ] npm/yarn/pnpm
- [ ] Git + GitHub
- [ ] VS Code ou editor preferido
- [ ] Postman/Insomnia (API testing)

---

## STORIES DENTRO DO EPIC 1

### Story 1.1 — Project Setup & Infrastructure

**Descrição:** Configurar estrutura base de frontend e backend, CI/CD, ambientes

**Subtarefas:**
- [ ] Criar repositório Git
- [ ] Setup inicial React (Vite)
- [ ] Setup inicial Node.js (Express)
- [ ] Configurar .env e variáveis de ambiente
- [ ] Setup GitHub Actions (lint, test, build)
- [ ] Configurar Vercel deployment (frontend)
- [ ] Configurar Railway deployment (backend)
- [ ] Documentar setup local (README)

**Aceitação:** Ambos (FE e BE) rodando localmente, CI/CD verde

---

### Story 1.2 — PostgreSQL Schema & RLS Policies

**Descrição:** Criar schema do banco de dados com Row Level Security habilitado

**Subtarefas:**
- [ ] Criar tabelas (users, subscriptions, consultancies, etc)
- [ ] Habilitar RLS em todas as tabelas
- [ ] Criar políticas RLS para cada tabela
- [ ] Criar função de audit trigger
- [ ] Executar migrations
- [ ] Documentar schema em `docs/database-schema.md`
- [ ] Testar RLS (usuário A não vê dados de B)

**Aceitação:** Schema completo, RLS testado, migrations funcionando

---

### Story 1.3 — Authentication Flow (Signup/Login)

**Descrição:** Implementar signup e login com Supabase Auth

**Frontend:**
- [ ] Página de Login (email + password)
- [ ] Página de Signup
- [ ] Password reset flow
- [ ] Componentes de erro/validação
- [ ] Zustand store para auth state
- [ ] Protected routes (redirect se não logged)
- [ ] JWT refresh token handling

**Backend:**
- [ ] POST /auth/signup → Cria usuário + webhook trigger
- [ ] POST /auth/login → Retorna JWT
- [ ] POST /auth/refresh → Novo JWT
- [ ] POST /auth/logout → Cleanup
- [ ] Middleware de verificação JWT

**Aceitação:** Signup, login e logout funcionando end-to-end

---

### Story 1.4 — Dashboard Layout & Navigation

**Descrição:** Criar layout responsivo da home com sidebar/hamburger menu

**Subtarefas:**
- [ ] Criar componente de Sidebar (desktop)
- [ ] Criar componente de Hamburger Menu (mobile)
- [ ] Layout principal com Outlet (React Router)
- [ ] Componentes de navegação
- [ ] Responsividade (Tailwind breakpoints)
- [ ] Dark mode toggle (opcional)
- [ ] Logo e branding

**Aceitação:** Layout funcional, navegável em desktop e mobile

---

### Story 1.5 — Dashboard Content Sections

**Descrição:** Preencher dashboard com as 8 seções (banners, carrosséis, cards)

**Subtarefas:**
- [ ] Banner estratégico (estático por enquanto)
- [ ] Seção "Consultorias Ativas" (carrossel)
- [ ] Seção "Próximas Ações" (lista de tasks)
- [ ] Seção "Ferramentas Recomendadas" (cards)
- [ ] Seção "Continue de Onde Parou" (history)
- [ ] Seção "Cursos Recomendados" (carrossel)
- [ ] Seção "Recursos Bloqueados" (upsell)
- [ ] Seção "Status de Créditos" (card)

**Aceitação:** Dashboard completo visualmente, dados mockados ok

---

### Story 1.6 — Consultancy CRUD (Backend)

**Descrição:** Implementar API de criação, leitura, atualização, exclusão de consultorias

**Subtarefas:**
- [ ] POST /api/consultancies → Criar nova consultoria
- [ ] GET /api/consultancies → Listar minhas consultorias (RLS)
- [ ] GET /api/consultancies/:id → Detalhe 1 consultoria
- [ ] PUT /api/consultancies/:id → Atualizar dados
- [ ] DELETE /api/consultancies/:id → Soft delete
- [ ] Validação de entrada (Zod)
- [ ] Tests (unit + integration)

**Aceitação:** API completa, RLS funcionando, testes passando

---

### Story 1.7 — Consultancy UI (Frontend)

**Descrição:** Interface para criar, visualizar, editar consultorias

**Subtarefas:**
- [ ] Página "/consultancies" (lista)
- [ ] Página "/consultancies/new" (formulário)
- [ ] Modal de edição rápida
- [ ] Cards de consultoria com status
- [ ] Integração com React Query (fetch automático)
- [ ] Loading states e error handling
- [ ] Confirmação antes de deletar

**Aceitação:** CRUD completo funcional na UI

---

### Story 1.8 — Consultancy Diagnosis (IA Iris)

**Descrição:** Executar diagnóstico automático via IA quando consultoria criada

**Subtarefas:**
- [ ] Criar service wrapper OpenAI (irisAIService.ts)
- [ ] Prompt com método Iris injected
- [ ] POST /api/consultancies/:id/diagnose → Chama IA
- [ ] Salva resultado em `consultancy_diagnostics`
- [ ] Mostra resultado no frontend
- [ ] Permite editar/validar diagnóstico
- [ ] Versionamento de diagnósticos

**Aceitação:** Diagnóstico gerado automaticamente, editável, versionado

---

### Story 1.9 — Credit System (Reserve & Consume)

**Descrição:** Implementar sistema de reserva, consumo e liberação de créditos

**Backend:**
- [ ] POST /api/credits/reserve → Reserva crédito
- [ ] POST /api/credits/consume → Confirma consumo
- [ ] POST /api/credits/release → Libera se erro
- [ ] GET /api/credits/balance → Saldo atual
- [ ] Transações registradas em `credit_transactions`
- [ ] Validação de saldo antes de executar
- [ ] Idempotência (mesma requisição 2x = 1 desconto)

**Frontend:**
- [ ] Display de saldo (card)
- [ ] Modal de compra de créditos (future)
- [ ] Histórico de consumo (table)

**Aceitação:** Reserve/consume funciona end-to-end, auditoria registrada

---

### Story 1.10 — Plan & Subscription Management

**Descrição:** Estrutura de planos, atribuição de créditos mensais, renovação

**Subtarefas:**
- [ ] Criar tabelas `plans`, `subscriptions`
- [ ] Endpoint GET /api/plans (listar planos)
- [ ] Lógica de atribuição mensal de créditos
- [ ] Verificação de acesso por plano
- [ ] Entitlements (quem pode usar qual ferramenta)
- [ ] Dashboard de uso vs limite

**Aceitação:** Usuário sabe qual plano tem, quantos créditos/mês

---

### Story 1.11 — Stripe Integration (Webhooks)

**Descrição:** Receber webhooks Stripe e atualizar banco de dados

**Subtarefas:**
- [ ] Setup Stripe CLI (teste local)
- [ ] POST /webhooks/stripe → Recebe eventos
- [ ] Validar assinatura do webhook (security!)
- [ ] Idempotência (mesmo evento 2x = 1 processamento)
- [ ] Handle: payment_intent.succeeded
- [ ] Handle: customer.subscription.created
- [ ] Handle: customer.subscription.deleted
- [ ] Testes de webhook (mock Stripe)
- [ ] Logging completo

**Aceitação:** Webhook recebido, processado, idempotente

---

### Story 1.12 — Checkout & Payment UI

**Descrição:** Página de compra/planos no frontend, integração com Stripe

**Subtarefas:**
- [ ] Página "/plans" (mostrar planos)
- [ ] Página "/checkout" (Stripe Checkout)
- [ ] Botão "Upgrade" na conta
- [ ] Packs avulsos de créditos
- [ ] Confirmação de pagamento
- [ ] Redirect após sucesso (dashboard)
- [ ] Recovery de falhas

**Aceitação:** Usuário consegue comprar plano, recebe créditos

---

## PRIORIZAÇÃO DENTRO DO EPIC

### Wave 1 (Semana 1 — Foundation)
1. Story 1.1 → Setup
2. Story 1.2 → Database schema
3. Story 1.3 → Authentication

### Wave 2 (Semana 2 — Core UI)
4. Story 1.4 → Dashboard layout
5. Story 1.5 → Dashboard content
6. Story 1.6 → Consultancy API
7. Story 1.7 → Consultancy UI

### Wave 3 (Semana 3 — IA + Credits)
8. Story 1.8 → IA Diagnosis
9. Story 1.9 → Credit system
10. Story 1.10 → Plans

### Wave 4 (Semana 4 — Payments)
11. Story 1.11 → Stripe webhooks
12. Story 1.12 → Checkout UI

---

## ACEITAÇÃO DO EPIC

Epic é considerado **PRONTO PARA DEMO** quando:

- ✅ Todas as 12 stories implementadas e testadas
- ✅ Usuário consegue: signup → comprar plano → criar consultoria → ver diagnóstico
- ✅ Sistema de créditos funcionando (reserva/consumo)
- ✅ Pagamento via Stripe processando corretamente
- ✅ RLS protegendo dados
- ✅ Dashboard mostrando informações corretas
- ✅ CI/CD pipeline verde
- ✅ Documentação atualizada

---

## MÉTRICAS DE SUCESSO

- **Coverage:** >80% test coverage
- **Performance:** Home < 1s, API < 500ms
- **Uptime:** 99%+ (monitored com Sentry)
- **Security:** Zero OWASP top 10 issues
- **UX:** Mobile-friendly, acessível (WCAG AA)

---

**Epic 1 — Foundation Phase**
Próximo Epic: **Epic 2 — Ferramentas MVP** (3 plugins)
