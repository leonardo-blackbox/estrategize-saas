---
phase: 02-admin-planos-e-stripe
verified: 2026-03-29T04:00:00Z
status: gaps_found
score: 6/8 must-haves verified
re_verification: false
gaps:
  - truth: "POST /api/admin/stripe/products creates product+price in Stripe API and saves to stripe_products table"
    status: failed
    reason: "Backend route is mounted at /api/admin/stripe (no /products segment). Frontend calls /api/admin/stripe/products. Every CRUD call will receive a 404 at runtime."
    artifacts:
      - path: "backend/src/app.ts"
        issue: "Mounted at /api/admin/stripe — routes resolve to /api/admin/stripe (GET), /api/admin/stripe/:id (PATCH/DELETE)"
      - path: "frontend/src/api/stripe.ts"
        issue: "Calls /api/admin/stripe/products and /api/admin/stripe/products/:id — mismatched prefix"
    missing:
      - "Either change backend mount in app.ts from '/api/admin/stripe' to '/api/admin/stripe/products', OR update all 4 frontend API client functions in frontend/src/api/stripe.ts to remove the /products segment"
  - truth: "GET /api/admin/stripe/products returns list of stripe_products from DB"
    status: failed
    reason: "Same URL mismatch as above. GET /api/admin/stripe/products hits no registered route."
    artifacts:
      - path: "frontend/src/api/stripe.ts"
        issue: "adminListProducts calls /api/admin/stripe/products — backend has no handler at that path"
    missing:
      - "Fix URL mismatch (see gap above)"
human_verification:
  - test: "Open /admin/planos in browser after URL fix, click 'Novo Plano', fill the form and submit"
    expected: "New plan appears in the list AND is visible in the Stripe Dashboard under Products"
    why_human: "Requires live Stripe API key and actual network call to stripe.com"
  - test: "Click 'Arquivar' on an active plan card"
    expected: "Plan status badge changes to 'Arquivado' and the plan is marked inactive in Stripe Dashboard"
    why_human: "Requires live Stripe API call"
---

# Phase 02: Admin Planos e Stripe — Verification Report

**Phase Goal:** A Iris cria um novo plano (nome, preco, creditos) e ele aparece no Stripe sem abrir terminal. Admin ve eventos de webhook com UI melhorada.
**Verified:** 2026-03-29T04:00:00Z
**Status:** gaps_found — 1 blocker (URL mismatch between frontend and backend)
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| #  | Truth                                                                                          | Status      | Evidence                                                                          |
|----|------------------------------------------------------------------------------------------------|-------------|-----------------------------------------------------------------------------------|
| 1  | GET /api/admin/stripe/products returns list from DB                                            | FAILED      | Backend has no route at that path; mounted at /api/admin/stripe                   |
| 2  | POST /api/admin/stripe/products creates product+price in Stripe and saves to DB               | FAILED      | Same URL mismatch — 404 at runtime                                                |
| 3  | PATCH /api/admin/stripe/products/:id updates name/credits/status in DB                        | FAILED      | Same URL mismatch                                                                 |
| 4  | DELETE /api/admin/stripe/products/:id archives product in Stripe and DB                       | FAILED      | Same URL mismatch                                                                 |
| 5  | Admin sees list of plans with name, price, credits, billing interval, and status              | PARTIAL     | UI components exist and are correct; data will not load due to 404s               |
| 6  | Admin clicks 'Novo Plano' and modal appears                                                   | VERIFIED    | PlanFormModal renders on isModalOpen=true; UI logic correct                       |
| 7  | Admin sees webhook events with color-coded status badges (green/red/amber)                    | VERIFIED    | STATUS_STYLE has emerald-400, red-400, amber-400 entries; dot indicator present   |
| 8  | WebhooksTab renders event types with human-readable PT-BR labels                              | VERIFIED    | EVENT_TYPE_LABELS map with 10 entries; fallback to raw string                     |

**Score:** 3/8 truths fully verified (4 blocked by URL mismatch, 1 partial, 3 verified)

Note: Truths 1–4 and 5 all stem from a single root cause: the URL mismatch. Fixing one line in app.ts (or 4 lines in stripe.ts) unblocks all of them.

### Required Artifacts

| Artifact                                                                              | Expected                              | Status     | Details                                                     |
|---------------------------------------------------------------------------------------|---------------------------------------|------------|-------------------------------------------------------------|
| `backend/src/database/migrations/023_stripe_products.sql`                            | stripe_products table with RLS        | VERIFIED   | 10 columns, RLS enabled, updated_at trigger, status index   |
| `backend/src/services/stripeProductService.ts`                                       | 4 exported functions + Stripe SDK     | VERIFIED   | listProducts, createProduct, updateProduct, archiveProduct  |
| `backend/src/routes/admin/stripe.ts`                                                 | 4 admin routes with Zod + auth guards | VERIFIED   | GET /, POST /, PATCH /:id, DELETE /:id; requireAuth+Admin   |
| `backend/src/app.ts`                                                                  | Route mounted under /api/admin/stripe | VERIFIED   | Line 116: app.use('/api/admin/stripe', adminLimit, ...)     |
| `frontend/src/api/stripe.ts`                                                          | 4 typed API functions                 | STUB-URL   | Functions exist and are typed correctly but call wrong URLs |
| `frontend/src/features/admin/hooks/useStripeProducts.ts`                             | React Query hook with 3 mutations     | VERIFIED   | useQuery + 3 useMutation with cache invalidation            |
| `frontend/src/features/admin/components/AdminPlanosPage/AdminPlanosPage.tsx`         | Aggregator <=200 lines                | VERIFIED   | 111 lines; imports hook, PlanCard, PlanFormModal            |
| `frontend/src/features/admin/components/PlanCard/PlanCard.tsx`                       | Micro-module <=80 lines               | VERIFIED   | 65 lines; named export; props/callbacks pattern             |
| `frontend/src/features/admin/components/PlanFormModal/PlanFormModal.tsx`             | Micro-module <=80 lines               | VERIFIED   | 71 lines; no direct API calls; delegates via onSubmit       |
| `frontend/src/pages/admin/AdminPlanosPage.tsx`                                       | Page shell <=5 lines (untouched)      | VERIFIED   | 1 line: re-export only                                      |
| `frontend/src/features/admin/components/AdminStripePage/AdminStripePage.tsx`         | STATUS_STYLE with semantic colors     | VERIFIED   | emerald-400/10, red-400/10, amber-400/10, amber-400/5       |
| `frontend/src/features/admin/components/AdminStripePage/WebhooksTab.tsx`             | EVENT_TYPE_LABELS + dot indicator     | VERIFIED   | 78 lines; 10 labels; dot span with bg-current               |

