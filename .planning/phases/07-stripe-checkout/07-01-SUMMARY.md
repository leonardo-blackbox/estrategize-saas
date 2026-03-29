---
phase: 07-stripe-checkout
plan: "01"
subsystem: payments
tags: [stripe, checkout, express, zod, typescript]

requires:
  - phase: 06-pagina-de-planos
    provides: PublicPlan list page and /api/plans endpoint that exposes active stripe_products

provides:
  - "POST /api/stripe/checkout-session endpoint with auth guard, DB validation, and Stripe session creation"
  - "backend/src/routes/stripe/checkout.ts: standalone checkout router"

affects: [07-stripe-webhook, frontend-checkout-button, planos-page]

tech-stack:
  added: []
  patterns:
    - "Stripe checkout with mode detection: one_time → payment, month/year → subscription"
    - "price_id is internal UUID (stripe_products.id), not Stripe price ID — prevents leaking Stripe internals to frontend"
    - "generalLimit (global) + requireAuth (route-level) sufficient for user-facing Stripe endpoints — no adminLimit"

key-files:
  created:
    - backend/src/routes/stripe/checkout.ts
  modified:
    - backend/src/app.ts

key-decisions:
  - "price_id validated as UUID against stripe_products table before hitting Stripe API — prevents invalid Stripe calls and leaks"
  - "mode auto-detected from billing_interval: one_time → payment mode, month/year → subscription mode"
  - "client_reference_id set to req.userId for Stripe webhook to correlate session with platform user"
  - "No adminLimit on /api/stripe — user-facing endpoint protected by requireAuth inside route + global generalLimit"

patterns-established:
  - "Stripe routes in backend/src/routes/stripe/ directory (parallel to admin/)"
  - "502 returned on Stripe API errors (upstream failure), not 500"

requirements-completed:
  - CHKT-02

duration: 1min
completed: "2026-03-29"
---

# Phase 07 Plan 01: Stripe Checkout Session Endpoint Summary

**Authenticated POST /api/stripe/checkout-session endpoint that validates plan UUID against DB, determines subscription vs payment mode, and returns a Stripe-hosted checkout URL**

## Performance

- **Duration:** ~1 min
- **Started:** 2026-03-29T04:56:09Z
- **Completed:** 2026-03-29T04:57:10Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Created `backend/src/routes/stripe/checkout.ts` with full authentication, Zod validation, DB lookup, and Stripe session creation
- Registered route at `/api/stripe` in `app.ts` with correct middleware scope
- TypeScript compiles without errors across both changes

## Task Commits

1. **Task 1: Create checkout session route** - `f5fb9c0` (feat)
2. **Task 2: Register route in app.ts** - `d9deb07` (feat)

## Files Created/Modified
- `backend/src/routes/stripe/checkout.ts` - POST /checkout-session handler: requireAuth, Zod UUID validation, DB lookup, mode detection, Stripe session creation
- `backend/src/app.ts` - Added stripeCheckoutRouter import and mount at /api/stripe

## Decisions Made
- price_id is internal UUID (stripe_products.id), not Stripe's price ID — decouples frontend from Stripe internals
- mode auto-detected from billing_interval so consumer doesn't need to know Stripe mode semantics
- client_reference_id carries userId for webhook correlation in Phase 07-02

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required beyond STRIPE_SECRET_KEY and FRONTEND_URL already in .env.

## Next Phase Readiness
- POST /api/stripe/checkout-session is live and ready for frontend integration
- Phase 07-02 (Stripe webhook) can now reference client_reference_id pattern established here

---
*Phase: 07-stripe-checkout*
*Completed: 2026-03-29*

## Self-Check: PASSED
- backend/src/routes/stripe/checkout.ts: FOUND
- Commit f5fb9c0 (Task 1): FOUND
- Commit d9deb07 (Task 2): FOUND
