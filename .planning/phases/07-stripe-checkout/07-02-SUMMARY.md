---
phase: 07-stripe-checkout
plan: 02
subsystem: payments
tags: [stripe, react, react-query, zustand, checkout]

# Dependency graph
requires:
  - phase: 07-01
    provides: POST /api/stripe/checkout-session backend endpoint
  - phase: 06-pagina-de-planos
    provides: PlanosPage aggregator and PlanCard micro-module
provides:
  - createCheckoutSession() API client function
  - useCheckout() useMutation hook with redirect-on-success
  - PlanCard with isLoading/error props (per-card loading state, inline error)
  - PlanosPage with auth gate and real checkout orchestration
affects: [stripe-webhook, member-area, user-billing]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - useMutation hook wraps API call and redirects via window.location.href on success
    - activePlanId state scopes loading/error to specific PlanCard (multi-card list pattern)
    - Auth gate in aggregator: check user before mutate, navigate to /login with state.from

key-files:
  created:
    - frontend/src/api/checkout.ts
    - frontend/src/features/planos/hooks/useCheckout.ts
  modified:
    - frontend/src/features/planos/components/PlanCard/PlanCard.tsx
    - frontend/src/features/planos/components/PlanosPage/PlanosPage.tsx

key-decisions:
  - "activePlanId tracks which card is loading so isLoading scopes to only the clicked PlanCard"
  - "Auth gate in PlanosPage aggregator (not PlanCard) keeps micro-module free of navigation concerns"
  - "Error message from checkout.error.message surfaced inline in PlanCard, not as toast"

patterns-established:
  - "activePlanId pattern: useState<string | null> to scope mutation state to one item in a list"

requirements-completed: [CHKT-02]

# Metrics
duration: 4min
completed: 2026-03-29
---

# Phase 07 Plan 02: Stripe Checkout Frontend Summary

**"Assinar" button creates a Stripe checkout session via useMutation hook and redirects authenticated users; unauthenticated users are gated to /login with state.from**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-29T04:58:56Z
- **Completed:** 2026-03-29T05:00:19Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- `createCheckoutSession()` API client calls POST /api/stripe/checkout-session and returns typed `{ url: string }` response
- `useCheckout()` useMutation hook wraps the API call and redirects via `window.location.href = data.url` on success
- PlanCard upgraded with `isLoading` (disables button, shows "Processando...") and `error` (inline red text) props
- PlanosPage orchestrates the full checkout flow: auth gate redirects to /login with `state.from`, `activePlanId` scopes per-card loading/error state

## Task Commits

Each task was committed atomically:

1. **Task 1: Create checkout API client and useCheckout hook** - `aa7c78c` (feat)
2. **Task 2: Update PlanCard and PlanosPage with auth gate + checkout flow** - `f49d5d9` (feat)

**Plan metadata:** (docs commit follows)

## Files Created/Modified
- `frontend/src/api/checkout.ts` - API client function `createCheckoutSession(priceId)` calling POST /api/stripe/checkout-session
- `frontend/src/features/planos/hooks/useCheckout.ts` - useMutation hook with redirect-on-success
- `frontend/src/features/planos/components/PlanCard/PlanCard.tsx` - Added `isLoading` and `error` props; conditional button state
- `frontend/src/features/planos/components/PlanosPage/PlanosPage.tsx` - Auth gate, useCheckout integration, activePlanId state

## Decisions Made
- `activePlanId` state in PlanosPage tracks the clicked plan ID so `isPending` and `error` can be scoped to only that PlanCard — prevents all cards from showing loading simultaneously
- Auth gate lives in PlanosPage aggregator, not in PlanCard — keeps micro-module free of navigation concerns and Zustand imports
- Error is surfaced inline via `checkout.error.message` per-card, not as a global toast

## Deviations from Plan
None — plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None — no external service configuration required.

## Next Phase Readiness
- Frontend checkout flow is complete end-to-end
- User can click "Assinar", get redirected to Stripe hosted checkout, complete payment
- Ready for Stripe webhook handler (Phase 07-03 if planned) to process payment confirmation and allocate credits

---
*Phase: 07-stripe-checkout*
*Completed: 2026-03-29*