### Key Link Verification

| From                     | To                            | Via                          | Status      | Details                                                              |
|--------------------------|-------------------------------|------------------------------|-------------|----------------------------------------------------------------------|
| admin/stripe.ts          | stripeProductService.ts       | service function calls       | VERIFIED    | listProducts, createProduct, updateProduct, archiveProduct imported  |
| app.ts                   | routes/admin/stripe.ts        | app.use mount                | VERIFIED    | Line 116: /api/admin/stripe                                          |
| useStripeProducts.ts     | api/stripe.ts                 | import + useQuery/useMutation| VERIFIED    | All 4 functions imported and used in mutations                       |
| AdminPlanosPage.tsx      | useStripeProducts.ts          | useStripeProducts hook       | VERIFIED    | Destructures products, isLoading, mutations                          |
| AdminPlanosPage.tsx      | PlanCard.tsx                  | renders in grid              | VERIFIED    | PlanCard rendered per product with onEdit/onArchive callbacks        |
| api/stripe.ts (FE)       | backend /api/admin/stripe     | HTTP calls                   | BROKEN      | FE calls /api/admin/stripe/products; BE handles /api/admin/stripe    |
| AdminStripePage.tsx      | WebhooksTab.tsx               | statusStyle prop             | VERIFIED    | STATUS_STYLE defined in aggregator, passed as prop                   |

### Requirements Coverage

| Requirement | Source Plan | Description                                          | Status        | Evidence                                                                  |
|-------------|------------|------------------------------------------------------|---------------|---------------------------------------------------------------------------|
| ADMN-01     | 02-01, 02-02 | Admin cria/edita planos Stripe via interface sem terminal | BLOCKED   | All CRUD will 404 at runtime due to URL mismatch                          |
| ADMN-07     | 02-03       | Admin visualiza eventos de webhook Stripe recentes   | VERIFIED      | Semantic status colors + EVENT_TYPE_LABELS + dot indicator all present    |

### Anti-Patterns Found

| File                     | Line | Pattern                         | Severity  | Impact                                                        |
|--------------------------|------|---------------------------------|-----------|---------------------------------------------------------------|
| `frontend/src/api/stripe.ts` | 33-45 | Wrong URL path (/api/admin/stripe/products vs /api/admin/stripe) | BLOCKER | All 4 CRUD operations return 404; plan management non-functional |
| `frontend/src/features/admin/components/AdminStripePage/AdminStripePage.tsx` | 51-54 | `as any` casts for webhooksData/auditData | WARNING | Pre-existing issue from Epic 2; not introduced in this phase |

### Human Verification Required

#### 1. Plan Creation Round-Trip (after URL fix)

**Test:** In the admin panel at /admin/planos, click "Novo Plano", fill name="Teste", price="19.90", credits="10", interval="Mensal", and submit.
**Expected:** Plan appears in the card grid; opening Stripe Dashboard -> Products shows a new product "Teste" with price R$19.90/month.
**Why human:** Requires live STRIPE_SECRET_KEY in .env and actual Stripe API call.

#### 2. Plan Archive Flow (after URL fix)

**Test:** Click "Arquivar" on an active plan card.
**Expected:** Card status badge switches to "Arquivado"; the product is marked inactive in Stripe Dashboard.
**Why human:** Requires live Stripe API call; can't verify Stripe side-effects programmatically.

### Gaps Summary

There is one root cause blocking the primary goal of this phase (ADMN-01): **a URL path mismatch between the frontend API client and the backend route mount point**.

The backend router for Stripe products is mounted at `/api/admin/stripe` in `app.ts`. The route handlers inside `routes/admin/stripe.ts` are registered at `/` (GET list, POST create) and `/:id` (PATCH update, DELETE archive). This means the effective URLs are:
- `GET /api/admin/stripe`
- `POST /api/admin/stripe`
- `PATCH /api/admin/stripe/:id`
- `DELETE /api/admin/stripe/:id`

However, all four functions in `frontend/src/api/stripe.ts` call `/api/admin/stripe/products` and `/api/admin/stripe/products/:id`. Every request will receive a 404 response.

**Fix options (either one resolves all 4 failing truths):**

Option A (preferred — backend change, 1 line): Change app.ts line 116 from `/api/admin/stripe` to `/api/admin/stripe/products`.

Option B (frontend change, 4 lines): Remove `/products` from all 4 paths in `frontend/src/api/stripe.ts`.

Everything else in this phase is correctly implemented: migration, service, route handlers, Zod schemas, auth guards, React Query hook, 3-layer architecture, barrel exports, page shell, STATUS_STYLE, EVENT_TYPE_LABELS, and colored dot badges. ADMN-07 is fully achieved. Only ADMN-01 is blocked.

---

_Verified: 2026-03-29T04:00:00Z_
_Verifier: Claude (gsd-verifier)_
