---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: unknown
stopped_at: Completed 04-01-PLAN.md
last_updated: "2026-03-29T04:24:03.854Z"
progress:
  total_phases: 20
  completed_phases: 4
  total_plans: 11
  completed_plans: 11
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-28)

**Core value:** A IA de cada consultoria responde com a metodologia real da Iris e com o contexto específico do cliente
**Current focus:** Phase 04 — admin-usuárias

## Current Position

Phase: 04 (admin-usuárias) — EXECUTING
Plan: 1 of 2

## Performance Metrics

**Velocity:**

- Total plans completed: 0
- Average duration: —
- Total execution time: 0 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| - | - | - | - |

**Recent Trend:**

- Last 5 plans: —
- Trend: —

*Updated after each plan completion*
| Phase 01 P03 | 5 min | 2 tasks | 19 files |
| Phase 01 P01 | 14 min | 3 tasks | 14 files |
| Phase 01 P02 | 8 min | 3 tasks | 18 files |
| Phase 02 P01 | 2 | 2 tasks | 4 files |
| Phase 02 P03 | 5 | 1 tasks | 2 files |
| Phase 02-admin-planos-e-stripe P02 | 4 | 2 tasks | 7 files |
| Phase 03-admin-cursos P01 | 1 | 2 tasks | 2 files |
| Phase 03-admin-cursos P03 | 3 | 2 tasks | 9 files |
| Phase 03-admin-cursos P02 | 7 | 2 tasks | 10 files |
| Phase 04-admin-usuárias P02 | 5 | 2 tasks | 5 files |
| Phase 04-admin-usuárias P01 | 10 | 2 tasks | 6 files |

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- Recall.ai para MVP (bot de reunião): time-to-market dias vs semanas do LiveKit
- pgvector no Supabase para RAG: evita serviço separado
- Dois escopos de conhecimento (global + consultancy): metodologia Iris compartilhada; contexto do cliente isolado
- [Phase 01]: Mutations delegated from modals to aggregators — modals receive onSubmit/onSave callbacks for pure UI separation
- [Phase 02]: Stripe apiVersion 2026-01-28.clover; RLS stripe_products with service_role only; one_time billing creates non-recurring Stripe price
- [Phase 02]: Tailwind color palette with /10 opacity variants for status badge backgrounds — dark-mode compatible without CSS variables
- [Phase 02]: EVENT_TYPE_LABELS in WebhooksTab (not aggregator) — label logic colocated with rendering component
- [Phase 02-admin-planos-e-stripe]: PlanFormModal delegates mutations to aggregator via onSubmit — modal is pure UI with zero API knowledge
- [Phase 02-admin-planos-e-stripe]: BRL price input: user types decimal (97.00), aggregator converts to integer cents (9700) before API call
- [Phase 03-admin-cursos]: 1:N FK on courses.stripe_product_id (ON DELETE SET NULL) — no junction table; Supabase FK join syntax in select string for stripe_products join
- [Phase 03-admin-cursos]: Lesson status defaults to draft — existing lessons require explicit publish action by admin
- [Phase 03-admin-cursos]: Dedicated POST publish/unpublish endpoints for lessons — consistent with existing course publish/archive pattern
- [Phase 03-admin-cursos]: PlanSelect extracted as micro-module from CourseCreateModal when inline version exceeded 80-line limit
- [Phase 03-admin-cursos]: Unpublish uses adminUpdateCourse({status: draft}) not adminArchiveCourse — archive is semantically distinct from unpublish
- [Phase 04-admin-usuárias]: adminListCourses query with shared admin-courses queryKey populates grant entitlement dropdown; Array.isArray guard consistent with AdminFormacaoPage pattern
- [Phase 04-admin-usuárias]: intersect() helper in users.ts avoids TypeScript narrowing issues on null union type for filter composition
- [Phase 04-admin-usuárias]: Plan badge uses emerald tokens; no-plan badge uses CSS variable tokens for dark-mode compatibility

### Pending Todos

None yet.

### Blockers/Concerns

- **[Pre-Phase 10]**: pgvector extension deve ser habilitada no Supabase Dashboard ANTES de executar Phase 10
- **[Pre-Phase 14]**: Conta no Recall.ai + API key necessária ANTES de executar Phase 14
- **[Phase 5 depends on Phase 10]**: Phase 5 (Admin IA Global) requer que o pipeline de embeddings (Phase 10) exista. Executar Phase 10 antes de Phase 5 se Epic C iniciar antes de Epic A completar

## Session Continuity

Last session: 2026-03-29T04:24:03.851Z
Stopped at: Completed 04-01-PLAN.md
Resume file: None
