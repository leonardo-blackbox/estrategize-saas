---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: unknown
stopped_at: Completed 14-02-PLAN.md
last_updated: "2026-03-30T03:16:19.267Z"
progress:
  total_phases: 20
  completed_phases: 13
  total_plans: 29
  completed_plans: 27
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-28)

**Core value:** A IA de cada consultoria responde com a metodologia real da Iris e com o contexto específico do cliente
**Current focus:** Phase 14 — Integração Recall.ai Backend

## Current Position

Phase: 14 (Integração Recall.ai Backend) — EXECUTING
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
| Phase 04-admin-usuarios P02 | 5 | 2 tasks | 5 files |
| Phase 04-admin-usuarios P01 | 10 | 2 tasks | 6 files |
| Phase 06-pagina-de-planos P01 | 1 | 2 tasks | 4 files |
| Phase 06-pagina-de-planos P02 | 5 | 2 tasks | 7 files |
| Phase 07-stripe-checkout P01 | 1 | 2 tasks | 2 files |
| Phase 07-stripe-checkout P02 | 4 | 2 tasks | 4 files |
| Phase 08-retorno-e-confirmacao P02 | 1 | 2 tasks | 2 files |
| Phase 08-retorno-e-confirmacao P01 | 8 | 2 tasks | 2 files |
| Phase 09-conta-e-assinatura P01 | 17 | 2 tasks | 4 files |
| Phase 09-conta-e-assinatura P02 | 15 | 1 tasks | 10 files |
| Phase 10-pipeline-de-embeddings P01 | 3 | 2 tasks | 4 files |
| Phase 11-api-de-documentos-globais P01 | 5 | 2 tasks | 3 files |
| Phase 11 P02 | 3 | 2 tasks | 5 files |
| Phase 12-api-de-documentos-por-consultoria P01 | 2 | 2 tasks | 2 files |
| Phase 12-api-de-documentos-por-consultoria P02 | 8 | 2 tasks | 6 files |
| Phase 13 P01 | 8 | 2 tasks | 2 files |
| Phase 14 P01 | 2 | 2 tasks | 4 files |
| Phase 14 P02 | 2 | 1 tasks | 2 files |

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
- [Phase 04-admin-usuarios]: adminListCourses query with shared admin-courses queryKey populates grant entitlement dropdown; Array.isArray guard consistent with AdminFormacaoPage pattern
- [Phase 04-admin-usuarios]: intersect() helper in users.ts avoids TypeScript narrowing issues on null union type for filter composition
- [Phase 04-admin-usuarios]: Plan badge uses emerald tokens; no-plan badge uses CSS variable tokens for dark-mode compatibility
- [Phase 06-pagina-de-planos]: PublicPlan omits stripe_product_id and stripe_price_id — internal Stripe IDs not exposed publicly
- [Phase 06-pagina-de-planos]: usePlans select callback unwraps res.data to return flat PublicPlan[] array directly to consumers
- [Phase 06-pagina-de-planos]: PlanCard splits price string on interval suffix regex to separate base price from suffix for typographic treatment (bold base + smaller suffix)
- [Phase 06-pagina-de-planos]: SkeletonCard defined as local function in PlanosPage, not exported — only used as loading placeholder with no cross-feature reuse
- [Phase 07-stripe-checkout]: price_id validated as UUID against stripe_products table before hitting Stripe API — prevents invalid Stripe calls and leaks
- [Phase 07-stripe-checkout]: mode auto-detected from billing_interval: one_time → payment mode, month/year → subscription mode
- [Phase 07-stripe-checkout]: client_reference_id set to req.userId for Stripe webhook to correlate session with platform user
- [Phase 07-stripe-checkout]: activePlanId tracks which card is loading so isLoading scopes to only the clicked PlanCard
- [Phase 07-stripe-checkout]: Auth gate in PlanosPage aggregator keeps PlanCard micro-module free of navigation concerns
- [Phase 08-retorno-e-confirmacao]: CheckoutSucessoPage self-contained (no aggregator) — purely informational, no API calls, single responsibility under 80 lines
- [Phase 08-retorno-e-confirmacao]: /checkout/sucesso route outside ProtectedRoute — Stripe redirect may arrive before Supabase session is re-established on client
- [Phase 08-01]: Dynamic import of grantCredits inside processPurchase avoids circular dependency between onboardingService and creditService
- [Phase 08-01]: client_reference_id as primary source for user_id in Stripe webhook; metadata.user_id as fallback — both set in checkout.ts
- [Phase 08-01]: Email-based listUsers scan preserved as fallback path for Hotmart/Kiwify webhooks that do not carry a platform user_id
- [Phase 09-01]: delete+insert used for subscriptions table (no unique constraint on user_id)
- [Phase 09-01]: Stripe subscription data enriched at read time with DB fallback on error
- [Phase 09-02]: window.location.href used for Stripe portal redirect (external URL outside React Router scope)
- [Phase 09-02]: STATUS_LABELS and STATUS_CLASSES as module-level lookup objects in SubscriptionCard avoid inline ternary chains
- [Phase 10-pipeline-de-embeddings]: createRequire pattern for pdf-parse CJS import in ESM project with moduleResolution bundler
- [Phase 10-pipeline-de-embeddings]: Embedding vector stored as string [v1,v2,...] for PostgREST vector type conversion; supabaseAdmin (service role) used server-side to bypass RLS
- [Phase 11-api-de-documentos-globais]: parseFile and chunkText exported from knowledgeService; POST returns 201 with status processing and fires background IIFE for parse/chunk/embed
- [Phase 11]: Raw fetch with FormData used for knowledge upload to avoid JSON Content-Type header
- [Phase 11]: STATUS_CONFIG lookup object in KnowledgeList colocates status label and badge className
- [Phase 12]: mergeParams: true on Router so :consultancyId from app.ts mount is accessible in member document handlers
- [Phase 12]: authLimit (not adminLimit) for consultancy document routes — these are member-facing endpoints
- [Phase 12]: Replace 'arquivos' placeholder tab with 'documentos' functional tab in ConsultoriaDetailPage
- [Phase 12]: Per-resource React Query hook with queryKey including consultancyId for cache isolation per consultancy
- [Phase 13]: RAG chunks prepended before system prompt; threshold 0.5 for inclusive retrieval; graceful degradation on error
- [Phase 14]: authLimit (not adminLimit) for /api/meetings — member-facing endpoints
- [Phase 14]: consultancy_id ON DELETE SET NULL — preserves session history when consultancy is deleted
- [Phase 14]: POST /api/meetings returns 502 when Recall.ai API fails — distinguishes upstream failure from server error
- [Phase 14]: Recall webhook mounted at /api/webhooks/recall BEFORE generic /:provider handler to prevent route capture
- [Phase 14]: Terminal state guard: UPDATE WHERE status NOT IN (done, error) prevents status regression on Recall bot events

### Pending Todos

None yet.

### Blockers/Concerns

- **[Pre-Phase 10]**: pgvector extension deve ser habilitada no Supabase Dashboard ANTES de executar Phase 10
- **[Pre-Phase 14]**: Conta no Recall.ai + API key necessária ANTES de executar Phase 14
- **[Phase 5 depends on Phase 10]**: Phase 5 (Admin IA Global) requer que o pipeline de embeddings (Phase 10) exista. Executar Phase 10 antes de Phase 5 se Epic C iniciar antes de Epic A completar

## Session Continuity

Last session: 2026-03-30T03:16:19.264Z
Stopped at: Completed 14-02-PLAN.md
Resume file: None
