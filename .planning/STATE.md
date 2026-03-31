---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: unknown
stopped_at: Completed 05-02-PLAN.md
last_updated: "2026-03-31T01:33:14.105Z"
progress:
  total_phases: 20
  completed_phases: 20
  total_plans: 41
  completed_plans: 41
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-28)

**Core value:** A IA de cada consultoria responde com a metodologia real da Iris e com o contexto específico do cliente
**Current focus:** Phase 05 — admin-ia-global

## Current Position

Phase: 05 (admin-ia-global) — EXECUTING
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
| Phase 15 P01 | 2 | 2 tasks | 2 files |
| Phase 15 P02 | 2 | 1 tasks | 1 files |
| Phase 16-reunioes-ui P01 | 1 | 2 tasks | 2 files |
| Phase 16-reunioes-ui P02 | 2 | 2 tasks | 5 files |
| Phase 17-lista-de-consultorias-com-kpis P01 | 3 | 2 tasks | 6 files |
| Phase 17-lista-de-consultorias-com-kpis P02 | 2 | 1 tasks | 1 files |
| Phase 18-wizard-de-criacao P01 | 2 | 2 tasks | 4 files |
| Phase 18-wizard-de-criacao P02 | 2 | 2 tasks | 3 files |
| Phase 19-central-da-cliente-tabs P01 | 5 | 2 tasks | 3 files |
| Phase 19 P02 | 3 | 2 tasks | 2 files |
| Phase 20 P01 | 1 | 1 tasks | 3 files |
| Phase 20 P02 | 2 | 2 tasks | 3 files |
| Phase 05 P01 | 3 | 2 tasks | 4 files |
| Phase 05 P02 | 6 | 2 tasks | 5 files |

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
- [Phase 15]: processTranscript runs as fire-and-forget; errors caught internally, session.status set to error on failure, never re-throws
- [Phase 15]: Aggregated columns (formatted_transcript, summary, speakers) placed on meeting_sessions: meeting_transcripts holds raw Recall.ai segments; session owns processed output
- [Phase 15]: No credit charge for transcript pipeline — triggered by webhook automatically, not by user action
- [Phase 15]: processTranscript called fire-and-forget (no await) in recall webhook — webhook must respond to Recall.ai before GPT-4 pipeline completes
- [Phase 16]: listQuerySchema with z.string().uuid().optional() validates consultancy_id before Supabase query — returns 400 on malformed UUID
- [Phase 16]: meetingKeys.byConsultancy uses spread of meetingKeys.all for cache hierarchy consistency
- [Phase 16-reunioes-ui]: prevCreating ref to detect mutation success — avoids prop drilling onSuccess through aggregator
- [Phase 16-reunioes-ui]: onNewMeeting prop made optional; modal fully internal to ConsultoriaDetailMeetings aggregator
- [Phase 17-01]: useDebounce extracted to src/hooks/ anticipating reuse; removes inline debounce from useConsultorias to stay within 120-line limit
- [Phase 17-01]: pillBase/pillActive/pillInactive module-level constants in ConsultoriasFilterBar DRY both pill rows without extra abstraction
- [Phase 17-01]: hasSearch broadened to include statusFilter and phaseFilter so any active filter triggers the filtered-empty-state message
- [Phase 18-01]: Backend template enum aligned to frontend ConsultancyTemplate values (repositioning|launch|scaling|restructuring|none) — previous enum was legacy mismatch
- [Phase 18-01]: ticket stored as string in WizardState for UX — converted to number before API call in plan 18-02
- [Phase 19-central-da-cliente-tabs]: TabKey reduced from 12 to 9 — removed jornada/mercado/conteudo/financeiro as no longer in roadmap
- [Phase 19-central-da-cliente-tabs]: ConsultoriaDetailMemory sidebar sizing removed; grid-cols-1/2/3 used for full-width responsive tab layout
- [Phase 19]: insights passed as prop from aggregator to Overview — not fetched independently; meetingDate derives from insights.next_meeting first, falls back to consultancy.next_meeting_at
- [Phase 20]: RAG indexing in transcriptService uses direct supabase inserts (not processDocument) to avoid re-parsing already-formatted text
- [Phase 20]: Step 5b in processTranscript wrapped in try/catch so RAG failure never breaks action item insertion in Step 6
- [Phase 20]: recentMeetings derived in hook: filtering/slicing in useConsultoriaDetail keeps Overview component stateless
- [Phase 20]: snip() module-level helper in ConsultoriaDetailOverview compresses JSX to stay within 80-line limit (77 lines)
- [Phase 05]: testQuery implemented in knowledgeService using RAG + gpt-4o-mini; Zod UUID validation on DELETE /:id in knowledge routes
- [Phase 05]: AdminIAPage rewritten as direct React Query aggregator — drops useKnowledge hook in favour of inline useQuery + useMutation to align with plan spec and expose queryKey admin-knowledge-documents
- [Phase 05]: deletingId tracked in aggregator state for per-row isDeleting prop isolation so only the clicked document row shows loading

### Pending Todos

None yet.

### Blockers/Concerns

- **[Pre-Phase 10]**: pgvector extension deve ser habilitada no Supabase Dashboard ANTES de executar Phase 10
- **[Pre-Phase 14]**: Conta no Recall.ai + API key necessária ANTES de executar Phase 14
- **[Phase 5 depends on Phase 10]**: Phase 5 (Admin IA Global) requer que o pipeline de embeddings (Phase 10) exista. Executar Phase 10 antes de Phase 5 se Epic C iniciar antes de Epic A completar

## Session Continuity

Last session: 2026-03-31T01:28:30.572Z
Stopped at: Completed 05-02-PLAN.md
Resume file: None
