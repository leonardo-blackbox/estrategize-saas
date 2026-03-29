---
phase: 09-conta-e-assinatura
plan: 02
subsystem: ui
tags: [react, stripe, billing-portal, subscriptions, feature-architecture, decomposition]

requires:
  - phase: 09-01
    provides: [GET /api/account/subscription, POST /api/account/billing-portal]

provides:
  - features/conta/ module with ProfileCard, SubscriptionCard, ContaPage aggregator
  - SubscriptionCard showing plan name, status badge, renewal date, credits, Gerenciar assinatura button
  - Stripe Customer Portal redirect via useBillingPortal mutation
  - useSubscription React Query hook with 60s staleTime
  - account.api.ts service with fetchSubscription and createBillingPortalSession

affects: [future conta features, billing, credits page]

tech-stack:
  added: []
  patterns:
    - ContaPage decomposed into 3-layer feature-based architecture (service / hook / micro-modules / aggregator / thin page)
    - useMutation with window.location.href redirect for Stripe portal navigation
    - STATUS_LABELS and STATUS_CLASSES lookup objects for Tailwind badge styling without CSS-in-JS

key-files:
  created:
    - frontend/src/features/conta/services/account.api.ts
    - frontend/src/features/conta/hooks/useSubscription.ts
    - frontend/src/features/conta/components/SubscriptionCard/SubscriptionCard.tsx
    - frontend/src/features/conta/components/SubscriptionCard/index.ts
    - frontend/src/features/conta/components/ProfileCard/ProfileCard.tsx
    - frontend/src/features/conta/components/ProfileCard/index.ts
    - frontend/src/features/conta/components/ContaPage/ContaPage.tsx
    - frontend/src/features/conta/components/ContaPage/index.ts
    - frontend/src/features/conta/components/index.ts
  modified:
    - frontend/src/pages/member/ContaPage.tsx (425 lines → 5 lines thin wrapper)

key-decisions:
  - "SpinnerIcon and CameraIcon extracted as local function components in ProfileCard to stay under 80-line limit"
  - "STATUS_LABELS and STATUS_CLASSES as module-level lookup objects in SubscriptionCard — avoids inline ternary chains"
  - "window.location.href used for Stripe portal redirect (external URL, not React Router)"
  - "ProfileCard receives fileInputRef as RefObject<HTMLInputElement | null> to match React 19 useRef type"

patterns-established:
  - "Lookup object pattern for Tailwind status badge classes (STATUS_CLASSES record keyed by union type)"
  - "Thin page wrapper pattern: pages/member/X.tsx imports from features/X/components/X/index.ts"

requirements-completed: [CHKT-05, CHKT-06]

duration: 15min
completed: 2026-03-29
---

# Phase 09 Plan 02: ContaPage Decomposition + SubscriptionCard Summary

**425-line ContaPage monolith decomposed into feature-based 3-layer architecture with SubscriptionCard showing live Stripe subscription info and Customer Portal redirect**

## Performance

- **Duration:** ~15 min
- **Started:** 2026-03-29
- **Completed:** 2026-03-29
- **Tasks:** 1 of 2 (Task 2 is checkpoint:human-verify — awaiting manual review)
- **Files modified:** 10

## Accomplishments

- Decomposed 425-line ContaPage.tsx into proper 3-layer feature architecture under features/conta/
- Created SubscriptionCard micro-module (62 lines) with plan name, status badge, renewal date, credits, and "Gerenciar assinatura" button
- Created ProfileCard micro-module (51 lines) with avatar upload, name/email, and admin badge
- Created ContaPage aggregator (183 lines) orchestrating all micro-modules
- Rewrote pages/member/ContaPage.tsx to 5-line thin wrapper
- TypeScript compiles clean with zero errors

## Task Commits

1. **Task 1: Create account API service + useSubscription hook + decompose ContaPage** - `8d84406` (feat)

## Files Created/Modified

- `frontend/src/features/conta/services/account.api.ts` — API service: fetchSubscription, createBillingPortalSession, SubscriptionData interface
- `frontend/src/features/conta/hooks/useSubscription.ts` — useSubscription (React Query, staleTime 60s) + useBillingPortal (mutation + redirect)
- `frontend/src/features/conta/components/SubscriptionCard/SubscriptionCard.tsx` — Micro-module: loading skeleton, empty state, active plan display
- `frontend/src/features/conta/components/ProfileCard/ProfileCard.tsx` — Micro-module: avatar upload, name/email, admin badge
- `frontend/src/features/conta/components/ContaPage/ContaPage.tsx` — Aggregator: orchestrates all sections
- `frontend/src/features/conta/components/index.ts` — Barrel export
- `frontend/src/pages/member/ContaPage.tsx` — Thin page wrapper (5 lines)

## Decisions Made

- `window.location.href` used for Stripe portal redirect since it is an external URL outside React Router scope
- `SpinnerIcon` and `CameraIcon` extracted as module-level function components in ProfileCard to keep the main component under 80 lines (Rule: no nested component definitions)
- `STATUS_LABELS` and `STATUS_CLASSES` as module-level lookup objects in SubscriptionCard — avoids conditional chains and follows the badge pattern established in Phase 02

## Deviations from Plan

None — plan executed exactly as written. All line limits respected:
- Page wrapper: 5 lines (limit: 20)
- ContaPage aggregator: 183 lines (limit: 200)
- SubscriptionCard: 62 lines (limit: 80)
- ProfileCard: 51 lines (limit: 80)

## Issues Encountered

Initial drafts of SubscriptionCard (117 lines) and ProfileCard (85 lines) exceeded the 80-line micro-module limit. Both were refactored inline: lookup objects collapsed to single-line declarations, icon SVGs extracted to local function components.

## User Setup Required

**Pre-condition for Stripe portal to work:** Stripe Customer Portal must be enabled in Stripe Dashboard → Settings → Billing → Customer Portal. If not configured, clicking "Gerenciar assinatura" will return a Stripe error.

## Next Phase Readiness

- Task 2 (checkpoint:human-verify) is awaiting manual visual review of /conta page
- Once approved, Phase 09 is complete and Phase 10 (pgvector/AI) can begin
- Pre-condition for Phase 10: pgvector extension must be enabled in Supabase Dashboard before executing

---
*Phase: 09-conta-e-assinatura*
*Completed: 2026-03-29*
