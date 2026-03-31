# Iris SaaS — MVP Completo

## What This Is

Plataforma B2B SaaS para consultoras de estratégia de negócios. Permite criar e gerenciar consultorias com IA treinada na metodologia da Iris, transcrição automática de reuniões via bot, formulários de qualificação de leads, área de membros (cursos), sistema de créditos e pagamento via Stripe. Produto duplo: a Iris usa para si mesma e vende para outras consultoras.

## Core Value

A IA de cada consultoria responde com a metodologia real da Iris e com o contexto específico do cliente — tornando cada sessão de consultoria mais inteligente e fundamentada do que qualquer ferramenta genérica.

## Requirements

### Validated

- ✓ Auth via Supabase (signup, login, logout, session persistente) — Epic 1
- ✓ Dashboard principal com navegação — Epic 1
- ✓ Consultorias CRUD (criar, listar, editar, deletar) — Epic 1
- ✓ Sistema de créditos (reserva, consumo, histórico) — Epic 1
- ✓ Webhook handler multi-provider (Stripe/Hotmart/Kiwify) com HMAC — Epic 2
- ✓ onboardingService (compra → matrícula → entitlements) — Epic 2
- ✓ Área de membros Netflix-like (Formação) — Epic 2
- ✓ Admin Console base (11 páginas) — Epic 2
- ✓ Form Builder completo (Aplicações) — Epic 3 — 11 tipos de campo, analytics, Meta CAPI

### Active

- [ ] Admin Robusto — Iris opera o sistema inteiro via UI (Stripe, cursos, usuárias, IA global)
- [ ] Checkout Stripe — visitante compra plano → acesso liberado automaticamente
- ✓ Admin IA Global — upload PDF/TXT/MD + indexação + teste de query IA — Validado em Phase 05
- [ ] IA Base de Conhecimento — RAG com metodologia Iris (global) + docs do cliente (por consultoria)
- ✓ Reuniões com Transcrição — bot Recall.ai entra no Meet → transcrição + resumo + action items — Validado em Phase 20
- ✓ Central da Cliente v2 — consultorias refinadas com KPIs, wizard, tabs organizadas, integração IA/reunião — Validado em Phases 17-20

### Out of Scope

- LiveKit nativo (vídeo dentro do app) — implementar após tração com bot
- Webhooks Hotmart/Kiwify no checkout — apenas Stripe no MVP
- Lógica condicional em formulários — Epic 6 (pós-MVP)
- App mobile — web-first
- Onboarding wizard sofisticado — pós-lançamento
- Templates avançados de consultoria — pós-lançamento

## Context

**Stack confirmada:** React 18 + TypeScript + Vite (frontend) | Node.js + Express + TypeScript (backend) | PostgreSQL via Supabase (RLS mandatory) | Supabase Auth | OpenAI GPT-4 | Stripe | Vercel (FE) + Railway (BE)

**Codebase brownfield:** Projeto extenso com 31 páginas frontend, 18+ rotas backend, 19 migrations, 150+ componentes. Tudo em `/Users/leonardorodrigues/dev/estrategize-saas`.

**PRD completo:** `docs/prd/MVP-PRD.md` — contém regras de negócio, arquitetura técnica, migrações SQL necessárias, epics detalhados com stories.

**Reuniões:** Decisão = Recall.ai para MVP ($0,50/hora, SOC-2) → LiveKit nativo após tração.

**RAG:** Supabase pgvector com dois escopos — `global` (metodologia Iris) e `consultancy` (docs do cliente).

**Dependência externa:** pgvector extension deve estar habilitada no Supabase antes de executar Epic C.

## Constraints

- **Stack:** Monorepo `/frontend` + `/backend` — não mudar estrutura
- **DB:** Supabase + RLS obrigatório em todas as tabelas novas
- **Code style:** TypeScript strict sem `any`, componentização 3 camadas (Página ≤20 linhas, Agregador ≤200, Micro-módulo ≤80)
- **Segurança:** Webhook Stripe com signature verification (já existe)
- **LGPD:** Consentimento explícito antes de ativar gravação; bot visível como "Iris AI Notetaker"

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Recall.ai para reuniões (MVP) | Time-to-market dias vs semanas do LiveKit; validar feature antes de investir | — Pending |
| pgvector no Supabase para RAG | Evita serviço separado (Pinecone); Supabase já é o DB principal | — Pending |
| OpenAI text-embedding-3-small | Melhor custo/qualidade para embeddings; já temos chave OpenAI | — Pending |
| Dois escopos de conhecimento (global + consultancy) | Global = metodologia Iris compartilhada; consultancy = contexto do cliente isolado | — Pending |
| Skip research no GSD | Pesquisa de domínio já realizada via PRD PRO + NotebookLM (docs em Obsidian) | ✓ Good |

---
*Last updated: 2026-03-31 — Phase 05 complete (Admin IA Global — upload + indexação + teste de query)*
